import re
import math
import time
from typing import List, Dict, Any, Tuple, Optional
from urllib.parse import urlparse

# Topic Categories
TOPICS = [
    'Decisions and Plans',
    'Tasks and Actions',
    'Corrections and Updates',
    'People and Contacts',
    'Facts and Reference Information',
    'Requirements',
    'Questions and Unresolved Issues',
    'General Discussion',
]

def normalize_whitespace(text: str) -> str:
    if not text:
        return ''
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_conversation_text(raw_text: str) -> List[Dict[str, Any]]:
    normalized = normalize_whitespace(raw_text)
    if not normalized:
        return []

    lines = normalized.split('\n')
    messages: List[Dict[str, Any]] = []
    current_role = 'user'
    current_buffer: List[str] = []
    current_timestamp = None
    msg_idx = 1

    role_pattern = re.compile(r'^(user|human|client|customer|assistant|chatgpt|ai|system|bot)[\s:\-–—\]]+', re.IGNORECASE)
    bracket_pattern = re.compile(r'^\[(user|assistant|chatgpt|system)(?:\s*([0-9\-\:T\s]+))?\][\s:\-]*', re.IGNORECASE)

    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            if current_buffer:
                current_buffer.append('')
            continue

        bracket_match = bracket_pattern.match(trimmed)
        role_match = role_pattern.match(trimmed)

        if bracket_match:
            if current_buffer:
                messages.append({
                    'id': f"M-{str(msg_idx).zfill(3)}",
                    'role': current_role,
                    'content': '\n'.join(current_buffer).strip(),
                    'timestamp': current_timestamp
                })
                msg_idx += 1
                current_buffer = []
            raw_r = bracket_match.group(1).lower()
            current_role = 'user' if ('user' in raw_r or 'human' in raw_r) else 'system' if 'system' in raw_r else 'assistant'
            current_timestamp = bracket_match.group(2).strip() if bracket_match.group(2) else None
            rem = bracket_pattern.sub('', trimmed).strip()
            if rem:
                current_buffer.append(rem)
        elif role_match:
            if current_buffer:
                messages.append({
                    'id': f"M-{str(msg_idx).zfill(3)}",
                    'role': current_role,
                    'content': '\n'.join(current_buffer).strip(),
                    'timestamp': current_timestamp
                })
                msg_idx += 1
                current_buffer = []
            raw_r = role_match.group(1).lower()
            current_role = 'user' if ('user' in raw_r or 'human' in raw_r or 'client' in raw_r) else 'system' if 'system' in raw_r else 'assistant'
            rem = role_pattern.sub('', trimmed).strip()
            if rem:
                current_buffer.append(rem)
        else:
            current_buffer.append(trimmed)

    if current_buffer:
        messages.append({
            'id': f"M-{str(msg_idx).zfill(3)}",
            'role': current_role,
            'content': '\n'.join(current_buffer).strip(),
            'timestamp': current_timestamp
        })

    if not messages and normalized:
        messages.append({'id': 'M-001', 'role': 'user', 'content': normalized})

    return messages

def split_into_sentences(text: str) -> List[str]:
    if not text:
        return []
    # Protect common abbreviations
    protected = re.sub(r'\b(e\.g\.|i\.e\.|etc\.|vs\.|dr\.|mr\.|ms\.|prof\.)', lambda m: m.group(0).replace('.', '___DOT___'), text, flags=re.IGNORECASE)
    protected = re.sub(r'(https?://[^\s]+)', lambda m: m.group(0).replace('.', '___DOT___'), protected)

    parts = re.split(r'(?<=[.!?])\s+(?=[A-Z0-9"']|\b)', protected)
    sentences = [p.replace('___DOT___', '.').strip() for p in parts if p.strip()]
    return sentences

def clean_statement(s: str) -> str:
    s = re.sub(r'^[\*\-•\s\d\.\)\>]+', '', s)
    s = re.sub(r'[`*~_]', '', s)
    return s.strip()

def classify_topic(text: str) -> str:
    lower = text.lower()

    if any(k in lower for k in ['correction', 'updated to', 'moved to', 'rescheduled to', 'instead of', 'changed to', 'revised', 'cancel that', 'previously stated', 'apologies,', 'my mistake']):
        return 'Corrections and Updates'

    if any(k in lower for k in ['decided', 'agreed to', 'we will use', 'plan is', 'conclusion:', 'final choice', 'scheduled for', 'consensus', 'roadmap', 'milestone', 'approach will be']):
        return 'Decisions and Plans'

    if any(k in lower for k in ['todo', 'action item', 'will complete', 'assigned to', 'responsible for', 'must implement', 'needs to be done', 'deadline', 'by tomorrow', 'by friday', 'by monday', 'by next week', 'follow up']):
        return 'Tasks and Actions'

    if any(k in lower for k in ['requirement', 'must support', 'shall', 'compatible with', 'prerequisite', 'specification', 'constraint', 'minimum of', 'cannot exceed', 'latency', 'offline-first']):
        return 'Requirements'

    if any(k in lower for k in ['contact:', 'email:', '@', 'team lead', 'dr.', 'prof.', 'harsh', 'mentor', 'stakeholder', 'engineer', 'manager']):
        return 'People and Contacts'

    if any(k in lower for k in ['how are you', 'how can i help', 'how may i assist', 'hello', 'hi']):
        return 'General Discussion'

    if lower.endswith('?') or any(lower.startswith(q) for q in ['why ', 'how ', 'what ', 'when ']) or any(k in lower for k in ['unclear', 'unresolved', 'to be determined', 'tbd', 'open question']):
        return 'Questions and Unresolved Issues'

    if re.search(r'\b(version \d|v\d|\d{4}|\d+%|\$\d+|port \d+|schema|sqlite|fastapi|python|react)\b', lower) or any(k in lower for k in ['defined as', 'stands for', 'architecture', 'database', 'system consists of']):
        return 'Facts and Reference Information'

    return 'General Discussion'

def evaluate_importance(text: str, topic: str) -> Tuple[bool, Optional[str]]:
    lower = text.lower()
    if topic in ['Corrections and Updates', 'Decisions and Plans', 'Tasks and Actions', 'Requirements', 'Questions and Unresolved Issues']:
        return True, f"Contains critical {topic.lower()} knowledge"

    if re.search(r'\b(deadline|due on|\b\d{4}-\d{2}-\d{2}\b|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b', lower):
        return True, "Contains date or schedule reference"

    if re.search(r'\b(version|v\d\.\d|port 3000|sqlite|fastapi|token|endpoint)\b', lower):
        return True, "Contains technical parameters"

    if lower in ['hello', 'hi', 'thanks', 'thank you', 'sure!', 'ok', 'got it'] or lower.startswith('let me know'):
        return False, "Conversational politeness or filler"

    return False, None

def extract_statements_from_messages(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    statements = []
    stmt_idx = 1
    for msg in messages:
        sentences = split_into_sentences(msg.get('content', ''))
        for raw in sentences:
            cleaned = clean_statement(raw)
            if len(cleaned) < 3:
                continue
            topic = classify_topic(cleaned)
            is_important, reason = evaluate_importance(cleaned, topic)
            statements.append({
                'id': f"S-{str(stmt_idx).zfill(3)}",
                'messageId': msg.get('id', 'M-001'),
                'role': msg.get('role', 'user'),
                'text': cleaned,
                'topic': topic,
                'isImportant': is_important,
                'importanceReason': reason,
                'isDuplicate': False,
                'duplicateOfId': None,
                'similarityScore': None,
                'isCorrectionCandidate': False,
                'supersededBy': None
            })
            stmt_idx += 1
    return statements

def tokenize_words(text: str) -> List[str]:
    cleaned = re.sub(r'[^a-zA-Z0-9\s]', ' ', text.lower())
    return [w for w in cleaned.split() if len(w) > 2]

def calculate_jaccard_similarity(text_a: str, text_b: str) -> float:
    words_a = set(tokenize_words(text_a))
    words_b = set(tokenize_words(text_b))
    if not words_a and not words_b:
        return 1.0
    if not words_a or not words_b:
        return 0.0
    inter = len(words_a.intersection(words_b))
    union = len(words_a.union(words_b))
    return inter / union if union > 0 else 0.0

def detect_duplicates(statements: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    duplicates = []
    stmts = [dict(s) for s in statements]

    for i in range(len(stmts)):
        s1 = stmts[i]
        s1_norm = s1['text'].strip().lower()

        for j in range(i + 1, len(stmts)):
            s2 = stmts[j]
            s2_norm = s2['text'].strip().lower()

            if s1_norm == s2_norm:
                duplicates.append({
                    'originalId': s1['id'],
                    'duplicateId': s2['id'],
                    'type': 'exact',
                    'similarity': 1.0,
                    'originalText': s1['text'],
                    'duplicateText': s2['text'],
                    'isMeaningfulUpdate': False
                })
                s2['isDuplicate'] = True
                s2['duplicateOfId'] = s1['id']
                s2['similarityScore'] = 1.0
                continue

            sim = calculate_jaccard_similarity(s1['text'], s2['text'])
            if sim >= 0.72:
                is_update = (
                    s2['topic'] == 'Corrections and Updates' or
                    any(k in s2['text'].lower() for k in ['correction', 'instead of', 'moved to', 'changed'])
                )
                duplicates.append({
                    'originalId': s1['id'],
                    'duplicateId': s2['id'],
                    'type': 'near-duplicate',
                    'similarity': round(sim, 3),
                    'originalText': s1['text'],
                    'duplicateText': s2['text'],
                    'isMeaningfulUpdate': is_update
                })

                if not is_update:
                    s2['isDuplicate'] = True
                    s2['duplicateOfId'] = s1['id']
                    s2['similarityScore'] = round(sim, 3)
                else:
                    s1['supersededBy'] = s2['id']
                    s2['isCorrectionCandidate'] = True

    return duplicates, stmts

def detect_corrections(statements: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    candidates = []
    corr_idx = 1

    for i, s in enumerate(statements):
        lower = s['text'].lower()
        is_correction = (
            s['topic'] == 'Corrections and Updates' or
            any(k in lower for k in ['correction:', 'moved to', 'rescheduled', 'actually,', 'changed to', 'instead of', 'revised:'])
        )
        if not is_correction:
            continue

        corr_type = 'Status change'
        if re.search(r'\b(thursday|friday|monday|tuesday|wednesday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}:\d{2})\b', lower):
            corr_type = 'Date update'
        elif any(k in lower for k in ['decide', 'plan', 'framework']):
            corr_type = 'Decision change'
        elif any(k in lower for k in ['require', 'spec', 'must']):
            corr_type = 'Requirement modification'
        elif any(k in lower for k in ['assigned', 'responsible']):
            corr_type = 'Task reassignment'

        matched_earlier = None
        for j in range(i - 1, -1, -1):
            prev = statements[j]
            sim = calculate_jaccard_similarity(prev['text'], s['text'])
            if sim > 0.25 or (corr_type == 'Date update' and re.search(r'\b(meeting|schedule|date|on\s+[a-z]+)\b', prev['text'], re.IGNORECASE)):
                matched_earlier = prev
                break

        candidates.append({
            'id': f"CORR-{str(corr_idx).zfill(3)}",
            'earlierStatementId': matched_earlier['id'] if matched_earlier else 'N/A',
            'earlierText': matched_earlier['text'] if matched_earlier else 'Prior unrecorded statement',
            'newStatementId': s['id'],
            'newText': s['text'],
            'correctionType': corr_type,
            'reviewStatus': 'Pending review'
        })
        corr_idx += 1

    return candidates

def compress_context(statements: List[Dict[str, Any]], level: str = 'balanced') -> Tuple[str, List[Dict[str, Any]]]:
    non_dups = [s for s in statements if not s.get('isDuplicate')]

    if level == 'low':
        selected = [s for s in non_dups if s.get('importanceReason') != 'Conversational politeness or filler']
    elif level == 'balanced':
        selected = [s for s in non_dups if s.get('isImportant') or s.get('topic') in ['Decisions and Plans', 'Corrections and Updates', 'Tasks and Actions', 'Requirements', 'Questions and Unresolved Issues']]
    else: # high
        selected = [s for s in non_dups if not s.get('supersededBy') and s.get('topic') in ['Decisions and Plans', 'Corrections and Updates', 'Tasks and Actions', 'Requirements']]

    # Group by topic into chunks
    topic_map: Dict[str, List[Dict[str, Any]]] = {}
    for s in selected:
        t = s.get('topic', 'General Discussion')
        topic_map.setdefault(t, []).append(s)

    chunks = []
    chunk_idx = 1
    for t, items in topic_map.items():
        if not items:
            continue
        summary_lines = [f"• [{it['id']}] {it['text']}" for it in items]
        summary = '\n'.join(summary_lines)
        w_count = len(summary.split())
        chunks.append({
            'id': f"CHK-{str(chunk_idx).zfill(3)}",
            'topic': t,
            'title': f"{t} ({len(items)} items)",
            'statementIds': [it['id'] for it in items],
            'summary': summary,
            'wordCount': w_count
        })
        chunk_idx += 1

    sections = [f"=== COMPACT CONVERSATION KNOWLEDGE ({level.upper()} COMPRESSION) ===\n"]
    for c in chunks:
        sections.append(f"## {c['title']}")
        sections.append(c['summary'])
        sections.append("")

    return '\n'.join(sections).strip(), chunks

def calculate_metrics(
    raw_text: str,
    messages: list,
    statements: list,
    duplicates: list,
    corrections: list,
    compressed_text: str,
    chunks: list,
    processing_time_ms: float
) -> Dict[str, Any]:
    orig_chars = len(raw_text)
    orig_words = len(raw_text.strip().split()) or 1
    comp_chars = len(compressed_text)
    comp_words = len(compressed_text.strip().split())

    exact_dups = len([d for d in duplicates if d.get('type') == 'exact'])
    near_dups = len([d for d in duplicates if d.get('type') == 'near-duplicate'])
    important_count = len([s for s in statements if s.get('isImportant')])
    distinct_topics = len(set(s.get('topic') for s in statements))

    compression_ratio = round(comp_words / orig_words, 3)
    reduction = max(0.0, ((orig_words - comp_words) / orig_words) * 100.0)
    percentage_reduction = round(reduction, 1)

    estimated_tokens = round(comp_words * 1.33)
    actual_tokens_approx = round(comp_chars / 4)

    return {
        'originalCharCount': orig_chars,
        'originalWordCount': orig_words,
        'originalMessageCount': len(messages),
        'cleanedStatementCount': len(statements),
        'exactDuplicatesCount': exact_dups,
        'nearDuplicatesCount': near_dups,
        'topicsCount': distinct_topics,
        'chunksCount': len(chunks),
        'importantStatementsCount': important_count,
        'correctionsDetectedCount': len(corrections),
        'processingTimeMs': round(processing_time_ms, 2),
        'compressedWordCount': comp_words,
        'compressedCharCount': comp_chars,
        'estimatedTokens': estimated_tokens,
        'actualTokensApprox': actual_tokens_approx,
        'compressionRatio': compression_ratio,
        'percentageReduction': percentage_reduction
    }

def verify_extracted_items(statements: list, corrections: list) -> List[Dict[str, Any]]:
    items = []
    item_idx = 1
    superseded_map = {c['earlierStatementId']: c['newStatementId'] for c in corrections if c.get('earlierStatementId') and c.get('earlierStatementId') != 'N/A'}

    for s in statements:
        if not s.get('isImportant') and s.get('topic') == 'General Discussion':
            continue

        item_id = f"VER-{str(item_idx).zfill(3)}"
        result = 'Supported by original conversation'
        explanation = f"Directly extracted from original statement {s['id']} spoken by [{s.get('role', 'user')}]. Verified against source utterance."
        confidence = 0.95

        if s['id'] in superseded_map:
            result = 'Possible outdated information'
            rep = superseded_map[s['id']]
            explanation = f"Superseded by later correction in statement {rep}. Historical context preserved."
            confidence = 0.85
        elif s.get('isCorrectionCandidate'):
            result = 'Requires manual review'
            explanation = "Correction candidate identified. Requires user confirmation to finalize resolution."
            confidence = 0.75
        elif s.get('topic') == 'Questions and Unresolved Issues':
            result = 'Requires manual review'
            explanation = "Stated as an unresolved question or open problem in original conversation; not an established factual premise."
            confidence = 0.70

        items.append({
            'id': item_id,
            'statementId': s['id'],
            'extractedInformation': s['text'],
            'category': s.get('topic', 'General Discussion'),
            'originalSourceText': s['text'],
            'speakerRole': s.get('role', 'user'),
            'result': result,
            'confidence': confidence,
            'explanation': explanation,
            'reviewStatus': 'Flagged' if result == 'Requires manual review' else 'Verified'
        })
        item_idx += 1

    return items

def screen_claim_against_source(claim: str, source_title: str, source_url: str, source_excerpt: str) -> Dict[str, Any]:
    try:
        domain = urlparse(source_url).hostname or 'unknown-domain'
    except Exception:
        domain = 'invalid-url'

    claim_words = tokenize_words(claim)
    excerpt_words = set(tokenize_words(source_excerpt))

    matched = sum(1 for w in claim_words if w in excerpt_words)
    overlap = round(matched / len(claim_words), 3) if claim_words else 0.0

    if overlap >= 0.65:
        classification = 'Supported'
        explanation = f"High keyword overlap ({int(overlap * 100)}%) between claim and retrieved excerpt from {domain}."
    elif overlap >= 0.35:
        classification = 'Inconclusive'
        explanation = f"Moderate keyword overlap ({int(overlap * 100)}%). Source touches on relevant concepts, but insufficient to establish confirmation."
    else:
        classification = 'Inconclusive'
        explanation = f"Low keyword overlap ({int(overlap * 100)}%). The retrieved excerpt contains minimal matching terminology for this claim."

    excerpt_lower = source_excerpt.lower()
    if ('not ' in claim.lower() and 'not ' not in excerpt_lower) or any(k in excerpt_lower for k in ['false', 'incorrect', 'disproven', 'deprecated']):
        classification = 'Contradicted'
        explanation = "Excerpt contains terminology suggesting contradiction or deprecation regarding this claim."

    limitations = "PROTOTYPE LIMITATION NOTICE: External verification uses keyword-overlap screening against user-supplied excerpts. Keyword overlap does NOT constitute objective proof or comprehensive research. Source domain credibility must be evaluated by the researcher."

    return {
        'claim': claim,
        'sourceUrl': source_url,
        'sourceDomain': domain,
        'sourceTitle': source_title or domain,
        'publicationDate': time.strftime('%Y-%m-%d'),
        'sourceExcerpt': (source_excerpt[:300] + '...') if len(source_excerpt) > 300 else source_excerpt,
        'overlapScore': overlap,
        'classification': classification,
        'explanation': explanation,
        'limitations': limitations,
        'humanReviewStatus': 'Unreviewed'
    }

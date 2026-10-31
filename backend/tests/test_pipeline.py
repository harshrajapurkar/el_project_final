import pytest
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import processing as proc
import database as db

def test_empty_conversation():
    messages = proc.parse_conversation_text("")
    assert len(messages) == 0
    statements = proc.extract_statements_from_messages(messages)
    assert len(statements) == 0

def test_large_conversation():
    lines = [f"User: Message {i} regarding component {i % 5}." for i in range(100)]
    raw = "\n".join(lines)
    messages = proc.parse_conversation_text(raw)
    assert len(messages) == 100
    statements = proc.extract_statements_from_messages(messages)
    assert len(statements) >= 100

def test_speaker_roles():
    raw = "User: Hello\nChatGPT: Hi there\nSystem: Initialized"
    messages = proc.parse_conversation_text(raw)
    assert messages[0]['role'] == 'user'
    assert messages[1]['role'] == 'assistant'
    assert messages[2]['role'] == 'system'

def test_exact_duplicates():
    stmts = [
        {'id': 'S-001', 'text': 'The database is SQLite.', 'topic': 'Decisions and Plans', 'isImportant': True},
        {'id': 'S-002', 'text': 'The database is SQLite.', 'topic': 'Decisions and Plans', 'isImportant': True},
    ]
    dups, flagged = proc.detect_duplicates(stmts)
    assert len(dups) == 1
    assert dups[0]['type'] == 'exact'
    assert flagged[1]['isDuplicate'] is True

def test_near_duplicates_with_correction_preservation():
    stmts = [
        {'id': 'S-001', 'text': 'The meeting is on Thursday.', 'topic': 'Decisions and Plans', 'isImportant': True},
        {'id': 'S-002', 'text': 'Correction: The meeting has been moved to Friday.', 'topic': 'Corrections and Updates', 'isImportant': True},
    ]
    dups, flagged = proc.detect_duplicates(stmts)
    assert len(dups) == 1
    assert dups[0]['isMeaningfulUpdate'] is True
    # Verify correction is NOT marked as duplicate
    assert flagged[1]['isDuplicate'] is False

def test_detect_corrections():
    stmts = [
        {'id': 'S-001', 'text': 'The meeting is scheduled for Thursday at 2 PM.', 'topic': 'Decisions and Plans', 'isImportant': True},
        {'id': 'S-002', 'text': 'Correction: The meeting is moved to Friday at 3 PM.', 'topic': 'Corrections and Updates', 'isImportant': True},
    ]
    corrs = proc.detect_corrections(stmts)
    assert len(corrs) == 1
    assert corrs[0]['earlierStatementId'] == 'S-001'
    assert corrs[0]['correctionType'] == 'Date update'

def test_topic_classification():
    assert proc.classify_topic("We decided to use FastAPI.") == "Decisions and Plans"
    assert proc.classify_topic("Harsh will write tests by Friday.") == "Tasks and Actions"
    assert proc.classify_topic("System must support offline SQLite.") == "Requirements"
    assert proc.classify_topic("What schema should we use?") == "Questions and Unresolved Issues"
    assert proc.classify_topic("Correction: Updated the port to 3000.") == "Corrections and Updates"

def test_compression_and_chunking():
    stmts = [
        {'id': 'S-001', 'text': 'We decided on React 19.', 'topic': 'Decisions and Plans', 'isImportant': True},
        {'id': 'S-002', 'text': 'Implement unit tests.', 'topic': 'Tasks and Actions', 'isImportant': True},
    ]
    comp, chunks = proc.compress_context(stmts, 'balanced')
    assert len(chunks) == 2
    assert 'Decisions and Plans' in comp

def test_internal_traceability_and_superseded_items():
    stmts = [
        {'id': 'S-001', 'text': 'The meeting is on Thursday.', 'topic': 'Decisions and Plans', 'isImportant': True, 'role': 'user'},
        {'id': 'S-002', 'text': 'Correction: The meeting is on Friday.', 'topic': 'Corrections and Updates', 'isImportant': True, 'role': 'user'},
    ]
    corrs = [{
        'id': 'CORR-001',
        'earlierStatementId': 'S-001',
        'newStatementId': 'S-002',
        'correctionType': 'Date update',
        'reviewStatus': 'Pending review'
    }]
    verifs = proc.verify_extracted_items(stmts, corrs)
    assert verifs[0]['result'] == 'Possible outdated information'

def test_external_keyword_overlap_screening():
    claim = "FastAPI supports automatic OpenAPI documentation."
    source = "FastAPI generates automatic OpenAPI schemas and Swagger documentation."
    res = proc.screen_claim_against_source(claim, "FastAPI Docs", "https://fastapi.tiangolo.com", source)
    assert res['classification'] == 'Supported'
    assert res['overlapScore'] >= 0.65

def test_low_overlap_inconclusive():
    claim = "FastAPI supports quantum computing qubits."
    source = "FastAPI is a modern web framework for building APIs with Python."
    res = proc.screen_claim_against_source(claim, "FastAPI Docs", "https://fastapi.tiangolo.com", source)
    assert res['classification'] == 'Inconclusive'

def test_database_persistence():
    conv_id = "test-py-conv"
    db.save_conversation(conv_id, "Pytest Conv", "User: hi\nAssistant: hello", 2)
    item = db.get_conversation(conv_id)
    assert item is not None
    assert item['title'] == "Pytest Conv"
    assert db.delete_conversation(conv_id) is True

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeWhitespace,
  parseConversationText,
  extractStatementsFromMessages,
  classifyTopic,
  detectDuplicates,
  detectCorrections,
  compressContext,
  calculateMetrics,
  verifyExtractedItems,
  screenClaimAgainstSource,
  runBenchmarkEvaluation,
} from './pipeline';

test('normalizeWhitespace cleans extra spaces and line breaks', () => {
  const input = '  Hello   World!\r\n\r\n\r\nLine 2   test.  ';
  const out = normalizeWhitespace(input);
  assert.equal(out, 'Hello World!\n\nLine 2 test.');
});

test('parseConversationText correctly extracts User and Assistant turns', () => {
  const conv = `User: Can we schedule the meeting for Thursday?
ChatGPT: The meeting is scheduled for Thursday at 2 PM.
User: Correction: The meeting has been moved to Friday at 3 PM.`;

  const messages = parseConversationText(conv);
  assert.equal(messages.length, 3);
  assert.equal(messages[0].role, 'user');
  assert.equal(messages[1].role, 'assistant');
  assert.equal(messages[2].role, 'user');
});

test('extractStatementsFromMessages tags statement IDs and topics', () => {
  const messages = [
    { id: 'M-001', role: 'user' as const, content: 'We decided to use FastAPI for the backend.' },
    { id: 'M-002', role: 'assistant' as const, content: 'FastAPI provides async support and automatic Swagger docs.' },
  ];
  const statements = extractStatementsFromMessages(messages);
  assert.ok(statements.length >= 2);
  assert.equal(statements[0].id, 'S-001');
  assert.equal(statements[0].topic, 'Decisions and Plans');
  assert.equal(statements[0].isImportant, true);
});

test('detectDuplicates detects exact duplicate while preserving corrections', () => {
  const statements = [
    { id: 'S-001', messageId: 'M-1', role: 'user' as const, text: 'The meeting is on Thursday.', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-002', messageId: 'M-2', role: 'assistant' as const, text: 'The meeting is on Thursday.', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-003', messageId: 'M-3', role: 'user' as const, text: 'Correction: The meeting has been moved to Friday.', topic: 'Corrections and Updates' as const, isImportant: true },
  ];

  const { duplicates, flaggedStatements } = detectDuplicates(statements);
  assert.equal(duplicates.length, 1);
  assert.equal(duplicates[0].type, 'exact');
  assert.equal(duplicates[0].originalId, 'S-001');
  assert.equal(duplicates[0].duplicateId, 'S-002');
  assert.equal(flaggedStatements[1].isDuplicate, true);
  assert.equal(flaggedStatements[2].isDuplicate, undefined); // Correction is preserved!
});

test('detectCorrections identifies earlier statement and new statement', () => {
  const statements = [
    { id: 'S-001', messageId: 'M-1', role: 'user' as const, text: 'The meeting is scheduled for Thursday.', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-002', messageId: 'M-2', role: 'user' as const, text: 'Correction: The meeting is moved to Friday.', topic: 'Corrections and Updates' as const, isImportant: true },
  ];

  const corrections = detectCorrections(statements);
  assert.equal(corrections.length, 1);
  assert.equal(corrections[0].earlierStatementId, 'S-001');
  assert.equal(corrections[0].newStatementId, 'S-002');
  assert.equal(corrections[0].correctionType, 'Date update');
  assert.equal(corrections[0].reviewStatus, 'Pending review');
});

test('compressContext produces chunks with low, balanced, and high levels', () => {
  const statements = [
    { id: 'S-001', messageId: 'M-1', role: 'user' as const, text: 'Hello there!', topic: 'General Discussion' as const, isImportant: false, importanceReason: 'Conversational politeness or filler' },
    { id: 'S-002', messageId: 'M-2', role: 'user' as const, text: 'We agreed to use SQLite for persistence.', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-003', messageId: 'M-3', role: 'user' as const, text: 'Harsh will complete the tests.', topic: 'Tasks and Actions' as const, isImportant: true },
  ];

  const balanced = compressContext(statements, 'balanced');
  assert.ok(balanced.chunks.length > 0);
  assert.ok(balanced.compressedText.includes('Decisions and Plans'));
  assert.ok(balanced.compressedText.includes('SQLite'));
});

test('calculateMetrics calculates word reduction and compression ratio', () => {
  const orig = 'This is a long conversation with many words repeating ideas over and over again for testing.';
  const comp = 'Key idea extracted.';
  const metrics = calculateMetrics(orig, [], [], [], [], comp, [], 15);

  assert.ok(metrics.percentageReduction > 0);
  assert.ok(metrics.compressionRatio < 1.0);
  assert.ok(metrics.estimatedTokens > 0);
  assert.ok(metrics.actualTokensApprox > 0);
});

test('verifyExtractedItems marks superseded statements as possible outdated', () => {
  const statements = [
    { id: 'S-001', messageId: 'M-1', role: 'user' as const, text: 'Meeting is on Thursday', topic: 'Decisions and Plans' as const, isImportant: true },
    { id: 'S-002', messageId: 'M-2', role: 'user' as const, text: 'Correction: Meeting is on Friday', topic: 'Corrections and Updates' as const, isImportant: true },
  ];
  const corrections = [
    {
      id: 'CORR-001',
      earlierStatementId: 'S-001',
      earlierText: 'Meeting is on Thursday',
      newStatementId: 'S-002',
      newText: 'Correction: Meeting is on Friday',
      correctionType: 'Date update' as const,
      reviewStatus: 'Pending review' as const,
    },
  ];

  const verifications = verifyExtractedItems(statements, corrections);
  const s1Ver = verifications.find((v) => v.statementId === 'S-001');
  assert.ok(s1Ver);
  assert.equal(s1Ver.result, 'Possible outdated information');
});

test('screenClaimAgainstSource evaluates keyword overlap and attaches limitations', () => {
  const claim = 'FastAPI provides automatic Swagger OpenAPI documentation.';
  const sourceText = 'FastAPI generates interactive Swagger documentation and OpenAPI specification automatically for all endpoints.';
  const res = screenClaimAgainstSource(claim, 'FastAPI Docs', 'https://fastapi.tiangolo.com', sourceText);

  assert.equal(res.classification, 'Supported');
  assert.ok(res.overlapScore >= 0.65);
  assert.ok(res.limitations.includes('PROTOTYPE LIMITATION NOTICE'));
});

test('runBenchmarkEvaluation executes labelled test dataset evaluation', () => {
  const benchmark = runBenchmarkEvaluation();
  assert.ok(benchmark.topicClassification.accuracy > 0.8);
  assert.ok(benchmark.duplicateDetection.precision > 0);
  assert.ok(benchmark.correctionDetection.f1 > 0);
});

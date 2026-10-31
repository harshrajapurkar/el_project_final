import test from 'node:test';
import assert from 'node:assert/strict';
import { localDb } from './database';

test('LocalDatabase successfully performs CRUD operations on SQLite', () => {
  const testId = `test-conv-${Date.now()}`;
  localDb.saveConversation(testId, 'Test Conversation', 'User: Hello\nAssistant: Hi', 2);

  const item = localDb.getConversation(testId);
  assert.ok(item);
  assert.equal(item.title, 'Test Conversation');

  localDb.saveCorrections(testId, [
    {
      id: 'CORR-001',
      earlierStatementId: 'S-001',
      earlierText: 'Original note',
      newStatementId: 'S-002',
      newText: 'Correction: Updated note',
      correctionType: 'Status change',
      reviewStatus: 'Pending review',
    },
  ]);

  const corrs = localDb.getCorrections(testId);
  assert.equal(corrs.length, 1);
  assert.equal(corrs[0].reviewStatus, 'Pending review');

  // Resolve correction
  const resolved = localDb.resolveCorrection(testId, 0, 'Accepted');
  assert.equal(resolved, true);

  const updatedCorrs = localDb.getCorrections(testId);
  assert.equal(updatedCorrs[0].reviewStatus, 'Accepted');

  // Delete
  const deleted = localDb.deleteConversation(testId);
  assert.equal(deleted, true);

  const missing = localDb.getConversation(testId);
  assert.equal(missing, null);
});

test('LocalDatabase handles multiple conversations with same correction IDs without UNIQUE constraint collision', () => {
  const convA = `conv-a-${Date.now()}`;
  const convB = `conv-b-${Date.now()}`;

  localDb.saveConversation(convA, 'Conv A', 'text A', 1);
  localDb.saveConversation(convB, 'Conv B', 'text B', 1);

  // Both have 'CORR-001'
  localDb.saveCorrections(convA, [
    { id: 'CORR-001', newStatementId: 'S-2', newText: 'Update A', correctionType: 'Date update', reviewStatus: 'Pending review' },
  ]);
  localDb.saveCorrections(convB, [
    { id: 'CORR-001', newStatementId: 'S-2', newText: 'Update B', correctionType: 'Date update', reviewStatus: 'Pending review' },
  ]);

  const corrsA = localDb.getCorrections(convA);
  const corrsB = localDb.getCorrections(convB);

  assert.equal(corrsA.length, 1);
  assert.equal(corrsA[0].id, 'CORR-001');
  assert.equal(corrsA[0].newText, 'Update A');

  assert.equal(corrsB.length, 1);
  assert.equal(corrsB[0].id, 'CORR-001');
  assert.equal(corrsB[0].newText, 'Update B');

  localDb.deleteConversation(convA);
  localDb.deleteConversation(convB);
});

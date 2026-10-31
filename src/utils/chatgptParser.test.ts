import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectChatGPTExport, parseSelectedChatGPTConversation } from './chatgptParser';

test('inspectChatGPTExport identifies multi-conversation exports', () => {
  const sampleExport = [
    {
      id: 'conv-1',
      title: 'Project Architecture Planning',
      create_time: 1700000000,
      mapping: {
        node1: { id: 'node1', message: { author: { role: 'user' }, content: { parts: ['Hello'] } } },
      },
    },
    {
      id: 'conv-2',
      title: 'Database Optimization Discussion',
      create_time: 1700005000,
      mapping: {
        node2: { id: 'node2', message: { author: { role: 'user' }, content: { parts: ['How to optimize SQLite?'] } } },
      },
    },
  ];

  const inspect = inspectChatGPTExport(sampleExport);
  assert.equal(inspect.isValid, true);
  assert.equal(inspect.isMultiConversation, true);
  assert.equal(inspect.conversations.length, 2);
  assert.equal(inspect.conversations[0].title, 'Project Architecture Planning');
  assert.equal(inspect.conversations[1].title, 'Database Optimization Discussion');
});

test('parseSelectedChatGPTConversation extracts tree structure messages accurately', () => {
  const conv = {
    title: 'Sem-EL Meeting',
    current_node: 'n3',
    mapping: {
      n1: {
        id: 'n1',
        parent: null,
        message: { author: { role: 'user' }, content: { parts: ['Meeting is set for Thursday'] } },
      },
      n2: {
        id: 'n2',
        parent: 'n1',
        message: { author: { role: 'assistant' }, content: { parts: ['Confirmed for Thursday 2 PM.'] } },
      },
      n3: {
        id: 'n3',
        parent: 'n2',
        message: { author: { role: 'user' }, content: { parts: ['Correction: Meeting is moved to Friday'] } },
      },
    },
  };

  const parsed = parseSelectedChatGPTConversation(conv, 0);
  assert.equal(parsed.title, 'Sem-EL Meeting');
  assert.equal(parsed.messages.length, 3);
  assert.equal(parsed.messages[0].role, 'user');
  assert.equal(parsed.messages[1].role, 'assistant');
  assert.equal(parsed.messages[2].role, 'user');
  assert.ok(parsed.rawText.includes('Friday'));
});

test('inspectChatGPTExport handles malformed payload gracefully', () => {
  const inspect = inspectChatGPTExport('invalid json string {');
  assert.equal(inspect.isValid, false);
  assert.ok(inspect.error);
});

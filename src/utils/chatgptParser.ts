/**
 * Robust ChatGPT Export JSON & Shared Link Parser
 * Handles official ChatGPT conversations.json tree structures, multi-conversation lists,
 * and edge cases.
 */

import type { Message } from './pipeline.ts';

export interface ChatGPTExportItem {
  index: number;
  id: string;
  title: string;
  createTime?: string;
  updateTime?: string;
  messageCount: number;
}

export function inspectChatGPTExport(jsonData: any): {
  isValid: boolean;
  isMultiConversation: boolean;
  conversations: ChatGPTExportItem[];
  error?: string;
} {
  try {
    let data = jsonData;
    if (typeof data === 'string') {
      data = JSON.parse(data);
    }

    if (!data) {
      return { isValid: false, isMultiConversation: false, conversations: [], error: 'Empty JSON payload' };
    }

    const convList: any[] = Array.isArray(data) ? data : [data];
    if (convList.length === 0) {
      return { isValid: false, isMultiConversation: false, conversations: [], error: 'No conversations found in array' };
    }

    const items: ChatGPTExportItem[] = [];

    convList.forEach((conv, idx) => {
      if (!conv || typeof conv !== 'object') return;
      const title = conv.title || conv.name || `Conversation ${idx + 1}`;
      const id = conv.id || `conv-${idx + 1}`;
      let messageCount = 0;

      if (conv.mapping && typeof conv.mapping === 'object') {
        for (const key of Object.keys(conv.mapping)) {
          const node = conv.mapping[key];
          if (node && node.message && node.message.content) {
            messageCount++;
          }
        }
      } else if (Array.isArray(conv.messages)) {
        messageCount = conv.messages.length;
      }

      const createTime = conv.create_time ? new Date(conv.create_time * 1000).toLocaleString() : undefined;
      const updateTime = conv.update_time ? new Date(conv.update_time * 1000).toLocaleString() : undefined;

      items.push({
        index: idx,
        id,
        title,
        createTime,
        updateTime,
        messageCount: Math.max(messageCount, 1),
      });
    });

    if (items.length === 0) {
      return { isValid: false, isMultiConversation: false, conversations: [], error: 'JSON does not contain recognized ChatGPT conversation objects' };
    }

    return {
      isValid: true,
      isMultiConversation: items.length > 1,
      conversations: items,
    };
  } catch (err: any) {
    return {
      isValid: false,
      isMultiConversation: false,
      conversations: [],
      error: `JSON parsing error: ${err.message || 'Invalid JSON format'}`,
    };
  }
}

export function parseSelectedChatGPTConversation(
  jsonData: any,
  selectedIndex: number = 0
): { title: string; messages: Message[]; rawText: string } {
  let data = jsonData;
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }

  const convList: any[] = Array.isArray(data) ? data : [data];
  if (selectedIndex < 0 || selectedIndex >= convList.length) {
    selectedIndex = 0;
  }

  const conv = convList[selectedIndex] || {};
  const title = conv.title || conv.name || 'Imported ChatGPT Conversation';
  const messages: Message[] = [];
  let msgIdx = 1;

  if (conv.mapping && typeof conv.mapping === 'object') {
    // Traverse ChatGPT mapping tree
    // If current_node is provided, traverse path back to root, then reverse
    const mapping = conv.mapping;
    const currentNodeId = conv.current_node;

    if (currentNodeId && mapping[currentNodeId]) {
      const pathNodes: any[] = [];
      let curr = mapping[currentNodeId];
      const visited = new Set<string>();

      while (curr && !visited.has(curr.id || '')) {
        visited.add(curr.id || '');
        if (curr.message) {
          pathNodes.push(curr.message);
        }
        curr = curr.parent ? mapping[curr.parent] : null;
      }

      pathNodes.reverse();

      for (const msg of pathNodes) {
        const parsed = extractMessageContent(msg, msgIdx++);
        if (parsed) messages.push(parsed);
      }
    } else {
      // Fallback: extract all nodes sorted by create_time
      const allMsgs: any[] = [];
      for (const k of Object.keys(mapping)) {
        const node = mapping[k];
        if (node && node.message) {
          allMsgs.push(node.message);
        }
      }

      allMsgs.sort((a, b) => (a.create_time || 0) - (b.create_time || 0));

      for (const msg of allMsgs) {
        const parsed = extractMessageContent(msg, msgIdx++);
        if (parsed) messages.push(parsed);
      }
    }
  } else if (Array.isArray(conv.messages)) {
    // Simplified export format
    for (const msg of conv.messages) {
      const parsed = extractMessageContent(msg, msgIdx++);
      if (parsed) messages.push(parsed);
    }
  }

  // Synthesize raw text for display and downstream processing
  const rawText = messages
    .map((m) => {
      const roleLabel = m.role === 'user' ? 'User' : m.role === 'assistant' ? 'ChatGPT' : 'System';
      const ts = m.timestamp ? ` [${m.timestamp}]` : '';
      return `${roleLabel}${ts}:\n${m.content}`;
    })
    .join('\n\n');

  return { title, messages, rawText };
}

function extractMessageContent(msg: any, fallbackIdx: number): Message | null {
  if (!msg) return null;

  const authorRole = msg.author?.role || msg.role || 'user';
  let role: 'user' | 'assistant' | 'system' = 'user';
  if (authorRole === 'assistant') role = 'assistant';
  else if (authorRole === 'system') role = 'system';

  let text = '';
  if (msg.content) {
    if (typeof msg.content === 'string') {
      text = msg.content;
    } else if (Array.isArray(msg.content.parts)) {
      text = msg.content.parts
        .map((p: any) => (typeof p === 'string' ? p : JSON.stringify(p)))
        .filter(Boolean)
        .join('\n');
    } else if (msg.content.text) {
      text = msg.content.text;
    }
  }

  text = text.trim();
  if (!text) return null;

  const timestamp = msg.create_time
    ? new Date(msg.create_time * 1000).toLocaleString()
    : undefined;

  return {
    id: `M-${String(fallbackIdx).padStart(3, '0')}`,
    role,
    content: text,
    timestamp,
  };
}

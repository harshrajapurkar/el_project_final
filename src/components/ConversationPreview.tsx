import React, { useState } from 'react';
import { Message, Statement } from '../types';
import { ListFilter, MessageSquare, Check, AlertCircle, Copy } from 'lucide-react';

interface ConversationPreviewProps {
  messages: Message[];
  statements: Statement[];
}

export const ConversationPreview: React.FC<ConversationPreviewProps> = ({
  messages,
  statements,
}) => {
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const topics = ['all', ...Array.from(new Set(statements.map((s) => s.topic)))];

  const filteredStatements = statements.filter((s) => {
    if (filterTopic === 'all') return true;
    return s.topic === filterTopic;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'user':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">User</span>;
      case 'assistant':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">ChatGPT</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">System</span>;
    }
  };

  const getTopicColor = (topic: string) => {
    switch (topic) {
      case 'Decisions and Plans':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Tasks and Actions':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Corrections and Updates':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Requirements':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Facts and Reference Information':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Questions and Unresolved Issues':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Statement Extraction & Utterance Traceability
          </h2>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-mono">
            {statements.length} Extracted Items
          </span>
        </div>

        {/* Filter by Topic */}
        <div className="flex items-center gap-2 text-xs">
          <ListFilter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Filter Topic:</span>
          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All Categories' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
        {filteredStatements.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No statements extracted yet. Click "Run Local Pipeline" above.
          </div>
        ) : (
          filteredStatements.map((s) => {
            return (
              <div
                key={s.id}
                className={`pt-2.5 flex items-start justify-between gap-3 text-xs transition-colors p-2 rounded-lg ${
                  s.isDuplicate
                    ? 'bg-slate-50/70 opacity-60'
                    : s.supersededBy
                    ? 'bg-amber-50/40 border-l-2 border-amber-400'
                    : s.isCorrectionCandidate
                    ? 'bg-emerald-50/40 border-l-2 border-emerald-500'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {s.id}
                    </span>
                    {getRoleBadge(s.role)}
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${getTopicColor(s.topic)}`}>
                      {s.topic}
                    </span>

                    {s.isImportant && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Important
                      </span>
                    )}

                    {s.isDuplicate && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                        Duplicate of {s.duplicateOfId}
                      </span>
                    )}

                    {s.supersededBy && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        Superseded by {s.supersededBy}
                      </span>
                    )}

                    {s.isCorrectionCandidate && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Correction Update
                      </span>
                    )}
                  </div>

                  <p
                    className={`text-slate-900 leading-relaxed font-sans ${
                      s.isDuplicate || s.supersededBy ? 'line-through text-slate-500' : ''
                    }`}
                  >
                    {s.text}
                  </p>

                  {s.importanceReason && (
                    <p className="text-[10px] text-slate-400 italic">
                      Rationale: {s.importanceReason}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleCopy(s.text, s.id)}
                  title="Copy statement text"
                  className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-colors shrink-0"
                >
                  {copiedId === s.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

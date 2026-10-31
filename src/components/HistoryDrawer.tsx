import React, { useEffect, useState } from 'react';
import { ConversationRecord } from '../types';
import { History, Trash2, Download, ArrowUpRight, Clock, FileText, RefreshCw } from 'lucide-react';

interface HistoryDrawerProps {
  onLoadConversation: (record: any) => void;
  onRefreshList: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  onLoadConversation,
  onRefreshList,
}) => {
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/conversations');
      const data = await resp.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSelectConv = async (id: string) => {
    try {
      const resp = await fetch(`/api/conversations/${id}`);
      const data = await resp.json();
      onLoadConversation(data);
    } catch (e) {
      console.error('Error fetching conversation details:', e);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this conversation record from SQLite?')) return;

    setDeletingId(id);
    try {
      await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
      await fetchConversations();
      onRefreshList();
    } catch (e) {
      console.error('Failed to delete conversation:', e);
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = (e: React.MouseEvent, id: string, format: 'json' | 'txt') => {
    e.stopPropagation();
    window.location.href = `/api/conversations/${id}/export?format=${format}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
            Local SQLite Database Persistence (Task 10)
          </h3>
        </div>

        <button
          onClick={fetchConversations}
          disabled={loading}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          title="Refresh History"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5">
        {conversations.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400">
            No saved conversations found in SQLite. When you process a conversation with "Save" checked, it will automatically persist here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => handleSelectConv(c.id)}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-xs transition-all bg-white text-left cursor-pointer space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {c.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                      {c.message_count} msgs
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <Clock className="w-3 h-3" />
                    <span>Updated: {new Date(c.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleExport(e, c.id, 'json')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      JSON
                    </button>
                    <button
                      onClick={(e) => handleExport(e, c.id, 'txt')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      TXT
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, c.id)}
                    disabled={deletingId === c.id}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

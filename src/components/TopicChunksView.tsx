import React, { useState } from 'react';
import { Chunk } from '../types';
import { Layers, Copy, Check, Hash, FileDown, BookOpen } from 'lucide-react';

interface TopicChunksViewProps {
  chunks: Chunk[];
  compressedText: string;
  onOpenExportModal: () => void;
}

export const TopicChunksView: React.FC<TopicChunksViewProps> = ({
  chunks,
  compressedText,
  onOpenExportModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeChunkId, setActiveChunkId] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(compressedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* 1. Manageable Topic-Based Chunks Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Topic Segmentation & Manageable Chunks (Task 1.4 & 1.8)
            </h3>
          </div>
          <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-medium border border-indigo-200">
            {chunks.length} Chunks Generated
          </span>
        </div>

        <div className="p-5">
          {chunks.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Run the processing pipeline to segment conversation into topic chunks.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chunks.map((chunk) => {
                const isSelected = activeChunkId === chunk.id;
                return (
                  <div
                    key={chunk.id}
                    onClick={() => setActiveChunkId(isSelected ? null : chunk.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                        {chunk.id}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {chunk.wordCount} words
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-900 mb-2">
                      {chunk.title}
                    </h4>

                    <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 whitespace-pre-line font-sans leading-relaxed max-h-36 overflow-y-auto">
                      {chunk.summary}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Source Statements:</span>
                      <span className="font-mono text-slate-600">
                        {chunk.statementIds.slice(0, 3).join(', ')}
                        {chunk.statementIds.length > 3 ? ` +${chunk.statementIds.length - 3}` : ''}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Reusable Compact Knowledge Context Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Compact Reusable Conversation Context (Task 1.7)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Context' : 'Copy Reusable Context'}</span>
            </button>

            <button
              onClick={onOpenExportModal}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Export DOCX / PDF</span>
            </button>
          </div>
        </div>

        <div className="p-5">
          <textarea
            readOnly
            value={compressedText}
            rows={8}
            className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-200 rounded-lg focus:outline-none border border-slate-800 resize-y"
          />
        </div>
      </div>
    </div>
  );
};

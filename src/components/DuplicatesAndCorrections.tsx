import React from 'react';
import { DuplicateMatch, CorrectionCandidate } from '../types';
import { CopyCheck, ArrowRight, Check, X, Clock, HelpCircle, AlertCircle } from 'lucide-react';

interface DuplicatesAndCorrectionsProps {
  duplicates: DuplicateMatch[];
  corrections: CorrectionCandidate[];
  onResolveCorrection: (correctionIndex: number, newStatus: 'Accepted' | 'Rejected' | 'Pending review') => void;
}

export const DuplicatesAndCorrections: React.FC<DuplicatesAndCorrectionsProps> = ({
  duplicates,
  corrections,
  onResolveCorrection,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* 1. Duplicate & Near-Duplicate Detection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CopyCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Duplicate Detection (Task 1.3)
            </h3>
          </div>
          <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
            {duplicates.length} Matches
          </span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3">
          {duplicates.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No duplicate or redundant statements detected in this conversation.
            </div>
          ) : (
            duplicates.map((dup, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {dup.duplicateId}
                    </span>
                    <span className="text-slate-400">matches</span>
                    <span className="font-mono font-bold text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded text-[10px]">
                      {dup.originalId}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      dup.type === 'exact'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {dup.type === 'exact' ? 'Exact Duplicate (100%)' : `Near Duplicate (${Math.round(dup.similarity * 100)}%)`}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 block text-[10px] uppercase">Original:</span>
                    {dup.originalText}
                  </div>
                  <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700 block text-[10px] uppercase">Duplicate:</span>
                    {dup.duplicateText}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 italic">
                  {dup.isMeaningfulUpdate
                    ? 'Status: Identified as a meaningful state update / correction; preserved in knowledge history.'
                    : 'Status: Pure redundant repetition; pruned from high-compression context.'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Correction Candidate Detection Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Correction Detection & Review (Task 1.6)
            </h3>
          </div>
          <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
            {corrections.length} Candidates
          </span>
        </div>

        <div className="p-4 flex-1 overflow-y-auto max-h-[380px] space-y-3">
          {corrections.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No correction markers (e.g. "correction", "rescheduled to", "instead of") detected.
            </div>
          ) : (
            corrections.map((corr, idx) => (
              <div
                key={corr.id}
                className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] border border-amber-200">
                      {corr.id}
                    </span>
                    <span className="font-semibold text-slate-700 text-xs">
                      {corr.correctionType}
                    </span>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      corr.reviewStatus === 'Accepted'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : corr.reviewStatus === 'Rejected'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {corr.reviewStatus}
                  </span>
                </div>

                {/* Compare Previous vs New */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-rose-50/70 border border-rose-200 text-rose-900">
                    <div className="font-semibold text-[10px] uppercase text-rose-700 flex items-center justify-between mb-1">
                      <span>Prior Statement ({corr.earlierStatementId})</span>
                    </div>
                    <p className="line-through">{corr.earlierText}</p>
                  </div>

                  <div className="p-2 rounded bg-emerald-50/70 border border-emerald-200 text-emerald-900">
                    <div className="font-semibold text-[10px] uppercase text-emerald-700 flex items-center justify-between mb-1">
                      <span>Updated Statement ({corr.newStatementId})</span>
                    </div>
                    <p>{corr.newText}</p>
                  </div>
                </div>

                {/* Reviewer Action Buttons */}
                <div className="pt-1 flex items-center justify-between border-t border-amber-200/60">
                  <span className="text-[10px] text-slate-500">
                    Review Decision:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onResolveCorrection(idx, 'Accepted')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                        corr.reviewStatus === 'Accepted'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      <span>Accept Update</span>
                    </button>

                    <button
                      onClick={() => onResolveCorrection(idx, 'Rejected')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                        corr.reviewStatus === 'Rejected'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => onResolveCorrection(idx, 'Pending review')}
                      className={`px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                        corr.reviewStatus === 'Pending review'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>Pending</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

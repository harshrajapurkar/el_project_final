import React from 'react';
import { Play, RotateCcw, Sliders, Zap, CheckCircle, AlertTriangle } from 'lucide-react';

interface ProcessingControlsProps {
  compressionLevel: 'low' | 'balanced' | 'high';
  setCompressionLevel: (lvl: 'low' | 'balanced' | 'high') => void;
  onRunPipeline: () => void;
  onReset: () => void;
  isLoading: boolean;
  hasResults: boolean;
  correctionsPendingCount: number;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  compressionLevel,
  setCompressionLevel,
  onRunPipeline,
  onReset,
  isLoading,
  hasResults,
  correctionsPendingCount,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Compression Level Selector */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Compression Strategy (Task 1.7)
            </span>
          </div>

          <div className="inline-flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setCompressionLevel('low')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                compressionLevel === 'low'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low (Max Detail)
            </button>
            <button
              onClick={() => setCompressionLevel('balanced')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                compressionLevel === 'balanced'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Balanced (Recommended)
            </button>
            <button
              onClick={() => setCompressionLevel('high')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                compressionLevel === 'high'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High (Compact Context)
            </button>
          </div>

          <p className="text-[11px] text-slate-500 max-w-xl">
            {compressionLevel === 'low' && 'Retains almost all statements, removing only empty pleasantries and exact duplicates.'}
            {compressionLevel === 'balanced' && 'Retains decisions, requirements, tasks, facts, and updates while pruning near-duplicates and non-essential banter.'}
            {compressionLevel === 'high' && 'Retains only final state decisions, active requirements, and latest corrections, dropping superseded premises.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onReset}
            disabled={isLoading}
            className="px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={onRunPipeline}
            disabled={isLoading}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Executing Local Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Local Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Review Banner if corrections detected */}
      {correctionsPendingCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{correctionsPendingCount} correction candidate(s)</strong> require manual review before finalizing knowledge report.
            </span>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
            Action Required
          </span>
        </div>
      )}
    </div>
  );
};

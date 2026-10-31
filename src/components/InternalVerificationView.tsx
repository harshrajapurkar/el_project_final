import React, { useState } from 'react';
import { InternalVerificationItem } from '../types';
import { ShieldCheck, Info, CheckCircle2, AlertTriangle, XCircle, Search, HelpCircle } from 'lucide-react';

interface InternalVerificationViewProps {
  verifications: InternalVerificationItem[];
}

export const InternalVerificationView: React.FC<InternalVerificationViewProps> = ({
  verifications,
}) => {
  const [filterResult, setFilterResult] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = verifications.filter((v) => {
    if (filterResult !== 'all' && v.result !== filterResult) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.extractedInformation.toLowerCase().includes(q) ||
        v.statementId.toLowerCase().includes(q) ||
        v.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getResultBadge = (result: InternalVerificationItem['result']) => {
    switch (result) {
      case 'Supported by original conversation':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Supported
          </span>
        );
      case 'Possible outdated information':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Outdated / Superseded
          </span>
        );
      case 'Requires manual review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Requires Review
          </span>
        );
      case 'Contradictory information found':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Contradiction
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            Unsupported
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Epistemological Boundary Notice Banner */}
      <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-xl shadow-xs">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div className="text-xs text-indigo-950 space-y-1">
            <h4 className="font-semibold text-sm text-indigo-900">
              Task 2: Internal Source Traceability & Epistemological Boundary
            </h4>
            <p className="leading-relaxed text-indigo-800">
              <strong>Source consistency does not establish objective reality.</strong> A statement appearing in a conversation does not make it objectively true in the real world. This task checks whether an extracted item is authentically supported by the cited conversation utterance, tracking speaker provenance and flagging statements superseded by subsequent corrections.
            </p>
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search verified statements..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter Result:</span>
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Verification Results</option>
            <option value="Supported by original conversation">Supported by Conversation</option>
            <option value="Possible outdated information">Outdated / Superseded</option>
            <option value="Requires manual review">Requires Manual Review</option>
            <option value="Contradictory information found">Contradictory</option>
          </select>
        </div>
      </div>

      {/* Verification Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Statement ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Extracted Information</th>
                <th className="py-3 px-4">Verification Result</th>
                <th className="py-3 px-4">Audit Rationale & Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No items match the verification filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      item.result === 'Possible outdated information'
                        ? 'bg-amber-50/20'
                        : item.result === 'Requires manual review'
                        ? 'bg-blue-50/20'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-700 whitespace-nowrap">
                      {item.statementId}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        {item.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 max-w-sm">
                      <p className="font-medium text-slate-900">{item.extractedInformation}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Speaker: [{item.speakerRole}]
                      </p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getResultBadge(item.result)}
                    </td>

                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-md">
                      <p>{item.explanation}</p>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Traceability confidence: {Math.round(item.confidence * 100)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

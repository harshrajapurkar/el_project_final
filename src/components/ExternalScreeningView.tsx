import React, { useState } from 'react';
import { ExternalScreeningResult, Statement } from '../types';
import { Globe, Search, AlertCircle, CheckCircle2, XCircle, HelpCircle, ExternalLink, ShieldAlert } from 'lucide-react';

interface ExternalScreeningViewProps {
  statements: Statement[];
  screenings: ExternalScreeningResult[];
  onAddScreening: (res: ExternalScreeningResult) => void;
  onUpdateStatus: (index: number, status: 'Validated' | 'Questionable') => void;
}

export const ExternalScreeningView: React.FC<ExternalScreeningViewProps> = ({
  statements,
  screenings,
  onAddScreening,
  onUpdateStatus,
}) => {
  const [selectedClaim, setSelectedClaim] = useState<string>('');
  const [sourceUrl, setSourceUrl] = useState<string>('https://fastapi.tiangolo.com');
  const [manualExcerpt, setManualExcerpt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Preset credible sources
  const PRESET_SOURCES = [
    { name: 'FastAPI Official Docs', url: 'https://fastapi.tiangolo.com' },
    { name: 'SQLite Official Documentation', url: 'https://www.sqlite.org' },
    { name: 'React Official Documentation', url: 'https://react.dev' },
    { name: 'Python Official Documentation', url: 'https://docs.python.org/3/' },
  ];

  const handleScreenClaim = async () => {
    if (!selectedClaim.trim()) {
      setErrorMsg('Please select or type a claim to test.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const resp = await fetch('/api/verify/external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim: selectedClaim,
          source_url: sourceUrl.trim() || undefined,
          manual_excerpt: manualExcerpt.trim() || undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to execute external screening');
      }

      onAddScreening(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationBadge = (cls: ExternalScreeningResult['classification']) => {
    switch (cls) {
      case 'Supported':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Supported (High Overlap)
          </span>
        );
      case 'Contradicted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Contradicted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            Inconclusive (Low Overlap)
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Methodology & Limitations Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <h4 className="font-semibold text-sm text-amber-950">
            Task 3: External Fact-Checking & Evidence Screening Limitations
          </h4>
          <p className="text-amber-800 leading-relaxed">
            This prototype uses <strong>lexical keyword-overlap screening</strong> against user-supplied external source excerpts. A high overlap score indicates textual lexical correlation but does <strong>not</strong> constitute objective proof or exhaustive research. Low overlap remains explicitly marked as Inconclusive. Always conduct human review of cited sources.
          </p>
        </div>
      </div>

      {/* Screen New Claim Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          <span>Screen Selected Claim Against External Source</span>
        </h3>

        {/* Claim Selection / Input */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Claim Under Investigation:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={selectedClaim}
              onChange={(e) => setSelectedClaim(e.target.value)}
              placeholder="e.g. FastAPI provides automatic Swagger OpenAPI documentation."
              className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {statements.length > 0 && (
              <select
                onChange={(e) => setSelectedClaim(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 max-w-xs focus:outline-none"
              >
                <option value="">Pick from extracted statements...</option>
                {statements
                  .filter((s) => s.isImportant || s.topic === 'Decisions and Plans' || s.topic === 'Requirements')
                  .slice(0, 15)
                  .map((s) => (
                    <option key={s.id} value={s.text}>
                      [{s.id}] {s.text.slice(0, 50)}...
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        {/* External Source URL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-700">
              External HTTPS Source URL:
            </label>
            <div className="flex items-center gap-2 text-[11px] text-indigo-600">
              <span className="text-slate-400">Presets:</span>
              {PRESET_SOURCES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setSourceUrl(p.url)}
                  className="hover:underline font-medium"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://fastapi.tiangolo.com"
            className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Offline Excerpt Option */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Manual Excerpt (Optional - use for offline testing or when site restricts scraping):
          </label>
          <textarea
            value={manualExcerpt}
            onChange={(e) => setManualExcerpt(e.target.value)}
            rows={2}
            placeholder="Paste text excerpt directly from source..."
            className="w-full text-xs p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          onClick={handleScreenClaim}
          disabled={loading}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Retrieving & Screening Source...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>Execute Lexical Screening</span>
            </>
          )}
        </button>
      </div>

      {/* Screened Claims Results Grid */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          Screened Claims & Evidence Records ({screenings.length})
        </h4>

        {screenings.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-xs text-slate-400 border border-slate-200">
            No external evidence screenings performed yet. Select a claim above to test against external documentation.
          </div>
        ) : (
          screenings.map((res, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Claim Tested</span>
                  <p className="text-sm font-semibold text-slate-900">"{res.claim}"</p>
                </div>
                <div>{getClassificationBadge(res.classification)}</div>
              </div>

              {/* Source Info & Overlap Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="font-semibold text-slate-900">{res.sourceTitle}</span>
                  </div>
                  <a
                    href={res.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 break-all"
                  >
                    <span>{res.sourceUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                  <p className="text-[10px] text-slate-400">
                    Domain: {res.sourceDomain} | Evaluated: {res.publicationDate || '2026-10-30'}
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>Lexical Keyword Overlap:</span>
                    <span className="font-mono font-bold text-indigo-700">
                      {Math.round(res.overlapScore * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        res.overlapScore >= 0.65
                          ? 'bg-emerald-500'
                          : res.overlapScore >= 0.35
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round(res.overlapScore * 100))}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 pt-0.5">{res.explanation}</p>
                </div>
              </div>

              {/* Source Excerpt */}
              <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                  Retrieved Source Excerpt:
                </span>
                <p className="text-slate-800 italic font-serif leading-relaxed">
                  "{res.sourceExcerpt}"
                </p>
              </div>

              {/* Reviewer Action */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 text-xs">
                <span className="text-[10px] text-slate-500">
                  Human Audit Status: <strong>{res.humanReviewStatus}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateStatus(idx, 'Validated')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      res.humanReviewStatus === 'Validated'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    ✓ Mark Validated
                  </button>

                  <button
                    onClick={() => onUpdateStatus(idx, 'Questionable')}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      res.humanReviewStatus === 'Questionable'
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    ⚠ Flag Questionable
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

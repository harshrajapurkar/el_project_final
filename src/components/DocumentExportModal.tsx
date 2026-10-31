import React, { useState } from 'react';
import { FileDown, FileText, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import {
  ProcessingMetrics,
  Statement,
  Chunk,
  CorrectionCandidate,
  InternalVerificationItem,
  ExternalScreeningResult,
} from '../types';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  rawText: string;
  compressedText: string;
  metrics: ProcessingMetrics | null;
  statements: Statement[];
  chunks: Chunk[];
  corrections: CorrectionCandidate[];
  verifications: InternalVerificationItem[];
  externalScreenings: ExternalScreeningResult[];
}

export const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  title,
  rawText,
  compressedText,
  metrics,
  statements,
  chunks,
  corrections,
  verifications,
  externalScreenings,
}) => {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const buildPayload = () => ({
    title: title || 'Sem-EL Academic Report',
    originalText: rawText,
    compressedText,
    metrics: metrics || {
      originalCharCount: rawText.length,
      originalWordCount: rawText.split(/\s+/).filter(Boolean).length,
      originalMessageCount: 1,
      cleanedStatementCount: statements.length,
      exactDuplicatesCount: 0,
      nearDuplicatesCount: 0,
      topicsCount: 1,
      chunksCount: chunks.length,
      importantStatementsCount: statements.filter((s) => s.isImportant).length,
      correctionsDetectedCount: corrections.length,
      processingTimeMs: 10,
      compressedWordCount: compressedText.split(/\s+/).filter(Boolean).length,
      compressedCharCount: compressedText.length,
      estimatedTokens: Math.round(compressedText.split(/\s+/).filter(Boolean).length * 1.33),
      actualTokensApprox: Math.round(compressedText.length / 4),
      compressionRatio: 0.5,
      percentageReduction: 50,
    },
    statements,
    chunks,
    corrections,
    verifications,
    externalScreenings,
  });

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    setErrorMsg(null);
    setDownloadSuccess(null);

    try {
      const resp = await fetch('/api/documents/docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate DOCX document');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SemEL_Academic_Report_${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess('Editable Word (.docx) document downloaded successfully.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setErrorMsg(null);
    setDownloadSuccess(null);

    try {
      const resp = await fetch('/api/documents/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to generate PDF document');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SemEL_Academic_Report_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadSuccess('Academic PDF report downloaded successfully.');
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileDown className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">
              Generate Structured Academic Reports (Task 4.1)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate formal Sem-EL academic reports incorporating conversation metadata, quantitative metrics, topic chunks, correction audit logs, internal traceability tables, external screening results, and ethical limitations disclosures.
          </p>

          {/* Report Sections Checklist */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 block uppercase tracking-wider text-[10px]">
              Document Sections Included:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
              <span className="flex items-center gap-1.5">✓ Executive Overview</span>
              <span className="flex items-center gap-1.5">✓ Processing Metrics Table</span>
              <span className="flex items-center gap-1.5">✓ Topic-Wise Segments</span>
              <span className="flex items-center gap-1.5">✓ Correction Audit History</span>
              <span className="flex items-center gap-1.5">✓ Internal Traceability Matrix</span>
              <span className="flex items-center gap-1.5">✓ External Evidence Findings</span>
              <span className="flex items-center gap-1.5">✓ Reusable Compact Context</span>
              <span className="flex items-center gap-1.5">✓ Limitations & Ethics Notice</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Action Download Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleDownloadDocx}
              disabled={downloadingDocx || downloadingPdf}
              className="p-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
            >
              {downloadingDocx ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Building DOCX...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>Download Editable DOCX</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingDocx || downloadingPdf}
              className="p-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white rounded-xl shadow-xs flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Academic PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

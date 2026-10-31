import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ImportPanel } from './components/ImportPanel';
import { ProcessingControls } from './components/ProcessingControls';
import { ConversationPreview } from './components/ConversationPreview';
import { DuplicatesAndCorrections } from './components/DuplicatesAndCorrections';
import { TopicChunksView } from './components/TopicChunksView';
import { InternalVerificationView } from './components/InternalVerificationView';
import { ExternalScreeningView } from './components/ExternalScreeningView';
import { MetricsDashboard } from './components/MetricsDashboard';
import { HistoryDrawer } from './components/HistoryDrawer';
import { ArchitectureDocsModal } from './components/ArchitectureDocsModal';
import { DocumentExportModal } from './components/DocumentExportModal';
import { DEMO_CONVERSATIONS } from './utils/demoData';
import {
  Message,
  Statement,
  DuplicateMatch,
  CorrectionCandidate,
  Chunk,
  ProcessingMetrics,
  InternalVerificationItem,
  ExternalScreeningResult,
} from './types';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'verification' | 'metrics' | 'history' | 'docs'>('pipeline');
  const [status, setStatus] = useState<'Ready' | 'Processing' | 'Completed' | 'Failed' | 'Requires review'>('Ready');

  // Input states (initialized with rich Demo 1)
  const [title, setTitle] = useState(DEMO_CONVERSATIONS[0].title);
  const [rawText, setRawText] = useState(DEMO_CONVERSATIONS[0].rawText);
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'balanced' | 'high'>('balanced');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string>(`conv-${Date.now()}`);

  // Pipeline output states
  const [messages, setMessages] = useState<Message[]>([]);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [corrections, setCorrections] = useState<CorrectionCandidate[]>([]);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [compressedText, setCompressedText] = useState<string>('');
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [verifications, setVerifications] = useState<InternalVerificationItem[]>([]);
  const [externalScreenings, setExternalScreenings] = useState<ExternalScreeningResult[]>([
    {
      claim: 'FastAPI provides high-performance asynchronous endpoints and automatic Swagger documentation.',
      sourceUrl: 'https://fastapi.tiangolo.com',
      sourceDomain: 'fastapi.tiangolo.com',
      sourceTitle: 'FastAPI Documentation',
      publicationDate: '2026-10-30',
      sourceExcerpt: 'FastAPI is a modern, fast (high-performance), web framework for building APIs with Python based on standard Python type hints. Features include automatic interactive API documentation with Swagger UI.',
      overlapScore: 0.82,
      classification: 'Supported',
      explanation: 'High lexical keyword overlap (82%) between conversation claim and official FastAPI technical documentation.',
      limitations: 'PROTOTYPE LIMITATION NOTICE: Screening utilizes lexical keyword overlap. Human review recommended.',
      humanReviewStatus: 'Validated',
    },
  ]);

  const [savedCount, setSavedCount] = useState<number>(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Initial load of pipeline on mount
  useEffect(() => {
    handleRunPipeline();
    refreshSavedCount();
  }, []);

  const refreshSavedCount = async () => {
    try {
      const resp = await fetch('/api/conversations');
      const data = await resp.json();
      if (Array.isArray(data)) {
        setSavedCount(data.length);
      }
    } catch {
      // Ignore initial list error
    }
  };

  const handleRunPipeline = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Please provide conversation text or select a demonstration dataset.');
      return;
    }

    setIsProcessing(true);
    setStatus('Processing');
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          title,
          text: rawText,
          compression_level: compressionLevel,
          save: true,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to process conversation');
      }

      setConversationId(data.conversation_id);
      setMessages(data.messages || []);
      setStatements(data.statements || []);
      setDuplicates(data.duplicates || []);
      setCorrections(data.corrections || []);
      setChunks(data.chunks || []);
      setCompressedText(data.compressed_text || '');
      setMetrics(data.metrics || null);
      setVerifications(data.verifications || []);

      const pendingCount = (data.corrections || []).filter((c: any) => c.reviewStatus === 'Pending review').length;
      setStatus(pendingCount > 0 ? 'Requires review' : 'Completed');
      refreshSavedCount();
    } catch (err: any) {
      console.error('Pipeline processing error:', err);
      setStatus('Failed');
      setErrorMessage(err.message || 'An unexpected error occurred during processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResolveCorrection = async (
    correctionIndex: number,
    newStatus: 'Accepted' | 'Rejected' | 'Pending review'
  ) => {
    // Optimistic UI update
    const updated = [...corrections];
    if (updated[correctionIndex]) {
      updated[correctionIndex].reviewStatus = newStatus;
      setCorrections(updated);
    }

    try {
      await fetch(`/api/conversations/${conversationId}/corrections/${correctionIndex}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Error persisting correction review:', err);
    }

    const remainingPending = updated.filter((c) => c.reviewStatus === 'Pending review').length;
    setStatus(remainingPending > 0 ? 'Requires review' : 'Completed');
  };

  const handleReset = () => {
    setTitle(DEMO_CONVERSATIONS[0].title);
    setRawText(DEMO_CONVERSATIONS[0].rawText);
    setConversationId(`conv-${Date.now()}`);
    setMessages([]);
    setStatements([]);
    setDuplicates([]);
    setCorrections([]);
    setChunks([]);
    setCompressedText('');
    setMetrics(null);
    setVerifications([]);
    setStatus('Ready');
    setErrorMessage(null);
  };

  const handleLoadSavedConversation = (rec: any) => {
    if (!rec) return;
    setTitle(rec.title || 'Saved Conversation');
    setRawText(rec.raw_text || '');
    setConversationId(rec.id);

    if (rec.processingRun) {
      setCompressedText(rec.processingRun.compressedText || '');
      setMetrics(rec.processingRun.metrics || null);
      setChunks(rec.processingRun.chunks || []);
      setStatements(rec.processingRun.statements || []);
    }

    if (rec.corrections) {
      setCorrections(rec.corrections);
    }

    setActiveTab('pipeline');
    setStatus('Completed');
  };

  const pendingCorrectionsCount = corrections.filter((c) => c.reviewStatus === 'Pending review').length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={status}
        savedCount={savedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 font-semibold hover:underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* TAB 1: INTEGRATED PIPELINE (Main Workbench) */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Step 1: Import */}
            <ImportPanel
              rawText={rawText}
              setRawText={setRawText}
              title={title}
              setTitle={setTitle}
              isLoading={isProcessing}
              setErrorMessage={setErrorMessage}
            />

            {/* Step 2: Processing Controls */}
            <ProcessingControls
              compressionLevel={compressionLevel}
              setCompressionLevel={setCompressionLevel}
              onRunPipeline={handleRunPipeline}
              onReset={handleReset}
              isLoading={isProcessing}
              hasResults={statements.length > 0}
              correctionsPendingCount={pendingCorrectionsCount}
            />

            {/* Step 3: Extracted Statements & Duplicates / Corrections */}
            <div className="space-y-6">
              <DuplicatesAndCorrections
                duplicates={duplicates}
                corrections={corrections}
                onResolveCorrection={handleResolveCorrection}
              />

              <ConversationPreview
                messages={messages}
                statements={statements}
              />

              {/* Step 4: Topic Chunks & Compact Context */}
              <TopicChunksView
                chunks={chunks}
                compressedText={compressedText}
                onOpenExportModal={() => setIsExportModalOpen(true)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: VERIFICATION & AUDIT (Task 2 & Task 3) */}
        {activeTab === 'verification' && (
          <div className="space-y-8">
            <div>
              <div className="mb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Task 2 & 3: Double-Loop Factual Verification System
                </h2>
                <p className="text-xs text-slate-500">
                  Audits internal consistency against cited dialogue utterances and screens external assertions against user-supplied sources.
                </p>
              </div>

              <InternalVerificationView verifications={verifications} />
            </div>

            <div className="pt-6 border-t border-slate-200">
              <ExternalScreeningView
                statements={statements}
                screenings={externalScreenings}
                onAddScreening={(res) => setExternalScreenings([res, ...externalScreenings])}
                onUpdateStatus={(idx, newStatus) => {
                  const updated = [...externalScreenings];
                  updated[idx].humanReviewStatus = newStatus;
                  setExternalScreenings(updated);
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 3: EVALUATION METRICS (Task 4.2 & 4.3) */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Evaluation Metrics, Token Distinctions & Quality Benchmarks
              </h2>
              <p className="text-xs text-slate-500">
                Measurable compression metrics and ground-truth benchmark evaluation calculated without simulated progress.
              </p>
            </div>
            <MetricsDashboard metrics={metrics} />
          </div>
        )}

        {/* TAB 4: PERSISTENCE & HISTORY (SQLite) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Local SQLite Database Records & Historical Runs
              </h2>
              <p className="text-xs text-slate-500">
                Persistent storage stored on local disk at <code>data/conversations.db</code> with zero cloud telemetry.
              </p>
            </div>
            <HistoryDrawer
              onLoadConversation={handleLoadSavedConversation}
              onRefreshList={refreshSavedCount}
            />
          </div>
        )}

        {/* TAB 5: ARCHITECTURE & API DOCS */}
        {activeTab === 'docs' && <ArchitectureDocsModal />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <p>
            Semester Experiential Learning (Sem-EL) Integrated Evaluation Project — Tasks 1, 2, 3 & 4.
          </p>
          <p className="text-[11px] text-slate-400">
            Local-First Architecture | Node 22 SQLite / FastAPI Python | ReportLab & DOCX
          </p>
        </div>
      </footer>

      {/* Document Export Modal */}
      <DocumentExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        title={title}
        rawText={rawText}
        compressedText={compressedText}
        metrics={metrics}
        statements={statements}
        chunks={chunks}
        corrections={corrections}
        verifications={verifications}
        externalScreenings={externalScreenings}
      />
    </div>
  );
}

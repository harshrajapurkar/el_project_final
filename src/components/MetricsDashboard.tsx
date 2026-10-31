import React, { useState } from 'react';
import { ProcessingMetrics } from '../types';
import { BarChart3, TrendingDown, Cpu, Clock, Award, PlayCircle, CheckCircle2 } from 'lucide-react';
import { runBenchmarkEvaluation, BenchmarkMetrics } from '../utils/pipeline';

interface MetricsDashboardProps {
  metrics: ProcessingMetrics | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  const [benchmark, setBenchmark] = useState<BenchmarkMetrics | null>(null);
  const [runningBenchmark, setRunningBenchmark] = useState(false);

  const handleRunBenchmark = () => {
    setRunningBenchmark(true);
    setTimeout(() => {
      const res = runBenchmarkEvaluation();
      setBenchmark(res);
      setRunningBenchmark(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* 1. Quantitative Processing Metrics Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Measurable Quantitative Metrics (Task 4.2)
            </h3>
          </div>
          {metrics && (
            <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
              Latency: {metrics.processingTimeMs} ms
            </span>
          )}
        </div>

        <div className="p-5">
          {!metrics ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Run the processing pipeline to calculate and display measurable metrics.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Highlight Cards: Reduction & Ratio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm space-y-1">
                  <span className="text-xs text-indigo-100 font-medium">Word Reduction</span>
                  <div className="text-2xl font-bold">{metrics.percentageReduction}%</div>
                  <span className="text-[10px] text-indigo-200">
                    Formula: ((Original - Output) / Original) × 100
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm space-y-1">
                  <span className="text-xs text-slate-300 font-medium">Compression Ratio</span>
                  <div className="text-2xl font-bold font-mono">{metrics.compressionRatio}</div>
                  <span className="text-[10px] text-slate-400">
                    Formula: Output words / Original words
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Estimated Tokens</span>
                  <div className="text-2xl font-bold text-slate-800 font-mono">
                    ~{metrics.estimatedTokens}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Formula: Words × 1.33 (approximate estimate)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Approx Subwords</span>
                  <div className="text-2xl font-bold text-slate-800 font-mono">
                    ~{metrics.actualTokensApprox}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Char-heuristic (~4 chars/token)
                  </span>
                </div>
              </div>

              {/* Detailed Breakdown Tables */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Input Metrics */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                    1. Input Space
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Original Words:</span>
                    <span className="font-mono font-semibold">{metrics.originalWordCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Original Characters:</span>
                    <span className="font-mono font-semibold">{metrics.originalCharCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Message Count:</span>
                    <span className="font-mono font-semibold">{metrics.originalMessageCount}</span>
                  </div>
                </div>

                {/* Processing Metrics */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                    2. Processing Space
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Cleaned Statements:</span>
                    <span className="font-mono font-semibold">{metrics.cleanedStatementCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Exact Duplicates:</span>
                    <span className="font-mono font-semibold text-rose-600">{metrics.exactDuplicatesCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Near-Duplicates:</span>
                    <span className="font-mono font-semibold text-amber-600">{metrics.nearDuplicatesCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Corrections Detected:</span>
                    <span className="font-mono font-semibold text-indigo-600">{metrics.correctionsDetectedCount}</span>
                  </div>
                </div>

                {/* Output Space */}
                <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200">
                    3. Output & Compression
                  </h4>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Compressed Words:</span>
                    <span className="font-mono font-semibold text-emerald-700">{metrics.compressedWordCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Important Statements:</span>
                    <span className="font-mono font-semibold">{metrics.importantStatementsCount}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Topics / Chunks:</span>
                    <span className="font-mono font-semibold">{metrics.topicsCount} / {metrics.chunksCount}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Processing Latency:</span>
                    <span className="font-mono font-semibold">{metrics.processingTimeMs} ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Academic Evaluation & Benchmarking (Task 4.3) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              Academic Benchmark Assessment (Task 4.3)
            </h3>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={runningBenchmark}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>{runningBenchmark ? 'Evaluating Dataset...' : 'Run Labeled Test Dataset Benchmark'}</span>
          </button>
        </div>

        <div className="p-5">
          {!benchmark ? (
            <div className="text-center py-8 text-xs text-slate-500 max-w-lg mx-auto">
              <p>Click "Run Labeled Test Dataset Benchmark" to compute precision, recall, and F1-score against the pre-labeled academic reference set.</p>
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Adheres to Sem-EL evaluation requirements: no accuracy percentages are claimed without an actual executed benchmark test.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Benchmark executed across 10 ground-truth labeled statements. Measurable metrics calculated deterministically.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Duplicate Detection Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px]">
                    Duplicate Detection
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Precision:</span>
                      <span className="font-bold text-indigo-700">{benchmark.duplicateDetection.precision * 100}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Recall:</span>
                      <span className="font-bold text-indigo-700">{benchmark.duplicateDetection.recall * 100}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">F1-Score:</span>
                      <span className="font-bold text-emerald-700">{benchmark.duplicateDetection.f1}</span>
                    </div>
                  </div>
                </div>

                {/* Topic Classification Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px]">
                    Topic Classification
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Accuracy:</span>
                      <span className="font-bold text-indigo-700">{Math.round(benchmark.topicClassification.accuracy * 100)}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Correct:</span>
                      <span>{benchmark.topicClassification.correct} / {benchmark.topicClassification.total}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Categories Tested:</span>
                      <span>7 Categories</span>
                    </div>
                  </div>
                </div>

                {/* Correction Detection Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px]">
                    Correction Detection
                  </h4>
                  <div className="space-y-1 font-mono">
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Precision:</span>
                      <span className="font-bold text-indigo-700">{benchmark.correctionDetection.precision * 100}%</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200">
                      <span className="text-slate-600">Recall:</span>
                      <span className="font-bold text-indigo-700">{benchmark.correctionDetection.recall * 100}%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">F1-Score:</span>
                      <span className="font-bold text-emerald-700">{benchmark.correctionDetection.f1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

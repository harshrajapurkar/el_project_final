import React, { useState } from 'react';
import { BookOpen, Terminal, Check, Copy, Code, Layers, ShieldCheck, FileText } from 'lucide-react';

export const ArchitectureDocsModal: React.FC = () => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyCommand = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const API_TABLE = [
    { method: 'GET', path: '/api/health', desc: 'System health, SQLite status & capabilities' },
    { method: 'POST', path: '/api/process', desc: 'Core pipeline: statement extraction, duplicates, topics, corrections, compression' },
    { method: 'POST', path: '/api/import/chatgpt-json', desc: 'Parse official ChatGPT export JSON with multi-conversation picker' },
    { method: 'POST', path: '/api/import/chatgpt-link', desc: 'Safe best-effort fetch of shared link with error disclosures' },
    { method: 'POST', path: '/api/knowledge', desc: 'Extract structured facts/decisions linked to source statement IDs' },
    { method: 'POST', path: '/api/verify/external', desc: 'Lexical keyword overlap screening against external HTTPS source' },
    { method: 'POST', path: '/api/documents/docx', desc: 'Generate editable Microsoft Word (.docx) report' },
    { method: 'POST', path: '/api/documents/pdf', desc: 'Generate formatted academic PDF (.pdf) report' },
    { method: 'GET', path: '/api/conversations', desc: 'List all saved conversations from SQLite database' },
    { method: 'GET', path: '/api/conversations/{id}', desc: 'Retrieve conversation record, processing run, and corrections' },
    { method: 'DELETE', path: '/api/conversations/{id}', desc: 'Delete conversation and linked runs from SQLite' },
    { method: 'GET', path: '/api/conversations/{id}/corrections', desc: 'Retrieve correction candidates for conversation' },
    { method: 'POST', path: '/api/conversations/{id}/corrections/{index}/resolve', desc: 'Update review status: Accepted, Rejected, or Pending' },
    { method: 'GET', path: '/api/conversations/{id}/export', desc: 'Export conversation as structured JSON or raw TXT' },
    { method: 'GET', path: '/api/evaluation/benchmark', desc: 'Execute evaluation on labeled test dataset for Precision, Recall, F1' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Academic Abstract */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Semester Experiential Learning (Sem-EL) Project Architecture
          </h2>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          The <strong>Local Conversation Processing, Compression, Verification and Knowledge Generation System</strong> is engineered as a unified, four-task pipeline designed to ingest unstructured multi-turn AI conversations, eliminate redundancies while strictly preserving factual evolution, audit statement fidelity against original conversational context, screen assertions against external documentation, and synthesize formal academic artifacts.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1">Task 1: Processing & Compression</h4>
            <p className="text-slate-600 text-[11px]">
              Whitespace normalization, sentence parsing, Jaccard duplicate detection (&gt;= 0.72), topic classification, state update detection, and chunk synthesis.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1">Task 2: Internal Verification</h4>
            <p className="text-slate-600 text-[11px]">
              Utterance-level traceability matrix. Distinguishes supported premises from outdated statements superseded by later corrections.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1">Task 3: External Screening</h4>
            <p className="text-slate-600 text-[11px]">
              Keyword-overlap screening against user-supplied HTTPS sources with clear methodological limitations and human verification workflows.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-slate-900 mb-1">Task 4: Documents & Evaluation</h4>
            <p className="text-slate-600 text-[11px]">
              Automated DOCX and PDF document synthesis, word reduction and compression ratio calculations, and benchmark precision/recall/F1 scoring.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Windows Startup & Deployment Guide */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">
            Windows Execution Instructions for Academic Evaluators
          </h3>
        </div>

        <p className="text-xs text-slate-600">
          The project includes Windows batch scripts to launch both the standalone FastAPI backend and the React frontend on any standard laptop without paid APIs.
        </p>

        <div className="space-y-3">
          <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Option 1: One-Click Windows Launcher</span>
              <button
                onClick={() => copyCommand('run_all.bat', 'run_all')}
                className="text-slate-300 hover:text-white flex items-center gap-1"
              >
                {copiedCmd === 'run_all' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <code>run_all.bat</code>
          </div>

          <div className="bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1">
              <span>Option 2: Standalone Python FastAPI Backend (Port 8000)</span>
              <button
                onClick={() => copyCommand('cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000', 'backend_cmd')}
                className="text-slate-300 hover:text-white flex items-center gap-1"
              >
                {copiedCmd === 'backend_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy</span>
              </button>
            </div>
            <code>cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000</code>
          </div>
        </div>
      </div>

      {/* 3. REST API Endpoint Contract */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
              FastAPI REST API Contract & Endpoints
            </h3>
          </div>
          <span className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded font-mono">
            FastAPI Swagger: /docs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] uppercase tracking-wider">
                <th className="py-2.5 px-4">Method</th>
                <th className="py-2.5 px-4">Endpoint Path</th>
                <th className="py-2.5 px-4">Functionality & Pipeline Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {API_TABLE.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        row.method === 'GET'
                          ? 'bg-blue-100 text-blue-800'
                          : row.method === 'POST'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {row.method}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">{row.path}</td>
                  <td className="py-2.5 px-4 text-slate-600">{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

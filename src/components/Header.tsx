import React from 'react';
import { ShieldCheck, Database, Cpu, FileText, BarChart3, History, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'pipeline' | 'verification' | 'metrics' | 'history' | 'docs';
  setActiveTab: (tab: 'pipeline' | 'verification' | 'metrics' | 'history' | 'docs') => void;
  status: 'Ready' | 'Processing' | 'Completed' | 'Failed' | 'Requires review';
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  status,
  savedCount,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'Processing':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-300 animate-pulse">● Processing...</span>;
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Completed</span>;
      case 'Requires review':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-300">⚠ Requires Review</span>;
      case 'Failed':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800 border border-rose-300">✕ Failed</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-300">○ Ready</span>;
    }
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Academic Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Sem-EL Conversation Processor
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-indigo-900 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700">
                  Academic Project
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Local Compression, Factual Verification & Academic Document Generation
              </p>
            </div>
          </div>

          {/* System Properties Badges */}
          <div className="hidden lg:flex items-center space-x-2 text-xs">
            <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Local-First (No Paid LLM)
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              SQLite Persistent
            </span>
            <div>{getStatusBadge()}</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-4 border-t border-slate-800 py-1.5 overflow-x-auto text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Integrated Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab('verification')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'verification'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verification & Audit</span>
          </button>

          <button
            onClick={() => setActiveTab('metrics')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Evaluation Metrics</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History ({savedCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'docs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Architecture & API</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

import React, { useState } from 'react';
import { Upload, Link2, FileEdit, Sparkles, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { DEMO_CONVERSATIONS } from '../utils/demoData';

interface ImportPanelProps {
  rawText: string;
  setRawText: (text: string) => void;
  title: string;
  setTitle: (t: string) => void;
  onImportComplete?: () => void;
  isLoading: boolean;
  setErrorMessage: (msg: string | null) => void;
}

export const ImportPanel: React.FC<ImportPanelProps> = ({
  rawText,
  setRawText,
  title,
  setTitle,
  isLoading,
  setErrorMessage,
}) => {
  const [importMode, setImportMode] = useState<'sample' | 'manual' | 'json' | 'link'>('sample');
  const [sharedUrl, setSharedUrl] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Multi-conversation state
  const [multiConversations, setMultiConversations] = useState<any[]>([]);
  const [cachedJsonData, setCachedJsonData] = useState<any>(null);
  const [selectedConvIndex, setSelectedConvIndex] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('');

  const handleSelectSample = (sampleId: string) => {
    const sample = DEMO_CONVERSATIONS.find((s) => s.id === sampleId);
    if (sample) {
      setTitle(sample.title);
      setRawText(sample.rawText);
      setErrorMessage(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMessage(null);

    try {
      const text = await file.text();
      const parsedJson = JSON.parse(text);

      // Call inspect on endpoint /api/import/chatgpt-json
      const resp = await fetch('/api/import/chatgpt-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json_data: parsedJson, inspect_only: true }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Failed to inspect ChatGPT JSON');
      }

      setCachedJsonData(parsedJson);

      if (data.isMultiConversation && data.conversations.length > 1) {
        setMultiConversations(data.conversations);
        setSelectedConvIndex(0);
        // Load first by default
        loadSelectedConversation(parsedJson, 0);
      } else {
        setMultiConversations([]);
        loadSelectedConversation(parsedJson, 0);
      }
    } catch (err: any) {
      setErrorMessage(`JSON Import Error: ${err.message}`);
    }
  };

  const loadSelectedConversation = async (jsonData: any, index: number) => {
    try {
      const resp = await fetch('/api/import/chatgpt-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json_data: jsonData, selected_index: index }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Failed to parse selected conversation');
      }

      setTitle(data.title);
      setRawText(data.raw_text);
      setSelectedConvIndex(index);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(`Conversation load failed: ${err.message}`);
    }
  };

  const handleSharedLinkFetch = async () => {
    if (!sharedUrl.trim()) {
      setErrorMessage('Please enter a valid ChatGPT shared conversation URL.');
      return;
    }

    setUrlLoading(true);
    setErrorMessage(null);

    try {
      const resp = await fetch('/api/import/chatgpt-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sharedUrl }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || 'Could not fetch conversation from shared link.');
      }

      setTitle(data.title || 'Imported Shared Conversation');
      setRawText(data.raw_text);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Title bar & import mode switcher */}
      <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <span>Step 1: Conversation Import & Data Ingestion</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Load ChatGPT dialogues via official JSON export, shared link, manual paste, or academic demo scenarios.
          </p>
        </div>

        {/* Import Tabs */}
        <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setImportMode('sample')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              importMode === 'sample' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demonstrations</span>
          </button>

          <button
            onClick={() => setImportMode('manual')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              importMode === 'manual' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Manual Text</span>
          </button>

          <button
            onClick={() => setImportMode('json')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              importMode === 'json' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>ChatGPT JSON</span>
          </button>

          <button
            onClick={() => setImportMode('link')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
              importMode === 'link' ? 'bg-white text-indigo-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Shared Link</span>
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Conversation Title Input */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Conversation Project Title:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sem-EL System Architecture Sync"
              className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* 1. Sample Demonstrations Mode */}
        {importMode === 'sample' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DEMO_CONVERSATIONS.map((demo) => {
              const isSelected = title === demo.title;
              return (
                <div
                  key={demo.id}
                  onClick={() => handleSelectSample(demo.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <h3 className="text-xs font-semibold text-slate-900">{demo.title}</h3>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{demo.description}</p>
                  <div className="mt-2.5 flex items-center gap-2 text-[10px] text-indigo-600 font-medium">
                    <span>Click to load demo dataset</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 2. ChatGPT JSON Upload Mode */}
        {importMode === 'json' && (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 bg-slate-50/50 transition-colors">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <label className="cursor-pointer">
                <span className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Choose conversations.json file
                </span>
                <span className="text-xs text-slate-500 block mt-1">
                  Supports official ChatGPT data export format (Single or Multi-conversation archive)
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <p className="text-xs font-medium text-emerald-700 mt-2">
                  Loaded: {fileName}
                </p>
              )}
            </div>

            {/* Multi-conversation selection dropdown */}
            {multiConversations.length > 1 && (
              <div className="bg-indigo-50/70 border border-indigo-200 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-indigo-950 block">
                    Multiple Conversations Detected ({multiConversations.length} total)
                  </span>
                  <span className="text-[11px] text-indigo-700">
                    Select which conversation to extract and process from this export:
                  </span>
                </div>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedConvIndex}
                    onChange={(e) => {
                      const idx = Number(e.target.value);
                      setSelectedConvIndex(idx);
                      loadSelectedConversation(cachedJsonData, idx);
                    }}
                    className="w-full sm:w-72 text-xs font-medium bg-white border border-indigo-300 text-slate-800 rounded-md py-1.5 pl-2.5 pr-8 focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
                  >
                    {multiConversations.map((c) => (
                      <option key={c.index} value={c.index}>
                        {c.title} ({c.messageCount} messages)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. ChatGPT Shared Link Mode */}
        {importMode === 'link' && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={sharedUrl}
                onChange={(e) => setSharedUrl(e.target.value)}
                placeholder="https://chatgpt.com/share/..."
                className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSharedLinkFetch}
                disabled={urlLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {urlLoading ? 'Fetching...' : 'Retrieve Link'}
              </button>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Security & Limitations Disclosure:</p>
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  OpenAI employs Cloudflare bot protection on shared links which frequently restricts programmatic fetching.
                  If fetching fails, use the official JSON export or copy-paste directly. No login credentials or session tokens are ever requested.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-slate-700">
              Raw Conversation Utterances (Editable Text Stream):
            </label>
            <span className="text-[11px] text-slate-400">
              {rawText.length} characters | ~{rawText.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            placeholder="User: ...&#10;ChatGPT: ...&#10;User: Correction: ..."
            className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>
  );
};

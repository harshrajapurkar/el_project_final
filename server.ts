import express from 'express';
import type { Request, Response } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  parseConversationText,
  extractStatementsFromMessages,
  detectDuplicates,
  detectCorrections,
  compressContext,
  calculateMetrics,
  verifyExtractedItems,
  screenClaimAgainstSource,
  runBenchmarkEvaluation,
} from './src/utils/pipeline.ts';
import type { CompressionLevel } from './src/utils/pipeline.ts';
import {
  inspectChatGPTExport,
  parseSelectedChatGPTConversation,
} from './src/utils/chatgptParser.ts';
import { generateDocxReport, generatePdfReport } from './src/utils/documentGenerator.ts';
import { localDb } from './src/server/database.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ----------------------------------------------------------------------
// API Endpoints
// ----------------------------------------------------------------------

// GET /api/health
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'Sem-EL Local Conversation Processor & Verifier',
    database: 'SQLite (local file data/conversations.db)',
    environment: 'Local / Offline Capable',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/process
// Full pipeline: text -> messages -> statements -> duplicates -> topics -> corrections -> compression -> metrics
app.post('/api/process', (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    const {
      conversation_id,
      title = 'Sem-EL Conversation',
      text = '',
      messages: inputMessages,
      compression_level = 'balanced',
      save = true,
    } = req.body;

    if (!text && (!inputMessages || inputMessages.length === 0)) {
      return res.status(400).json({ error: 'Either conversation text or messages array is required' });
    }

    // Step 1: Parse or use messages
    const messages = inputMessages && inputMessages.length > 0 ? inputMessages : parseConversationText(text);
    const rawText = text || messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n');

    // Step 2: Extract statements
    const rawStatements = extractStatementsFromMessages(messages);

    // Step 3: Duplicate detection (preserving meaningful corrections)
    const { duplicates, flaggedStatements } = detectDuplicates(rawStatements);

    // Step 4: Detect correction candidates
    const corrections = detectCorrections(flaggedStatements);

    // Step 5: Compress context and generate manageable chunks
    const { compressedText, chunks } = compressContext(flaggedStatements, compression_level as CompressionLevel);

    // Step 6: Internal Factual Verification (Task 2)
    const verifications = verifyExtractedItems(flaggedStatements, corrections);

    // Step 7: Calculate comprehensive metrics
    const processingTimeMs = Date.now() - startTime;
    const metrics = calculateMetrics(
      rawText,
      messages,
      flaggedStatements,
      duplicates,
      corrections,
      compressedText,
      chunks,
      processingTimeMs
    );

    const convId = conversation_id || `conv-${Date.now()}`;

    // Step 8: Persist to local SQLite
    if (save) {
      localDb.saveConversation(convId, title, rawText, messages.length);
      localDb.saveProcessingRun(convId, compressedText, metrics, chunks, flaggedStatements);
      localDb.saveCorrections(convId, corrections);
    }

    res.json({
      conversation_id: convId,
      title,
      raw_text: rawText,
      messages,
      statements: flaggedStatements,
      duplicates,
      corrections,
      chunks,
      compressed_text: compressedText,
      verifications,
      metrics,
    });
  } catch (err: any) {
    console.error('Processing error:', err);
    res.status(500).json({ error: err.message || 'Error processing conversation' });
  }
});

// POST /api/import/chatgpt-json
// Robust import supporting multi-conversation exports and conversation selection
app.post('/api/import/chatgpt-json', (req: Request, res: Response) => {
  try {
    const { json_data, selected_index = 0, inspect_only = false } = req.body;

    if (!json_data) {
      return res.status(400).json({ error: 'Missing json_data payload' });
    }

    const inspection = inspectChatGPTExport(json_data);
    if (!inspection.isValid) {
      return res.status(400).json({ error: inspection.error || 'Invalid ChatGPT JSON structure' });
    }

    if (inspect_only) {
      return res.json(inspection);
    }

    const parsed = parseSelectedChatGPTConversation(json_data, selected_index);
    res.json({
      title: parsed.title,
      messages: parsed.messages,
      raw_text: parsed.rawText,
      total_conversations_in_export: inspection.conversations.length,
      available_conversations: inspection.conversations,
      selected_index,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to import ChatGPT JSON' });
  }
});

// POST /api/import/chatgpt-link
// Best-effort public shared link import with strict error boundaries and no false success
app.post('/api/import/chatgpt-link', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a full HTTPS URL.' });
    }

    if (parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: 'Only secure HTTPS URLs are allowed.' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const isChatGPTDomain = hostname.includes('chatgpt.com') || hostname.includes('openai.com');

    if (!isChatGPTDomain) {
      return res.status(400).json({
        error: 'URL domain must be chatgpt.com or chat.openai.com (e.g., https://chatgpt.com/share/...)',
      });
    }

    // Attempt best-effort fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    let html = '';
    let responseStatus = 200;

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      responseStatus = response.status;
      html = await response.text();
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      return res.status(502).json({
        error: `Could not retrieve shared link: ${fetchErr.name === 'AbortError' ? 'Connection timed out' : fetchErr.message}. Public link imports are subject to server availability. Use JSON export as fallback.`,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Check for Cloudflare challenge or auth block
    if (responseStatus === 403 || html.includes('cf-browser-verification') || html.includes('challenges.cloudflare.com')) {
      return res.status(403).json({
        error:
          'OpenAI Cloudflare Bot Protection blocked automated retrieval of this shared link. This is expected behavior for scraping protections. Please copy-paste the conversation text or upload the conversations.json export.',
      });
    }

    if (responseStatus === 404 || html.includes('Page not found')) {
      return res.status(404).json({
        error: 'Shared conversation was not found or has been revoked by the author.',
      });
    }

    // Attempt best-effort extraction from HTML hydration script
    const messages: any[] = [];
    let title = 'ChatGPT Shared Conversation';

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      title = titleMatch[1].replace(/ - ChatGPT/i, '').trim();
    }

    // Look for embedded JSON state in window.__remixContext or script tags
    const remixMatch = html.match(/window\.__remixContext\s*=\s*(\{.*?\});<\/script>/s);
    if (remixMatch) {
      try {
        const remixData = JSON.parse(remixMatch[1]);
        const serverProps = remixData.state?.loaderData;
        if (serverProps) {
          // Traverse loader data
          const dump = JSON.stringify(serverProps);
          // Extract message chunks
          const textMatches = dump.matchAll(/"parts":\s*\["([^"]+)"\]/g);
          let mCount = 1;
          for (const m of textMatches) {
            messages.push({
              id: `M-${String(mCount++).padStart(3, '0')}`,
              role: mCount % 2 === 1 ? 'user' : 'assistant',
              content: m[1].replace(/\\n/g, '\n'),
            });
          }
        }
      } catch (e) {
        // Fallback to text parsing
      }
    }

    if (messages.length === 0) {
      // Return clear disclosure that page format changed or is dynamic
      return res.status(422).json({
        error:
          'The shared conversation page returned dynamic client-rendered HTML without static SSR content. To preserve complete fidelity, please paste the conversation directly or import the official JSON export.',
      });
    }

    const rawText = messages.map((m) => `${m.role === 'user' ? 'User' : 'ChatGPT'}:\n${m.content}`).join('\n\n');

    res.json({
      title,
      messages,
      raw_text: rawText,
      source_url: url,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing shared link' });
  }
});

// POST /api/knowledge
// Extract structured facts, decisions, requirements, tasks, linked to original statements
app.post('/api/knowledge', (req: Request, res: Response) => {
  try {
    const { statements = [], corrections = [] } = req.body;
    const items = verifyExtractedItems(statements, corrections);
    res.json({ items, count: items.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract knowledge items' });
  }
});

// POST /api/verify/external
// Screen claim against user-supplied external source URL
app.post('/api/verify/external', async (req: Request, res: Response) => {
  try {
    const { claim, source_url, manual_excerpt } = req.body;

    if (!claim) {
      return res.status(400).json({ error: 'Claim text is required' });
    }

    if (!source_url && !manual_excerpt) {
      return res.status(400).json({ error: 'Either source_url or manual_excerpt must be provided' });
    }

    let sourceTitle = 'External Source';
    let excerpt = manual_excerpt || '';

    if (source_url && !excerpt) {
      try {
        const parsedUrl = new URL(source_url);
        if (parsedUrl.protocol !== 'https:') {
          return res.status(400).json({ error: 'Source URL must use secure HTTPS protocol.' });
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);

        const response = await fetch(source_url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SemEL-Research-Verifier/1.0',
            Accept: 'text/html,text/plain;q=0.9',
          },
        });
        clearTimeout(timeout);

        if (!response.ok) {
          return res.status(502).json({
            error: `Failed to retrieve external source: HTTP status ${response.status}`,
          });
        }

        const html = await response.text();
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
          sourceTitle = titleMatch[1].trim();
        } else {
          sourceTitle = parsedUrl.hostname;
        }

        // Strip HTML tags and scripts to get clean excerpt
        const cleanText = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Find best matching paragraph or window around claim keywords
        const claimWords = claim.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
        let bestSnippet = cleanText.slice(0, 400);

        for (const w of claimWords) {
          const idx = cleanText.toLowerCase().indexOf(w);
          if (idx !== -1) {
            const start = Math.max(0, idx - 80);
            const end = Math.min(cleanText.length, idx + 320);
            bestSnippet = cleanText.slice(start, end).trim();
            break;
          }
        }

        excerpt = bestSnippet;
      } catch (fetchErr: any) {
        return res.status(502).json({
          error: `External URL could not be retrieved (${fetchErr.message}). You may paste an excerpt manually.`,
        });
      }
    }

    const result = screenClaimAgainstSource(claim, sourceTitle, source_url || 'https://local-source.org', excerpt);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing external screening' });
  }
});

// POST /api/documents/docx
app.post('/api/documents/docx', async (req: Request, res: Response) => {
  try {
    const reportData = req.body;
    if (!reportData || !reportData.title) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const docxBuffer = await generateDocxReport(reportData);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="SemEL_Report_${Date.now()}.docx"`);
    res.send(docxBuffer);
  } catch (err: any) {
    console.error('DOCX generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate DOCX report' });
  }
});

// POST /api/documents/pdf
app.post('/api/documents/pdf', async (req: Request, res: Response) => {
  try {
    const reportData = req.body;
    if (!reportData || !reportData.title) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    const pdfBytes = await generatePdfReport(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SemEL_Report_${Date.now()}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err: any) {
    console.error('PDF generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate PDF report' });
  }
});

// GET /api/conversations
app.get('/api/conversations', (_req: Request, res: Response) => {
  try {
    const list = localDb.listConversations();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list conversations' });
  }
});

// GET /api/conversations/:id
app.get('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const conv = localDb.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch conversation' });
  }
});

// DELETE /api/conversations/:id
app.delete('/api/conversations/:id', (req: Request, res: Response) => {
  try {
    const success = localDb.deleteConversation(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete conversation' });
  }
});

// GET /api/conversations/:id/corrections
app.get('/api/conversations/:id/corrections', (req: Request, res: Response) => {
  try {
    const corrs = localDb.getCorrections(req.params.id);
    res.json(corrs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch corrections' });
  }
});

// POST /api/conversations/:id/corrections/:index/resolve
app.post('/api/conversations/:id/corrections/:index/resolve', (req: Request, res: Response) => {
  try {
    const { status = 'Accepted' } = req.body;
    const { id, index } = req.params;
    const success = localDb.resolveCorrection(id, index, status);
    if (!success) {
      return res.status(404).json({ error: 'Correction index or ID not found' });
    }
    res.json({ success: true, status, updated_at: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to resolve correction' });
  }
});

// GET /api/conversations/:id/export
app.get('/api/conversations/:id/export', (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'json';
    const conv = localDb.getConversation(req.params.id);
    if (!conv) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (format === 'txt') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${conv.title || 'conversation'}.txt"`);
      return res.send(conv.raw_text);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${conv.title || 'conversation'}.json"`);
    res.json(conv);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to export conversation' });
  }
});

// GET /api/evaluation/benchmark
// Runs labelled test dataset evaluation returning precision, recall, and F1
app.get('/api/evaluation/benchmark', (_req: Request, res: Response) => {
  try {
    const benchmark = runBenchmarkEvaluation();
    res.json({
      status: 'success',
      dataset_size: 10,
      benchmark,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to run benchmark' });
  }
});

// ----------------------------------------------------------------------
// Vite Middleware / Static Files Serving
// ----------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot error:', err);
  process.exit(1);
});

# Local Conversation Processing, Compression, Verification and Knowledge Generation System
## Integrated Sem-EL Academic Software Project (Tasks 1, 2, 3 & 4)

An integrated, local-first academic software system developed for Semester Experiential Learning (Sem-EL) evaluation. The system processes ChatGPT dialogues, extracts structured knowledge, identifies exact and near duplicates, tracks state corrections, verifies extracted information against original conversation context (internal traceability), screens candidate claims against external HTTPS sources via lexical keyword overlap, and compiles formatted academic reports in editable DOCX and PDF formats.

---

## 1. System Architecture & Integrated Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. IMPORT (Task 1.1)                                        │
│   • Manual Conversation Input                               │
│   • Official ChatGPT Export (`conversations.json` tree)     │
│   • Multi-conversation Selection Dropdown                   │
│   • Public Shared Link Retrieval (Best-effort HTTPS)        │
│   • Demonstration Pre-loaded Scenarios                      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. LOCAL TEXT PROCESSING & COMPRESSION (Task 1.2 - 1.8)     │
│   • Normalization, whitespace cleaning & sentence splitting │
│   • Statement extraction with unique IDs (S-001, S-002, ...)│
│   • Exact and Near-Duplicate Detection (Jaccard >= 0.72)    │
│   • Topic Classification & Thematic Segmentation            │
│   • State Update & Correction Candidate Detection           │
│   • Compression Levels: Low, Balanced, High                 │
│   • Manageable Topic Chunk Synthesis                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. INTERNAL FACTUAL VERIFICATION (Task 2)                   │
│   • Statement-level Source Traceability                     │
│   • Detection of Superseded / Outdated Information          │
│   • Citation of exact speaker utterances                    │
│   • Disclosed Boundary: Source consistency ≠ absolute truth│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. EXTERNAL EVIDENCE SCREENING (Task 3)                     │
│   • User-supplied HTTPS source URL retrieval                │
│   • Domain identification & clean excerpt extraction        │
│   • Lexical keyword overlap scoring                         │
│   • Classification: Supported, Contradicted, Inconclusive   │
│   • Explicit prototype limitation disclosure                │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DOCUMENT GENERATION & EVALUATION (Task 4)                │
│   • Measurable metrics: Reduction %, Ratio, Token Estimates │
│   • Benchmarking: Precision, Recall, F1 for detection/topics│
│   • Editable Microsoft Word (.docx) Report Generation       │
│   • Formatted Academic PDF (.pdf) Report Generation         │
│   • Local SQLite Persistence (`data/conversations.db`)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite.
- **Backend (Python)**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, SQLite3, ReportLab, python-docx, BeautifulSoup4, Requests, Pytest.
- **Runtime Environment (Integrated Node/Express)**: Express 4.21, Node 22 built-in SQLite (`DatabaseSync`), `docx`, `pdf-lib`.
- **Database**: Local SQLite file (`data/conversations.db`) with WAL mode.
- **Privacy & Security**: Zero external LLM API calls, no transmission of raw conversations to third-party AI services.

---

## 3. Quick Start on Windows

### Option A: One-Click Launcher
Double-click `run_all.bat`. It will:
1. Launch the FastAPI backend on `http://127.0.0.1:8000`.
2. Launch the React frontend on `http://localhost:3000`.

### Option B: Manual Terminal Execution

#### 1. Start Python Backend
```cmd
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
Swagger UI will be active at: `http://127.0.0.1:8000/docs`

#### 2. Start Frontend
In a separate terminal:
```cmd
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## 4. API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status, database connectivity, and engine version |
| `POST` | `/api/process` | Full local processing, duplicate detection, chunking & metrics |
| `POST` | `/api/import/chatgpt-json` | Parses ChatGPT export JSON with multi-conversation selection |
| `POST` | `/api/import/chatgpt-link` | Safe best-effort extraction of public ChatGPT shared link |
| `POST` | `/api/knowledge` | Extracts verifiable statements linked to utterance IDs |
| `POST` | `/api/verify/external` | Screens claim against supplied HTTPS source URL excerpt |
| `POST` | `/api/documents/docx` | Generates editable Word document (.docx) |
| `POST` | `/api/documents/pdf` | Generates formatted academic report (.pdf) |
| `GET` | `/api/conversations` | Lists saved conversations from SQLite |
| `GET` | `/api/conversations/{id}` | Retrieves full conversation details and processing run |
| `DELETE` | `/api/conversations/{id}` | Deletes conversation and all linked processing runs |
| `GET` | `/api/conversations/{id}/corrections` | Retrieves correction candidates and review status |
| `POST` | `/api/conversations/{id}/corrections/{index}/resolve` | Resolves correction as Accepted, Rejected, or Pending |
| `GET` | `/api/conversations/{id}/export` | Exports conversation as structured JSON or raw TXT |
| `GET` | `/api/evaluation/benchmark` | Runs labelled test dataset evaluation for Precision/Recall/F1 |

---

## 5. Automated Testing

### Running Frontend & Node Logic Tests:
```bash
npx --yes tsx --test src/utils/pipeline.test.ts
npx --yes tsx --test src/utils/chatgptParser.test.ts
npx --yes tsx --test src/utils/documentGenerator.test.ts
npx --yes tsx --test src/server/database.test.ts
```

### Running Backend Python Tests:
```cmd
cd backend
pytest tests/test_pipeline.py -v
```

---

## 6. Academic & Methodological Disclosures

1. **Local Rule-Based Architecture**: Processing relies on deterministic grammatical, positional, and heuristic classifiers without undisclosed LLM API calls.
2. **Internal Source Consistency**: Task 2 verifies whether an extracted item is supported by the cited conversation utterance. It confirms internal conversational consistency rather than real-world truth.
3. **External Evidence Screening**: Task 3 computes lexical keyword overlap against user-provided sources. It provides an initial screening signal, not comprehensive automated research.
4. **Token Estimation Formula**: Standard token count is estimated as `Words * 1.33` and clearly flagged as an approximation alongside subword character heuristics.

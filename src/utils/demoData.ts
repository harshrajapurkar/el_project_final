export interface DemoConversation {
  id: string;
  title: string;
  description: string;
  rawText: string;
}

export const DEMO_CONVERSATIONS: DemoConversation[] = [
  {
    id: 'demo-architecture-meeting',
    title: 'Sem-EL Architecture & Rescheduling Meeting',
    description: 'Contains scheduling, duplicate reminders, date corrections, technical decisions, and assigned responsibilities.',
    rawText: `User [2026-10-30 10:00]: Hello! Let's finalize our architecture for the Semester Experiential Learning (Sem-EL) project.
ChatGPT [2026-10-30 10:01]: Welcome! Let's structure the local conversation processing and compression pipeline across all four tasks.
User [2026-10-30 10:03]: We decided to use FastAPI for the Python backend service and React 19 with Vite for the frontend.
ChatGPT [2026-10-30 10:04]: Excellent. FastAPI provides high-performance asynchronous endpoints and automatic Swagger documentation.
User [2026-10-30 10:05]: The meeting is scheduled for Thursday at 2 PM.
ChatGPT [2026-10-30 10:06]: Got it. The team sync is confirmed for Thursday at 2 PM.
User [2026-10-30 10:10]: The meeting is scheduled for Thursday at 2 PM.
ChatGPT [2026-10-30 10:11]: Understood, keeping Thursday 2 PM reserved.
User [2026-10-30 10:15]: Correction: The meeting has been moved to Friday at 3 PM due to a mentor conflict.
ChatGPT [2026-10-30 10:16]: Noted and updated! The revised meeting time is Friday at 3 PM.
User [2026-10-30 10:18]: Harsh is responsible for completing the unit tests and ReportLab documentation by Friday evening.
ChatGPT [2026-10-30 10:19]: Action item logged for Harsh with deadline Friday evening.
User [2026-10-30 10:20]: The system must support offline SQLite local persistence with WAL mode enabled.
ChatGPT [2026-10-30 10:21]: Requirement recorded: local SQLite storage with zero external cloud dependencies.
User [2026-10-30 10:22]: What database indexing strategy should we use for rapid statement retrieval?
ChatGPT [2026-10-30 10:23]: We can index conversation_id and statement IDs for sub-millisecond query lookups.`
  },
  {
    id: 'demo-ml-hyperparameters',
    title: 'Machine Learning Experiment & Hyperparameter Tuning',
    description: 'Contains experimental configurations, duplicate batch sizes, parameter corrections, and benchmark questions.',
    rawText: `User [2026-10-28 14:00]: We are evaluating the local NLI model for semantic contradiction detection.
ChatGPT [2026-10-28 14:01]: Sounds promising. A lightweight DeBERTa-v3 or MiniLM model can run locally on CPU.
User [2026-10-28 14:03]: We decided on a batch size of 32 for the evaluation run.
ChatGPT [2026-10-28 14:04]: Batch size 32 configured with AdamW optimizer.
User [2026-10-28 14:05]: We decided on a batch size of 32 for the evaluation run.
ChatGPT [2026-10-28 14:06]: Acknowledged, maintaining batch size 32.
User [2026-10-28 14:10]: Correction: The batch size is changed to 64 to better utilize available system RAM.
ChatGPT [2026-10-28 14:11]: Updated: Batch size set to 64. Memory overhead estimated at 1.8 GB.
User [2026-10-28 14:15]: System requirement: inference latency must remain below 150 milliseconds per pair.
ChatGPT [2026-10-28 14:16]: Latency constraint noted: target <= 150ms on standard Windows laptop hardware.
User [2026-10-28 14:20]: Can we run quantization in 8-bit mode without accuracy degradation?
ChatGPT [2026-10-28 14:21]: Open research question: INT8 quantization will be benchmarked on the test dataset.`
  },
  {
    id: 'demo-product-backlog',
    title: 'Product Requirements & Sprint Backlog',
    description: 'Contains user stories, duplicates, priority corrections, and delivery commitments.',
    rawText: `User [2026-10-25 09:00]: Let's define Sprint 4 deliverables for the conversation processing system.
ChatGPT [2026-10-25 09:01]: Ready. Key deliverables include Task 3 external verification and Task 4 document generation.
User [2026-10-25 09:05]: Primary requirement: ReportLab and python-docx must produce valid, openable academic reports.
ChatGPT [2026-10-25 09:06]: Verified: Generated DOCX must be fully editable and PDF must adhere to academic formatting.
User [2026-10-25 09:08]: Sprint demo is scheduled for November 5th.
ChatGPT [2026-10-25 09:09]: Calendar marked: Sprint demo on November 5th.
User [2026-10-25 09:12]: Correction: Sprint demo is rescheduled to November 8th to accommodate the project mentor.
ChatGPT [2026-10-25 09:13]: Date correction saved: Sprint demo moved to November 8th.
User [2026-10-25 09:15]: Who is handling the automated pytest validation suite?
ChatGPT [2026-10-25 09:16]: Assigned to Harsh with test execution covering all 22 pipeline cases.`
  }
];

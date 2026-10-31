export type TopicCategory =
  | 'Decisions and Plans'
  | 'Tasks and Actions'
  | 'Corrections and Updates'
  | 'People and Contacts'
  | 'Facts and Reference Information'
  | 'Requirements'
  | 'Questions and Unresolved Issues'
  | 'General Discussion';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface Statement {
  id: string;
  messageId: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  topic: TopicCategory;
  isImportant: boolean;
  importanceReason?: string;
  isDuplicate?: boolean;
  duplicateOfId?: string;
  similarityScore?: number;
  isCorrectionCandidate?: boolean;
  supersededBy?: string;
}

export interface DuplicateMatch {
  originalId: string;
  duplicateId: string;
  type: 'exact' | 'near-duplicate';
  similarity: number;
  originalText: string;
  duplicateText: string;
  isMeaningfulUpdate: boolean;
}

export interface CorrectionCandidate {
  id: string;
  earlierStatementId: string;
  earlierText: string;
  newStatementId: string;
  newText: string;
  correctionType: 'Date update' | 'Decision change' | 'Requirement modification' | 'Task reassignment' | 'Status change';
  reviewStatus: 'Pending review' | 'Accepted' | 'Rejected';
  timestamp?: string;
}

export interface Chunk {
  id: string;
  topic: TopicCategory;
  title: string;
  statementIds: string[];
  summary: string;
  wordCount: number;
}

export interface ProcessingMetrics {
  originalCharCount: number;
  originalWordCount: number;
  originalMessageCount: number;
  cleanedStatementCount: number;
  exactDuplicatesCount: number;
  nearDuplicatesCount: number;
  topicsCount: number;
  chunksCount: number;
  importantStatementsCount: number;
  correctionsDetectedCount: number;
  processingTimeMs: number;
  compressedWordCount: number;
  compressedCharCount: number;
  estimatedTokens: number;
  actualTokensApprox: number;
  compressionRatio: number;
  percentageReduction: number;
}

export interface InternalVerificationItem {
  id: string;
  statementId: string;
  extractedInformation: string;
  category: TopicCategory;
  originalSourceText: string;
  speakerRole: 'user' | 'assistant' | 'system';
  result:
    | 'Supported by original conversation'
    | 'Unsupported by cited conversation text'
    | 'Contradictory information found'
    | 'Possible outdated information'
    | 'Requires manual review';
  confidence: number;
  explanation: string;
  reviewStatus: 'Pending' | 'Verified' | 'Flagged';
}

export interface ExternalScreeningResult {
  claim: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceTitle: string;
  publicationDate?: string;
  sourceExcerpt: string;
  overlapScore: number;
  classification: 'Supported' | 'Contradicted' | 'Outdated' | 'Inconclusive';
  explanation: string;
  limitations: string;
  humanReviewStatus: 'Unreviewed' | 'Validated' | 'Questionable';
}

export interface ConversationRecord {
  id: string;
  title: string;
  message_count: number;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  raw_text?: string;
  processingRun?: {
    compressedText: string;
    metrics: ProcessingMetrics;
    chunks: Chunk[];
    statements: Statement[];
    updatedAt: string;
  };
  corrections?: CorrectionCandidate[];
}

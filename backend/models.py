from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

class MessageModel(BaseModel):
    id: str
    role: Literal['user', 'assistant', 'system']
    content: str
    timestamp: Optional[str] = None

class StatementModel(BaseModel):
    id: str
    messageId: str
    role: Literal['user', 'assistant', 'system']
    text: str
    topic: str
    isImportant: bool
    importanceReason: Optional[str] = None
    isDuplicate: Optional[bool] = False
    duplicateOfId: Optional[str] = None
    similarityScore: Optional[float] = None
    isCorrectionCandidate: Optional[bool] = False
    supersededBy: Optional[str] = None

class DuplicateMatchModel(BaseModel):
    originalId: str
    duplicateId: str
    type: Literal['exact', 'near-duplicate']
    similarity: float
    originalText: str
    duplicateText: str
    isMeaningfulUpdate: bool

class CorrectionCandidateModel(BaseModel):
    id: str
    earlierStatementId: str
    earlierText: str
    newStatementId: str
    newText: str
    correctionType: Literal['Date update', 'Decision change', 'Requirement modification', 'Task reassignment', 'Status change']
    reviewStatus: Literal['Pending review', 'Accepted', 'Rejected'] = 'Pending review'
    timestamp: Optional[str] = None

class ChunkModel(BaseModel):
    id: str
    topic: str
    title: str
    statementIds: List[str]
    summary: str
    wordCount: int

class ProcessingMetricsModel(BaseModel):
    originalCharCount: int
    originalWordCount: int
    originalMessageCount: int
    cleanedStatementCount: int
    exactDuplicatesCount: int
    nearDuplicatesCount: int
    topicsCount: int
    chunksCount: int
    importantStatementsCount: int
    correctionsDetectedCount: int
    processingTimeMs: float
    compressedWordCount: int
    compressedCharCount: int
    estimatedTokens: int
    actualTokensApprox: int
    compressionRatio: float
    percentageReduction: float

class InternalVerificationItemModel(BaseModel):
    id: str
    statementId: str
    extractedInformation: str
    category: str
    originalSourceText: str
    speakerRole: Literal['user', 'assistant', 'system']
    result: Literal[
        'Supported by original conversation',
        'Unsupported by cited conversation text',
        'Contradictory information found',
        'Possible outdated information',
        'Requires manual review'
    ]
    confidence: float
    explanation: str
    reviewStatus: Literal['Pending', 'Verified', 'Flagged'] = 'Pending'

class ExternalScreeningResultModel(BaseModel):
    claim: str
    sourceUrl: str
    sourceDomain: str
    sourceTitle: str
    publicationDate: Optional[str] = None
    sourceExcerpt: str
    overlapScore: float
    classification: Literal['Supported', 'Contradicted', 'Outdated', 'Inconclusive']
    explanation: str
    limitations: str
    humanReviewStatus: Literal['Unreviewed', 'Validated', 'Questionable'] = 'Unreviewed'

# Request Payloads
class ProcessRequest(BaseModel):
    conversation_id: Optional[str] = None
    title: Optional[str] = 'Sem-EL Conversation'
    text: Optional[str] = ''
    messages: Optional[List[MessageModel]] = None
    compression_level: Optional[Literal['low', 'balanced', 'high']] = 'balanced'
    save: Optional[bool] = True

class ChatGPTJsonImportRequest(BaseModel):
    json_data: Any
    selected_index: Optional[int] = 0
    inspect_only: Optional[bool] = False

class ChatGPTLinkImportRequest(BaseModel):
    url: str

class ExternalVerificationRequest(BaseModel):
    claim: str
    source_url: Optional[str] = None
    manual_excerpt: Optional[str] = None

class ResolveCorrectionRequest(BaseModel):
    status: Literal['Accepted', 'Rejected', 'Pending review'] = 'Accepted'

class ReportGenerationRequest(BaseModel):
    title: str
    originalText: str
    compressedText: str
    metrics: ProcessingMetricsModel
    statements: List[StatementModel]
    chunks: List[ChunkModel]
    corrections: List[CorrectionCandidateModel]
    verifications: List[InternalVerificationItemModel]
    externalScreenings: List[ExternalScreeningResultModel]
    timestamp: Optional[str] = None

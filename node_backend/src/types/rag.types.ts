export interface ParsedDocument {
  filename: string;
  fileType: string;
  content: string;
  size: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface ChunkMetadata {
  totalChunks: number;
  chunkIndex: number;
  sourceSize: number;
}

export interface TextChunk {
  text: string;
  chunkId: number;
  sourceFile: string;
  fileType: string;
  chunkSize: number;
  metadata: ChunkMetadata;
}

export interface SearchResult {
  chunk: TextChunk;
  similarityScore: number;
  distance: number;
  rank: number;
}

export interface ConversationTurn {
  turnId: string;
  userMessage: string;
  assistantResponse: string;
  timestamp: string;
  retrievedChunks: string[];
  sources: string[];
  contextUsed: string;
  tokensUsed: number;
  processingTime: number;
  relevanceScore: number;
}

export interface ConversationSession {
  sessionId: string;
  createdAt: string;
  lastActivity: string;
  turns: ConversationTurn[];
  sessionSummary: string;
  totalTokens: number;
  documentContext: Record<string, any>;
}

export interface FormattedContext {
  formattedContext: string;
  recentTopics: string[];
  turnCount: number;
}

export interface LLMResponse {
  answer: string;
  tokensUsed: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface QueryRequest {
  sessionId: string;
  message: string;
  useContext?: boolean;
}

export interface QueryResponse {
  sessionId: string;
  turnId: string;
  answer: string;
  sources: string[];
  processingTime: number;
  tokensUsed: number;
  conversationTurns: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  components: {
    server: string;
    llmApi: string;
    vectorStore: string;
    conversationMemory: string;
  };
}

export interface SystemStatsResponse {
  activeSessions: number;
  totalChunks: number;
  totalSources: number;
  uptimeSeconds: number;
  timestamp: string;
}

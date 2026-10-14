import { v4 as uuidv4 } from 'uuid';
import {
  ConversationSession,
  ConversationTurn,
  FormattedContext
} from '../../types/rag.types.js';
import { SessionStore } from './session.store.js';
import { env } from '../../config/env.config.js';

export class ConversationMemoryService {
  private static stopWords = new Set([
    'The', 'This', 'That', 'These', 'Those', 'They', 'We', 'You', 'I', 'It', 'He', 'She',
    'What', 'How', 'Where', 'Why', 'When', 'Who', 'Which', 'Whom', 'Whose',
    'Is', 'Are', 'Was', 'Were', 'Be', 'Been', 'Being',
    'Have', 'Has', 'Had', 'Do', 'Does', 'Did',
    'Can', 'Could', 'Should', 'Would', 'Will', 'Shall', 'May', 'Might', 'Must',
    'An', 'A', 'And', 'But', 'Or', 'Nor', 'For', 'So', 'Yet',
    'In', 'On', 'At', 'To', 'From', 'By', 'With', 'About', 'Into', 'Through', 'During',
    'Before', 'After', 'Above', 'Below', 'Under', 'Between'
  ]);

  constructor(
    private readonly sessionStore: SessionStore,
    private readonly maxShortTermTurns: number = env.MAX_CONTEXT_TURNS,
    private readonly maxContextLength: number = 4000
  ) {}

  public async createSession(documentContext: Record<string, any> = {}): Promise<string> {
    const sessionId = uuidv4();
    const now = new Date().toISOString();

    const session: ConversationSession = {
      sessionId,
      createdAt: now,
      lastActivity: now,
      turns: [],
      sessionSummary: 'New session created',
      totalTokens: 0,
      documentContext
    };

    await this.sessionStore.saveSession(session);
    return sessionId;
  }

  public getSession(sessionId: string): ConversationSession | undefined {
    return this.sessionStore.getSession(sessionId);
  }

  public getAllSessions(): ConversationSession[] {
    return this.sessionStore.getAllSessions();
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessionStore.deleteSession(sessionId);
  }

  public async clearContext(sessionId: string): Promise<boolean> {
    return this.sessionStore.clearTurns(sessionId);
  }

  public async addTurn(
    sessionId: string,
    params: {
      userMessage: string;
      assistantResponse: string;
      retrievedChunks?: string[];
      sources?: string[];
      contextUsed?: string;
      tokensUsed?: number;
      processingTime?: number;
      relevanceScore?: number;
    }
  ): Promise<string> {
    const session = this.sessionStore.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const turnId = uuidv4();
    const now = new Date().toISOString();

    const turn: ConversationTurn = {
      turnId,
      userMessage: params.userMessage,
      assistantResponse: params.assistantResponse,
      timestamp: now,
      retrievedChunks: params.retrievedChunks || [],
      sources: params.sources || [],
      contextUsed: params.contextUsed || '',
      tokensUsed: params.tokensUsed || 0,
      processingTime: params.processingTime || 0,
      relevanceScore: params.relevanceScore || 0
    };

    session.turns.push(turn);
    session.lastActivity = now;
    session.totalTokens += turn.tokensUsed;

    // Retain only short term turns in active context
    if (session.turns.length > this.maxShortTermTurns) {
      session.turns = session.turns.slice(-this.maxShortTermTurns);
    }

    // Update summary with recent topics
    const recentTopics = this.extractTopics(
      session.turns.map(t => `${t.userMessage} ${t.assistantResponse}`).join(' ')
    );
    session.sessionSummary = `Conversation with ${session.turns.length} exchange(s). Recent topics: ${
      recentTopics.slice(0, 3).join(', ') || 'General'
    }`;

    await this.sessionStore.saveSession(session);
    return turnId;
  }

  public getConversationContext(sessionId: string, currentQuery = ''): FormattedContext {
    const session = this.sessionStore.getSession(sessionId);
    if (!session || session.turns.length === 0) {
      return { formattedContext: '', recentTopics: [], turnCount: 0 };
    }

    const contextParts: string[] = [];
    const recentTopics = new Set<string>();
    let currentLength = currentQuery.length;

    // Walk turns backwards (most recent first)
    for (let i = session.turns.length - 1; i >= 0; i--) {
      const turn = session.turns[i];
      const turnText = `Human: ${turn.userMessage}\nAssistant: ${turn.assistantResponse}\n`;

      if (currentLength + turnText.length > this.maxContextLength) {
        break;
      }

      contextParts.unshift(turnText);
      currentLength += turnText.length;

      this.extractTopics(turn.userMessage).forEach(t => recentTopics.add(t));
      this.extractTopics(turn.assistantResponse).forEach(t => recentTopics.add(t));
    }

    return {
      formattedContext: contextParts.join('\n---\n'),
      recentTopics: Array.from(recentTopics),
      turnCount: session.turns.length
    };
  }

  public extractTopics(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const uniqueTopics = new Set<string>();

    for (const match of matches) {
      const trimmed = match.trim();
      if (!ConversationMemoryService.stopWords.has(trimmed) && trimmed.length > 2) {
        uniqueTopics.add(trimmed);
      }
    }

    return Array.from(uniqueTopics);
  }
}

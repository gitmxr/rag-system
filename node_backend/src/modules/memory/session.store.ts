import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { ConversationSession } from '../../types/rag.types.js';
import { env } from '../../config/env.config.js';

export class SessionStore {
  private activeSessions: Map<string, ConversationSession> = new Map();
  private memoryDir: string;
  private readonly sessionTimeoutMs = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Resolve conversation_memory either in cwd or in project root
    const rootPath = path.resolve(process.cwd(), '..', env.STORAGE_PATH);
    const localPath = path.resolve(process.cwd(), env.STORAGE_PATH);

    if (fsSync.existsSync(rootPath)) {
      this.memoryDir = rootPath;
    } else {
      this.memoryDir = localPath;
    }

    if (!fsSync.existsSync(this.memoryDir)) {
      fsSync.mkdirSync(this.memoryDir, { recursive: true });
    }

    this.loadExistingSessions().catch(err => {
      console.error('Failed to load existing sessions:', err);
    });
  }

  private async loadExistingSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.memoryDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && !f.startsWith('archived_'));

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.memoryDir, file);
          const raw = await fs.readFile(filePath, 'utf-8');
          const session = JSON.parse(raw) as ConversationSession;

          const lastActive = new Date(session.lastActivity).getTime();
          const isExpired = Date.now() - lastActive > this.sessionTimeoutMs;

          if (isExpired) {
            const archivedPath = path.join(this.memoryDir, `archived_${file}`);
            await fs.rename(filePath, archivedPath);
          } else {
            this.activeSessions.set(session.sessionId, session);
          }
        } catch (fileErr) {
          console.warn(`Could not parse session file ${file}:`, fileErr);
        }
      }
      console.log(`📂 Loaded ${this.activeSessions.size} active session(s) from ${this.memoryDir}`);
    } catch (err) {
      console.error('Error scanning session directory:', err);
    }
  }

  public getSession(sessionId: string): ConversationSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public getAllSessions(): ConversationSession[] {
    return Array.from(this.activeSessions.values());
  }

  public async saveSession(session: ConversationSession): Promise<void> {
    this.activeSessions.set(session.sessionId, session);
    const filePath = path.join(this.memoryDir, `${session.sessionId}.json`);
    await fs.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
  }

  public async deleteSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    this.activeSessions.delete(sessionId);
    const currentPath = path.join(this.memoryDir, `${sessionId}.json`);
    const archivedPath = path.join(this.memoryDir, `archived_${sessionId}.json`);

    try {
      if (fsSync.existsSync(currentPath)) {
        await fs.rename(currentPath, archivedPath);
      }
      return true;
    } catch (err) {
      console.error(`Error archiving session ${sessionId}:`, err);
      return false;
    }
  }

  public async clearTurns(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;

    session.turns = [];
    session.sessionSummary = 'Session history cleared';
    session.lastActivity = new Date().toISOString();

    await this.saveSession(session);
    return true;
  }
}

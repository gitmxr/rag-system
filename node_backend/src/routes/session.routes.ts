import { Router, Request, Response, NextFunction } from 'express';
import { ConversationMemoryService } from '../modules/memory/memory.service.js';

function getParamId(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export function createSessionRouter(memoryService: ConversationMemoryService): Router {
  const router = Router();

  // Create new session
  router.post('/sessions/new', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const documentContext = req.body?.documentContext || {};
      const sessionId = await memoryService.createSession(documentContext);

      res.status(201).json({
        session_id: sessionId,
        status: 'created'
      });
    } catch (err) {
      next(err);
    }
  });

  // List all active sessions
  router.get('/sessions', (_req: Request, res: Response) => {
    const sessions = memoryService.getAllSessions();
    const formatted = sessions.map(s => ({
      session_id: s.sessionId,
      created_at: s.createdAt,
      last_activity: s.lastActivity,
      turn_count: s.turns.length,
      session_summary: s.sessionSummary,
      total_tokens: s.totalTokens
    }));

    res.json(formatted);
  });

  // Get specific session details
  router.get('/sessions/:id', (req: Request, res: Response) => {
    const sessionId = getParamId(req.params.id);
    const session = memoryService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    res.json(session);
  });

  // Get session context and extracted topics
  router.get('/sessions/:id/context', (req: Request, res: Response) => {
    const sessionId = getParamId(req.params.id);
    const query = typeof req.query.q === 'string' ? req.query.q : '';

    const session = memoryService.getSession(sessionId);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    const context = memoryService.getConversationContext(sessionId, query);
    res.json({
      session_id: sessionId,
      ...context
    });
  });

  // Clear session conversation turns
  router.post('/sessions/:id/clear-context', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = getParamId(req.params.id);
      const cleared = await memoryService.clearContext(sessionId);

      if (!cleared) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        status: 'context_cleared',
        session_id: sessionId
      });
    } catch (err) {
      next(err);
    }
  });

  // Delete/archive session
  router.delete('/sessions/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = getParamId(req.params.id);
      const deleted = await memoryService.deleteSession(sessionId);

      if (!deleted) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      res.json({
        status: 'cleared',
        session_id: sessionId
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

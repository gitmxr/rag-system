import { Router, Request, Response } from 'express';
import { HealthResponse } from '../types/rag.types.js';
import { env } from '../config/env.config.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    components: {
      server: 'online',
      llmApi: env.GROQ_API_KEY ? 'configured' : 'missing_key',
      vectorStore: 'ready',
      conversationMemory: 'ready'
    }
  });
});

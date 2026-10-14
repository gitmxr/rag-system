import express from 'express';
import cors from 'cors';
import { env } from './config/env.config.js';
import { SessionStore } from './modules/memory/session.store.js';
import { ConversationMemoryService } from './modules/memory/memory.service.js';
import { healthRouter } from './routes/health.routes.js';
import { createSessionRouter } from './routes/session.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Services
const sessionStore = new SessionStore();
export const memoryService = new ConversationMemoryService(sessionStore);

// API Routes
app.use('/api', healthRouter);
app.use('/api', createSessionRouter(memoryService));

// Global Error Handler
app.use(errorHandler);

// Server bootstrap
app.listen(env.PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Enhanced RAG System (Node.js/TypeScript)`);
  console.log(`📡 Server running at http://localhost:${env.PORT}`);
  console.log(`🩺 Health check: http://localhost:${env.PORT}/api/health`);
  console.log(`💾 Memory storage: ${env.STORAGE_PATH}`);
  console.log(`🧠 Groq Model: ${env.GROQ_MODEL}`);
  console.log(`==================================================\n`);
});

export default app;

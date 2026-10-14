import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from cwd or project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required for LLM operations'),
  GROQ_MODEL: z.string().default('llama-3.1-8b-instant'),
  EMBEDDING_MODEL: z.string().default('Xenova/all-MiniLM-L6-v2'),
  CHUNK_SIZE: z.coerce.number().default(1000),
  CHUNK_OVERLAP: z.coerce.number().default(200),
  SIMILARITY_THRESHOLD: z.coerce.number().default(0.3),
  MAX_RETRIEVED_DOCS: z.coerce.number().default(5),
  MAX_CONTEXT_TURNS: z.coerce.number().default(5),
  CONTEXT_WEIGHT: z.coerce.number().default(0.7),
  CONTEXT_DECAY: z.coerce.number().default(0.9),
  STORAGE_PATH: z.string().default('conversation_memory'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(200),
  DEBUG_MODE: z.coerce.boolean().default(false)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
export type EnvConfig = typeof env;

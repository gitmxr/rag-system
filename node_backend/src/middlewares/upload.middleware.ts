import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { env } from '../config/env.config.js';

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.pptx', '.txt']);

// Use memory storage for direct buffer parsing
const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type '${ext}'. Allowed types: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`
      )
    );
  }
}

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, // 200MB limit
    files: 10 // Maximum 10 files per request
  },
  fileFilter
});

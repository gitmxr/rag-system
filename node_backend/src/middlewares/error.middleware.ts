import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import multer from 'multer';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('❌ Server Error:', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.flatten()
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    res.status(400).json({
      success: false,
      error: `Upload Error: ${err.message}`,
      code: err.code
    });
    return;
  }

  // Handle custom file filter errors
  if (err.message && err.message.startsWith('Unsupported file type')) {
    res.status(400).json({
      success: false,
      error: err.message
    });
    return;
  }

  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message
  });
}

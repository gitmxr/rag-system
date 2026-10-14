import { Router, Request, Response, NextFunction } from 'express';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';
import { ConversationMemoryService } from '../modules/memory/memory.service.js';

export function createDocumentRouter(memoryService: ConversationMemoryService): Router {
  const router = Router();

  /**
   * POST /api/documents/upload
   * Multipart upload handler for heterogeneous document files.
   * In Phase 1: Handles upload streaming, validation, size checks, and session binding.
   * In Phases 2-5: Connects parsing, chunking, and session-isolated vector storage.
   */
  router.post(
    '/documents/upload',
    uploadMiddleware.array('files'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const files = req.files as Express.Multer.File[] | undefined;
        const requestedSessionId = (req.body?.session_id || req.query?.session_id) as string | undefined;

        if (!files || files.length === 0) {
          res.status(400).json({
            success: false,
            error: 'No files uploaded. Provide multipart form-data with key "files".'
          });
          return;
        }

        // Validate existing session or auto-create a new one
        let activeSessionId = requestedSessionId;
        if (!activeSessionId || !memoryService.getSession(activeSessionId)) {
          activeSessionId = await memoryService.createSession({
            uploadedFilesCount: files.length,
            uploadedAt: new Date().toISOString()
          });
        }

        const fileReceipts = files.map(file => ({
          filename: file.originalname,
          sizeBytes: file.size,
          mimetype: file.mimetype,
          status: 'ready_for_parsing' as const
        }));

        res.status(200).json({
          success: true,
          message: `Successfully received ${files.length} document(s)`,
          session_id: activeSessionId,
          files: fileReceipts
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
}

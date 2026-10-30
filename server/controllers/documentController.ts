import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { storage } from '../services/storage.ts';
import { parseDocumentFile } from '../utils/documentParser.ts';
import { chunkText, batchGenerateEmbeddings } from '../utils/textChunker.ts';
import { ai, GEMINI_MODELS } from '../config/gemini.ts';

export const documentController = {
  async uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: workspaceId } = req.params;

      const ws = await storage.getWorkspaceById(workspaceId, userId);
      if (!ws) {
        res.status(404).json({ error: 'Workspace not found or unauthorized.' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'No document file uploaded.' });
        return;
      }

      const file = req.file;

      // 1. Initial pending document creation
      const doc = await storage.createDocument({
        workspace_id: workspaceId,
        user_id: userId,
        title: req.body.title || file.originalname,
        authors: req.body.authors || 'Unknown Researcher',
        publication_date: req.body.publicationDate || new Date().toISOString().split('T')[0],
        file_name: file.originalname,
        file_path: file.path,
        file_type: file.mimetype,
        file_size_bytes: file.size,
        status: 'processing',
        summary: 'Extracting semantic structure and indexing vector chunks...',
        metadata: {
          originalName: file.originalname,
          size: file.size,
        },
      });

      // Respond immediately with processing state or process synchronously
      // For immediate user feedback and reliable indexing, process now
      try {
        const parsed = await parseDocumentFile(file.path, file.originalname, file.mimetype);

        const title = req.body.title || parsed.title || file.originalname;
        const authors = req.body.authors || parsed.authors || 'Research Working Group';
        const publicationDate = req.body.publicationDate || parsed.publicationDate;

        // 2. Semantic recursive chunking
        const textChunks = chunkText(parsed.text, 800, 150);
        console.log(`Extracted ${parsed.text.length} characters from ${file.originalname}, created ${textChunks.length} chunks.`);

        // 3. Batch embedding generation (Gemini text-embedding-004)
        const embeddedChunks = await batchGenerateEmbeddings(textChunks, 4);

        // 4. Save chunks to database
        const chunkRecords = embeddedChunks.map((item) => ({
          document_id: doc.id,
          workspace_id: workspaceId,
          chunk_index: item.chunkIndex,
          content: item.content,
          token_count: item.tokenCount,
          embedding: item.embedding,
        }));
        await storage.insertChunks(chunkRecords);

        // 5. Generate high-level summary using Gemini fast model
        let summaryText = 'Indexed document with ' + textChunks.length + ' semantic passages.';
        if (process.env.GEMINI_API_KEY && parsed.text.length > 50) {
          try {
            const previewText = parsed.text.slice(0, 3000);
            const sumResponse = await ai.models.generateContent({
              model: GEMINI_MODELS.TEXT_FAST,
              contents: `Provide a concise 2-sentence executive summary of this research paper:\n\n${previewText}`,
            });
            if (sumResponse.text) {
              summaryText = sumResponse.text.trim();
            }
          } catch (sumErr) {
            console.warn('Summary generation notice:', sumErr);
          }
        }

        // 6. Update document state to indexed
        const updated = await storage.updateDocument(doc.id, {
          title,
          authors,
          status: 'indexed',
          summary: summaryText,
          metadata: {
            ...parsed.metadata,
            chunkCount: textChunks.length,
            indexedAt: new Date().toISOString(),
          },
        });

        res.status(201).json({
          message: 'Document successfully uploaded and indexed with vector embeddings.',
          document: updated,
          chunksIndexed: textChunks.length,
        });
      } catch (procErr: any) {
        console.error('Document processing error:', procErr);
        await storage.updateDocument(doc.id, {
          status: 'error',
          summary: `Processing failed: ${procErr.message || 'Unknown error during text extraction'}`,
        });
        res.status(500).json({
          error: 'Document uploaded but encountered an indexing failure.',
          details: procErr.message,
        });
      }
    } catch (err: any) {
      console.error('Upload document error:', err);
      res.status(500).json({ error: 'Failed to upload document.' });
    }
  },

  async listDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id: workspaceId } = req.params;

      const docs = await storage.getDocumentsByWorkspace(workspaceId, userId);
      res.json({ documents: docs });
    } catch (err: any) {
      console.error('List documents error:', err);
      res.status(500).json({ error: 'Failed to fetch documents.' });
    }
  },

  async getAllDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const docs = await storage.getAllUserDocuments(userId);
      res.json({ documents: docs });
    } catch (err: any) {
      console.error('Get all documents error:', err);
      res.status(500).json({ error: 'Failed to fetch all documents.' });
    }
  },

  async getDocumentChunks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const doc = await storage.getDocumentById(id, userId);
      if (!doc) {
        res.status(404).json({ error: 'Document not found or unauthorized.' });
        return;
      }

      const chunks = await storage.getChunksForDocument(id);
      res.json({ document: doc, chunks });
    } catch (err: any) {
      console.error('Get document chunks error:', err);
      res.status(500).json({ error: 'Failed to fetch chunks.' });
    }
  },

  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await storage.deleteDocument(id, userId);
      if (!success) {
        res.status(404).json({ error: 'Document not found or unauthorized.' });
        return;
      }

      res.json({ message: 'Document and its vector embeddings deleted successfully.' });
    } catch (err: any) {
      console.error('Delete document error:', err);
      res.status(500).json({ error: 'Failed to delete document.' });
    }
  },
};

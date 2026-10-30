import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { storage } from '../services/storage.ts';

export const workspaceController = {
  async listWorkspaces(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const workspaces = await storage.getWorkspaces(userId);
      const allDocs = await storage.getAllUserDocuments(userId);

      // Enhance with counts
      const enriched = workspaces.map((ws) => {
        const docs = allDocs.filter((d) => d.workspace_id === ws.id);
        return {
          ...ws,
          documentCount: docs.length,
          indexedCount: docs.filter((d) => d.status === 'indexed').length,
        };
      });

      res.json({ workspaces: enriched });
    } catch (err: any) {
      console.error('List workspaces error:', err);
      res.status(500).json({ error: 'Failed to fetch workspaces.' });
    }
  },

  async createWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { name, description, domain } = req.body;

      const ws = await storage.createWorkspace({
        user_id: userId,
        name,
        description,
        domain,
      });

      res.status(201).json({
        message: 'Workspace created successfully.',
        workspace: { ...ws, documentCount: 0, indexedCount: 0 },
      });
    } catch (err: any) {
      console.error('Create workspace error:', err);
      res.status(500).json({ error: 'Failed to create workspace.' });
    }
  },

  async getWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const ws = await storage.getWorkspaceById(id, userId);
      if (!ws) {
        res.status(404).json({ error: 'Workspace not found or unauthorized access.' });
        return;
      }

      const docs = await storage.getDocumentsByWorkspace(id, userId);

      res.json({
        workspace: {
          ...ws,
          documentCount: docs.length,
          indexedCount: docs.filter((d) => d.status === 'indexed').length,
          documents: docs,
        },
      });
    } catch (err: any) {
      console.error('Get workspace error:', err);
      res.status(500).json({ error: 'Failed to fetch workspace.' });
    }
  },

  async deleteWorkspace(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const success = await storage.deleteWorkspace(id, userId);
      if (!success) {
        res.status(404).json({ error: 'Workspace not found or unauthorized.' });
        return;
      }

      res.json({ message: 'Workspace and all associated documents deleted successfully.' });
    } catch (err: any) {
      console.error('Delete workspace error:', err);
      res.status(500).json({ error: 'Failed to delete workspace.' });
    }
  },
};

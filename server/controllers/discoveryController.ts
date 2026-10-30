import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.ts';
import { storage } from '../services/storage.ts';
import { generateEmbedding } from '../utils/textChunker.ts';

export const discoveryController = {
  async search(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { workspaceId, query, topK = 5, documentIds, domainFilter } = req.body;

      const ws = await storage.getWorkspaceById(workspaceId, userId);
      if (!ws) {
        res.status(404).json({ error: 'Workspace not found or unauthorized.' });
        return;
      }

      const startTime = Date.now();

      // 1. Generate query embedding (768 dimensions)
      const queryEmbedding = await generateEmbedding(query);

      // 2. Perform hybrid search (dense cosine similarity + keyword boost)
      const searchResults = await storage.hybridSearch({
        workspaceId,
        userId,
        queryEmbedding,
        queryText: query,
        topK: topK || 5,
        documentIds,
      });

      const latencyMs = Date.now() - startTime;

      // 3. Format results with highlighted snippets
      const formatted = searchResults.map((item, index) => {
        const queryTerms = query.toLowerCase().split(/\W+/).filter((t: string) => t.length > 2);
        let snippet = item.chunk.content;

        // Try to center snippet around highest match
        let bestPos = 0;
        for (const term of queryTerms) {
          const pos = snippet.toLowerCase().indexOf(term);
          if (pos !== -1) {
            bestPos = Math.max(0, pos - 60);
            break;
          }
        }
        if (snippet.length > 350) {
          snippet = (bestPos > 0 ? '...' : '') + snippet.slice(bestPos, bestPos + 350) + '...';
        }

        return {
          rank: index + 1,
          chunkId: item.chunk.id,
          chunkIndex: item.chunk.chunk_index,
          documentId: item.document.id,
          documentTitle: item.document.title,
          documentAuthors: item.document.authors,
          publicationDate: item.document.publication_date,
          content: item.chunk.content,
          snippet,
          similarityScore: Number(item.similarity.toFixed(4)),
          keywordScore: Number(item.keywordScore.toFixed(4)),
          combinedScore: Number(item.combinedScore.toFixed(4)),
          tokenCount: item.chunk.token_count,
        };
      });

      res.json({
        query,
        workspace: { id: ws.id, name: ws.name, domain: ws.domain },
        totalMatches: formatted.length,
        latencyMs,
        results: formatted,
      });
    } catch (err: any) {
      console.error('Discovery search error:', err);
      res.status(500).json({ error: 'Vector search operation failed.' });
    }
  },
};

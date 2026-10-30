import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initPostgres } from './server/config/db.ts';
import { seedInitialResearchData } from './server/services/storage.ts';

// Routes
import authRoutes from './server/routes/authRoutes.ts';
import workspaceRoutes from './server/routes/workspaceRoutes.ts';
import documentRoutes from './server/routes/documentRoutes.ts';
import discoveryRoutes from './server/routes/discoveryRoutes.ts';
import synthesisRoutes from './server/routes/synthesisRoutes.ts';
import extractionRoutes from './server/routes/extractionRoutes.ts';
import analyticsRoutes from './server/routes/analyticsRoutes.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isDev = process.env.NODE_ENV !== 'production';

// Body parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    system: 'ResearchPulse AI Enterprise Knowledge Discovery',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workspaces', workspaceRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/discovery', discoveryRoutes);
app.use('/api/v1/synthesis', synthesisRoutes);
app.use('/api/v1/extractions', extractionRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Error handler middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected server error occurred.',
  });
});

async function startServer() {
  // Initialize Database & Seed Sample Literature
  console.log('🔄 Initializing ResearchPulse storage engine...');
  await initPostgres();
  await seedInitialResearchData();

  if (isDev) {
    // Mount Vite middleware in development
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('⚡ Vite development middlewares attached.');
  } else {
    // Serve static production build
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║   RESEARCHPULSE AI – Enterprise Knowledge Discovery System        ║
║   Status: Running on http://localhost:${PORT}                       ║
║   Vector Engine: 768-dim embeddings (Gemini text-embedding-004)   ║
║   Models: gemini-2.5-flash (Fast RAG) | gemini-2.5-pro (Reviews)  ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});

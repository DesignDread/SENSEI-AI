import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { httpLogger } from './lib/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const normalizeOrigin = (origin: string) => origin.replace(/\/+$/, '');

// Route imports
import authRoutes, { userRouter } from './modules/auth/auth.routes';
import kanaRoutes from './modules/kana/kana.routes';
import kanjiRoutes from './modules/kanji/kanji.routes';
import grammarRoutes from './modules/grammar/grammar.routes';
import vocabularyRoutes from './modules/vocabulary/vocabulary.routes';
import srsRoutes from './modules/srs/srs.routes';
import testsRoutes from './modules/tests/tests.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import { aiRouter } from './ai/orchestrator';

const app = express();
app.set('trust proxy', 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (requestOrigin, callback) => {
    if (!requestOrigin) return callback(null, true);
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin);
    const allowedOrigin = normalizeOrigin(env.CLIENT_URL);
    if (normalizedRequestOrigin === allowedOrigin) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin denied: ${requestOrigin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(httpLogger);
app.use(generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: env.NODE_ENV });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
const API = '/api/v1';

app.use(`${API}/auth`, authRoutes);
app.use(`${API}/users`, userRouter);
app.use(`${API}/kana`, kanaRoutes);
app.use(`${API}/kanji`, kanjiRoutes);
app.use(`${API}/grammar`, grammarRoutes);
app.use(`${API}/vocabulary`, vocabularyRoutes);
app.use(`${API}/srs`, srsRoutes);
app.use(`${API}/tests`, testsRoutes);
app.use(`${API}/dashboard`, dashboardRoutes);
app.use(`${API}/ai`, aiRouter);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Auto Content Sync ───────────────────────────────────────────────────────
const autoSync = async () => {
  try {
    const { Kanji } = await import('./models/Kanji');
    const { Vocabulary } = await import('./models/Vocabulary');
    const kanjiCount = await Kanji.countDocuments();
    const vocabCount = await Vocabulary.countDocuments();

    if (kanjiCount < 50 || vocabCount < 50) {
      console.log('📦 Content not found — running auto-sync in background...');
      const { syncContent } = await import('./scripts/syncContent');
      // Run sync in background, don't block server start
      syncContent().catch(err => console.error('Auto-sync error:', err));
    } else {
      console.log(`📊 Content ready (${kanjiCount} kanji, ${vocabCount} vocab)`);
    }
  } catch (err) {
    console.warn('⚠️  Auto-sync check failed, content can be synced manually via `npm run sync`');
  }
};

// ─── Start Server ─────────────────────────────────────────────────────────────
const startServer = async () => {
  await connectDatabase();
  app.listen(env.PORT, () => {
    console.log(`\n🚀 SenseiAI API running on http://localhost:${env.PORT}`);
    console.log(`📚 Environment: ${env.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${env.PORT}/health\n`);
  });

  // Auto-sync content after server starts
  await autoSync();
};

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

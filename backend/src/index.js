import { env } from './config/env.js';   // Fail-fast: crashes immediately on missing vars
import { getDb } from './db/database.js'; // Initialises SQLite + schema on first call
import { fetchAndParseFeeds } from './services/rss.service.js';
import express from 'express';
import cors from 'cors';
import articlesRouter from './routes/articles.js';

// Initialise DB at startup so schema errors surface before any request arrives
getDb();

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Articles API ──────────────────────────────────────────────────────────────
app.use('/api/articles', articlesRouter);

// ── Manual ingestion trigger (local testing only) ────────────────────────────
// POST /api/trigger-fetch
// Runs the full RSS ingestion pipeline and returns a summary of what happened.
// Example: curl -X POST http://localhost:3001/api/trigger-fetch
app.post('/api/trigger-fetch', async (_req, res) => {
  console.log('[trigger] Manual fetch initiated');
  try {
    const summary = await fetchAndParseFeeds();
    res.json({ ok: true, summary });
  } catch (err) {
    // Only unrecoverable errors (e.g. DB init failure) reach here
    console.error('[trigger] Unrecoverable error during fetch:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`[server] Backend running → http://localhost:${env.PORT}`);
});

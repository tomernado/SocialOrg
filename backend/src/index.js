import { env } from './config/env.js';   // Fail-fast: crashes immediately on missing vars
import { getDb } from './db/database.js'; // Initialises SQLite + schema on first call
import { fetchAndParseFeeds } from './services/rss.service.js';
import express from 'express';
import cors from 'cors';
import articlesRouter from './routes/articles.js';
import cron from 'node-cron';

// Initialise DB at startup so schema errors surface before any request arrives
getDb();

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(express.json());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Articles API ──────────────────────────────────────────────────────────────
app.use('/api/articles', articlesRouter);

// ── Auth helper — guards fetch endpoints in production ────────────────────────
function requireSecret(req, res) {
  if (env.NODE_ENV !== 'production') return false; // allow freely in dev
  const auth = req.headers['authorization'];
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    res.status(401).json({ error: 'Unauthorized — set Authorization: Bearer <CRON_SECRET>' });
    return true; // blocked
  }
  return false; // allowed
}

// ── Manual ingestion trigger ──────────────────────────────────────────────────
// POST /api/trigger-fetch
// Local dev: no auth required.
// Production: requires  Authorization: Bearer <CRON_SECRET>
app.post('/api/trigger-fetch', async (req, res) => {
  if (requireSecret(req, res)) return;
  console.log('[trigger] Manual fetch initiated');
  try {
    const summary = await fetchAndParseFeeds();
    res.json({ ok: true, summary });
  } catch (err) {
    console.error('[trigger] Unrecoverable error during fetch:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Cron trigger endpoint ─────────────────────────────────────────────────────
// GET /api/cron/fetch
// Called every hour by UptimeRobot or any external scheduler.
// Production: requires  Authorization: Bearer <CRON_SECRET>
app.get('/api/cron/fetch', async (req, res) => {
  if (requireSecret(req, res)) return;
  console.log('[cron-http] External trigger received');
  try {
    const summary = await fetchAndParseFeeds();
    res.json({ ok: true, summary });
  } catch (err) {
    console.error('[cron-http] Fetch failed —', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

async function runScheduledFetch() {
  const now = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  console.log(`[cron]  ⟳ Hourly fetch started at ${now}…`);
  try {
    const summary = await fetchAndParseFeeds();
    console.log(
      `[cron]  ✓ Fetch complete — processed=${summary.processed} skipped=${summary.skipped} errors=${summary.errors}`
    );
  } catch (err) {
    console.error('[cron]  ✗ Fetch failed —', err.message);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`[server] Backend running → http://localhost:${env.PORT}`);

  // Cron: top of every hour  (0 * * * *)
  cron.schedule('0 * * * *', runScheduledFetch);
  console.log('[cron]  ✓ Scheduled — runs at the top of every hour (0 * * * *)');

  // Also run once immediately on startup to populate the DB right away
  runScheduledFetch();
});

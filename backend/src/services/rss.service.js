import Parser from 'rss-parser';
import { randomUUID } from 'crypto';
import { getDb } from '../db/database.js';
import { articleExists, insertArticle, trimSubCategory } from '../db/schema.js';
import { categorizeArticle } from './ai.service.js';

const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'SocialOrg-NewsBot/1.0' },
});

// ---------------------------------------------------------------------------
// Feed definitions
// TODO: Replace ALL placeholder feeds with the exact whitelist sources
//       (including social media scrapers for categories like "Barcelona FC").
//       See ai-rules.md § 12 — Agent A: THE SOURCE CONTROLLER.
// ---------------------------------------------------------------------------
const RSS_FEEDS = [
  {
    url: 'https://techcrunch.com/feed/',
    // TODO: Replace with a curated AI-only feed once whitelist is finalised
  },
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    // TODO: Replace with targeted club/league feeds (e.g. Barcelona, La Liga)
  },
  {
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    // TODO: Replace with curated geopolitical sources
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanTitle(raw) {
  if (!raw) return 'Untitled';
  return raw.replace(/<[^>]*>/g, '').trim();
}

function extractImage(item) {
  return (
    item.enclosure?.url ??
    item['media:content']?.['$']?.url ??
    item['media:thumbnail']?.['$']?.url ??
    null
  );
}

// ---------------------------------------------------------------------------
// Core ingestion function
// ---------------------------------------------------------------------------

/**
 * Phase 3 pipeline: Fetch → Dedup → Gemini AI → Zod Validate → Insert → FIFO trim
 *
 * Agent C rules (ai-rules.md § 12):
 *   - for...of loop, every step in its own try-catch
 *   - a failure at any step logs and continues — never crashes the batch
 *   - returns { processed, skipped, errors } for the trigger-fetch response
 *
 * @returns {{ processed: number, skipped: number, errors: number }}
 */
export async function fetchAndParseFeeds() {
  const db = getDb();
  const result = { processed: 0, skipped: 0, errors: 0 };

  for (const feed of RSS_FEEDS) {
    let feedResult;

    try {
      feedResult = await parser.parseURL(feed.url);
    } catch (err) {
      console.error(`[rss] ✗ Feed fetch failed — url=${feed.url} | ${err.message}`);
      result.errors++;
      continue;
    }

    const items = feedResult.items ?? [];
    console.log(`[rss] ✓ Fetched ${items.length} items from ${feed.url}`);

    for (const item of items) {
      const url = item.link ?? item.guid;

      if (!url) {
        console.warn(`[rss] ⚠ Missing URL — title="${item.title}" — skipping`);
        result.skipped++;
        continue;
      }

      try {
        // ── Step 1: Idempotency check — skip before spending an LLM token ──────
        if (articleExists(db, url)) {
          result.skipped++;
          continue;
        }

        const title = cleanTitle(item.title);
        const rawContent = item.contentSnippet ?? item.content ?? item.summary ?? '';

        // ── Step 2: Gemini AI categorisation + Hebrew summary ─────────────────
        console.log(`[ai]  ⟳ Categorising: "${title.slice(0, 60)}…"`);
        const aiResult = await categorizeArticle(title, rawContent);

        // ── Step 3: Build the final article (AI fields override feed defaults) ─
        const article = {
          id: randomUUID(),
          original_url: url,
          title,
          image_url: extractImage(item),
          category: aiResult.category,
          sub_category: aiResult.sub_category,
          tag: aiResult.tag,
          relevance_score: aiResult.relevance_score,
          ai_summary: aiResult.ai_summary,
        };

        // ── Step 4: Insert + FIFO trim ────────────────────────────────────────
        const inserted = insertArticle(db, article);
        if (inserted) {
          trimSubCategory(db, aiResult.sub_category);
          result.processed++;
          console.log(`[db]  ✓ Saved [${aiResult.category}] "${title.slice(0, 50)}…" (score=${aiResult.relevance_score})`);
        } else {
          result.skipped++; // UNIQUE constraint race-condition safety net
        }
      } catch (err) {
        // Covers: Gemini network error, rate limit, Zod validation failure, DB error
        console.error(`[ai]  ✗ AI processing failed for article — url=${url} | ${err.message}`);
        result.errors++;
        // Agent C: log and continue — never abort the batch
      }
    }
  }

  console.log(
    `[rss] ═══ Run complete — processed=${result.processed} skipped=${result.skipped} errors=${result.errors}`
  );
  return result;
}

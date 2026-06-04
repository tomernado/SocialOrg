import Parser from 'rss-parser';
import { randomUUID } from 'crypto';
import { getDb } from '../db/database.js';
import { articleExists, insertArticle, trimSubCategory } from '../db/schema.js';
import { categorizeArticle } from './ai.service.js';
import { env } from '../config/env.js';

// Request extra fields from rss-parser so enclosure + media tags are captured
const parser = new Parser({
  timeout: 10_000,
  headers: { 'User-Agent': 'SocialOrg-NewsBot/1.0' },
  customFields: {
    item: [
      ['media:content', 'media:content', { keepArray: false }],
      ['media:thumbnail', 'media:thumbnail', { keepArray: false }],
      ['content:encoded', 'content:encoded'],
    ],
  },
});

// ---------------------------------------------------------------------------
// Category label → Hebrew DB value (for forceCategory override)
// ---------------------------------------------------------------------------
const ENGLISH_TO_HEBREW_CATEGORY = {
  'Football':      'חדשות בעולם הכדורגל',
  'Sports':        'חדשות בעולם הספורט',
  'AI & Tech':     'עולם ה-AI והפיתוח',
  'Entertainment': 'חדשות כלליות בעולם הבידור',
  'Global News':   'חדשות כלליות בעולם',
};

// ---------------------------------------------------------------------------
// Feed definitions — Agent A: THE SOURCE CONTROLLER (ai-rules.md § 12)
//
// forceCategory:    English label → mapped to Hebrew DB value. Overrides AI.
// forceSubCategory: English constant (BARCELONA | FOOTBALL-NEWS | ... | AI-NEWS | ...)
// forceTag:         Hebrew hashtag applied to every article from this feed.
// source_name:      Display name shown on article cards and in modals.
// ---------------------------------------------------------------------------
const RSS_FEEDS = [
  // ════════════════════════════════════════════════════════════════════════════
  // FOOTBALL
  // ════════════════════════════════════════════════════════════════════════════

  {
    url: 'https://fetchrss.com/feed/1wUiPR1DNEvy1wUiP490c30c.rss',
    source_name: 'Barca Mania',
    forceCategory: 'Football',
    forceSubCategory: 'BARCELONA',
    forceTag: '#ברצלונה',
    isHebrew: true,
  },
  {
    url: 'https://fetchrss.com/feed/1wUiPR1DNEvy1wUikC5sj47X.rss',
    source_name: 'Fabrizio Romano',
    forceCategory: 'Football',
    forceSubCategory: 'TRANSFERS',
    forceTag: '#העברות',
    isHebrew: true,
  },
  {
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    source_name: 'BBC Sport',
    forceCategory: 'Football',
    forceSubCategory: 'NATIONAL-MONDIAL',
    forceTag: '#כדורגל_עולמי',
  },
  {
    url: 'https://www.skysports.com/rss/12098',
    source_name: 'Sky Sports',
    forceCategory: 'Football',
    forceSubCategory: 'PREMIER-LEAGUE',
    forceTag: '#כדורגל_עולמי',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // SPORTS
  // ════════════════════════════════════════════════════════════════════════════

  // ── WORLD-SPORTS ───────────────────────────────────────────────────────────
  {
    url: 'http://feeds.bbci.co.uk/sport/rss.xml',
    source_name: 'BBC Sport',
    forceCategory: 'Sports',
    forceSubCategory: 'WORLD-SPORTS',
    forceTag: '#ספורט_עולמי',
  },

  // ── ISRAELI-SPORTS ─────────────────────────────────────────────────────────
  {
    url: 'https://rss.walla.co.il/feed/5',
    source_name: 'Walla Sports',
    forceCategory: 'Sports',
    forceSubCategory: 'ISRAELI-SPORTS',
    forceTag: '#ספורט_ארצי',
    isHebrew: true,
  },

  // ── BASKETBALL-NBA ─────────────────────────────────────────────────────────
  {
    url: 'https://www.cbssports.com/rss/headlines/nba/',
    source_name: 'CBS NBA',
    forceCategory: 'Sports',
    forceSubCategory: 'BASKETBALL-NBA',
    forceTag: '#כדורסל_NBA',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // AI & TECH
  // ════════════════════════════════════════════════════════════════════════════

  // ── AI-NEWS ────────────────────────────────────────────────────────────────
  {
    url: 'https://fetchrss.com/feed/1wUiPR1DNEvy1wUjsE8ASDb8.rss',
    source_name: 'Ailon Gruper',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'AI-NEWS',
    forceTag: '#בינה_מלאכותית',
    isHebrew: true,
  },
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    source_name: 'TechCrunch AI',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'AI-NEWS',
    forceTag: '#בינה_מלאכותית',
  },

  // ── GADGETS-LEAKS ──────────────────────────────────────────────────────────
  {
    url: 'https://9to5mac.com/feed/',
    source_name: '9to5Mac',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'GADGETS-LEAKS',
    forceTag: '#גאדגטים',
  },
  {
    url: 'https://www.theverge.com/rss/index.xml',
    source_name: 'The Verge',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'GADGETS-LEAKS',
    forceTag: '#אפל',
  },

  // ── CYBER-TECH ─────────────────────────────────────────────────────────────
  {
    url: 'https://hnrss.org/frontpage',
    source_name: 'Hacker News',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'CYBER-TECH',
    forceTag: '#הייטק',
  },
  {
    url: 'https://www.bleepingcomputer.com/feed/',
    source_name: 'Bleeping Computer',
    forceCategory: 'AI & Tech',
    forceSubCategory: 'CYBER-TECH',
    forceTag: '#סייבר',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ENTERTAINMENT
  // ════════════════════════════════════════════════════════════════════════════

  // ── MUSIC ──────────────────────────────────────────────────────────────────
  {
    url: 'https://www.rollingstone.com/music/music-news/feed/',
    source_name: 'Rolling Stone',
    forceCategory: 'Entertainment',
    forceSubCategory: 'MUSIC',
    forceTag: '#מוזיקה',
  },
  {
    url: 'https://www.billboard.com/f/music/feed/',
    source_name: 'Billboard',
    forceCategory: 'Entertainment',
    forceSubCategory: 'MUSIC',
    forceTag: '#מוזיקה',
  },

  // ── MOVIES-SERIES ──────────────────────────────────────────────────────────
  {
    url: 'https://variety.com/v/digital/feed/',
    source_name: 'Variety',
    forceCategory: 'Entertainment',
    forceSubCategory: 'MOVIES-SERIES',
    forceTag: '#סרטים_וסדרות',
  },
  {
    url: 'https://collider.com/feed/',
    source_name: 'Collider',
    forceCategory: 'Entertainment',
    forceSubCategory: 'MOVIES-SERIES',
    forceTag: '#קולנוע',
  },

  // ── CELEBS-REALITY ─────────────────────────────────────────────────────────
  {
    url: 'https://www.tmz.com/rss.xml',
    source_name: 'TMZ',
    forceCategory: 'Entertainment',
    forceSubCategory: 'CELEBS-REALITY',
    forceTag: '#רכילות',
  },
  {
    url: 'https://people.com/celebrity/index.rss',
    source_name: 'People',
    forceCategory: 'Entertainment',
    forceSubCategory: 'CELEBS-REALITY',
    forceTag: '#סלבס',
  },

  // ── ISRAELI-ENTERTAINMENT ──────────────────────────────────────────────────
  {
    url: 'https://rss.walla.co.il/feed/22',
    source_name: 'Walla Celebs',
    forceCategory: 'Entertainment',
    forceSubCategory: 'ISRAELI-ENTERTAINMENT',
    forceTag: '#סלבס_מקומי',
    isHebrew: true,
  },
  {
    url: 'https://rss.walla.co.il/feed/3',
    source_name: 'Walla Tarbut',
    forceCategory: 'Entertainment',
    forceSubCategory: 'ISRAELI-ENTERTAINMENT',
    forceTag: '#בידור_ישראלי',
    isHebrew: true,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // GLOBAL NEWS
  // ════════════════════════════════════════════════════════════════════════════

  // ── WORLD-NEWS ─────────────────────────────────────────────────────────────
  {
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    source_name: 'BBC World',
    forceCategory: 'Global News',
    forceSubCategory: 'WORLD-NEWS',
    forceTag: '#חדשות_עולם',
  },
  {
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    source_name: 'NY Times',
    forceCategory: 'Global News',
    forceSubCategory: 'WORLD-NEWS',
    forceTag: '#חדשות_עולם',
  },

  // ── ECONOMY ────────────────────────────────────────────────────────────────
  {
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=120000000&id=10000664',
    source_name: 'CNBC',
    forceCategory: 'Global News',
    forceSubCategory: 'ECONOMY',
    forceTag: '#כלכלה',
  },
  {
    url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',
    source_name: 'Wall Street Journal',
    forceCategory: 'Global News',
    forceSubCategory: 'ECONOMY',
    forceTag: '#כלכלה',
  },
  {
    url: 'https://fetchrss.com/feed/1wUiPR1DNEvy1wUjxo9ALGLE.rss',
    source_name: 'Capital Market IL',
    forceCategory: 'Global News',
    forceSubCategory: 'ECONOMY',
    forceTag: '#שוק_ההון',
    isHebrew: true,
  },

  // ── ISRAEL-NEWS ────────────────────────────────────────────────────────────
  {
    url: 'http://www.ynet.co.il/Integration/StoryRss2.xml',
    source_name: 'Ynet',
    forceCategory: 'Global News',
    forceSubCategory: 'ISRAEL-NEWS',
    forceTag: '#חדשות_ישראל',
    isHebrew: true,
  },
  {
    url: 'https://rss.walla.co.il/feed/1',
    source_name: 'Walla News',
    forceCategory: 'Global News',
    forceSubCategory: 'ISRAEL-NEWS',
    forceTag: '#חדשות_ישראל',
    isHebrew: true,
  },
  {
    url: 'https://fetchrss.com/feed/1wUiPR1DNEvy1wUjzu7A1B5G.rss',
    source_name: 'Daniel Amram',
    forceCategory: 'Global News',
    forceSubCategory: 'ISRAEL-NEWS',
    forceTag: '#דניאל_עמרם',
    isHebrew: true,
  },
];

// Gemini free-tier limit: 15 RPM on flash-lite.
// 5 s delay = 12 RPM — safely under the cap with headroom for retries.
// DO NOT lower below 4 s (15 RPM) — see AGENT_MEMORY.md.
const GEMINI_DELAY_MS = 5_000;

// Master switch — controlled via ENABLE_AI_AGENT env var.
// Set to "true" in Render/Railway dashboard when Gemini quota resets — no redeploy needed.
// "false" = Turbo Mode: skip Gemini + sleep, save raw content instantly.
// "true"  = Production AI Agent: every article gets a real Gemini summary + score.
const ENABLE_AI_AGENT = env.ENABLE_AI_AGENT === 'true';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cleanTitle(raw) {
  if (!raw) return 'Untitled';
  return raw.replace(/<[^>]*>/g, '').trim();
}

/** Boilerplate strings produced by FetchRSS and similar scraper services. */
const BOILERPLATE_RE = /feed generated|fetchrss|rss generated|powered by|subscribe to|click here to|this is a feed/i;

/**
 * Returns usable summary text for an RSS item.
 * Falls back to the title if the content is boilerplate, too short, or missing.
 */
function extractSummary(item, title) {
  const raw = (item.contentSnippet ?? item.content ?? item.summary ?? '').trim();
  // Strip HTML tags from content fields
  const text = raw.replace(/<[^>]*>/g, '').trim();
  if (!text || text.length < 30 || BOILERPLATE_RE.test(text)) return title;
  return text;
}

/** Trim whitespace/newlines that some feeds embed in URLs. */
function cleanUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/[\r\n\t ]/g, '');
  return trimmed.startsWith('http') ? trimmed : null;
}

/** Generic/placeholder image patterns — skip these and fall through to next strategy. */
const BLOCKED_IMAGE_RE = /default|placeholder|logo|blank|loading|noimage|no-image|walla\.co\.il\/picture\/0|mabzak/i;

function isBlockedImage(url) {
  return !url || BLOCKED_IMAGE_RE.test(url);
}

/** Extract the url string from a media:content or media:thumbnail node.
 *  Handles both object form ({ $: { url } }) and array form ([{ $: { url } }]). */
function mediaUrl(node) {
  if (!node) return null;
  const target = Array.isArray(node) ? node[0] : node;
  return cleanUrl(target?.['$']?.url ?? target?.url ?? null);
}

/** First <img src="..."> found anywhere in an HTML string.
 *  Decodes HTML entities in the src value (e.g. TechCrunch uses &amp; in URLs). */
function imgFromHtml(html) {
  if (!html || typeof html !== 'string') return null;
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  if (!match) return null;
  const decoded = match[1]
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
  return cleanUrl(decoded);
}

/**
 * Multi-strategy image extraction — checks every known RSS image location.
 * Skips generic/placeholder URLs and tries the next strategy in the chain.
 * Priority: enclosure → media:content → media:thumbnail → img in HTML content
 *           → img in description.
 */
function extractImage(item) {
  const candidates = [
    cleanUrl(item.enclosure?.url),
    mediaUrl(item['media:content']),
    mediaUrl(item['media:thumbnail']),
    imgFromHtml(item['content:encoded']),
    imgFromHtml(item.content),
    imgFromHtml(item.description),
  ];
  return candidates.find((url) => url && !isBlockedImage(url)) ?? null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// Core ingestion function
// ---------------------------------------------------------------------------

/**
 * Phase 3 pipeline: Fetch → Dedup → (delay) → Gemini AI → Zod Validate → Insert → FIFO trim
 *
 * Agent C rules (ai-rules.md § 12):
 *   - for...of loop, every step in its own try-catch
 *   - a failure at any step logs and continues — never crashes the batch
 *   - returns { processed, skipped, errors }
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
    console.log(`[rss] ✓ Fetched ${items.length} items from ${feed.source_name}`);

    for (const item of items) {
      const url = item.link ?? item.guid;

      if (!url) {
        console.warn(`[rss] ⚠ Missing URL — title="${item.title}" — skipping`);
        result.skipped++;
        continue;
      }

      // title is declared here so the quota fallback catch block can access it
      const title = cleanTitle(item.title);

      try {
        // ── Step 1: Idempotency check ─────────────────────────────────────
        if (articleExists(db, url)) {
          result.skipped++;
          continue;
        }

        const rawContent = item.contentSnippet ?? item.content ?? item.summary ?? '';
        const summary = extractSummary(item, title);

        if (!ENABLE_AI_AGENT) {
          // ── TURBO MODE: no Gemini, no delay, raw content saved instantly ──
          const article = {
            id: randomUUID(),
            original_url: url,
            title,
            image_url: extractImage(item),
            category: ENGLISH_TO_HEBREW_CATEGORY[feed.forceCategory] ?? feed.forceCategory,
            sub_category: feed.forceSubCategory ?? 'GENERAL',
            source_name: feed.source_name ?? '',
            tag: feed.forceTag ?? '#חדשות',
            relevance_score: 10,
            ai_summary: summary,
          };
          const inserted = insertArticle(db, article);
          if (inserted) {
            trimSubCategory(db, article.sub_category, article.source_name);
            result.processed++;
            const imgMark = article.image_url ? '🖼' : '—';
            console.log(`[db]  ✓ ${imgMark} [TURBO] "${title.slice(0, 45)}…"`);
          } else {
            result.skipped++;
          }

        } else {
          // ── PRODUCTION AI AGENT: Gemini summary + score for every article ──
          await sleep(GEMINI_DELAY_MS);
          console.log(`[ai]  ⟳ Categorizing: "${title.slice(0, 60)}…"`);
          const aiResult = await categorizeArticle(title, rawContent, feed.forceSubCategory ?? null);

          const article = {
            id: randomUUID(),
            original_url: url,
            title,
            image_url: extractImage(item),
            category: (feed.forceCategory && ENGLISH_TO_HEBREW_CATEGORY[feed.forceCategory])
              ?? aiResult.category,
            sub_category: aiResult.sub_category,
            source_name: feed.source_name ?? '',
            tag: feed.forceTag ?? aiResult.tag,
            relevance_score: aiResult.relevance_score,
            ai_summary: aiResult.ai_summary,
          };
          const inserted = insertArticle(db, article);
          if (inserted) {
            trimSubCategory(db, aiResult.sub_category, article.source_name);
            result.processed++;
            const imgMark = article.image_url ? '🖼' : '—';
            console.log(`[db]  ✓ ${imgMark} [AI] "${title.slice(0, 45)}…" (score=${aiResult.relevance_score})`);
          } else {
            result.skipped++;
          }
        }

      } catch (err) {
        // Any error in AI path: save raw content so the UI stays populated
        console.warn(`[ai]  ⚠ Error — saving raw fallback for "${title.slice(0, 45)}…" | ${err.message.slice(0, 80)}`);
        try {
          const fallback = {
            id: randomUUID(),
            original_url: url,
            title,
            image_url: extractImage(item),
            category: ENGLISH_TO_HEBREW_CATEGORY[feed.forceCategory] ?? feed.forceCategory,
            sub_category: feed.forceSubCategory ?? 'GENERAL',
            source_name: feed.source_name ?? '',
            tag: feed.forceTag ?? '#חדשות',
            relevance_score: 0,
            ai_summary: extractSummary(item, title),
          };
          if (insertArticle(db, fallback)) {
            trimSubCategory(db, fallback.sub_category, fallback.source_name);
            result.processed++;
            console.log(`[db]  ↩ Raw fallback saved "${title.slice(0, 45)}…"`);
          } else {
            result.skipped++;
          }
        } catch (dbErr) {
          console.error(`[db]  ✗ Fallback insert failed — ${dbErr.message}`);
          result.errors++;
        }
      }
    }
  }

  console.log(
    `[rss] ═══ Run complete — processed=${result.processed} skipped=${result.skipped} errors=${result.errors}`
  );
  return result;
}

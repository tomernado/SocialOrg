# AI News Aggregator — Governance Rules

These rules are **mandatory** for all future development on this project.
Any deviation requires an explicit, documented justification.

---

## 1. Architecture

- **Strict frontend/backend separation.** The `frontend/` and `backend/` folders are independent applications. They do not share source files, utilities, or node_modules.
- **Frontend**: React + Vite + Tailwind CSS. Communicates with the backend exclusively via HTTP (fetch/axios). No direct DB access, no raw API key usage.
- **Backend**: Node.js + Express. Owns all business logic, DB access, and third-party API calls. Exposes a RESTful JSON API consumed by the frontend.
- **No monorepo blending.** Never import backend code into frontend or vice versa.

---

## 2. Security

- **API keys live ONLY in `backend/.env`.** This includes LLM keys (Gemini, etc.), database URLs, and any third-party service credentials.
- **`backend/.env` must never be committed.** It is `.gitignore`d. Only `.env.example` (no real values) is committed.
- **Frontend `.env` may only contain `VITE_API_BASE_URL`** (the backend URL) and other non-sensitive build-time config. Never put secrets there.
- **CORS** must be locked to the frontend's origin in production. Do not use `cors({ origin: '*' })` outside of local development.
- **No secrets in logs.** Never log API keys, DB credentials, or tokens, even at debug level.

---

## 3. Environment Variables — Fail-Fast Validation (Zod)

All environment variables are validated with Zod at application startup in `backend/src/config/env.js`.

Rules:
- If any required variable is missing or invalid, **the process must throw and exit immediately** with a clear error message.
- No silent fallbacks (e.g., `process.env.FOO || 'default'`) for required secrets.
- The validated `env` object is the single source of truth; import it anywhere instead of reading `process.env` directly.

```js
// Good
import { env } from './env.js';
const key = env.GEMINI_API_KEY;

// Bad — never do this in application code
const key = process.env.GEMINI_API_KEY;
```

---

## 4. Cost Constraints

- **Only free-tier APIs.** No paid LLM models, no paid RSS services, no paid enrichment APIs.
- Approved free options:
  - LLM: Gemini 1.5 Flash (free tier via Google AI Studio key)
  - RSS: public feed URLs (no auth required)
  - DB: Supabase free tier (Postgres)
- Before adding any new third-party service, verify it has a free tier that covers expected usage.
- **No streaming completions** unless explicitly needed — use `generateContent` (non-streaming) to keep usage predictable.

---

## 5. Database — FIFO Queue per Sub-Category

- Each `sub_category` in the `articles` table acts as a **capped queue of max 20 articles**.
- **On every insert**: if the count for that `sub_category` already equals 20, delete the oldest article (lowest `created_at`) before inserting the new one.
- This logic must live **only in the backend service layer** (`backend/src/services/articleService.js`), never in routes or the frontend.
- Never run raw `DELETE *` on the entire table. Only the FIFO trim function may delete rows.
- The schema enforces no DB-level constraint for this — it is application-level logic.

---

## 6. Data Model Constraints

- `original_url` is **unique**. Never upsert blindly — check for duplicates before insert.
- `relevance_score` is an integer `0–100`. Clamp values from the LLM before storing.
- `ai_summary` is plain text, max ~500 characters. Do not store raw HTML or markdown.
- `image_url` may be null. The frontend must gracefully handle missing images.

---

## 7. Strict Structured LLM Output

All LLM (Gemini) responses **must** be parsed and validated against a Zod schema before any data reaches the database.

Rules:
- Instruct Gemini to return JSON via `responseMimeType: 'application/json'` and a `responseSchema`.
- After receiving the response, parse the JSON and run it through a Zod schema in `backend/src/schemas/articleLlm.js`.
- If validation fails, **log the error and skip the article** — do not store partial or malformed data.
- Never interpolate raw LLM text directly into a DB write. The validated object is the only thing written.

```js
// Good
const parsed = articleLlmSchema.safeParse(JSON.parse(llmResponse.text()));
if (!parsed.success) { logger.warn('LLM output invalid', parsed.error); return; }
await db.article.create({ data: parsed.data });

// Bad — never do this
await db.article.create({ data: { ai_summary: llmResponse.text() } });
```

---

## 8. Fault-Tolerant Sequential Batch Processing

When fetching multiple RSS feeds or enriching multiple articles in a single run, each iteration must be wrapped in its own `try-catch`.

Rules:
- Use a sequential `for...of` loop (not `Promise.all`) so that one failure cannot cancel in-flight work.
- On any error (network timeout, LLM failure, parse error, DB error), **log the error with context and `continue`** to the next item.
- Never `throw` out of a batch loop unless the error is unrecoverable (e.g., DB connection lost entirely).
- Log enough context to diagnose the failure: feed URL or article URL, error message, timestamp.

```js
// Good
for (const feed of feeds) {
  try {
    await processFeed(feed);
  } catch (err) {
    logger.error({ feed: feed.url, err }, 'Feed processing failed — skipping');
  }
}

// Bad — one failure kills the whole batch
await Promise.all(feeds.map(processFeed));
```

---

## 9. Idempotency & Deduplication

Before sending any article to the LLM for enrichment, verify it is not already in the database.

Rules:
- Query `articles` by `original_url` before calling Gemini. If a row exists, **skip immediately** — do not make an LLM call.
- This check must happen in the service layer (`articleService.js`), not in the route or the RSS parser.
- The Prisma schema enforces `original_url @unique` as a safety net, but the application-level check must still run to avoid wasting LLM quota on a constraint violation.
- Deduplication applies to the full pipeline: RSS parse → dedup check → LLM enrich → Zod validate → DB write.

---

## 10. Code Style

- **ES Modules** throughout (`"type": "module"` in both package.json files).
- **No default exports** in backend service/utility files — use named exports.
- **No `console.log` in production paths** — use a proper logger (or at minimum, guard with `if (env.NODE_ENV !== 'production')`).
- Keep route handlers thin. Business logic belongs in `services/`, not in `routes/`.

---

## 11. Categories & Sub-Categories (hardcoded)

These are the only valid values for `category` and `sub_category`. Do not add new ones without updating this file.

| category         | sub_categories                        |
|------------------|---------------------------------------|
| AI & Tech        | Artificial Intelligence, Web Dev      |
| Sports           | Football, Basketball, Tennis          |
| Entertainment    | Movies, Music, Gaming                 |
| Global News      | Politics, Economy, Science            |

---

## 12. Virtual Agents Governance

Three virtual agents govern the ingestion pipeline. Every future implementation must satisfy all three.

---

### Agent A — THE SOURCE CONTROLLER

Responsible for: deciding **which feeds are ingested and how**.

Rules:
- For now, use standard public RSS feeds (e.g., TechCrunch, BBC Sport) as **placeholder sources**.
- Every feed definition must include a `// TODO: Replace with exact whitelist source` comment where a placeholder is used.
- Future sources for specific sub-categories (e.g., "Barcelona FC" — which may require social media scraping, paginated APIs, or custom parsers) must be noted in code comments **at the feed definition site**, not handled silently.
- The feed list lives exclusively in `src/services/rss.service.js`. It must never be hardcoded in routes or config files.
- Adding or removing a feed is a deliberate act: document the reason in `AGENT_MEMORY.md`.

---

### Agent B — THE FORMATTING INSPECTOR

Responsible for: enforcing the **final article shape** that reaches the database.

The required article structure is:

| Field | Rule |
|---|---|
| `title` | Bold/prominent. Must be non-empty. Strip HTML tags. |
| `image_url` | URL string or `null`. Never an empty string. |
| `ai_summary` | Plain text only (no HTML, no markdown). Apply the **length rule** below. |

**Summary length rule:**
- If the original content is ≤ 300 characters → store it as-is (it is already short).
- If the original content is > 300 characters → condense to a 2–4 sentence summary via the LLM (Phase 3).
- During Phase 2 (no LLM yet): store the first 300 characters of the content with a `[RAW]` prefix so it is visually distinguishable from AI-generated summaries.

All article objects must pass a Zod schema check before the DB insert (see Rule 7).

---

### Agent C — THE PIPELINE TESTER

Responsible for: guaranteeing **no single failure crashes the batch**.

Rules:
- Every feed fetch and every article insert is wrapped in its own `try-catch` inside a `for...of` loop.
- On failure: log `{ feed/article url, error message, timestamp }` and **`continue`** — never `throw` out of the loop.
- The batch function must return a structured result: `{ processed: number, skipped: number, errors: number }`.
- This result is returned by `POST /api/trigger-fetch` so manual test runs give immediate feedback.
- `Promise.all` is **forbidden** for any step that touches an external service (RSS fetch, LLM call, DB write).

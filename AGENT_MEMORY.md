# AGENT MEMORY — AI News Aggregator

This file records technical decisions, architectural constraints, and resolved bugs.
Append a new entry for every significant decision, change, or incident.
Never delete entries — mark them superseded if a later decision reverses them.

---

## Log Format

```
### [YYYY-MM-DD] <Short title>
**Type**: Decision | Constraint | Bug Fix | Refactor
**Status**: Active | Superseded by #<entry-number>
<Body: what, why, and any caveats>
```

---

### [2026-06-01] Project initialized
**Type**: Decision  
**Status**: Active

Project initialized. Rule set to strict separation of concerns, Zod validation for everything, and Free Tier LLM limitations.

Full governance rules documented in `ai-rules.md`. Key constraints in effect from day one:
- Frontend (React/Vite) and backend (Node/Express) are strictly isolated — no shared code, no shared node_modules.
- All environment variables validated at startup via Zod (`backend/src/config/env.js`). Missing secrets crash the process immediately.
- Only free-tier APIs permitted: Gemini 1.5 Flash for LLM, public RSS feeds, Supabase for Postgres.
- FIFO queue enforced at the application layer: max 20 articles per sub-category.
- LLM output must be validated against a Zod schema before any DB write — raw text never touches the database.
- Deduplication check on `original_url` required before any RSS article is processed, to save LLM tokens.
- Batch processing (RSS feeds, article enrichment) uses sequential `try-catch` loops — a single failure never aborts the entire run.

---

### [2026-06-01] Switch to SQLite (better-sqlite3) for local development
**Type**: Decision  
**Status**: Active

**What:** Replaced Prisma + Supabase Postgres with `better-sqlite3` (direct SQL, no ORM) for the Phase 2 local data layer. The DB file lives at `backend/news.db`.

**Why:** Supabase requires an active remote connection and credentials even for local development. SQLite lets the pipeline run entirely offline, making feed ingestion testable without any cloud setup. Prisma dependencies are retained in `package.json` for a future production migration to Postgres/Supabase.

**Consequences:**
- `DATABASE_URL` in `config/env.js` is now optional (was required). Re-tighten when production Postgres is wired.
- All DB functions are synchronous (`better-sqlite3` API). This is intentional — SQLite is fast enough locally and avoids async complexity in the ingestion loop.
- `GEMINI_API_KEY` is also optional until Phase 3 (LLM enrichment).
- Schema + FIFO logic live in `src/db/schema.js` (`insertArticle`, `trimSubCategory`, `articleExists`).

---

### [2026-06-03] UI Architecture: Main Category + Sub-Category navigation
**Type**: Decision  
**Status**: Active

**What:** Moved from a single-level category navigation to a two-level "Main Category + Sub-Category" system.

**Architecture:**
- **Sidebar** (left): static main categories (AI & Tech, Sports, Football, Entertainment, Global News)
- **SubNavbar** (horizontal strip, below main header): dynamic sub-category pills fetched live from the DB
- Active sub-category is highlighted; "הכל" pill always appears first to show all sub-categories

**Why it's dynamic:** Sub-categories come from `GET /api/articles/sub-categories?category=X` which queries `DISTINCT sub_category` from the DB. Adding a new RSS feed with a new sub_category (e.g. "קופה דל ריי") automatically makes it appear in the SubNavbar — no frontend code changes required.

**New backend routes:**
- `GET /api/articles/sub-categories?category=X` → `{ data: ["ברצלונה", "כדורסל", ...] }`
- `GET /api/articles?category=X&sub_category=Y` → filtered article list

**How to apply:** When adding new feeds to `rss.service.js`, ensure the `sub_category` field in the AI prompt maps to the intended grouping (e.g. all Barcelona-related feeds should produce `sub_category: "ברצלונה"`).

---

### [2026-06-03] Gemini model selection — ALWAYS use gemini-2.0-flash-lite
**Type**: Constraint  
**Status**: Active  
**Supersedes:** the gemini-2.5-flash-lite choice from Phase 3 initialisation

**Rule:** Use `gemini-2.0-flash-lite` as the model. Never use `gemini-2.5-flash-lite`.

**Why:** `gemini-2.5-flash-lite` has a free-tier cap of only **20 Requests Per Day** (RPD). A single test run of 15 articles exhausts the entire daily quota. `gemini-2.0-flash-lite` has **1,500 RPD** on the free tier — sufficient for full production runs.

Confirmed quota error message: `quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier", quotaValue: "20"`.

**How to apply:** If model is changed for any reason, verify the RPD cap before committing. The RPM limit (15 RPM) is shared — keep the 5 s delay.

---

### [2026-06-03] Gemini free-tier rate limit — MUST use 5 s delay
**Type**: Constraint  
**Status**: Active

**Rule:** `GEMINI_DELAY_MS` in `rss.service.js` MUST be set to `5_000` (5 seconds) or higher. Never set it below 4 seconds.

**Why:** Gemini Flash-Lite free tier allows 15 RPM. At 3.5 s delay (≈17 RPM) we consistently hit 429 Too Many Requests, causing all articles to error. At 5 s (12 RPM) we have a comfortable 3 RPM safety margin that survives minor API jitter.

**How to apply:** Any change to `GEMINI_DELAY_MS` requires updating this entry. If rate errors reappear in logs, increase the delay — do not retry failed calls in a loop.

---

### [2026-06-01] Phase 2 — RSS ingestion pipeline implemented
**Type**: Decision  
**Status**: Active

Three placeholder RSS feeds defined in `src/services/rss.service.js` for pipeline testing:
- TechCrunch → AI & Tech / Artificial Intelligence
- BBC Sport Football → Football / Football
- BBC News World → Global News / Politics

All three marked `// TODO: Replace with exact whitelist source` per Agent A rules.

Key implementation decisions:
- `buildRawSummary()` stores content ≤ 300 chars as-is; longer content gets truncated and prefixed with `[RAW]` — visually distinguishable from future Gemini summaries.
- Deduplication is done via `articleExists()` (SELECT before INSERT) + `INSERT OR IGNORE` as a safety net.
- FIFO trim runs after every successful insert, not in a background job.
- `POST /api/trigger-fetch` returns `{ processed, skipped, errors }` for immediate feedback.

---

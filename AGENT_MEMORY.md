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

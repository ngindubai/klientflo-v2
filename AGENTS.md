<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Klientflo — project guide

WhatsApp-first, AI-powered operating system for UAE real estate agents (not a
CRM). Architecture: full-stack Next.js (App Router, TS) + Tailwind v4 + Prisma/
PostgreSQL + AWS S3, with **Anthropic Claude** as the AI brain. Single agent for
Phase 1, but the data model is multi-agent-ready.

## Conventions
- Shared domain vocabulary lives in `src/lib/constants.ts` (nav, pipeline
  stages, urgency, classifications, document/event types). Reuse it everywhere.
- `src/lib/utils.ts` holds `cn()` and `formatAED()`.
- Design tokens (colours, radius, urgency scale) are CSS variables in
  `src/app/globals.css`, exposed to Tailwind via `@theme`.
- External integrations (WhatsApp, Property Finder/Bayut, S3, speech-to-text)
  go behind adapters so the app runs against mocks until creds are supplied.

## Build roadmap (sequential, each chunk ends runnable)
- **Chunk 1 ✅ Foundation** — scaffold, design system, constants, env template.
- **Chunk 2 ✅** — Prisma schema + migrations + seed.
- **Chunk 3 ✅** — App shell, sidebar nav, global AI command bar (UI).
- **Chunk 4 ✅** — Dashboard widgets.
- **Chunk 5 ✅ AI core layer** — Claude (claude-opus-4-8) via @anthropic-ai/sdk
  with structured outputs (zod) for classify / urgency 1–5 / summarise /
  extract requirements. Graceful heuristic mock in src/server/ai/mock.ts runs
  the app without ANTHROPIC_API_KEY. Services in src/server/ai/*; persist via
  analyzeAndPersistConversation. `pnpm ai:smoke` validates it.
- **Chunk 6 ✅ Functional AI command bar** — Claude tool-use (src/server/ai/
  command.ts) maps NL commands to DB-backed tools (search clients/properties,
  show urgent/pending/today, move_deal, draft_reply, open_page). Heuristic mock
  router works without a key. Results render inline via CommandResultPanel.
- Chunk 7 — Clients & lead management.
- Chunk 8 — Properties & AI matching + info pack generator.
- Chunk 9 — Calendar.
- Chunk 10 — Sales & rental pipelines.
- Chunk 11 — Documents (S3).
- Chunk 12 — WhatsApp Business Cloud API.
- Chunk 13 — Voice (STT, voice-note pipeline, dictation).
- Chunk 14 — AI auto-reply engine + quiet hours.
- Chunk 15 — Settings, auth, polish.

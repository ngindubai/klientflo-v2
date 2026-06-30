<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Workflow

- **Always commit and push to `claude/great-carson-8mjbfm`.** This is the
  production branch and the one Render deploys from (`render.yaml` → `branch:
  claude/great-carson-8mjbfm`, `autoDeploy: true`). Do not create or push to
  other branches unless explicitly asked.
- Before each push: `tsc --noEmit`, `eslint`, and `next build` must be green.

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
- **Chunk 7 ✅ Clients & lead management** — list (search) / detail / new / edit
  with the full requirement fields; ClientForm (create+edit) via server actions;
  detail shows linked conversations/deals/documents/events. Auto-population:
  populateClientFromConversations() (src/server/ai/populate.ts) runs the Chunk 5
  analysis over a client's conversations and fills empty requirement fields;
  exposed as the "Auto-fill from WhatsApp" action.
- **Chunk 8 ✅ Properties & AI matching** — portfolio list/detail/new/edit;
  matchScore() engine (src/server/matching.ts) scores client↔property both ways
  with reasons (shown on client + property detail). Info-pack generator
  (src/server/info-pack.ts → generateInfoPack) builds a WhatsApp-ready message +
  attachments. Portal import behind ListingSource adapters (Property Finder /
  Bayut stubs) with daily-refresh + expiry detection (refreshListings).
- **Chunk 9 ✅ Calendar** — month/week/day views (src/lib/calendar.ts helpers,
  URL-driven view+date nav), events linked to client+property, create/edit/
  delete (event-actions), per-type colour chips, and generateEventInvite for a
  WhatsApp invite message. Note: calendar components take a `refDate` prop (not
  `ref`, which the react-hooks/refs lint rule reserves).
- **Chunk 10 ✅ Sales & rental pipelines** — kanban boards at /pipeline
  (?type=sale|rental tabs) with stage columns + deal cards; move via per-card
  stage <select> (setDealStage), create via DealForm (createDeal). Added a
  "Pipeline" nav item (KanbanSquare icon) — a justified extension of the spec
  nav list.
- **Chunk 11 ✅ Documents** — upload (multipart server action) + preview via
  /api/files/[id]; pluggable StorageAdapter (local .uploads now, S3-ready
  behind getStorage()). Docs linked to client/deal/property, grouped by
  category with expiry badges; getMissingDocuments() powers missing-doc alerts
  (required client docs per deal type). Delete removes blob + row.
- **Chunk 12 ✅ WhatsApp Business Cloud API** — adapter (src/server/whatsapp.ts:
  sendText real+mock, parseWebhook, verifyWebhookChallenge/Signature). Webhook
  at /api/whatsapp/webhook (GET verify, POST ingest). ingestInbound upserts
  conversation + message + auto-runs AI analysis. Inbox UI (/inbox?c=) with
  conversation list, message thread (bubbles, AI summary, voice review), and a
  reply composer (sendReply via adapter + suggestReply AI draft). Runs in demo
  mode without Meta creds.
- **Chunk 13 ✅ Voice** — browser Web Speech API hook (use-speech-recognition)
  powers the command-bar mic and inbox dictation (no server keys). Server STT
  adapter (src/server/speech.ts, OpenAI Whisper when configured) + WhatsApp
  downloadMedia drive transcribeVoiceNote (download→transcribe→re-analyse).
  polishMessage rewrites dictated text professionally (Claude, or light mock).
- **Chunk 14 ✅ AI auto-reply engine + quiet hours** — maybeAutoReply (src/
  server/ai/auto-reply.ts) runs on inbound: quiet-hours holding message
  (isWithinQuietHours, once per window) or guard-railed reply (no final terms/
  legal/offer-confirm/restricted docs) either auto-sent or stored as a pending
  AI draft for approval (DraftApprovalButtons: approve/discard). Webhook dedupes
  by externalId. Settings page has a functional AI/quiet-hours form
  (updateAiSettings). Other settings sections land in Chunk 15.
- **Chunk 15 ✅ Settings, auth & polish** — full Settings page (AI/quiet hours,
  WhatsApp number, calendar working hours/durations/buffer, property broker/
  refresh, integration status). Auth: signed-cookie sessions (src/server/
  auth.ts, HMAC), /login page, middleware gate, session-aware getCurrentAgent
  (falls back to first agent for webhook/scripts), sidebar shows agent + sign
  out. Env: AUTH_SECRET, APP_PASSWORD.

All 15 chunks complete. App runs end-to-end in demo mode; drop in
ANTHROPIC_API_KEY / WHATSAPP_* / SPEECH_* / S3 / AWS creds to go live.

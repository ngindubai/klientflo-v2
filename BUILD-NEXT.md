# Klientflo — Build-Next Plan

> **Status (branch `claude/remove-demo-password-gate-ewsctv`):** Track B feature
> chunks **16–22 are implemented** — unified Contact + tagging, AI auto-tagging,
> Agents/Investors sections, owners database, reporting, storage hub
> (templates→PDF via @react-pdf, floorplans, videos), and bulk PDF send. Each
> was verified locally with `tsc --noEmit`, `eslint`, and `next build` (all
> green) and the PDF renderer was runtime-checked to emit a valid `%PDF` buffer.
> Migrations are written but applied at deploy by `prisma migrate deploy`.
> **Track A (go-live hardening) is still outstanding** — credentials, auth
> restore, S3, clean seed, monitoring (see below + `docs/HANDOVER-PLAN.html`).

Engineering build plan that continues the existing chunk roadmap (Chunks 1–15
are complete; see `AGENTS.md`). Two tracks run in parallel:

- **Track A — Go-live hardening** (credentials, security, infra). Mostly ops, no
  feature code; summarised in `docs/HANDOVER-PLAN.html`.
- **Track B — Feature chunks 16–22** (the requested edits). Sequential, each
  chunk ends in a runnable state and works against mocks so it can ship before
  Track A's live credentials arrive.

**Guiding principle:** Klientflo is a *primary communication system, not a CRM*.
Every feature hangs off the WhatsApp conversation and stays lightweight. Reuse
the shared vocabulary in `src/lib/constants.ts`, keep external integrations
behind adapters, and follow the conventions in `AGENTS.md`. Read the relevant
guide in `node_modules/next/dist/docs/` before writing Next.js code — this is
Next.js 16, not the version in your training data.

**Definition of done per chunk:** schema migration written + applied · server
layer + server actions · UI wired into nav/inbox where relevant · works against
the AI/storage mocks · `tsc --noEmit`, `eslint`, and `next build` all green ·
committed with a clear message.

---

## Track A — Go-live hardening (ops, do in parallel)

> Detailed rationale in `docs/HANDOVER-PLAN.html` §1–5. Checklist form here.

- [ ] **WhatsApp Business** — WABA + number, permanent token, webhook
      (`/api/whatsapp/webhook`), **submit message templates for approval** (long
      lead time — start first). Set `WHATSAPP_*` env vars; turn **on**
      `WHATSAPP_APP_SECRET` signature verification in the webhook.
- [ ] **Claude** — set `ANTHROPIC_API_KEY` (+ optional `ANTHROPIC_MODEL`);
      confirm real calls replace `src/server/ai/mock.ts`; add spend alerts.
- [ ] **S3** — set `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` /
      `S3_BUCKET` (Render disk is ephemeral — **blocker** for all uploads).
- [ ] **Speech-to-text** (optional) — `SPEECH_TO_TEXT_PROVIDER` / `_API_KEY`.
- [ ] **Auth restore** — revert `src/middleware.ts` to redirect to `/login`
      (one-line, documented in the file), then upgrade from the single shared
      `APP_PASSWORD` to per-user accounts.
- [ ] **Clean tenant** — guard/disable the demo seed in `prisma/seed.ts` so the
      production DB starts empty.
- [ ] **Infra** — right-size the DB (currently `basic-256mb`), enable backups,
      add error tracking + uptime monitoring, set a real health endpoint,
      `NEXT_PUBLIC_APP_URL`.

---

## Track B — Feature chunks

### Chunk 16 — Unified `Contact` model + WhatsApp tagging
**Goal:** one contact record with a category, conversations tagged, inbox
filterable. Foundation for 17–22 — **do this first.**

**Decision:** Unified `Contact` + `category`. Keep the internal tenant model
named `Agent` (the system owner). "Agent" as a *tag* means an external broker —
no collision because category is a string value, not a model.

**Schema (`prisma/schema.prisma`):**
- Add enum `ContactCategory { client agent investor spam personal }`.
- Rename model `Client` → `Contact`; add `category ContactCategory @default(client)`
  and a nullable `categoryConfidence` / `categorySuggested` pair for AI suggestions
  (Chunk 17). Keep all existing requirement fields (budget, area, pipeline rels) —
  they simply stay null for non-client categories.
- Update relations on `Conversation`, `Deal`, `Event`, `Document`,
  `SuggestedAction` to point at `Contact` (was `Client`). Add
  `@@index([agentId, category])`.
- Migration must **preserve existing data** (rename table, default existing rows
  to `client`). Use `prisma migrate dev` and verify the generated SQL renames
  rather than drops.

**Constants (`src/lib/constants.ts`):** add `CONTACT_CATEGORIES` +
`CONTACT_CATEGORY_LABELS` (Clients / Agents / Investors / Spam / Personal) and a
colour per category for chips.

**Server:** rename `clients.ts`/`client-actions.ts` domain to contacts (keep a
thin alias if needed to avoid breaking imports), add `setContactCategory()`.

**UI:** tag chip on each conversation in the inbox list + conversation header;
filter bar in `/inbox` by category; a `setCategory` server action behind a
dropdown. Spam category mutes the conversation (hidden from default inbox view).

**Done when:** existing client screens still work, every conversation shows a
category chip, and the inbox can be filtered by tag.

---

### Chunk 17 — AI auto-tagging (suggest, agent confirms)
**Goal:** Claude predicts the contact category on inbound; agent accepts/overrides
in one tap.

- Extend the analysis prompt/schema in `src/server/ai/analyze.ts` +
  `src/server/ai/schema.ts` to also return a `contactCategory` + confidence.
  Add the heuristic fallback in `src/server/ai/mock.ts` (keyword rules: investor
  language, "fellow agent"/agency mentions, spam patterns, personal contacts).
- On inbound (`whatsapp-ingest.ts`), store the suggestion on the Contact
  (`categorySuggested`), **do not** overwrite a human-set category.
- UI: when a suggestion differs from the current category, show an "AI suggests:
  *Investor* — Accept / Dismiss" inline prompt. Accepting calls
  `setContactCategory()` from Chunk 16.

**Done when:** a new inbound conversation shows an AI category suggestion that the
agent can accept or override, and manual choices are never silently overwritten.

---

### Chunk 18 — Agents & Investors sections
**Goal:** dedicated lightweight views for the Agent and Investor categories.

- Add nav items "Agents" and "Investors" (`NAV_ITEMS` in constants; pick icons
  consistent with the existing set).
- Routes `/agents` and `/investors` reuse the contacts list/detail components,
  pre-filtered by category, with category-appropriate fields surfaced:
  - **Investor:** target areas, ticket size (budget range), asset type, yield
    target, notes. (Reuse existing budget/area fields; add `investorAssetType`,
    `investorYieldTarget` if needed.)
  - **Agent (external broker):** agency name, areas covered, notes. Add
    `agencyName`, `areasCovered String[]` to `Contact` (nullable).
- Keep it to a filtered list + simple detail — **not** a full CRM record.

**Done when:** Agents and Investors each have their own section showing only the
relevant fields, populated by re-tagging conversations.

---

### Chunk 19 — Owners database (bulk upload + search)
**Goal:** import an owners list and search it by area/building; one-tap contact.

**Schema:** new model `Owner { id, agentId, name, phone?, email?, area?,
building?, unit?, notes?, source ("import"|"manual"), createdAt, updatedAt }`
with `@@index([agentId, area])` and `@@index([agentId, building])`.

**Import:** server action accepting `.csv`/`.xlsx` (use a small parser, e.g.
`papaparse` for CSV and a lightweight XLSX reader). Column-mapping step (map
spreadsheet headers → Owner fields), dedupe by phone, report rows imported /
skipped. Run as a background-ish action with progress, mirroring the existing
`ScrapeJob` pattern if volume is large.

**UI:** `/owners` — searchable, filterable table (search across name/phone,
filters for area + building + unit), pagination, and per-row WhatsApp / call
buttons (deep-link `https://wa.me/<phone>`; open a conversation if one exists).
Upload screen with the column-mapping UI.

**Done when:** a sample CSV imports cleanly and an owner is findable by area +
building with a one-tap WhatsApp action.

---

### Chunk 20 — Reporting & analytics
**Goal:** a metrics dashboard over WhatsApp + pipeline activity.

**Server:** `src/server/reporting.ts` with aggregation queries (date-range
param), each returning chart-ready series:
- Total WhatsApp messages, **broken down by contact category** (client /
  investor / agent / …) and direction.
- Incoming leads (new contacts / `new_enquiry` conversations) over time.
- Viewings booked (Events of type `viewing`, and/or deals reaching
  `viewing_booked`).
- Response time (median time-to-first-reply on inbound).
- Pipeline conversion (counts per stage; won/lost).

**UI:** `/reports` with a date-range picker and a small set of cards + charts
(reuse the dashboard widget style; add a light chart lib if needed). Keep
queries indexed and paginated/bounded.

**Done when:** the page renders accurate counts for a seeded date range,
including the message-by-category breakdown.

---

### Chunk 21 — Storage hub (templates → PDF, floorplans, videos)
**Goal:** a storage section with three stores; templates render branded PDFs from
live property data.

**Schema:**
- `Template { id, agentId, name, kind ("brochure"|"offer"|...), bodyJson Json,
  createdAt, updatedAt }` — `bodyJson` holds the editor document with merge-field
  tokens.
- `MediaAsset { id, agentId, type ("floorplan"|"video"|"link"), name, fileUrl?,
  externalUrl?, propertyId?, createdAt }` for floorplans + video files/links.

**Templates editor + PDF:**
- In-app rich-text/blocks editor storing `bodyJson`; merge fields like
  `{{property.title}}`, `{{property.price}}`, `{{property.area}}`,
  `{{property.bedrooms}}`, `{{agent.name}}`.
- Render server-side: resolve merge fields against a `Property` → produce branded
  HTML → PDF (use a server PDF route; pick a renderer that runs on Render, e.g.
  a headless-Chromium/`@react-pdf` approach — confirm bundle/runtime fit).
- Reuse the existing `info-pack` generator where it overlaps; persist generated
  PDFs to S3 via `getStorage()`.

**Floorplans & videos:** upload (multipart → S3) or link, optionally linked to a
`Property`; show under the property detail and in the storage hub. Note the
schema already has `Property.floorPlans String[]` — keep them consistent.

**UI:** `/storage` with three tabs (Templates / Floorplans / Videos). Template
list + editor + "Preview PDF" using a chosen property.

**Open inputs:** PDF branding assets (logo, colours, footer/permit disclaimer);
video hosting decision (S3 files vs links only).

**Done when:** a template with merge fields renders a correct branded PDF for a
chosen property, and floorplans/videos upload and persist to S3.

---

### Chunk 22 — Bulk PDF send to multiple clients
**Goal:** send a generated PDF to many contacts over WhatsApp, compliantly.

**Depends on:** Chunk 21 (PDF generation) + approved WhatsApp templates (Track A).

- Compose flow: pick a template + property → generate PDF → select multiple
  contacts (filter by category/tag) → send.
- Sending respects WhatsApp rules (`docs/HANDOVER-PLAN.html` §4): free-form for
  contacts inside the 24h window, **approved template message** for those
  outside it; attach the PDF as a document; throttle to the messaging tier;
  honour opt-in.
- Implement as a throttled, retryable queue (extend the adapter in
  `src/server/whatsapp.ts`); record per-recipient delivery status and an audit
  log of what was sent.
- UI: a "Send to multiple" action with recipient picker and a per-recipient
  status list.

**Done when:** one PDF can be sent to a selected group with per-recipient
delivery status, using templates for out-of-window recipients, without tripping
rate limits.

---

## Cross-cutting reminders
- Run `tsc --noEmit`, `eslint`, and `next build` before every commit.
- New uploads **must** go through `getStorage()` (S3 in prod) — never local disk.
- Add pagination + indexes to any new list that can grow (owners, reports,
  contacts).
- Keep AI features working against `src/server/ai/mock.ts` so the app runs
  without keys.
- Add tests for the pure logic: CSV parsing, merge-field rendering, reporting
  aggregations, category heuristics.

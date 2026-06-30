# KlientFlo — QA Correction Plan

Derived from the pre-launch audit (`docs/QA-AUDIT.html`). Work top-to-bottom:
**Immediate** (launch blockers) → **Short-term** → **Long-term**. Each task lists
the files to touch, the concrete change, and how to verify. Tick items as they
land. Every change must keep `tsc --noEmit`, `eslint`, `next build`, and
`pnpm test` green before commit.

> **Guiding decision — `DEMO_MODE`.** Most critical findings come from the access
> gate being intentionally open for the demo. The plan introduces a single
> `DEMO_MODE` flag (env: `NEXT_PUBLIC_DEMO_MODE=true`). When on, the app keeps its
> open, show-off behaviour; when off (production default), it is secure-by-default.
> This lets us fix everything without losing the public demo.

---

## Phase 1 — Immediate (before any real-client launch)

### F1 · Enforce authentication + remove anonymous fallback — `Critical` (Audit #1)
- **Files:** `src/proxy.ts`, `src/server/agent.ts`, all server actions that call `getCurrentAgent()`.
- **Change:**
  - `proxy.ts`: when `DEMO_MODE` is off, restore the redirect-to-`/login` for everything except `/login`, `/privacy`, `/terms`, `/api/whatsapp/webhook`, `/api/health`, and static assets. When on, keep pass-through.
  - `agent.ts`: split into `getCurrentAgent()` (browser — resolves from session, **throws/redirects if none** when `DEMO_MODE` off) and `getSystemAgent()` (explicit, for webhook/scripts — keeps first-agent fallback).
- **Verify:** with `DEMO_MODE` off, logged-out access to `/clients`, `/settings`, `/owners` → redirect to `/login` (test S-01); anonymous server action → rejected (S-02). With `DEMO_MODE` on, demo still open.

### F2 · Remove login password disclosure + forbid default password — `High` (Audit #5)
- **Files:** `src/components/auth/login-form.tsx`, `src/app/login/page.tsx`, `src/server/auth.ts`.
- **Change:** only render the `Demo password: …` hint when `DEMO_MODE` is on. In production refuse to start/login with the default `"klientflo"` password (require `APP_PASSWORD` or a seeded user).
- **Verify:** `/login` in prod shows no password (S-06); login with default password fails when `DEMO_MODE` off.

### F3 · Close the open redirect on `/api/media/[id]` — `High` (Audit #2)
- **Files:** `src/app/api/media/[id]/route.ts`, `src/server/media-actions.ts`.
- **Change:** stop server-redirecting to `externalUrl`. Validate URLs at write time in `addMediaLink` (allow `https:` only; optional host allowlist YouTube/Vimeo/Drive). For external links, return them to the client to open as a normal anchor rather than a 302 from our domain.
- **Verify:** opening `/api/media/<id>` for an external link does not 302 to an arbitrary host (S-03); junk URLs rejected on add.

### F4 · File-upload limits (size + type) — `High` (Audit #4)
- **Files:** `src/server/media-actions.ts`, `src/server/document-actions.ts` (shared helper in `src/lib/uploads.ts`).
- **Change:** enforce a max size (docs 10 MB, images 10 MB, video 50 MB) and a content-type allowlist **before** writing to storage; reject with a clear error otherwise.
- **Verify:** oversized upload rejected (S-04); disallowed type rejected (S-05); happy path still works.

### F5 · Cap CSV import — `Medium` (Audit #7)
- **Files:** `src/server/owner-actions.ts`, `src/lib/owners-csv.ts`.
- **Change:** reject input over ~5 MB / ~10k rows with a clear message; chunk `createMany`.
- **Verify:** unit test parsing a >10k-row input returns the cap error; normal import unaffected (extend `tests/owners-csv.test.ts`).

### F6 · Confirmation on destructive actions — `Medium` (Audit #6)
- **Files:** `src/components/settings/team-settings.tsx`, `src/components/storage/media-manager.tsx`; new shared `src/components/ui/confirm-button.tsx`.
- **Change:** wrap delete user / delete media in a consistent styled confirm (focus-trapped dialog), replacing the no-prompt form submits and the scattered native `confirm()`.
- **Verify:** delete requires explicit confirmation everywhere; cancel does nothing.

### F7 · Fix/remove broken `/seed/*` assets + starter SVGs — `High` (Audit #3)
- **Files:** `prisma/seed.ts`, `public/`.
- **Change:** **(partly handled by the branding pass)** remove leftover `next.svg`, `vercel.svg`, `globe.svg`, `window.svg`, `file.svg`. Either add real placeholder assets under `public/seed/` or change the seed to omit `fileUrl`/`images`/`mediaUrl` and render a clean "no preview" state.
- **Verify:** no 404s for `/seed/*`; document/voice/brochure UIs render a tidy empty/preview state.

### F8 · Hide "Simulate inbound" in production — `Low/Med` (Audit #9)
- **Files:** `src/app/(app)/inbox/page.tsx` (+ `SimulateInboundButton`).
- **Change:** render only when `DEMO_MODE` is on.
- **Verify:** button absent in prod build with `DEMO_MODE` off.

---

## Phase 2 — Short-term (quality, trust, accessibility)

### S1 · Webhook fail-closed signature — `Medium` (Audit #8)
- **Files:** `src/server/whatsapp.ts`.
- **Change:** if `isWhatsAppConfigured()`, require a valid signature regardless of `WHATSAPP_APP_SECRET`; only skip in `DEMO_MODE`.
- **Verify:** unsigned POST when configured → 401 (S-07).

### S2 · Security headers — `Medium` (Audit §F)
- **Files:** `next.config.ts`.
- **Change:** add `headers()` for CSP, HSTS, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
- **Verify:** response headers present (S-14); app still loads (tune CSP for Next/inline theme script + fonts).

### S3 · Roles (admin vs member) — `Medium` (Audit §F)
- **Files:** `prisma/schema.prisma` (add `User.role`), `src/server/user-actions.ts`, `src/components/settings/team-settings.tsx`.
- **Change:** gate destructive ops (delete user, clear owners) to `admin`; seed the first user as admin.
- **Verify:** member cannot delete users; admin can.

### S4 · Change-password + reset flow — `Medium` (Audit #10)
- **Files:** new `src/app/(app)/settings` change-password form + action; `/forgot` + token reset (email adapter; mock in demo).
- **Verify:** user can change password; reset issues a one-time token; old sessions optionally invalidated.

### S5 · Form a11y: labels + inline validation + aria — `Medium` (Audit §E)
- **Files:** `team-settings.tsx`, `owner-import.tsx`, `owner-filters.tsx`, `bulk-send.tsx`, inbox/owner filter selects, all forms.
- **Change:** add `<label>`/`aria-label` to placeholder-only inputs; wire field errors with `aria-invalid`/`aria-describedby`; put error banners in an `aria-live` region; bump tiny icon buttons toward 40–44px touch targets.
- **Verify:** axe-core clean on key forms; keyboard-only completion works.

### S6 · Contrast pass — `Medium` (Audit §E)
- **Files:** `src/app/globals.css`, the amber warning banners.
- **Change:** ensure muted text and amber text/bg pairs meet WCAG AA (≥4.5:1).
- **Verify:** Lighthouse/axe contrast checks pass.

### S7 · Cookie/consent + legal contact details + support footer — `Medium` (Audit §F/K)
- **Files:** `src/app/privacy/page.tsx`, `src/app/terms/page.tsx`, a footer component, a lightweight consent banner (only if analytics added).
- **Change:** fill in the real data-protection contact; add WhatsApp opt-in/consent capture copy; add a support/contact footer.
- **Verify:** policies complete; consent recorded where messaging opt-in applies.

### S8 · Group the navigation — `Medium` (Audit §C)
- **Files:** `src/lib/constants.ts` (`NAV_ITEMS` → grouped), `src/components/layout/sidebar.tsx`.
- **Change:** group the 13 items (Communication / Contacts / Listings / Pipeline / Library / Insights / Settings) with section labels.
- **Verify:** nav reads cleanly; active states still correct.

### S9 · First-run onboarding + "Demo/not connected" banner — `Medium` (Audit §G)
- **Files:** dashboard, a `SetupChecklist` component, an integration-status banner.
- **Change:** dashboard checklist (Connect WhatsApp → Import owners → Tag first conversation); a consistent banner tied to `isWhatsAppConfigured()`/`isAIEnabled()`.
- **Verify:** new tenant sees guidance; banner reflects real integration state.

---

## Phase 3 — Long-term (maturity, polish, scale)

- **L1 · e2e/integration tests** (Playwright) for auth, tagging, owners import, template→PDF, bulk send.
- **L2 · Reporting SQL rollup + caching** (replace the ranged `message.findMany` JS aggregation).
- **L3 · `next/image` + real asset pipeline** for property photos/brochures.
- **L4 · Account-activity notifications** (login, password/email change).
- **L5 · Data export/delete self-service** (PDPL).
- **L6 · Monitoring/alerting** (Sentry + uptime) and `/api/health` wired to the Render check.
- **L7 · Abuse hardening** — per-day send caps, idempotency keys on sends, audit log for sends/deletes, duplicate-submit guards.

---

## Verification checklist (run before calling a phase done)
- [ ] `tsc --noEmit` green
- [ ] `eslint` green
- [ ] `next build` green
- [ ] `pnpm test` green (extend tests for new pure logic)
- [ ] Manual: the relevant audit test IDs (F-/N-/E-/P-/S-) pass
- [ ] `DEMO_MODE` on → demo still fully usable; `DEMO_MODE` off → secure-by-default

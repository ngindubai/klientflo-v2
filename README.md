# Klientflo

An AI-powered, **WhatsApp-first operating system** for UAE real estate agents —
not a traditional CRM. It monitors WhatsApp conversations, flags urgent
messages and hot leads, transcribes voice notes, extracts client requirements,
recommends matching properties, books viewings, manages documents, and lets the
agent run most daily tasks from a single dashboard via a global AI command bar
and voice.

## Tech stack

- **Full-stack [Next.js](https://nextjs.org) 16** (App Router, TypeScript)
- **Tailwind CSS v4** with a custom design-token system
- **PostgreSQL + Prisma** (data layer — Chunk 2)
- **Anthropic Claude** for AI (analysis, summarisation, extraction, matching,
  replies — Chunk 5+)
- **AWS S3** for document storage (Chunk 11)
- **WhatsApp Business Cloud API** (Chunk 12) and speech-to-text (Chunk 13)

External integrations are built behind adapters, so the app runs end-to-end
against mocks/seed data until real credentials are supplied.

## Getting started

```bash
pnpm install
cp .env.example .env        # fill in as features come online
createdb klientflo          # or use the DATABASE_URL of your choice
pnpm prisma migrate dev     # apply migrations
pnpm db:seed                # sample UAE data + the initial agent
pnpm dev                    # http://localhost:3000
```

Sign in with the seeded agent's email (prefilled) and the demo password
`klientflo` (override with `APP_PASSWORD`). The app runs fully in **demo mode**
without external credentials — drop in `ANTHROPIC_API_KEY`, `WHATSAPP_*`,
`SPEECH_TO_TEXT_*`, and AWS/S3 vars to take each feature live.

```bash
pnpm build   # production build
pnpm lint    # eslint
```

## Build plan

The project is built in sequential, runnable chunks. See `AGENTS.md` for the
full roadmap and the current status.

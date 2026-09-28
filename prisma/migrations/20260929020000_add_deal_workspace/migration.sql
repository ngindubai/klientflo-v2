CREATE TABLE "DealTask" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "notes" TEXT,
  "assignee" TEXT,
  "stage" TEXT,
  "dueAt" DATE,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "blocked" BOOLEAN NOT NULL DEFAULT false,
  "templateKey" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DealTask_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DealTask_status_check" CHECK ("status" IN ('pending', 'done', 'dismissed')),
  CONSTRAINT "DealTask_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DealTask_dealId_templateKey_key" ON "DealTask"("dealId", "templateKey");
CREATE INDEX "DealTask_dealId_status_dueAt_idx" ON "DealTask"("dealId", "status", "dueAt");
CREATE TABLE "DealActivity" (
  "id" TEXT NOT NULL,
  "dealId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DealActivity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DealActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DealActivity_dealId_createdAt_idx" ON "DealActivity"("dealId", "createdAt");
ALTER TABLE "Event" ADD COLUMN "dealId" TEXT;
ALTER TABLE "Event" ADD CONSTRAINT "Event_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Event_dealId_idx" ON "Event"("dealId");

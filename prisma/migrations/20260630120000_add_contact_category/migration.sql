-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('client', 'agent', 'investor', 'spam', 'personal');

-- AlterTable
-- The Client table is the unified Contact record (Prisma model Contact, @@map("Client")).
ALTER TABLE "Client" ADD COLUMN     "category" "ContactCategory" NOT NULL DEFAULT 'client',
ADD COLUMN     "categorySuggested" "ContactCategory";

-- CreateIndex
CREATE INDEX "Client_agentId_category_idx" ON "Client"("agentId", "category");

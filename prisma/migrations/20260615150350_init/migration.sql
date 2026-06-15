-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('buyer', 'tenant', 'seller', 'landlord');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('mortgage', 'cash');

-- CreateEnum
CREATE TYPE "ConversationClassification" AS ENUM ('new_enquiry', 'buyer', 'tenant', 'seller', 'landlord', 'hot_lead', 'viewing_request', 'price_negotiation', 'document_request', 'contract_stage', 'payment_stage', 'existing_client', 'low_priority', 'spam');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'voice', 'image', 'pdf', 'document', 'template');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('sale', 'rental');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('viewing', 'office_meeting', 'trustee_office_meeting', 'contract_signing', 'handover', 'follow_up');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('client', 'property', 'transaction');

-- CreateEnum
CREATE TYPE "PropertySource" AS ENUM ('property_finder', 'bayut', 'manual');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('active', 'expired', 'draft');

-- CreateEnum
CREATE TYPE "SuggestedActionStatus" AS ENUM ('pending', 'done', 'dismissed');

-- CreateEnum
CREATE TYPE "ApprovalMode" AS ENUM ('auto_send', 'require_approval');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "nationality" TEXT,
    "clientType" "ClientType",
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "area" TEXT,
    "bedrooms" INTEGER,
    "propertyType" TEXT,
    "paymentMethod" "PaymentMethod",
    "timeline" TEXT,
    "status" TEXT,
    "notes" TEXT,
    "nextAction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "clientId" TEXT,
    "contactPhone" TEXT NOT NULL,
    "contactName" TEXT,
    "classification" "ConversationClassification",
    "urgency" INTEGER NOT NULL DEFAULT 1,
    "summary" TEXT,
    "awaitingReply" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL DEFAULT 'text',
    "status" "MessageStatus" NOT NULL DEFAULT 'delivered',
    "body" TEXT,
    "mediaUrl" TEXT,
    "transcription" TEXT,
    "reviewed" BOOLEAN NOT NULL DEFAULT true,
    "externalId" TEXT,
    "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "listingId" TEXT,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "sizeSqft" INTEGER,
    "propertyType" TEXT,
    "area" TEXT,
    "community" TEXT,
    "description" TEXT,
    "images" TEXT[],
    "floorPlans" TEXT[],
    "brochureUrl" TEXT,
    "paymentPlan" TEXT,
    "listingUrl" TEXT,
    "permitNumber" TEXT,
    "source" "PropertySource" NOT NULL DEFAULT 'manual',
    "status" "PropertyStatus" NOT NULL DEFAULT 'active',
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "title" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "notes" TEXT,
    "clientId" TEXT,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "category" "DocumentCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT,
    "expiresAt" TIMESTAMP(3),
    "clientId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deal" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" "DealType" NOT NULL,
    "stage" TEXT NOT NULL,
    "clientId" TEXT,
    "propertyId" TEXT,
    "amount" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuggestedAction" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "reason" TEXT,
    "status" "SuggestedActionStatus" NOT NULL DEFAULT 'pending',
    "clientId" TEXT,
    "conversationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuggestedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "whatsappBusinessNumber" TEXT,
    "whatsappTemplates" JSONB NOT NULL DEFAULT '[]',
    "aiAutoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "aiApprovalMode" "ApprovalMode" NOT NULL DEFAULT 'require_approval',
    "aiTone" TEXT NOT NULL DEFAULT 'professional and friendly',
    "followUpAutomation" BOOLEAN NOT NULL DEFAULT false,
    "viewingBookingAutomation" BOOLEAN NOT NULL DEFAULT false,
    "newLeadAutomation" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,
    "quietHoursDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "quietHoursMessage" TEXT,
    "workingHoursStart" TEXT NOT NULL DEFAULT '09:00',
    "workingHoursEnd" TEXT NOT NULL DEFAULT '18:00',
    "viewingDuration" INTEGER NOT NULL DEFAULT 30,
    "meetingDuration" INTEGER NOT NULL DEFAULT 60,
    "bufferTime" INTEGER NOT NULL DEFAULT 15,
    "brokerNumber" TEXT,
    "refreshFrequency" TEXT NOT NULL DEFAULT 'daily',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE INDEX "Client_agentId_idx" ON "Client"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_agentId_phone_key" ON "Client"("agentId", "phone");

-- CreateIndex
CREATE INDEX "Conversation_agentId_urgency_idx" ON "Conversation"("agentId", "urgency");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_agentId_contactPhone_key" ON "Conversation"("agentId", "contactPhone");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_agentId_type_reviewed_idx" ON "Message"("agentId", "type", "reviewed");

-- CreateIndex
CREATE INDEX "Property_agentId_status_idx" ON "Property"("agentId", "status");

-- CreateIndex
CREATE INDEX "Event_agentId_startsAt_idx" ON "Event"("agentId", "startsAt");

-- CreateIndex
CREATE INDEX "Document_agentId_category_idx" ON "Document"("agentId", "category");

-- CreateIndex
CREATE INDEX "Deal_agentId_type_stage_idx" ON "Deal"("agentId", "type", "stage");

-- CreateIndex
CREATE INDEX "SuggestedAction_agentId_status_idx" ON "SuggestedAction"("agentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_agentId_key" ON "Settings"("agentId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deal" ADD CONSTRAINT "Deal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedAction" ADD CONSTRAINT "SuggestedAction_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedAction" ADD CONSTRAINT "SuggestedAction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuggestedAction" ADD CONSTRAINT "SuggestedAction_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

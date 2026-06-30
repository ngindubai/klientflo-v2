-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "area" TEXT,
    "building" TEXT,
    "unit" TEXT,
    "notes" TEXT,
    "source" TEXT NOT NULL DEFAULT 'import',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Owner_agentId_area_idx" ON "Owner"("agentId", "area");

-- CreateIndex
CREATE INDEX "Owner_agentId_building_idx" ON "Owner"("agentId", "building");

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

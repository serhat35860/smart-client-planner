-- AlterTable
ALTER TABLE "Client" ADD COLUMN "updatedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Client_updatedByUserId_idx" ON "Client"("updatedByUserId");

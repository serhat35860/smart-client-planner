-- AlterTable
ALTER TABLE "Note" ADD COLUMN "updatedByUserId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "updatedByUserId" TEXT;

-- CreateIndex
CREATE INDEX "Note_updatedByUserId_idx" ON "Note"("updatedByUserId");

-- CreateIndex
CREATE INDEX "Task_updatedByUserId_idx" ON "Task"("updatedByUserId");

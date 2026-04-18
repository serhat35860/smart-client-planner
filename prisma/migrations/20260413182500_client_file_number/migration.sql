ALTER TABLE "Client" ADD COLUMN "fileNumber" TEXT;

CREATE UNIQUE INDEX "Client_workspaceId_fileNumber_key" ON "Client"("workspaceId", "fileNumber");

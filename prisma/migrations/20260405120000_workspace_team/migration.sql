PRAGMA foreign_keys=OFF;

CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "Workspace" ("id", "name", "createdAt", "updatedAt")
SELECT
  'wsp_' || "id",
  CASE
    WHEN "name" IS NOT NULL AND length(trim("name")) > 0 THEN trim("name") || ' — team'
    ELSE "email" || ' — team'
  END,
  "createdAt",
  "updatedAt"
FROM "User";

CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'OWNER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WorkspaceMember_userId_key" ON "WorkspaceMember"("userId");
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

INSERT INTO "WorkspaceMember" ("id", "workspaceId", "userId", "role", "createdAt")
SELECT 'wmm_' || "id", 'wsp_' || "id", "id", 'OWNER', datetime('now') FROM "User";

CREATE TABLE "WorkspaceInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "WorkspaceInvite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WorkspaceInvite_token_key" ON "WorkspaceInvite"("token");
CREATE INDEX "WorkspaceInvite_workspaceId_idx" ON "WorkspaceInvite"("workspaceId");

ALTER TABLE "Client" ADD COLUMN "workspaceId" TEXT;
UPDATE "Client" SET "workspaceId" = 'wsp_' || "userId";

CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sector" TEXT,
    "generalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POTENTIAL',
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_Client_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("id", "companyName", "contactPerson", "phone", "email", "sector", "generalNotes", "status", "workspaceId", "createdAt", "updatedAt")
SELECT "id", "companyName", "contactPerson", "phone", "email", "sector", "generalNotes", "status", "workspaceId", "createdAt", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_workspaceId_companyName_idx" ON "Client"("workspaceId", "companyName");

ALTER TABLE "Note" ADD COLUMN "workspaceId" TEXT;
UPDATE "Note" SET "workspaceId" = 'wsp_' || "userId";

CREATE TABLE "new_Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "nextActionDate" DATETIME,
    "remindBeforeMinutes" INTEGER,
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_Note_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_Note_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Note" ("id", "title", "content", "nextActionDate", "remindBeforeMinutes", "color", "workspaceId", "clientId", "createdAt", "updatedAt")
SELECT "id", "title", "content", "nextActionDate", "remindBeforeMinutes", "color", "workspaceId", "clientId", "createdAt", "updatedAt" FROM "Note";
DROP TABLE "Note";
ALTER TABLE "new_Note" RENAME TO "Note";
CREATE INDEX "Note_clientId_createdAt_idx" ON "Note"("clientId", "createdAt");
CREATE INDEX "Note_workspaceId_createdAt_idx" ON "Note"("workspaceId", "createdAt");

ALTER TABLE "Task" ADD COLUMN "workspaceId" TEXT;
UPDATE "Task" SET "workspaceId" = 'wsp_' || "userId";

CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "deadline" DATETIME NOT NULL,
    "remindBeforeMinutes" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notCompletedReason" TEXT,
    "workspaceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "noteId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "new_Task_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "new_Task_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("id", "title", "deadline", "remindBeforeMinutes", "priority", "status", "notCompletedReason", "workspaceId", "clientId", "noteId", "createdAt", "updatedAt")
SELECT "id", "title", "deadline", "remindBeforeMinutes", "priority", "status", "notCompletedReason", "workspaceId", "clientId", "noteId", "createdAt", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_noteId_key" ON "Task"("noteId");
CREATE INDEX "Task_workspaceId_deadline_status_idx" ON "Task"("workspaceId", "deadline", "status");

ALTER TABLE "Tag" ADD COLUMN "workspaceId" TEXT;
UPDATE "Tag" SET "workspaceId" = 'wsp_' || "userId";

CREATE TABLE "new_Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "new_Tag_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tag" ("id", "name", "workspaceId", "createdAt")
SELECT "id", "name", "workspaceId", "createdAt" FROM "Tag";
DROP TABLE "Tag";
ALTER TABLE "new_Tag" RENAME TO "Tag";
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");
CREATE UNIQUE INDEX "Tag_workspaceId_name_key" ON "Tag"("workspaceId", "name");

PRAGMA foreign_keys=ON;

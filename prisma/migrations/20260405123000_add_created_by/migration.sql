ALTER TABLE "Client" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Note" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Task" ADD COLUMN "createdByUserId" TEXT;
ALTER TABLE "Tag" ADD COLUMN "createdByUserId" TEXT;

UPDATE "Client" SET "createdByUserId" = (
  SELECT "userId" FROM "WorkspaceMember"
  WHERE "workspaceId" = "Client"."workspaceId"
  ORDER BY CASE WHEN "role" = 'OWNER' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
);

UPDATE "Note" SET "createdByUserId" = (
  SELECT "userId" FROM "WorkspaceMember"
  WHERE "workspaceId" = "Note"."workspaceId"
  ORDER BY CASE WHEN "role" = 'OWNER' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
);

UPDATE "Task" SET "createdByUserId" = (
  SELECT "userId" FROM "WorkspaceMember"
  WHERE "workspaceId" = "Task"."workspaceId"
  ORDER BY CASE WHEN "role" = 'OWNER' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
);

UPDATE "Tag" SET "createdByUserId" = (
  SELECT "userId" FROM "WorkspaceMember"
  WHERE "workspaceId" = "Tag"."workspaceId"
  ORDER BY CASE WHEN "role" = 'OWNER' THEN 0 ELSE 1 END, "createdAt" ASC
  LIMIT 1
);

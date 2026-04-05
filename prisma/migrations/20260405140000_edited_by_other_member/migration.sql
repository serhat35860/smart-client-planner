-- AlterTable
ALTER TABLE "Note" ADD COLUMN "editedByOtherMember" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "editedByOtherMember" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TaskUserMention" (
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("taskId", "userId"),
    CONSTRAINT "TaskUserMention_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskUserMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TaskUserMention_userId_idx" ON "TaskUserMention"("userId");

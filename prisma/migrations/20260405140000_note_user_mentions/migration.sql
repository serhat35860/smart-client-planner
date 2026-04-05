-- CreateTable
CREATE TABLE "NoteUserMention" (
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    PRIMARY KEY ("noteId", "userId"),
    CONSTRAINT "NoteUserMention_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NoteUserMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "NoteUserMention_userId_idx" ON "NoteUserMention"("userId");

import type { Prisma } from "@prisma/client";
import { creatorSelect } from "@/lib/creator-preview";

/** Not kartı / düzenleme için ortak Prisma include. */
export const noteCardInclude = {
  tags: { include: { tag: { select: { name: true, createdBy: { select: creatorSelect } } } } },
  mentions: { include: { user: { select: { id: true, name: true, email: true } } } },
  task: { select: { id: true } },
  createdBy: { select: creatorSelect },
  updatedBy: { select: creatorSelect }
} satisfies Prisma.NoteInclude;

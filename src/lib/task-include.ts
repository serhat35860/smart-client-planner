import type { Prisma } from "@prisma/client";
import { creatorSelect } from "@/lib/creator-preview";

export const taskRowInclude = {
  client: true,
  createdBy: { select: creatorSelect },
  updatedBy: { select: creatorSelect },
  mentions: { include: { user: { select: { id: true, name: true, email: true } } } }
} satisfies Prisma.TaskInclude;

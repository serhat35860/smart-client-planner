import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canManageWorkspace, requireWorkspace } from "@/lib/workspace";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function POST() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManageWorkspace(ctx.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  await prisma.workspaceInvite.create({
    data: {
      workspaceId: ctx.workspace.id,
      token,
      expiresAt,
      createdById: ctx.user.id
    }
  });

  return NextResponse.json({ token, expiresAt: expiresAt.toISOString() });
}

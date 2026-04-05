import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const schema = z.object({ token: z.string().min(10).max(200) });

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const existing = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
  if (existing) {
    return NextResponse.json({ error: "already_in_workspace" }, { status: 409 });
  }

  const invite = await prisma.workspaceInvite.findUnique({ where: { token: parsed.data.token.trim() } });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: user.id, role: "MEMBER" }
    }),
    prisma.workspaceInvite.delete({ where: { id: invite.id } })
  ]);

  return NextResponse.json({ ok: true });
}

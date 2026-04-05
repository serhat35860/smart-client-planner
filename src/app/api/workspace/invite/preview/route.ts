import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "missing_token" }, { status: 400 });

  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    include: { workspace: { select: { name: true } } }
  });
  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "invalid_or_expired" }, { status: 404 });
  }
  return NextResponse.json({ workspaceName: invite.workspace.name });
}

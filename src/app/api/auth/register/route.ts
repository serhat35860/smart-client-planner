import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { loginWithEmailPassword } from "@/lib/auth";
import { defaultWorkspaceName } from "@/lib/workspace";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
  name: z.string().max(120).optional().nullable(),
  inviteToken: z.string().min(10).max(200).optional().nullable()
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const name = parsed.data.name?.trim() || null;
  const inviteToken = parsed.data.inviteToken?.trim() || null;

  if (inviteToken) {
    const invite = await prisma.workspaceInvite.findUnique({
      where: { token: inviteToken },
      include: { workspace: true }
    });
    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
    }
    const user = await prisma.user.create({ data: { email, passwordHash, name } });
    await prisma.workspaceMember.create({
      data: { workspaceId: invite.workspaceId, userId: user.id, role: "MEMBER" }
    });
    await prisma.workspaceInvite.delete({ where: { id: invite.id } });
    await loginWithEmailPassword(email, parsed.data.password);
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.create({ data: { email, passwordHash, name } });
  await prisma.workspace.create({
    data: {
      name: defaultWorkspaceName({ email, name }),
      members: { create: { userId: user.id, role: "OWNER" } }
    }
  });
  await loginWithEmailPassword(email, parsed.data.password);
  return NextResponse.json({ ok: true });
}

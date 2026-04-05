import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z
  .object({
    name: z.union([z.string().max(120), z.null()]).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6).max(200).optional()
  })
  .superRefine((val, ctx) => {
    if (val.newPassword && !val.currentPassword?.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["currentPassword"] });
    }
  });

export async function PATCH(req: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const { name, currentPassword, newPassword } = parsed.data;
  const hasName = name !== undefined;
  const hasPassword = Boolean(newPassword?.length);

  if (!hasName && !hasPassword) {
    return NextResponse.json({ error: "no_changes" }, { status: 400 });
  }

  const data: { name?: string | null; passwordHash?: string } = {};

  if (hasName) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    data.name = trimmed ? trimmed : null;
  }

  if (hasPassword) {
    const ok = await bcrypt.compare(currentPassword ?? "", user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "invalid_current_password" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(newPassword!, 10);
  }

  await prisma.user.update({
    where: { id: user.id },
    data
  });

  return NextResponse.json({ ok: true });
}

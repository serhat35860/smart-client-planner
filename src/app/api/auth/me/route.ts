import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/workspace";

/** Üst çubuk için oturumdaki kullanıcı özeti. */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    user: {
      name: ctx.user.name,
      email: ctx.user.email
    }
  });
}

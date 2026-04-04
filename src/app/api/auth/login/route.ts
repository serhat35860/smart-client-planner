import { NextResponse } from "next/server";
import { z } from "zod";
import { loginWithEmailPassword } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const user = await loginWithEmailPassword(parsed.data.email, parsed.data.password);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({ ok: true });
}

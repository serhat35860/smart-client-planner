import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionForUser, tryEmailPasswordLogin } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(4)
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const r = await tryEmailPasswordLogin(parsed.data.email, parsed.data.password);
  if (!r.ok) {
    if (r.reason === "workspace_inactive") {
      return NextResponse.json({ error: "workspace_inactive" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await setSessionForUser(r.user);
  return NextResponse.json({ ok: true });
}

import { requireWorkspace } from "@/lib/workspace";
import { fail, ok } from "@/lib/api-response";

/** Üst çubuk için oturumdaki kullanıcı özeti. */
export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) return fail("unauthorized", "Authentication required.", 401);
  return ok({
    user: {
      name: ctx.user.name,
      email: ctx.user.email
    }
  });
}

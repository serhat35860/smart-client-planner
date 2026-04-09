import { z } from "zod";
import bcrypt from "bcryptjs";
import { setSessionForUser, tryEmailPasswordLogin } from "@/lib/auth";
import { fail, ok } from "@/lib/api-response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { AuditEventType } from "@/lib/audit-event-types";
import { logAuditEvent } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { defaultWorkspaceName } from "@/lib/workspace";

const schema = z.object({
  email: z.string().min(3).max(120),
  password: z.string().min(4)
});

const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "admin123";
const DEFAULT_ADMIN_EMAIL = "admin@smartclientplanner.local";
const DEFAULT_DEMO_USERNAME = "demo";
const DEFAULT_DEMO_PASSWORD = "demo1234";
const DEFAULT_DEMO_EMAIL = "demo@smartclientplanner.local";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("invalid_json", "Request body must be valid JSON.", 400);
    }
    const parsed = schema.safeParse(body);
    if (!parsed.success) return fail("invalid_payload", "Invalid payload.", 400);
    const identifier = parsed.data.email.toLowerCase().trim();

    // Desktop / web: yalnızca bilinen kısayollar veya veritabanında doğrulanmış kimlik bilgisi (herhangi bir şifreyle giriş yok).
    const isAdminShortcut =
      (identifier === DEFAULT_ADMIN_USERNAME || identifier === DEFAULT_ADMIN_EMAIL) &&
      parsed.data.password === DEFAULT_ADMIN_PASSWORD;
    const isDemoShortcut =
      (identifier === DEFAULT_DEMO_USERNAME || identifier === DEFAULT_DEMO_EMAIL) &&
      parsed.data.password === DEFAULT_DEMO_PASSWORD;

    if (isAdminShortcut || isDemoShortcut) {
      const shortcut = isAdminShortcut
        ? {
            label: "admin",
            username: DEFAULT_ADMIN_USERNAME,
            email: DEFAULT_ADMIN_EMAIL,
            password: DEFAULT_ADMIN_PASSWORD,
            name: "Admin",
            role: "ADMIN" as const
          }
        : {
            label: "demo",
            username: DEFAULT_DEMO_USERNAME,
            email: DEFAULT_DEMO_EMAIL,
            password: DEFAULT_DEMO_PASSWORD,
            name: "Demo User",
            role: "USER" as const
          };
      console.info("[login-debug] shortcut matched", { identifier, shortcut: shortcut.label });
      const passwordHash = await bcrypt.hash(shortcut.password, 10);
      const userByEmail = await prisma.user.findUnique({ where: { email: shortcut.email } });
      const userByUsername = await prisma.user.findUnique({ where: { username: shortcut.username } });
      const targetUser = userByEmail ?? userByUsername;

      const user = targetUser
        ? await prisma.user.update({
            where: { id: targetUser.id },
            data: { email: shortcut.email, username: shortcut.username, passwordHash, name: shortcut.name }
          })
        : await prisma.user.create({
            data: {
              email: shortcut.email,
              username: shortcut.username,
              name: shortcut.name,
              passwordHash
            }
          });

      const existingMember = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
      if (!existingMember) {
        await prisma.workspace.create({
          data: {
            name: defaultWorkspaceName({ email: user.email, name: user.name }),
            members: { create: { userId: user.id, role: shortcut.role } }
          }
        });
      }
      await setSessionForUser(user);
      console.info("[login-debug] shortcut success", { shortcut: shortcut.label, userId: user.id });
      return ok();
    }

    const bucket = checkRateLimit(`login:${ip}:${identifier}`, 10, 10 * 60 * 1000);
    if (!bucket.ok) {
      await logAuditEvent({
        eventType: AuditEventType.AUTH_LOGIN_RATE_LIMITED,
        ipAddress: ip,
        userAgent,
        metaJson: { identifier }
      });
      return fail("too_many_requests", "Too many login attempts. Please try again later.", 429);
    }

    const r = await tryEmailPasswordLogin(identifier, parsed.data.password);
    if (!r.ok) {
      console.warn("[login-debug] normal login failed", { identifier, reason: r.reason });
      await logAuditEvent({
        eventType: AuditEventType.AUTH_LOGIN_FAILED,
        ipAddress: ip,
        userAgent,
        metaJson: { identifier, reason: r.reason }
      });
      if (r.reason === "workspace_inactive") {
        return fail("workspace_inactive", "Workspace member is inactive.", 403);
      }
      return fail("unauthorized", "Invalid credentials.", 401);
    }
    await setSessionForUser(r.user);
    console.info("[login-debug] normal login success", { identifier, userId: r.user.id });
    const membership = await prisma.workspaceMember.findUnique({
      where: { userId: r.user.id },
      select: { workspaceId: true }
    });
    await logAuditEvent({
      eventType: AuditEventType.AUTH_LOGIN_SUCCEEDED,
      actorUserId: r.user.id,
      workspaceId: membership?.workspaceId ?? null,
      ipAddress: ip,
      userAgent
    });
    return ok();
  } catch (error) {
    console.error("[login] unexpected error", error);
    const isDev = process.env.NODE_ENV !== "production";
    const msg = error instanceof Error ? (error.message ?? "") : String(error);
    const name = error instanceof Error ? (error.name ?? "") : "";
    if (
      isDev &&
      (name === "PrismaClientInitializationError" ||
        msg.includes("URL must start with the protocol") ||
        msg.includes("Unable to open the database file") ||
        msg.includes("Error validating datasource"))
    ) {
      return fail(
        "database_unavailable",
        "Veritabanına bağlanılamıyor. .env içinde DATABASE_URL=file:./dev.db olduğundan ve .env.local’in bunu postgresql ile ezmediğinden emin olun; ardından npx prisma db push ve sunucuyu yeniden başlatın.",
        503
      );
    }
    return fail("login_failed", "Login failed.", 500);
  }
}

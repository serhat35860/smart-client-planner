import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "scp_session";
const CSRF_COOKIE_NAME = "scp_csrf";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

type SessionPayload = {
  sid: string;
  userId: string;
  expiresAt: number;
};

function sessionCookieSecure() {
  if (process.env.DESKTOP_APP === "1") return false;
  return process.env.NODE_ENV === "production";
}

function getSecret() {
  const secret =
    process.env.JWT_SECRET ??
    process.env.DESKTOP_SESSION_SECRET ??
    "desktop-beta-insecure-secret-change-me";
  return secret;
}

function signPayload(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function randomToken(size = 32) {
  return randomBytes(size).toString("base64url");
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;
  const expected = createHmac("sha256", getSecret()).update(body).digest("base64url");
  if (signature.length !== expected.length) return null;
  const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
  if (!payload.sid || typeof payload.sid !== "string") return null;
  if (payload.expiresAt < Date.now()) return null;
  return payload;
}

export type TryLoginResult =
  | { ok: true; user: User }
  | { ok: false; reason: "bad_credentials" | "workspace_inactive" };

export async function tryEmailPasswordLogin(email: string, password: string): Promise<TryLoginResult> {
  const identifier = email.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }]
    }
  });
  if (!user) return { ok: false, reason: "bad_credentials" };
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return { ok: false, reason: "bad_credentials" };
  const member = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
  if (member && !member.isActive) return { ok: false, reason: "workspace_inactive" };
  return { ok: true, user };
}

export async function setSessionForUser(user: User) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session = await prisma.userSession.create({
    data: { userId: user.id, expiresAt: new Date(expiresAt) }
  });
  const payload: SessionPayload = { sid: session.id, userId: user.id, expiresAt };
  const token = signPayload(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: sessionCookieSecure(),
    path: "/",
    expires: new Date(payload.expiresAt)
  });
  cookieStore.set(CSRF_COOKIE_NAME, randomToken(), {
    httpOnly: false,
    sameSite: "strict",
    secure: sessionCookieSecure(),
    path: "/",
    expires: new Date(payload.expiresAt)
  });
}

export async function loginWithEmailPassword(email: string, password: string) {
  const r = await tryEmailPasswordLogin(email, password);
  if (r.ok !== true) return null;
  await setSessionForUser(r.user);
  return r.user;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (payload?.sid) {
    await prisma.userSession.updateMany({
      where: { id: payload.sid, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(CSRF_COOKIE_NAME);
}

export async function requireUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const session = await prisma.userSession.findFirst({
    where: { id: payload.sid, userId: payload.userId, revokedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true }
  });
  if (!session) return null;
  await prisma.userSession.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return prisma.user.findUnique({ where: { id: payload.userId } });
}

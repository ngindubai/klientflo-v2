"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const COOKIE = "kf_session";
const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

// --- Password hashing (scrypt) ------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(password, salt, 64);
  return (
    expected.length === actual.length &&
    crypto.timingSafeEqual(expected, actual)
  );
}

/** Constant-time string compare (for the legacy shared-password path). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// --- Sessions (HMAC-signed, with expiry) --------------------------------

function signSession(userId: string, expMs: number): string {
  const payload = `${userId}.${expMs}`;
  const mac = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verifySession(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, mac] = parts;
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${userId}.${expStr}`)
    .digest("hex");
  try {
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  return userId;
}

async function setSessionCookie(userId: string) {
  (await cookies()).set(COOKIE, signSession(userId, Date.now() + MAX_AGE_S * 1000), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

/** The signed-in user id from the session cookie, or null. Safe outside requests. */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    return token ? verifySession(token) : null;
  } catch {
    return null;
  }
}

/**
 * The agent (tenant) id behind the current session, resolved via the user.
 * Returns null for unauthenticated/system contexts — callers fall back to the
 * first agent (the access gate is intentionally open).
 */
export async function getSessionAgentId(): Promise<string | null> {
  const userId = await getSessionUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { agentId: true },
  });
  return user?.agentId ?? null;
}

/** Default access password when APP_PASSWORD isn't set (demo convenience). */
export async function usingDefaultPassword(): Promise<boolean> {
  return !process.env.APP_PASSWORD;
}

export async function login(email: string, password: string) {
  const normalized = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: normalized } });

  if (user) {
    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid email or password.");
    }
  } else {
    // Legacy/demo fallback: match an Agent + the shared APP_PASSWORD, then
    // lazily provision a hashed per-user account so future logins are hashed.
    const expected = (process.env.APP_PASSWORD || "klientflo").trim();
    const agent = await prisma.agent.findFirst({
      where: { email: { equals: email.trim(), mode: "insensitive" } },
    });
    if (!agent || !safeEqual(password.trim(), expected)) {
      throw new Error("Invalid email or password.");
    }
    user = await prisma.user.create({
      data: {
        email: normalized,
        agentId: agent.id,
        name: agent.name,
        passwordHash: await hashPassword(password.trim()),
      },
    });
  }

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

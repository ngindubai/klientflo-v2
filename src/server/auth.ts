"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  hashPassword as hashPasswordPure,
  verifyPassword,
  safeEqual,
  signSession,
  verifySession,
} from "@/lib/auth-crypto";

const COOKIE = "kf_session";
const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

/** Async wrapper so this stays a valid server-action export. */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordPure(password);
}

async function setSessionCookie(userId: string) {
  (await cookies()).set(
    COOKIE,
    signSession(userId, Date.now() + MAX_AGE_S * 1000, SECRET),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE_S,
    },
  );
}

/** The signed-in user id from the session cookie, or null. Safe outside requests. */
export async function getSessionUserId(): Promise<string | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    return token ? verifySession(token, SECRET) : null;
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
  // Throttle brute-force attempts per client IP (10 / 5 min).
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 10, 5 * 60_000).ok) {
    throw new Error("Too many attempts. Please wait a few minutes and try again.");
  }

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

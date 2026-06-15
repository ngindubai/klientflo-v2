"use server";

import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const COOKIE = "kf_session";
const SECRET = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";

function sign(agentId: string): string {
  const mac = crypto.createHmac("sha256", SECRET).update(agentId).digest("hex");
  return `${agentId}.${mac}`;
}

function verify(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot < 0) return null;
  const agentId = token.slice(0, dot);
  const expected = sign(agentId);
  try {
    if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
      return agentId;
    }
  } catch {
    return null;
  }
  return null;
}

/** The signed-in agent id from the session cookie, or null. Safe outside requests. */
export async function getSessionAgentId(): Promise<string | null> {
  try {
    const token = (await cookies()).get(COOKIE)?.value;
    return token ? verify(token) : null;
  } catch {
    // No request scope (scripts, background jobs) — caller falls back.
    return null;
  }
}

/** Default access password when APP_PASSWORD isn't set (demo convenience). */
export async function usingDefaultPassword(): Promise<boolean> {
  return !process.env.APP_PASSWORD;
}

export async function login(email: string, password: string) {
  const expected = process.env.APP_PASSWORD || "klientflo";
  const agent = await prisma.agent.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
  });
  if (!agent || password !== expected) {
    throw new Error("Invalid email or password.");
  }
  (await cookies()).set(COOKIE, sign(agent.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/dashboard");
}

export async function logout() {
  (await cookies()).delete(COOKIE);
  redirect("/login");
}

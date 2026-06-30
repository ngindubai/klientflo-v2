"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { hashPassword } from "@/server/auth";

/** Provision a per-user login account under the current agent tenant. */
export async function createTeamUser(formData: FormData) {
  const agent = await getCurrentAgent();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;

  if (!email || !password) throw new Error("Email and password are required.");
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  try {
    await prisma.user.create({
      data: {
        agentId: agent.id,
        email,
        name,
        passwordHash: await hashPassword(password),
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw new Error("A user with this email already exists.");
    }
    throw e;
  }
  revalidatePath("/settings");
}

export async function deleteTeamUser(id: string) {
  const agent = await getCurrentAgent();
  const user = await prisma.user.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!user) throw new Error("User not found.");
  await prisma.user.delete({ where: { id } });
  revalidatePath("/settings");
}

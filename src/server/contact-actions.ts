"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { CONTACT_CATEGORIES, type ContactCategory } from "@/lib/constants";

/**
 * Tag a conversation's contact with a category (Client / Agent / Investor /
 * Spam / Personal). The tag lives on the Contact so it follows the person
 * across the app. If the conversation has no linked Contact yet, one is created
 * from the WhatsApp contact details and linked. A human tag also clears any
 * pending AI suggestion (Chunk 17).
 */
export async function setConversationTag(
  conversationId: string,
  category: ContactCategory,
) {
  if (!CONTACT_CATEGORIES.includes(category)) {
    throw new Error("Invalid contact category.");
  }
  const agent = await getCurrentAgent();

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId: agent.id },
    select: { id: true, clientId: true, contactPhone: true, contactName: true },
  });
  if (!conversation) throw new Error("Conversation not found.");

  if (conversation.clientId) {
    await prisma.contact.update({
      where: { id: conversation.clientId },
      data: { category, categorySuggested: null },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { categorySuggested: null },
    });
  } else {
    // Create (or reuse, by phone) a Contact and link it to the conversation.
    const contact = await prisma.contact.upsert({
      where: {
        agentId_phone: { agentId: agent.id, phone: conversation.contactPhone },
      },
      create: {
        agentId: agent.id,
        name: conversation.contactName ?? conversation.contactPhone,
        phone: conversation.contactPhone,
        category,
      },
      update: { category, categorySuggested: null },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { clientId: contact.id, categorySuggested: null },
    });
  }

  revalidatePath("/inbox");
  revalidatePath("/clients");
}

/** Dismiss the AI tag suggestion on a conversation without applying it. */
export async function dismissTagSuggestion(conversationId: string) {
  const agent = await getCurrentAgent();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, agentId: agent.id },
    select: { id: true },
  });
  if (!conversation) throw new Error("Conversation not found.");
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { categorySuggested: null },
  });
  revalidatePath("/inbox");
}

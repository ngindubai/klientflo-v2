"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { CONTACT_CATEGORIES, type ContactCategory } from "@/lib/constants";
import { sendText, isWhatsAppConfigured } from "@/server/whatsapp";
import { generateOutreachMessage } from "@/server/ai/outreach";

/** Update the free-text note on a contact. */
export async function updateContactNote(id: string, notes: string) {
  const agent = await getCurrentAgent();
  const contact = await prisma.contact.findFirst({
    where: { id, agentId: agent.id },
    select: { id: true },
  });
  if (!contact) throw new Error("Contact not found.");
  await prisma.contact.update({
    where: { id },
    data: { notes: notes.trim() || null },
  });
  revalidatePath("/agents");
  revalidatePath("/investors");
  revalidatePath("/clients");
}

export type ContactSendResult = { sent: number; failed: number; demo: boolean };

/**
 * Send a WhatsApp message to one or more contacts (agents / investors / …)
 * from inside the app. Each send links/creates the conversation by phone so it
 * appears in the inbox. Throttled; mocked in demo mode.
 */
export async function sendContactMessages(
  contactIds: string[],
  message: string,
): Promise<ContactSendResult> {
  const agent = await getCurrentAgent();
  const text = message.trim();
  if (!text) throw new Error("Message is empty.");
  if (!contactIds.length) throw new Error("Select at least one contact.");

  const contacts = await prisma.contact.findMany({
    where: { id: { in: contactIds }, agentId: agent.id },
    select: { id: true, name: true, phone: true },
  });

  let sent = 0;
  let failed = 0;
  for (const c of contacts) {
    if (!c.phone) {
      failed++;
      continue;
    }
    try {
      const conv = await prisma.conversation.upsert({
        where: { agentId_contactPhone: { agentId: agent.id, contactPhone: c.phone } },
        create: {
          agentId: agent.id,
          contactPhone: c.phone,
          contactName: c.name,
          clientId: c.id,
          lastMessageAt: new Date(),
        },
        update: { clientId: c.id, lastMessageAt: new Date() },
        select: { id: true },
      });
      const res = await sendText(c.phone, text);
      await prisma.message.create({
        data: {
          agentId: agent.id,
          conversationId: conv.id,
          direction: "outbound",
          type: "text",
          status: "sent",
          body: text,
          externalId: res.externalId,
        },
      });
      sent++;
    } catch {
      failed++;
    }
    await new Promise((r) => setTimeout(r, 120));
  }

  revalidatePath("/inbox");
  return { sent, failed, demo: !isWhatsAppConfigured() };
}

/** AI-draft an outreach message (shared with the owner flow). */
export async function draftContactMessage(brief: string): Promise<string> {
  await getCurrentAgent();
  return generateOutreachMessage(brief);
}

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

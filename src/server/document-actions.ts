"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { getStorage } from "@/server/storage";
import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  type DocumentCategory,
} from "@/lib/constants";

const field = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

/** Upload a document (multipart) and link it to a client/deal/property. */
export async function uploadDocument(formData: FormData) {
  const agent = await getCurrentAgent();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a file to upload.");
  }

  const categoryRaw = field(formData, "category") ?? "client";
  const category = (DOCUMENT_CATEGORIES as readonly string[]).includes(categoryRaw)
    ? (categoryRaw as DocumentCategory)
    : "client";
  const typeRaw = field(formData, "type") ?? "passport";
  const type = (DOCUMENT_TYPES as readonly string[]).includes(typeRaw)
    ? typeRaw
    : "passport";

  const expiresRaw = field(formData, "expiresAt");
  const expiresAt = expiresRaw ? new Date(expiresRaw) : null;
  const dealId = field(formData, "dealId");
  const clientId = field(formData, "clientId");
  const propertyId = field(formData, "propertyId");
  if (dealId && !await prisma.deal.findFirst({ where: { id: dealId, agentId: agent.id } })) throw new Error("Deal not found.");
  if (clientId && !await prisma.contact.findFirst({ where: { id: clientId, agentId: agent.id } })) throw new Error("Client not found.");
  if (propertyId && !await prisma.property.findFirst({ where: { id: propertyId, agentId: agent.id } })) throw new Error("Property not found.");

  const document = await prisma.document.create({
    data: {
      agentId: agent.id,
      category,
      type,
      name: field(formData, "name") ?? file.name,
      fileUrl: "",
      expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      clientId,
      dealId,
      propertyId,
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await getStorage().put(
    document.id,
    buffer,
    file.type || "application/octet-stream",
  );
  await prisma.document.update({
    where: { id: document.id },
    data: { fileUrl: `/api/files/${document.id}` },
  });

  revalidatePath("/documents");
  revalidatePath("/dashboard");
  if (dealId) revalidatePath(`/deals/${dealId}`);
  if (dealId && field(formData, "returnToDeal") === "yes") redirect(`/deals/${dealId}`);
  redirect("/documents");
}

export async function deleteDocument(id: string) {
  const agent = await getCurrentAgent();
  const doc = await prisma.document.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!doc) throw new Error("Document not found.");

  if (doc.fileUrl === `/api/files/${doc.id}`) {
    await getStorage().delete(doc.id);
  }
  await prisma.document.delete({ where: { id } });
  revalidatePath("/documents");
  revalidatePath("/dashboard");
  redirect("/documents");
}

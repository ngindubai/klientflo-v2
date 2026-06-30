"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { getStorage } from "@/server/storage";

const field = (fd: FormData, key: string) => {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

const normType = (t: string | null) => (t === "video" ? "video" : "floorplan");

/** Upload a floorplan or video file and store it in blob storage. */
export async function uploadMedia(formData: FormData) {
  const agent = await getCurrentAgent();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Please choose a file to upload.");
  }
  const type = normType(field(formData, "type"));

  const asset = await prisma.mediaAsset.create({
    data: {
      agentId: agent.id,
      type,
      name: field(formData, "name") ?? file.name,
      fileUrl: "",
      propertyId: field(formData, "propertyId"),
    },
  });

  const buffer = Buffer.from(await file.arrayBuffer());
  await getStorage().put(asset.id, buffer, file.type || "application/octet-stream");
  await prisma.mediaAsset.update({
    where: { id: asset.id },
    data: { fileUrl: `/api/media/${asset.id}` },
  });

  revalidatePath("/storage");
}

/** Add a video (or floorplan) as an external link instead of an upload. */
export async function addMediaLink(formData: FormData) {
  const agent = await getCurrentAgent();
  const url = field(formData, "externalUrl");
  if (!url) throw new Error("Please paste a link.");
  const type = normType(field(formData, "type"));
  await prisma.mediaAsset.create({
    data: {
      agentId: agent.id,
      type,
      name: field(formData, "name") ?? url,
      externalUrl: url,
      propertyId: field(formData, "propertyId"),
    },
  });
  revalidatePath("/storage");
}

export async function deleteMedia(id: string) {
  const agent = await getCurrentAgent();
  const asset = await prisma.mediaAsset.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!asset) throw new Error("Media not found.");
  if (asset.fileUrl === `/api/media/${asset.id}`) {
    await getStorage().delete(asset.id);
  }
  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/storage");
}

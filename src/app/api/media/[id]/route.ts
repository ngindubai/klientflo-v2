import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { getStorage } from "@/server/storage";

// Streams a stored floorplan/video file (or redirects to an external link).
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const agent = await getCurrentAgent();
  const asset = await prisma.mediaAsset.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!asset) return new NextResponse("Not found", { status: 404 });

  if (asset.externalUrl) {
    return NextResponse.redirect(asset.externalUrl);
  }

  const file = await getStorage().read(asset.id);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(asset.name)}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

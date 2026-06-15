import { NextResponse } from "next/server";
import { getDocument } from "@/server/documents";
import { getStorage } from "@/server/storage";

// Streams a locally-stored uploaded document for preview/download. Scoped to
// the current agent. External/seed documents are served from their own URL.
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const doc = await getDocument(id);
  if (!doc || doc.fileUrl !== `/api/files/${doc.id}`) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await getStorage().read(doc.id);
  if (!file) return new NextResponse("Not found", { status: 404 });

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.name)}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";
import { BrochureDocument } from "@/server/pdf/brochure";

export const runtime = "nodejs";

/**
 * Render a template into a branded PDF for a chosen property.
 * GET /api/templates/[id]/pdf?propertyId=...
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const agent = await getCurrentAgent();

  const template = await prisma.template.findFirst({
    where: { id, agentId: agent.id },
  });
  if (!template) return new NextResponse("Template not found", { status: 404 });

  const propertyId = new URL(req.url).searchParams.get("propertyId");
  if (!propertyId) {
    return new NextResponse("Choose a property to generate the PDF.", {
      status: 400,
    });
  }
  const property = await prisma.property.findFirst({
    where: { id: propertyId, agentId: agent.id },
  });
  if (!property) return new NextResponse("Property not found", { status: 404 });

  const buffer = await renderToBuffer(
    BrochureDocument({
      templateName: template.name,
      body: template.body,
      property,
      agent: { name: agent.name, phone: agent.phone, email: agent.email },
    }),
  );

  const filename = `${template.name.replace(/[^\w-]+/g, "-")}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

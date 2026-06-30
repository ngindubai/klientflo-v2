import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAgent } from "@/server/agent";
import {
  getReport,
  REPORT_RANGES,
  type ReportRange,
} from "@/server/reporting";
import { ReportDocument } from "@/server/pdf/report";

export const runtime = "nodejs";

/** Branded PDF export of the reports dashboard. */
export async function GET(req: Request) {
  const agent = await getCurrentAgent();
  const params = new URL(req.url).searchParams;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const rangeNum = Number(params.get("range"));
  const days = REPORT_RANGES.includes(rangeNum as ReportRange)
    ? (rangeNum as ReportRange)
    : 30;

  const report = await getReport(from || to ? { from, to } : { days });

  const buffer = await renderToBuffer(
    ReportDocument({ report, agentName: agent.name }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="klientflo-report.pdf"`,
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  });
}

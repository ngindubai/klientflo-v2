import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import type { Report } from "@/server/reporting";
import { formatMinutes } from "@/lib/reporting-calc";
import { formatAED } from "@/lib/utils";
import { CONTACT_CATEGORY_LABELS, humanizeEnum } from "@/lib/constants";

const BRAND = "#108BFF";
const NAVY = "#06121F";
const MUTED = "#475569";
const COLORS = ["#108BFF", "#65C1FF", "#006DD5", "#0EA5E9", "#6366F1", "#94A3B8"];

const styles = StyleSheet.create({
  page: { paddingTop: 0, paddingBottom: 48, paddingHorizontal: 0, fontSize: 10, color: "#0F172A", fontFamily: "Helvetica" },
  band: { backgroundColor: NAVY, paddingVertical: 22, paddingHorizontal: 44, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#fff", letterSpacing: -0.5 },
  brandSub: { fontSize: 9, color: "#9DC9F2", marginTop: 2 },
  bandRight: { fontSize: 11, color: "#fff", fontFamily: "Helvetica-Bold" },
  accentRule: { height: 4, backgroundColor: BRAND },
  body: { paddingHorizontal: 44, paddingTop: 18 },
  meta: { fontSize: 10, color: MUTED, marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 8, marginTop: 16 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kpi: { width: "31.5%", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10 },
  kpiValue: { fontSize: 16, fontFamily: "Helvetica-Bold", color: NAVY },
  kpiLabel: { fontSize: 8, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 },
  chartRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  swatch: { width: 9, height: 9, borderRadius: 2, marginRight: 6 },
  legendLabel: { fontSize: 9, color: MUTED, flex: 1 },
  legendValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  barLabel: { width: 110, fontSize: 9, color: MUTED },
  barTrack: { flex: 1, height: 8, backgroundColor: "#EAF6FF", borderRadius: 4 },
  barFill: { height: 8, backgroundColor: BRAND, borderRadius: 4 },
  barValue: { width: 28, fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" },
  listRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEF2F7", paddingVertical: 4 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: NAVY, paddingVertical: 8, paddingHorizontal: 44, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: "#9DC9F2" },
});

function catLabel(c: string) {
  return c in CONTACT_CATEGORY_LABELS
    ? CONTACT_CATEGORY_LABELS[c as keyof typeof CONTACT_CATEGORY_LABELS]
    : "Untagged";
}

/** Pre-compute SVG pie-slice paths (plain function — no render-time mutation). */
function pieSlices(data: { value: number }[]): { d: string; color: string }[] {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = 50;
  const cy = 50;
  const r = 48;
  const start = -Math.PI / 2;
  return data.map((d, i) => {
    const before = data.slice(0, i).reduce((s, x) => s + x.value, 0);
    const a0 = start + (before / total) * 2 * Math.PI;
    const a1 = a0 + (d.value / total) * 2 * Math.PI;
    const x0 = cx + r * Math.cos(a0);
    const y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return {
      d: `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} Z`,
      color: COLORS[i % COLORS.length],
    };
  });
}

/** SVG pie chart for react-pdf. */
function Pie({ data, size = 96 }: { data: { value: number }[]; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {pieSlices(data).map((s, i) => (
        <Path key={i} d={s.d} fill={s.color} />
      ))}
    </Svg>
  );
}

function Legend({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <View style={{ flex: 1 }}>
      {rows.map((r, i) => (
        <View key={r.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: COLORS[i % COLORS.length] }]} />
          <Text style={styles.legendLabel}>{r.label}</Text>
          <Text style={styles.legendValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ChartBlock({ rows }: { rows: { label: string; value: number }[] }) {
  return (
    <View style={styles.chartRow}>
      <Pie data={rows} />
      <Legend rows={rows} />
    </View>
  );
}

function Bars({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <View>
      {rows.map((r) => (
        <View key={r.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{r.label}</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(r.count / max) * 100}%` }]} />
          </View>
          <Text style={styles.barValue}>{r.count}</Text>
        </View>
      ))}
    </View>
  );
}

export function ReportDocument({
  report,
  agentName,
}: {
  report: Report;
  agentName: string;
}) {
  const k = report.kpis;
  const kpis: { label: string; value: string | number }[] = [
    { label: "WhatsApp messages", value: k.messagesTotal },
    { label: "Incoming", value: k.inbound },
    { label: "Sent", value: k.outbound },
    { label: "New leads", value: k.newConversations },
    { label: "Viewings booked", value: k.viewingsBooked },
    { label: "Median response", value: formatMinutes(k.medianResponseMinutes) },
    { label: "Open pipeline value", value: formatAED(report.pipelineValue) },
    { label: "Deals won", value: report.dealOutcomes.won },
    { label: "Deals open", value: report.dealOutcomes.open },
  ];

  return (
    <Document title={`KlientFlo report — ${report.label}`}>
      <Page size="A4" style={styles.page}>
        {/* Branded header band */}
        <View style={styles.band}>
          <View>
            <Text style={styles.brand}>KlientFlo</Text>
            <Text style={styles.brandSub}>Client workflows, simplified.</Text>
          </View>
          <Text style={styles.bandRight}>Activity Report</Text>
        </View>
        <View style={styles.accentRule} />

        <View style={styles.body}>
          <Text style={styles.meta}>
            {agentName} · {report.label}
          </Text>

          <View style={styles.row}>
            {kpis.map((kp) => (
              <View key={kp.label} style={styles.kpi}>
                <Text style={styles.kpiValue}>{kp.value}</Text>
                <Text style={styles.kpiLabel}>{kp.label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Messages by tag</Text>
          {report.messagesByCategory.length > 0 ? (
            <ChartBlock
              rows={report.messagesByCategory.map((r) => ({
                label: catLabel(r.category),
                value: r.count,
              }))}
            />
          ) : (
            <Text style={styles.meta}>No messages in this period.</Text>
          )}

          <Text style={styles.sectionTitle}>Deals by type</Text>
          {report.dealsByType.length > 0 ? (
            <ChartBlock
              rows={report.dealsByType.map((r) => ({
                label: humanizeEnum(r.type),
                value: r.count,
              }))}
            />
          ) : (
            <Text style={styles.meta}>No deals yet.</Text>
          )}

          <Text style={styles.sectionTitle}>Conversations by type</Text>
          {report.conversationsByClassification.length > 0 ? (
            <Bars
              rows={report.conversationsByClassification.slice(0, 8).map((r) => ({
                label: humanizeEnum(r.classification),
                count: r.count,
              }))}
            />
          ) : (
            <Text style={styles.meta}>No conversations in this period.</Text>
          )}

          {report.topAreas.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top demand areas</Text>
              <Bars
                rows={report.topAreas.map((r) => ({ label: r.area, count: r.count }))}
              />
            </>
          )}

          <Text style={styles.sectionTitle}>Pipeline (open deals)</Text>
          {report.pipeline.length > 0 ? (
            report.pipeline.map((p) => (
              <View key={`${p.type}-${p.stage}`} style={styles.listRow}>
                <Text>
                  {humanizeEnum(p.type)} · {humanizeEnum(p.stage)}
                </Text>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{p.count}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.meta}>No deals yet.</Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>KlientFlo · Activity Report</Text>
          <Text style={styles.footerText}>Client workflows, simplified.</Text>
        </View>
      </Page>
    </Document>
  );
}

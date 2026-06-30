import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Report } from "@/server/reporting";
import { formatMinutes } from "@/lib/reporting-calc";
import { CONTACT_CATEGORY_LABELS, humanizeEnum } from "@/lib/constants";

const BRAND = "#108BFF";
const NAVY = "#06121F";
const MUTED = "#475569";

const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontSize: 10, color: "#0F172A", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND, letterSpacing: -0.5 },
  kicker: { fontSize: 10, color: MUTED },
  rule: { height: 3, backgroundColor: BRAND, marginVertical: 12, width: 70 },
  meta: { fontSize: 10, color: MUTED, marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: NAVY, marginBottom: 8, marginTop: 16 },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: { width: "31%", borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10 },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: NAVY },
  kpiLabel: { fontSize: 8, color: MUTED, marginTop: 2, textTransform: "uppercase", letterSpacing: 0.5 },
  barRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  barLabel: { width: 120, fontSize: 9, color: MUTED },
  barTrack: { flex: 1, height: 8, backgroundColor: "#EAF6FF", borderRadius: 4 },
  barFill: { height: 8, backgroundColor: BRAND, borderRadius: 4 },
  barValue: { width: 30, fontSize: 9, textAlign: "right", fontFamily: "Helvetica-Bold" },
  listRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#EEF2F7", paddingVertical: 4 },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, borderTopWidth: 1, borderTopColor: "#E2E8F0", paddingTop: 8, fontSize: 8, color: MUTED },
});

function catLabel(c: string) {
  return c in CONTACT_CATEGORY_LABELS
    ? CONTACT_CATEGORY_LABELS[c as keyof typeof CONTACT_CATEGORY_LABELS]
    : "Untagged";
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
  ];

  return (
    <Document title={`KlientFlo report — ${report.label}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>KlientFlo</Text>
          <Text style={styles.kicker}>Activity Report</Text>
        </View>
        <View style={styles.rule} />
        <Text style={styles.meta}>
          {agentName} · {report.label}
        </Text>

        <View style={styles.kpiRow}>
          {kpis.map((kp) => (
            <View key={kp.label} style={styles.kpi}>
              <Text style={styles.kpiValue}>{kp.value}</Text>
              <Text style={styles.kpiLabel}>{kp.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Messages by tag</Text>
        {report.messagesByCategory.length > 0 ? (
          <Bars
            rows={report.messagesByCategory.map((r) => ({
              label: catLabel(r.category),
              count: r.count,
            }))}
          />
        ) : (
          <Text style={styles.kicker}>No messages in this period.</Text>
        )}

        <Text style={styles.sectionTitle}>Conversations by type</Text>
        {report.conversationsByClassification.length > 0 ? (
          <Bars
            rows={report.conversationsByClassification.map((r) => ({
              label: humanizeEnum(r.classification),
              count: r.count,
            }))}
          />
        ) : (
          <Text style={styles.kicker}>No conversations in this period.</Text>
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
          <Text style={styles.kicker}>No deals yet.</Text>
        )}

        <Text style={styles.footer} fixed>
          Generated by KlientFlo · Client workflows, simplified.
        </Text>
      </Page>
    </Document>
  );
}

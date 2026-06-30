import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { formatAED } from "@/lib/utils";
import { resolveMergeFields, type MergeProperty, type MergeAgent } from "./merge";

const BRAND = "#108BFF";

const styles = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontSize: 11, color: "#1f2937", fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  brand: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND },
  kicker: { fontSize: 9, letterSpacing: 2, color: "#6b7280" },
  rule: { height: 2, backgroundColor: BRAND, marginVertical: 12, width: 60 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 4 },
  price: { fontSize: 18, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 12 },
  specs: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 18 },
  spec: { fontSize: 10, color: "#374151" },
  specLabel: { fontSize: 8, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 },
  body: { fontSize: 11, lineHeight: 1.6, marginBottom: 6 },
  para: { marginBottom: 8 },
  footer: { position: "absolute", bottom: 30, left: 44, right: 44, borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 8 },
  footerName: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#111827" },
  footerLine: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  disclaimer: { fontSize: 7, color: "#9ca3af", marginTop: 6 },
});

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.spec}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text>{value}</Text>
    </View>
  );
}

/**
 * Branded property brochure. The template body is resolved against the property
 * + agent, then laid out into a fixed branded PDF.
 */
export function BrochureDocument({
  templateName,
  body,
  property,
  agent,
}: {
  templateName: string;
  body: string;
  property: MergeProperty;
  agent: MergeAgent;
}) {
  const resolved = resolveMergeFields(body, property, agent);
  const paragraphs = resolved.split(/\n{1,}/).filter((p) => p.trim().length > 0);

  const specs: { label: string; value: string }[] = [];
  if (property.bedrooms != null) specs.push({ label: "Beds", value: String(property.bedrooms) });
  if (property.bathrooms != null) specs.push({ label: "Baths", value: String(property.bathrooms) });
  if (property.sizeSqft != null) specs.push({ label: "Size", value: `${property.sizeSqft.toLocaleString()} sqft` });
  if (property.propertyType) specs.push({ label: "Type", value: property.propertyType });
  if (property.area) specs.push({ label: "Area", value: property.area });

  return (
    <Document title={templateName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{agent.name}</Text>
          <Text style={styles.kicker}>PROPERTY BROCHURE</Text>
        </View>
        <View style={styles.rule} />

        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.price}>{formatAED(property.price)}</Text>

        {specs.length > 0 && (
          <View style={styles.specs}>
            {specs.map((s) => (
              <Spec key={s.label} label={s.label} value={s.value} />
            ))}
          </View>
        )}

        <View style={styles.body}>
          {paragraphs.map((p, i) => (
            <Text key={i} style={styles.para}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerName}>{agent.name}</Text>
          {(agent.phone || agent.email) && (
            <Text style={styles.footerLine}>
              {[agent.phone, agent.email].filter(Boolean).join("  ·  ")}
            </Text>
          )}
          <Text style={styles.disclaimer}>
            {property.permitNumber ? `Permit No. ${property.permitNumber}. ` : ""}
            Details are for guidance only and do not form part of any offer or contract.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

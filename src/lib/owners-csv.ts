// Pure CSV parsing + column mapping for the owners import (no DB), so it can be
// unit-tested. src/server/owner-actions.ts wraps this and writes to the DB.

export type OwnerRecord = {
  name: string;
  phone: string | null;
  email: string | null;
  area: string | null;
  building: string | null;
  unit: string | null;
  notes: string | null;
};

export type ParseResult = {
  records: OwnerRecord[];
  skipped: number;
  total: number;
  unmappedHeaders: string[];
  error?: string;
};

// Handles quoted fields, escaped quotes ("") and commas/newlines inside quotes.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inQuotes) {
      if (ch === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

// Header aliases → Owner field, matched after stripping non-alphanumerics.
const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  ownername: "name",
  owner: "name",
  fullname: "name",
  phone: "phone",
  mobile: "phone",
  contact: "phone",
  phonenumber: "phone",
  whatsapp: "phone",
  email: "email",
  emailaddress: "email",
  area: "area",
  community: "area",
  location: "area",
  building: "building",
  tower: "building",
  project: "building",
  unit: "unit",
  unitno: "unit",
  unitnumber: "unit",
  apartment: "unit",
  flat: "unit",
  notes: "notes",
  note: "notes",
  remarks: "notes",
};

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

/** Parse owner CSV text into records, auto-mapping columns and deduping by phone. */
export function parseOwnerCsv(csvText: string): ParseResult {
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return {
      records: [],
      skipped: 0,
      total: 0,
      unmappedHeaders: [],
      error: "The file needs a header row and at least one data row.",
    };
  }

  const headers = rows[0];
  const mapping = headers.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
  const unmappedHeaders = headers.filter((_, i) => mapping[i] === null);
  if (!mapping.includes("name")) {
    return {
      records: [],
      skipped: 0,
      total: rows.length - 1,
      unmappedHeaders,
      error:
        "Couldn't find a Name column. Include a column headed Name (or Owner Name).",
    };
  }

  const dataRows = rows.slice(1);
  const seenPhones = new Set<string>();
  const records: OwnerRecord[] = [];
  let skipped = 0;

  for (const r of dataRows) {
    const rec: Record<string, string | null> = {};
    mapping.forEach((fieldName, i) => {
      if (fieldName) rec[fieldName] = clean(r[i]);
    });
    if (!rec.name) {
      skipped++;
      continue;
    }
    if (rec.phone) {
      const key = rec.phone.replace(/\s/g, "");
      if (seenPhones.has(key)) {
        skipped++;
        continue;
      }
      seenPhones.add(key);
    }
    records.push({
      name: rec.name,
      phone: rec.phone ?? null,
      email: rec.email ?? null,
      area: rec.area ?? null,
      building: rec.building ?? null,
      unit: rec.unit ?? null,
      notes: rec.notes ?? null,
    });
  }

  return { records, skipped, total: dataRows.length, unmappedHeaders };
}

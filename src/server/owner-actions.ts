"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAgent } from "@/server/agent";

// --- CSV parsing (dependency-free) --------------------------------------
// Handles quoted fields, escaped quotes ("") and commas/newlines inside quotes.
function parseCsv(text: string): string[][] {
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

// Header aliases → Owner field. Matched case-insensitively after stripping
// non-alphanumerics, so "Owner Name", "owner_name", "NAME" all map to name.
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

const normalizeHeader = (h: string) =>
  h.toLowerCase().replace(/[^a-z0-9]/g, "");

const clean = (v?: string) => {
  const t = v?.trim();
  return t ? t : null;
};

export type ImportResult = {
  imported: number;
  skipped: number;
  total: number;
  unmappedHeaders: string[];
  error?: string;
};

/**
 * Import owners from a pasted/uploaded CSV. Auto-maps columns by header name,
 * dedupes by phone within the upload, and skips rows with no name.
 */
export async function importOwnersCsv(csvText: string): Promise<ImportResult> {
  const agent = await getCurrentAgent();
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return {
      imported: 0,
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
      imported: 0,
      skipped: 0,
      total: rows.length - 1,
      unmappedHeaders,
      error:
        "Couldn't find a Name column. Include a column headed Name (or Owner Name).",
    };
  }

  const dataRows = rows.slice(1);
  const seenPhones = new Set<string>();
  const records: {
    agentId: string;
    name: string;
    phone: string | null;
    email: string | null;
    area: string | null;
    building: string | null;
    unit: string | null;
    notes: string | null;
    source: string;
  }[] = [];
  let skipped = 0;

  for (const r of dataRows) {
    const rec: Record<string, string | null> = {};
    mapping.forEach((field, i) => {
      if (field) rec[field] = clean(r[i]);
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
      agentId: agent.id,
      name: rec.name,
      phone: rec.phone ?? null,
      email: rec.email ?? null,
      area: rec.area ?? null,
      building: rec.building ?? null,
      unit: rec.unit ?? null,
      notes: rec.notes ?? null,
      source: "import",
    });
  }

  if (records.length > 0) {
    await prisma.owner.createMany({ data: records });
  }

  revalidatePath("/owners");
  return {
    imported: records.length,
    skipped,
    total: dataRows.length,
    unmappedHeaders,
  };
}

/** Delete all imported owners (lets the agent re-import a corrected file). */
export async function clearOwners() {
  const agent = await getCurrentAgent();
  await prisma.owner.deleteMany({ where: { agentId: agent.id } });
  revalidatePath("/owners");
}

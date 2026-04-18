import { Prisma } from "@prisma/client";

export type AdditionalContact = { name: string; phone?: string; jobTitle?: string };

const MAX_CONTACTS = 20;

function readJobTitle(o: Record<string, unknown>): string | undefined {
  const jt = typeof o.jobTitle === "string" ? o.jobTitle.trim() : "";
  return jt ? jt : undefined;
}

export function parseAdditionalContacts(value: unknown): AdditionalContact[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  const out: AdditionalContact[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const phone = typeof o.phone === "string" ? o.phone.trim() : "";
    if (name) {
      const row: AdditionalContact = { name };
      if (phone) row.phone = phone;
      const jt = readJobTitle(o);
      if (jt) row.jobTitle = jt;
      out.push(row);
    }
  }
  return out.slice(0, MAX_CONTACTS);
}

/** API / formdan gelen diziyi kayda hazırla; boş çiftleri at. */
export function sanitizeAdditionalContactsInput(raw: unknown): AdditionalContact[] {
  if (!Array.isArray(raw)) return [];
  const out: AdditionalContact[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const phone = typeof o.phone === "string" ? o.phone.trim() : "";
    if (!name) continue;
    const row: AdditionalContact = { name };
    if (phone) row.phone = phone;
    const jt = readJobTitle(o);
    if (jt) row.jobTitle = jt;
    out.push(row);
    if (out.length >= MAX_CONTACTS) break;
  }
  return out;
}

export function additionalContactsForPrisma(
  contacts: AdditionalContact[]
): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return contacts.length > 0 ? contacts : Prisma.DbNull;
}

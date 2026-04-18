import type { ClientStatus } from "@prisma/client";
import ExcelJS from "exceljs";
import { z } from "zod";
import type { AdditionalContact } from "@/lib/client-additional-contacts";
import { parseAdditionalContacts } from "@/lib/client-additional-contacts";

const HEADER_TO_KEY: Record<string, keyof ParsedImportRow> = {
  dosya_no: "fileNumber",
  file_number: "fileNumber",
  fileno: "fileNumber",
  firma: "companyName",
  company: "companyName",
  company_name: "companyName",
  sirket: "companyName",
  şirket: "companyName",
  yetkili: "contactPerson",
  contact: "contactPerson",
  contact_person: "contactPerson",
  telefon: "phone",
  phone: "phone",
  tel: "phone",
  e_posta: "email",
  eposta: "email",
  email: "email",
  sektor: "sector",
  sektör: "sector",
  sector: "sector",
  genel_notlar: "generalNotes",
  general_notes: "generalNotes",
  notlar: "generalNotes",
  notes: "generalNotes",
  durum: "status",
  status: "status",
  ek_yetkililer: "extraContacts",
  extra_contacts: "extraContacts",
  ek_iletisim: "extraContacts"
};

export type ParsedImportRow = {
  fileNumber?: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  sector?: string;
  generalNotes?: string;
  status: ClientStatus;
  extraContacts: AdditionalContact[];
};

function normalizeHeader(cell: string): string {
  return cell
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/** `Ad Soyad|Görev Tanımı|İletişim; Ad2|Görev2|İletişim2` — noktalı virgül/satırsonu ile kişiler, | ile alanlar. */
export function parseExtraContactsCell(raw: string): AdditionalContact[] {
  const s = raw.trim();
  if (!s) return [];
  const chunks = s
    .split(/[;\n\r]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const out: AdditionalContact[] = [];
  for (const chunk of chunks) {
    const parts = chunk.split("|").map((x) => x.trim());
    const name = parts[0] ?? "";
    const second = parts[1] ?? "";
    const third = parts[2] ?? "";
    const secondLooksContact = /[@+\d]/.test(second);
    const thirdLooksContact = /[@+\d]/.test(third);

    // Backward compatible:
    // - old: name|contact|title
    // - old-short: name|contact
    // - new: name|title|contact
    let jobTitle = "";
    let phone = "";
    if (!second && !third) {
      jobTitle = "";
      phone = "";
    } else if (second && !third) {
      phone = second;
    } else if (secondLooksContact && !thirdLooksContact) {
      phone = second;
      jobTitle = third;
    } else if (!secondLooksContact && thirdLooksContact) {
      jobTitle = second;
      phone = third;
    } else {
      // Fallback for ambiguous rows: prefer preserving explicit third value as contact.
      jobTitle = second;
      phone = third || second;
    }
    if (name) {
      const row: AdditionalContact = { name };
      if (phone.trim()) row.phone = phone.trim();
      if (jobTitle.trim()) row.jobTitle = jobTitle.trim();
      out.push(row);
    }
  }
  return out.slice(0, 20);
}

const statusMap: Record<string, ClientStatus> = {
  active: "ACTIVE",
  aktif: "ACTIVE",
  passive: "PASSIVE",
  pasif: "PASSIVE",
  potential: "POTENTIAL",
  potansiyel: "POTENTIAL"
};

export function parseClientStatusCell(raw: string): ClientStatus | null {
  const k = raw.trim().toLowerCase();
  if (!k) return "POTENTIAL";
  return statusMap[k] ?? null;
}

export function serializeExtraContacts(contacts: AdditionalContact[]): string {
  if (!contacts.length) return "";
  return contacts
    .map((c) => {
      const j = c.jobTitle?.trim();
      const contact = c.phone?.trim() ?? "";
      return j ? `${c.name}|${j}|${contact}` : `${c.name}||${contact}`;
    })
    .join("; ");
}

const emailSchema = z.string().email();

export type ImportRowError = { row: number; message: string };

export function buildClientImportColumnMap(headerRow: string[]): Map<number, keyof ParsedImportRow> | null {
  const map = new Map<number, keyof ParsedImportRow>();
  for (let i = 0; i < headerRow.length; i += 1) {
    const key = HEADER_TO_KEY[normalizeHeader(headerRow[i] ?? "")];
    if (key) map.set(i, key);
  }
  if (!map.size) return null;
  const need: (keyof ParsedImportRow)[] = ["companyName", "contactPerson", "phone", "email"];
  const got = new Set(map.values());
  for (const k of need) {
    if (!got.has(k)) return null;
  }
  return map;
}

export function rowToParsedClient(
  cells: string[],
  colMap: Map<number, keyof ParsedImportRow>,
  rowIndex1Based: number
): { ok: true; data: ParsedImportRow } | { ok: false; error: ImportRowError } {
  const raw: Partial<Record<keyof ParsedImportRow, string>> = {};
  for (const [col, field] of colMap) {
    const v = cells[col];
    raw[field] = v == null || v === "" ? "" : String(v).trim();
  }
  const companyName = raw.companyName ?? "";
  const contactPerson = raw.contactPerson ?? "";
  const phone = raw.phone ?? "";
  const email = raw.email ?? "";
  const emptyLine = !companyName && !contactPerson && !phone && !email;
  if (emptyLine) {
    return { ok: false, error: { row: rowIndex1Based, message: "skip" } };
  }
  if (!companyName || !contactPerson || !phone || !email) {
    return {
      ok: false,
      error: { row: rowIndex1Based, message: "Firma, yetkili, telefon ve e-posta zorunludur." }
    };
  }
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { ok: false, error: { row: rowIndex1Based, message: "Geçersiz e-posta." } };
  }
  const st = parseClientStatusCell(raw.status ?? "");
  if (st === null) {
    return {
      ok: false,
      error: {
        row: rowIndex1Based,
        message: "Durum: AKTIF, PASIF veya POTANSIYEL (veya ACTIVE, PASSIVE, POTENTIAL) olmalı."
      }
    };
  }
  const extraContacts = parseExtraContactsCell(raw.extraContacts ?? "");
  return {
    ok: true,
    data: {
      fileNumber: raw.fileNumber?.trim() || undefined,
      companyName,
      contactPerson,
      phone,
      email: parsedEmail.data,
      sector: raw.sector?.trim() || undefined,
      generalNotes: raw.generalNotes?.trim() || undefined,
      status: st,
      extraContacts
    }
  };
}

export async function buildClientTemplateWorkbook(): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Müşteriler", { views: [{ state: "frozen", ySplit: 1 }] });
  const headers = [
    "dosya_no",
    "firma",
    "yetkili",
    "telefon",
    "e_posta",
    "sektor",
    "genel_notlar",
    "durum",
    "ek_yetkililer"
  ];
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  const widths = [12, 28, 22, 16, 28, 18, 36, 14, 42];
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
  ws.addRow([
    "",
    "Örnek A.Ş.",
    "Ayşe Yılmaz",
    "05551234567",
    "ornek@firma.com",
    "Yazılım",
    "İlk görüşme notu",
    "POTANSIYEL",
    "Mehmet Kaya|Muhasebe Sorumlusu|05559876543; Elif Demir|Satın Alma Uzmanı|elif@ornek.com"
  ]);
  const help = wb.addWorksheet("Açıklama");
  help.getColumn(1).width = 22;
  help.getColumn(2).width = 70;
  help.addRow(["Sütun", "Açıklama"]);
  help.getRow(1).font = { bold: true };
  const lines: [string, string][] = [
    ["dosya_no", "İçe aktarımda boş bırakın; sistem YYYY-N dosya numarası atar. Dışa aktarımda dolu gelir."],
    ["firma", "Zorunlu. Şirket / müşteri adı."],
    ["yetkili", "Zorunlu. Birincil yetkili kişi."],
    ["telefon", "Zorunlu."],
    ["e_posta", "Zorunlu, geçerli e-posta."],
    ["sektor", "İsteğe bağlı."],
    ["genel_notlar", "İsteğe bağlı."],
    ["durum", "AKTIF, PASIF, POTANSIYEL veya ACTIVE, PASSIVE, POTENTIAL. Boş: POTANSIYEL."],
    [
      "ek_yetkililer",
      "İsteğe bağlı. Birden fazla: Ad Soyad|Görev Tanımı|İletişim; Ad2|Görev2|İletişim2. İletişim alanı telefon veya e-posta olabilir."
    ]
  ];
  for (const [a, b] of lines) help.addRow([a, b]);
  const buf = await wb.xlsx.writeBuffer();
  return buf as ExcelJS.Buffer;
}

export async function buildClientExportWorkbook(
  rows: Array<{
    fileNumber: string | null;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    sector: string | null;
    generalNotes: string | null;
    status: ClientStatus;
    additionalContacts: unknown;
  }>
): Promise<ExcelJS.Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Müşteriler", { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = [
    { width: 12 },
    { width: 28 },
    { width: 22 },
    { width: 16 },
    { width: 28 },
    { width: 18 },
    { width: 36 },
    { width: 14 },
    { width: 42 }
  ];
  ws.addRow([
    "dosya_no",
    "firma",
    "yetkili",
    "telefon",
    "e_posta",
    "sektor",
    "genel_notlar",
    "durum",
    "ek_yetkililer"
  ]);
  ws.getRow(1).font = { bold: true };
  for (const r of rows) {
    const extra = serializeExtraContacts(parseAdditionalContacts(r.additionalContacts));
    ws.addRow([
      r.fileNumber ?? "",
      r.companyName,
      r.contactPerson,
      r.phone,
      r.email,
      r.sector ?? "",
      r.generalNotes ?? "",
      r.status,
      extra
    ]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return buf as ExcelJS.Buffer;
}

export type ParsedImportRowWithLine = { row: number; data: ParsedImportRow };

export async function parseClientImportBuffer(buffer: Buffer): Promise<{
  rows: ParsedImportRowWithLine[];
  errors: ImportRowError[];
  headerError: string | null;
}> {
  const wb = new ExcelJS.Workbook();
  // @ts-expect-error exceljs type definitions lag behind Node Buffer generics.
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) {
    return { rows: [], errors: [], headerError: "Çalışma sayfası bulunamadı." };
  }
  const first = ws.getRow(1);
  const headerRow: string[] = [];
  for (let c = 1; c <= 24; c += 1) {
    const v = first.getCell(c).value;
    let s = "";
    if (v == null) s = "";
    else if (typeof v === "string" || typeof v === "number") s = String(v);
    else if (typeof v === "object" && v && "text" in v) s = String((v as { text: string }).text);
    else if (typeof v === "object" && v && "result" in v) s = String((v as { result?: unknown }).result ?? "");
    headerRow.push(s);
  }
  while (headerRow.length && !normalizeHeader(headerRow[headerRow.length - 1] ?? "")) {
    headerRow.pop();
  }
  const colMap = buildClientImportColumnMap(headerRow);
  if (!colMap) {
    return {
      rows: [],
      errors: [],
      headerError:
        "İlk satırda şu başlıklar olmalı: firma, yetkili, telefon, e_posta (İngilizce karşılıkları da kabul edilir). Şablonu indirip kullanın."
    };
  }
  const rows: ParsedImportRowWithLine[] = [];
  const errors: ImportRowError[] = [];
  const maxCol = Math.max(24, ...colMap.keys()) + 1;
  const lastRow = Math.min(ws.rowCount || 2, 2002);
  for (let r = 2; r <= lastRow; r += 1) {
    const row = ws.getRow(r);
    const cells: string[] = [];
    for (let c = 1; c <= maxCol; c += 1) {
      const cell = row.getCell(c);
      const v = cell.value;
      let s = "";
      if (v == null) s = "";
      else if (typeof v === "string" || typeof v === "number") s = String(v);
      else if (v instanceof Date) s = v.toISOString();
      else if (typeof v === "object" && v && "text" in v) s = String((v as { text: string }).text);
      else if (typeof v === "object" && v && "result" in v) s = String((v as { result?: unknown }).result ?? "");
      cells[c - 1] = s;
    }
    const parsed = rowToParsedClient(cells, colMap, r);
    if (!parsed.ok) {
      if (parsed.error.message !== "skip") errors.push(parsed.error);
      continue;
    }
    rows.push({ row: r, data: parsed.data });
  }
  return { rows, errors, headerError: null };
}

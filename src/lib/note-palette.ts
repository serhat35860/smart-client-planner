/** Not oluşturma / düzenleme ile kart zemini — tek kaynak hex değerleri. */
export const NOTE_PALETTE = [
  { id: "yellow", hex: "#fff9c4" },
  { id: "blue", hex: "#dbeafe" },
  { id: "green", hex: "#dcfce7" },
  { id: "pink", hex: "#ffe4e6" },
  { id: "orange", hex: "#ffedd5" },
  { id: "purple", hex: "#ede9fe" },
  { id: "gray", hex: "#e2e8f0" }
] as const;

export type NotePaletteId = (typeof NOTE_PALETTE)[number]["id"];

export const NOTE_PALETTE_HEX: Record<string, string> = Object.fromEntries(
  NOTE_PALETTE.map((p) => [p.id, p.hex])
);

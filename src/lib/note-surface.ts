import type { CSSProperties } from "react";
import { NOTE_PALETTE_HEX } from "@/lib/note-palette";

const DEFAULT_HEX = NOTE_PALETTE_HEX.yellow ?? "#fff9c4";

/** Oluşturma paleti (`note-palette`) ve özel #hex ile kart/düğme zemini. */
export function noteSurfaceBgStyle(color: string): CSSProperties {
  const c = color.trim();
  if (c.startsWith("#")) return { backgroundColor: c };
  const hex = NOTE_PALETTE_HEX[c];
  return { backgroundColor: hex ?? DEFAULT_HEX };
}

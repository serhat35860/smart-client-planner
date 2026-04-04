"use client";

import { useTranslation } from "react-i18next";

export const NOTE_PALETTE = [
  { id: "yellow", hex: "#fff9c4" },
  { id: "blue", hex: "#dbeafe" },
  { id: "green", hex: "#dcfce7" },
  { id: "pink", hex: "#ffe4e6" },
  { id: "orange", hex: "#ffedd5" },
  { id: "purple", hex: "#ede9fe" },
  { id: "gray", hex: "#e2e8f0" }
] as const;

type Props = {
  color: string;
  setColor: (v: string) => void;
  customColor: string;
  setCustomColor: (v: string) => void;
};

export function NoteBackgroundPicker({ color, setColor, customColor, setCustomColor }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2">
      <p className="mb-2 text-xs text-slate-600">{t("note_background")}</p>
      <div className="mb-2 flex flex-wrap gap-2">
        {NOTE_PALETTE.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setColor(item.id)}
            className={`h-7 w-7 rounded-full border-2 ${color === item.id ? "border-slate-900" : "border-transparent"}`}
            style={{ backgroundColor: item.hex }}
            aria-label={item.id}
          />
        ))}
        <button
          type="button"
          onClick={() => setColor(customColor)}
          className={`h-7 w-7 rounded-full border-2 ${color === customColor ? "border-slate-900" : "border-transparent"}`}
          style={{ backgroundColor: customColor }}
          aria-label={t("custom_color")}
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">{t("custom_color")}</span>
        <input
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            setColor(e.target.value);
          }}
          className="h-8 w-10 rounded border border-slate-200 p-1"
        />
      </div>
    </div>
  );
}

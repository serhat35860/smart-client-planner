"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type MentionCandidate = { userId: string; label: string };

type Props = {
  textValue: string;
  onTextChange: (v: string) => void;
  mentionLabel: string | null;
  onPickMention: (userId: string, label: string) => void;
  onClearMention: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  /** Aynı sayfada birden fazla combo için benzersiz id. */
  listboxId?: string;
  /** i18n: chip altı kısa açıklama (örn. search_mention_filter_hint). */
  chipHintKey?: string;
  autoFocus?: boolean;
};

export function MentionAtCombo({
  textValue,
  onTextChange,
  mentionLabel,
  onPickMention,
  onClearMention,
  placeholder,
  className,
  inputClassName,
  disabled,
  listboxId = "mention-at-combo-list",
  chipHintKey = "search_mention_filter_hint",
  autoFocus
}: Props) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MentionCandidate[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/workspace/mention-candidates")
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d: { members?: MentionCandidate[] }) => {
        if (!cancelled) setMembers(Array.isArray(d.members) ? d.members : []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mentionNeedle = textValue.startsWith("@") ? textValue.slice(1).trim().toLowerCase() : "";
  const filteredMembers = textValue.startsWith("@")
    ? members.filter((m) => m.label.toLowerCase().includes(mentionNeedle))
    : [];

  useEffect(() => {
    setMenuOpen(textValue.startsWith("@"));
    setActiveIdx(0);
  }, [textValue]);

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  function pickMember(m: MentionCandidate) {
    onPickMention(m.userId, m.label);
    onTextChange("");
    setMenuOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!menuOpen || filteredMembers.length === 0) {
      if (e.key === "Escape") setMenuOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pickMember(filteredMembers[activeIdx]!);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setMenuOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      {mentionLabel ? (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-sm text-slate-800">
            @{mentionLabel}
            <span className="text-xs text-slate-500">({t(chipHintKey)})</span>
            <button
              type="button"
              onClick={onClearMention}
              className="rounded-full p-0.5 text-slate-600 hover:bg-slate-200"
              aria-label={t("search_clear_mention")}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </span>
        </div>
      ) : null}
      <input
        ref={inputRef}
        type="search"
        value={textValue}
        disabled={disabled}
        autoFocus={autoFocus}
        onChange={(e) => onTextChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn("w-full", inputClassName)}
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? listboxId : undefined}
        aria-autocomplete="list"
        role="combobox"
      />
      {menuOpen && filteredMembers.length > 0 ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={t("search_mention_list_label")}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {filteredMembers.map((m, i) => (
            <li key={m.userId} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === activeIdx}
                className={cn(
                  "flex w-full px-3 py-2 text-left text-sm",
                  i === activeIdx ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                )}
                onMouseEnter={() => setActiveIdx(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickMember(m)}
              >
                @{m.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {menuOpen && textValue.startsWith("@") && filteredMembers.length === 0 && members.length > 0 ? (
        <p className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-lg">
          {t("search_mention_no_match")}
        </p>
      ) : null}
    </div>
  );
}

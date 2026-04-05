"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type MentionCandidate = { userId: string; label: string };

export function NoteMemberPicker({
  value,
  onChange,
  labelClassName
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  labelClassName?: string;
}) {
  const { t } = useTranslation();
  const [members, setMembers] = useState<MentionCandidate[]>([]);

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

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((x) => x !== id));
    else onChange([...value, id]);
  }

  if (members.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className={cn("text-xs font-semibold text-slate-900", labelClassName)}>{t("note_tag_people")}</span>
      <div className="flex flex-wrap gap-2">
        {members.map((m) => {
          const on = value.includes(m.userId);
          return (
            <button
              key={m.userId}
              type="button"
              onClick={() => toggle(m.userId)}
              className={cnChip(on)}
            >
              @{m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cnChip(on: boolean) {
  return on
    ? "rounded-full border border-slate-900 bg-slate-900 px-2.5 py-1 text-xs text-white"
    : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50";
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MentionAtCombo } from "@/components/mention-at-combo";

type MentionCandidate = { userId: string; label: string };

export function ClientsFiltersForm({
  initialQ,
  initialStatus,
  initialMentionUserId,
  selectedClientId
}: {
  initialQ: string;
  initialStatus: string;
  initialMentionUserId: string | null;
  selectedClientId?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState(initialStatus);
  const [mentionUserId, setMentionUserId] = useState<string | null>(initialMentionUserId);
  const [mentionLabel, setMentionLabel] = useState<string | null>(null);

  useEffect(() => {
    setQ(initialQ);
    setStatus(initialStatus);
    setMentionUserId(initialMentionUserId);
  }, [initialQ, initialStatus, initialMentionUserId]);

  useEffect(() => {
    if (!initialMentionUserId) {
      setMentionLabel(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/workspace/mention-candidates")
      .then((r) => (r.ok ? r.json() : { members: [] }))
      .then((d: { members?: MentionCandidate[] }) => {
        if (cancelled) return;
        const m = (d.members ?? []).find((x) => x.userId === initialMentionUserId);
        setMentionLabel(m?.label ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [initialMentionUserId]);

  function apply(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status && status !== "ALL") p.set("status", status);
    if (mentionUserId) p.set("mentionedUserId", mentionUserId);
    if (selectedClientId) p.set("clientId", selectedClientId);
    router.push(`/clients?${p.toString()}`);
    router.refresh();
  }

  return (
    <form onSubmit={apply} className="mb-3 shrink-0 space-y-2">
      <MentionAtCombo
        listboxId="clients-filter-mention-list"
        textValue={q}
        onTextChange={setQ}
        mentionLabel={mentionLabel}
        onPickMention={(id, label) => {
          setMentionUserId(id);
          setMentionLabel(label);
          setQ("");
        }}
        onClearMention={() => {
          setMentionUserId(null);
          setMentionLabel(null);
        }}
        placeholder={t("search_clients_placeholder")}
        chipHintKey="search_mention_filter_hint_clients_list"
      />
      <div className="flex gap-2">
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-full">
          <option value="ALL">{t("all_statuses")}</option>
          <option value="ACTIVE">{t("active")}</option>
          <option value="PASSIVE">{t("passive")}</option>
          <option value="POTENTIAL">{t("potential")}</option>
        </select>
        <button
          type="submit"
          className="shrink-0 rounded-xl px-3 py-2 text-sm text-[var(--ui-accent-contrast)]"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {t("filter")}
        </button>
      </div>
    </form>
  );
}

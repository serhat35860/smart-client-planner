"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { MentionAtCombo } from "@/components/mention-at-combo";

type MentionCandidate = { userId: string; label: string };

export function ClientNotesFilterForm({
  clientId,
  initialQ,
  initialTag,
  initialMentionUserId
}: {
  clientId: string;
  initialQ: string;
  initialTag: string;
  initialMentionUserId: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [tag, setTag] = useState(initialTag);
  const [mentionUserId, setMentionUserId] = useState<string | null>(initialMentionUserId);
  const [mentionLabel, setMentionLabel] = useState<string | null>(null);
  const [mentionDraft, setMentionDraft] = useState("");

  useEffect(() => {
    setQ(initialQ);
    setTag(initialTag);
    setMentionUserId(initialMentionUserId);
  }, [initialQ, initialTag, initialMentionUserId]);

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
    if (tag.trim()) p.set("tag", tag.trim());
    if (mentionUserId) p.set("mentionedUserId", mentionUserId);
    router.push(`/clients/${clientId}?${p.toString()}`);
    router.refresh();
  }

  return (
    <form onSubmit={apply} className="my-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("keyword_filter")}
        className="w-full"
      />
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        placeholder={t("tag_filter")}
        className="w-full"
      />
      <div className="sm:col-span-2">
        <MentionAtCombo
          listboxId={`client-notes-mention-${clientId}`}
          textValue={mentionDraft}
          onTextChange={setMentionDraft}
          mentionLabel={mentionLabel}
          onPickMention={(id, label) => {
            setMentionUserId(id);
            setMentionLabel(label);
            setMentionDraft("");
          }}
          onClearMention={() => {
            setMentionUserId(null);
            setMentionLabel(null);
          }}
          placeholder={t("notes_filter_mention_placeholder")}
          chipHintKey="search_mention_filter_hint_notes_on_client"
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <button
          type="submit"
          className="rounded-xl px-4 py-2 text-sm text-[var(--ui-accent-contrast)]"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {t("filter")}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CreatorPreview } from "@/lib/creator-preview";
import { MentionAtCombo } from "@/components/mention-at-combo";
import { cn } from "@/lib/utils";

export type GlobalSearchResult = {
  clients: Array<{ id: string; companyName: string; createdBy: CreatorPreview | null }>;
  notes: Array<{
    id: string;
    title: string | null;
    content: string;
    client: { id: string; companyName: string } | null;
    createdBy: CreatorPreview | null;
    updatedBy: CreatorPreview | null;
    editedByOtherMember: boolean;
  }>;
};

export function GlobalSearchField({
  onResults,
  className
}: {
  onResults: (r: GlobalSearchResult) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [mentionUserId, setMentionUserId] = useState<string | null>(null);
  const [mentionLabel, setMentionLabel] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    if (q.startsWith("@")) {
      onResults({ clients: [], notes: [] });
      return;
    }
    if (!q.trim() && !mentionUserId) {
      onResults({ clients: [], notes: [] });
      return;
    }
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (mentionUserId) params.set("mentionedUserId", mentionUserId);
    const res = await fetch(`/api/search?${params.toString()}`);
    if (res.ok) onResults(await res.json());
  }, [q, mentionUserId, onResults]);

  useEffect(() => {
    const tmr = setTimeout(() => {
      void runSearch();
    }, 280);
    return () => clearTimeout(tmr);
  }, [runSearch]);

  return (
    <MentionAtCombo
      className={cn(className)}
      listboxId="search-mention-listbox"
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
      placeholder={t("search_placeholder")}
      chipHintKey="search_mention_filter_hint"
    />
  );
}

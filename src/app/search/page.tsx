"use client";

import { useState } from "react";
import Link from "next/link";
import { CreatorUpdaterCorner } from "@/components/added-by-line";
import { GlobalSearchField, type GlobalSearchResult } from "@/components/global-search-field";
import { AppShell } from "@/components/shell";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const { t } = useTranslation();
  const [results, setResults] = useState<GlobalSearchResult>({ clients: [], notes: [] });

  return (
    <AppShell>
      <h1 className="mb-3 text-h2 font-semibold">{t("global_search")}</h1>
      <GlobalSearchField onResults={setResults} className="mb-5" />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-theme-card p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">{t("clients")}</h2>
          <div className="space-y-2 text-body">
            {results.clients.map((client) => (
              <div key={client.id} className="relative pb-6">
                <Link className="block hover:underline" href={`/clients/${client.id}`}>
                  {client.companyName}
                </Link>
                <CreatorUpdaterCorner creator={client.createdBy} updatedBy={null} />
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-theme-card p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">{t("notes")}</h2>
          <div className="space-y-2 text-body">
            {results.notes.map((note) => {
              const showUpdatedCorner = Boolean(note.updatedBy && note.editedByOtherMember);
              const noteRowPb =
                showUpdatedCorner && note.createdBy ? "pb-10" : showUpdatedCorner ? "pb-9" : "pb-6";
              return (
                <div key={note.id} className={cn("relative", noteRowPb)}>
                  <Link
                    className="block hover:underline"
                    href={note.client ? `/clients/${note.client.id}` : "/dashboard"}
                  >
                    {note.client ? `${note.client.companyName}: ` : ""}
                    {note.title || note.content.slice(0, 48)}
                  </Link>
                  <CreatorUpdaterCorner
                    creator={note.createdBy}
                    updatedBy={note.updatedBy}
                    editedByOtherMember={note.editedByOtherMember}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

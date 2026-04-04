"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell";
import { useTranslation } from "react-i18next";

type SearchResult = {
  clients: Array<{ id: string; companyName: string }>;
  notes: Array<{ id: string; title: string | null; content: string; client: { id: string; companyName: string } | null }>;
};

export default function SearchPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult>({ clients: [], notes: [] });

  async function search(value: string) {
    setQ(value);
    if (!value.trim()) {
      setResults({ clients: [], notes: [] });
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    if (res.ok) setResults(await res.json());
  }

  return (
    <AppShell>
      <h1 className="mb-3 text-xl font-semibold">{t("global_search")}</h1>
      <input value={q} onChange={(e) => search(e.target.value)} placeholder={t("search_placeholder")} className="mb-5 w-full" />
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">{t("clients")}</h2>
          <div className="space-y-2 text-sm">
            {results.clients.map((client) => (
              <Link className="block hover:underline" key={client.id} href={`/clients/${client.id}`}>
                {client.companyName}
              </Link>
            ))}
          </div>
        </section>
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">{t("notes")}</h2>
          <div className="space-y-2 text-sm">
            {results.notes.map((note) => (
              <Link
                className="block hover:underline"
                key={note.id}
                href={note.client ? `/clients/${note.client.id}` : "/dashboard"}
              >
                {note.client ? `${note.client.companyName}: ` : ""}
                {note.title || note.content.slice(0, 48)}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

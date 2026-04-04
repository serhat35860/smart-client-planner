"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { NewClientForm } from "@/components/new-client-form";
import { cn } from "@/lib/utils";

type ApiClient = {
  id: string;
  companyName: string;
  contactPerson: string;
  status: string;
};

export function TotalClientsMetric({
  title,
  count,
  buttonClassName
}: {
  title: string;
  count: number;
  /** Overrides default shadow-sm on the metric tile. */
  buttonClassName?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) {
      const data = (await res.json()) as ApiClient[];
      setClients(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      void loadClients();
    } else {
      setQuickAdd(false);
      setQ("");
    }
  }, [open, loadClients]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(needle) || c.contactPerson.toLowerCase().includes(needle)
    );
  }, [clients, q]);

  function goToClient(id: string) {
    router.push(`/clients?clientId=${encodeURIComponent(id)}`);
    setOpen(false);
    setQ("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full rounded-2xl bg-white p-5 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)]",
          buttonClassName ?? "shadow-sm"
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <p className="text-sm text-slate-500">{title}</p>
        <p className="mt-2 text-3xl font-semibold">{count}</p>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-picker-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-4">
              <h2 id="client-picker-title" className="text-lg font-semibold">
                {quickAdd ? t("quick_add_client") : t("client_picker_title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {quickAdd ? t("quick_add_client_hint") : t("client_picker_subtitle")}
              </p>
              {quickAdd ? (
                <button
                  type="button"
                  onClick={() => setQuickAdd(false)}
                  className="mt-3 text-sm text-slate-600 underline hover:text-slate-900"
                >
                  ← {t("back_to_client_list")}
                </button>
              ) : (
                <>
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("search_clients_placeholder")}
                    className="mt-3 w-full"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setQuickAdd(true)}
                    className="mt-3 w-full rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    {t("quick_add_client")}
                  </button>
                </>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2">
              {quickAdd ? (
                <div className="p-2">
                  <NewClientForm
                    hideHeading
                    className="shadow-none"
                    onCreated={(c) => {
                      setOpen(false);
                      setQuickAdd(false);
                      setQ("");
                      router.push(`/clients/${c.id}`);
                      router.refresh();
                    }}
                  />
                </div>
              ) : loading ? (
                <p className="p-4 text-center text-sm text-slate-500">{t("loading")}</p>
              ) : filtered.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">{t("no_clients_found")}</p>
              ) : (
                <ul className="space-y-1">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => goToClient(c.id)}
                        className="w-full rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <span className="block font-medium">{c.companyName}</span>
                        <span className="block text-sm text-slate-600">{c.contactPerson}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-slate-200 p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl border px-4 py-2 text-sm"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuickTaskForm } from "@/components/quick-task-form";

type ApiClient = {
  id: string;
  companyName: string;
  contactPerson: string;
};

type Step = "pick" | "task_form";

export function QuickTaskActionModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
  const [selectedClient, setSelectedClient] = useState<ApiClient | null>(null);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/clients");
    if (res.ok) setClients(((await res.json()) as ApiClient[]) ?? []);
    setLoading(false);
  }, []);

  const closeAll = useCallback(() => {
    setOpen(false);
    setStep("pick");
    setSelectedClient(null);
    setQ("");
  }, []);

  useEffect(() => {
    if (open && step === "pick") void loadClients();
  }, [open, step, loadClients]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAll]);

  function openModal() {
    setStep("pick");
    setSelectedClient(null);
    setQ("");
    setOpen(true);
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(needle) || c.contactPerson.toLowerCase().includes(needle)
    );
  }, [clients, q]);

  function onClientPicked(c: ApiClient) {
    setSelectedClient(c);
    setStep("task_form");
  }

  const modalTitle = step === "pick" ? t("pick_client_for_task") : t("quick_task_title");

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-2xl bg-slate-900 p-5 text-left text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <p className="text-sm text-slate-300">{t("quick_action")}</p>
        <p className="mt-1 text-lg font-semibold">{t("add_task_fast")}</p>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-task-modal-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-4">
              <h2 id="quick-task-modal-title" className="text-lg font-semibold">
                {modalTitle}
              </h2>
              {step === "task_form" && selectedClient ? (
                <p className="mt-1 text-sm text-slate-600">
                  {selectedClient.companyName} — {selectedClient.contactPerson}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "pick" ? (
                <div className="space-y-3">
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t("search_clients_placeholder")}
                    className="w-full"
                    autoFocus
                  />
                  {loading ? (
                    <p className="text-center text-sm text-slate-500">{t("loading")}</p>
                  ) : filtered.length === 0 ? (
                    <p className="text-center text-sm text-slate-500">{t("no_clients_found")}</p>
                  ) : (
                    <ul className="space-y-1">
                      {filtered.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => onClientPicked(c)}
                            className="w-full rounded-xl border border-transparent px-3 py-3 text-left hover:border-slate-200 hover:bg-slate-50"
                          >
                            <span className="block font-medium">{c.companyName}</span>
                            <span className="block text-sm text-slate-600">{c.contactPerson}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}

              {step === "task_form" && selectedClient ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setStep("pick");
                    }}
                    className="text-sm text-slate-600 hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <QuickTaskForm
                    clientId={selectedClient.id}
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
                </div>
              ) : null}
            </div>

            {step === "pick" ? (
              <div className="border-t border-slate-200 p-3">
                <button type="button" onClick={closeAll} className="w-full rounded-xl border px-4 py-2 text-sm">
                  {t("cancel")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

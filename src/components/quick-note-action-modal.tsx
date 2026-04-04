"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuickNoteForm } from "@/components/quick-note-form";
import { QuickTaskForm } from "@/components/quick-task-form";

type ApiClient = {
  id: string;
  companyName: string;
  contactPerson: string;
};

type Step =
  | "menu"
  | "pick"
  | "note"
  | "standalone"
  | "reminder_choose"
  | "reminder_standalone"
  | "reminder_note"
  | "task_form";

type PickMode = "note" | "reminder" | "task";

export function QuickNoteActionModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("menu");
  const [pickMode, setPickMode] = useState<PickMode>("note");
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
  }, [open]);

  function closeAll() {
    setOpen(false);
    setStep("menu");
    setPickMode("note");
    setSelectedClient(null);
    setQ("");
  }

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return clients;
    return clients.filter(
      (c) =>
        c.companyName.toLowerCase().includes(needle) || c.contactPerson.toLowerCase().includes(needle)
    );
  }, [clients, q]);

  function openModal() {
    setStep("menu");
    setPickMode("note");
    setSelectedClient(null);
    setQ("");
    setOpen(true);
  }

  function goPick(mode: PickMode) {
    setPickMode(mode);
    setSelectedClient(null);
    setQ("");
    setStep("pick");
  }

  function onClientPicked(c: ApiClient) {
    setSelectedClient(c);
    if (pickMode === "note") setStep("note");
    else if (pickMode === "reminder") setStep("reminder_note");
    else setStep("task_form");
  }

  function backFromPick() {
    setSelectedClient(null);
    setQ("");
    if (pickMode === "reminder") setStep("reminder_choose");
    else setStep("menu");
  }

  const hideModalFooterCancel =
    step === "note" ||
    step === "reminder_note" ||
    step === "task_form" ||
    step === "standalone" ||
    step === "reminder_standalone";

  const modalTitle =
    step === "menu"
      ? t("quick_note_modal_title")
      : step === "pick"
        ? pickMode === "note"
          ? t("pick_client_for_quick_note")
          : pickMode === "reminder"
            ? t("pick_client_for_reminder")
            : t("pick_client_for_task")
        : step === "standalone"
          ? t("quick_note_standalone_title")
          : step === "reminder_choose"
            ? t("quick_option_reminder")
            : step === "reminder_standalone"
              ? t("reminder_standalone_title")
              : step === "reminder_note"
                ? t("reminder_for_client_title")
                : step === "note"
                  ? t("quick_note_for_client_title")
                  : step === "task_form"
                    ? t("quick_task_title")
                    : t("quick_note_modal_title");

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full rounded-2xl bg-slate-900 p-5 text-left text-white shadow-card-lift-dark transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      >
        <p className="text-sm text-slate-300">{t("quick_action")}</p>
        <p className="mt-1 text-lg font-semibold">{t("add_note_fast")}</p>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-note-modal-title"
        >
          <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-4">
              <h2 id="quick-note-modal-title" className="text-lg font-semibold">
                {modalTitle}
              </h2>
              {(step === "note" || step === "reminder_note" || step === "task_form") && selectedClient ? (
                <p className="mt-1 text-sm text-slate-600">
                  {selectedClient.companyName} — {selectedClient.contactPerson}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "menu" ? (
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => goPick("note")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("quick_note_option_client")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("quick_note_option_client_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("standalone")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("quick_note_option_full")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("quick_note_option_full_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("reminder_choose")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("quick_option_reminder")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("quick_option_reminder_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => goPick("task")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("quick_option_task")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("quick_option_task_desc")}</p>
                  </button>
                </div>
              ) : null}

              {step === "reminder_choose" ? (
                <div className="grid gap-3">
                  <button type="button" onClick={() => setStep("menu")} className="text-left text-sm text-slate-600 hover:underline">
                    ← {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => goPick("reminder")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("reminder_with_client")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("reminder_with_client_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("reminder_standalone")}
                    className="rounded-2xl border-2 border-slate-200 p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-900">{t("reminder_standalone_short")}</p>
                    <p className="mt-1 text-sm text-slate-600">{t("reminder_standalone_short_desc")}</p>
                  </button>
                </div>
              ) : null}

              {step === "pick" ? (
                <div className="space-y-3">
                  <button type="button" onClick={backFromPick} className="text-sm text-slate-600 hover:underline">
                    ← {t("back")}
                  </button>
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

              {step === "note" && selectedClient ? (
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
                  <QuickNoteForm
                    clientId={selectedClient.id}
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
                </div>
              ) : null}

              {step === "reminder_note" && selectedClient ? (
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
                  <p className="text-sm text-slate-600">{t("reminder_form_hint")}</p>
                  <QuickNoteForm
                    clientId={selectedClient.id}
                    reminderRequired
                    saveButtonKey="save_reminder"
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
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

              {step === "standalone" ? (
                <div className="space-y-3">
                  <button type="button" onClick={() => setStep("menu")} className="text-sm text-slate-600 hover:underline">
                    ← {t("back")}
                  </button>
                  <p className="text-sm text-slate-600">{t("standalone_note_hint")}</p>
                  <QuickNoteForm
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
                </div>
              ) : null}

              {step === "reminder_standalone" ? (
                <div className="space-y-3">
                  <button type="button" onClick={() => setStep("reminder_choose")} className="text-sm text-slate-600 hover:underline">
                    ← {t("back")}
                  </button>
                  <p className="text-sm text-slate-600">{t("reminder_standalone_hint")}</p>
                  <QuickNoteForm
                    reminderRequired
                    saveButtonKey="save_reminder"
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
                </div>
              ) : null}
            </div>

            {!hideModalFooterCancel ? (
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

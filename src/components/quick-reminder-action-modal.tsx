"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuickNoteForm } from "@/components/quick-note-form";
import { MentionAtCombo } from "@/components/mention-at-combo";
import { useWorkspaceClientsQuery } from "@/hooks/use-workspace-clients-query";

type ApiClient = {
  id: string;
  companyName: string;
  contactPerson: string;
};

type Step = "reminder_choose" | "pick" | "reminder_note" | "reminder_standalone";

export function QuickReminderActionModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("reminder_choose");
  const [selectedClient, setSelectedClient] = useState<ApiClient | null>(null);
  const pickerActive = open && step === "pick";
  const {
    q,
    setQ,
    setMentionUserId,
    setMentionLabel,
    mentionLabel,
    clients,
    loading
  } = useWorkspaceClientsQuery(pickerActive);

  const closeAll = useCallback(() => {
    setOpen(false);
    setStep("reminder_choose");
    setSelectedClient(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAll]);

  function openModal() {
    setStep("reminder_choose");
    setSelectedClient(null);
    setOpen(true);
  }

  function onClientPicked(c: ApiClient) {
    setSelectedClient(c);
    setStep("reminder_note");
  }

  const modalTitle =
    step === "reminder_choose"
      ? t("quick_option_reminder")
      : step === "pick"
        ? t("pick_client_for_reminder")
        : step === "reminder_note"
          ? t("reminder_for_client_title")
          : t("reminder_standalone_title");

  const showFooter = step === "reminder_choose" || step === "pick";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex h-full min-h-[5.25rem] w-full flex-col rounded-2xl bg-theme-primary p-3 text-left text-theme-on-primary transition hover:bg-theme-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-on-primary/50"
      >
        <p className="shrink-0 text-label font-medium uppercase tracking-wide leading-tight text-theme-on-primary/90">{t("quick_action")}</p>
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-end">
          <p className="text-body-lg font-medium uppercase tracking-wide leading-snug text-theme-on-primary">{t("add_reminder_fast")}</p>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-reminder-modal-title"
        >
          <div className="flex max-h-[72vh] w-full max-w-[25.5rem] flex-col overflow-hidden rounded-2xl bg-theme-card shadow-xl">
            <div className="border-b border-theme-border p-4">
              <h2 id="quick-reminder-modal-title" className="text-h3 font-semibold">
                {modalTitle}
              </h2>
              {step === "reminder_note" && selectedClient ? (
                <p className="mt-1 text-body text-theme-muted">
                  {selectedClient.companyName} — {selectedClient.contactPerson}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "reminder_choose" ? (
                <div className="grid gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setStep("pick");
                    }}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className="font-semibold text-theme-text">{t("reminder_with_client")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("reminder_with_client_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("reminder_standalone")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className="font-semibold text-theme-text">{t("reminder_standalone_short")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("reminder_standalone_short_desc")}</p>
                  </button>
                </div>
              ) : null}

              {step === "pick" ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setStep("reminder_choose");
                    }}
                    className="text-body text-theme-muted hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <MentionAtCombo
                    listboxId="quick-reminder-modal-mention-list"
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
                    className="w-full"
                    inputClassName="w-full"
                    autoFocus
                  />
                  {loading ? (
                    <p className="text-center text-body text-theme-muted">{t("loading")}</p>
                  ) : clients.length === 0 ? (
                    <p className="text-center text-body text-theme-muted">{t("no_clients_found")}</p>
                  ) : (
                    <ul className="space-y-1">
                      {clients.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => onClientPicked(c)}
                            className="w-full rounded-xl border border-transparent px-3 py-3 text-left hover:border-theme-border hover:bg-theme-subtle"
                          >
                            <span className="block font-medium">{c.companyName}</span>
                            <span className="block text-body text-theme-muted">{c.contactPerson}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
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
                    className="text-body text-theme-muted hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <p className="text-body text-theme-muted">{t("reminder_form_hint")}</p>
                  <QuickNoteForm
                    clientId={selectedClient.id}
                    reminderRequired
                    saveButtonKey="save_reminder"
                    stickyFooter
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
                  <button
                    type="button"
                    onClick={() => setStep("reminder_choose")}
                    className="text-body text-theme-muted hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <p className="text-body text-theme-muted">{t("reminder_standalone_hint")}</p>
                  <QuickNoteForm
                    reminderRequired
                    saveButtonKey="save_reminder"
                    stickyFooter
                    onCancel={closeAll}
                    onSaved={() => {
                      router.refresh();
                      closeAll();
                    }}
                  />
                </div>
              ) : null}
            </div>

            {showFooter ? (
              <div className="border-t border-theme-border p-3">
                <button type="button" onClick={closeAll} className="w-full rounded-xl border px-4 py-2 text-button font-medium">
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuickNoteForm } from "@/components/quick-note-form";
import { QuickTaskForm } from "@/components/quick-task-form";
import { MentionAtCombo } from "@/components/mention-at-combo";
import { useWorkspaceClientsQuery } from "@/hooks/use-workspace-clients-query";
import { cn } from "@/lib/utils";

const quickNoteModalHeadingClass = "uppercase tracking-wide";

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
  }

  function openModal() {
    setStep("menu");
    setPickMode("note");
    setSelectedClient(null);
    setOpen(true);
  }

  function goPick(mode: PickMode) {
    setPickMode(mode);
    setSelectedClient(null);
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
        className="dash-premium-metric flex h-full min-h-[5.25rem] w-full flex-col bg-theme-primary p-3.5 text-left text-theme-on-primary hover:bg-theme-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-on-primary/50"
      >
        <p className="shrink-0 text-label font-medium uppercase tracking-wide leading-tight text-theme-on-primary/90">{t("quick_action")}</p>
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-end">
          <p className="text-body-lg font-medium uppercase tracking-wide leading-snug text-theme-on-primary">{t("add_note_fast")}</p>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-note-modal-title"
        >
          <div className="flex max-h-[72vh] w-full max-w-[25.5rem] flex-col overflow-hidden rounded-2xl bg-theme-card shadow-xl">
            <div className="border-b border-theme-border p-4">
              <h2 id="quick-note-modal-title" className={cn("text-h3 font-semibold", quickNoteModalHeadingClass)}>
                {modalTitle}
              </h2>
              {(step === "note" || step === "reminder_note" || step === "task_form") && selectedClient ? (
                <p className="mt-1 text-body text-theme-muted">
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
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("quick_note_option_client")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("quick_note_option_client_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("standalone")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("quick_note_option_full")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("quick_note_option_full_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("reminder_choose")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("quick_option_reminder")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("quick_option_reminder_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => goPick("task")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("quick_option_task")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("quick_option_task_desc")}</p>
                  </button>
                </div>
              ) : null}

              {step === "reminder_choose" ? (
                <div className="grid gap-3">
                  <button type="button" onClick={() => setStep("menu")} className="text-left text-body text-theme-muted hover:underline">
                    ← {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={() => goPick("reminder")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("reminder_with_client")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("reminder_with_client_desc")}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("reminder_standalone")}
                    className="rounded-2xl border-2 border-theme-border p-4 text-left transition hover:border-[var(--ui-accent)] hover:bg-theme-subtle"
                  >
                    <p className={cn("font-semibold text-theme-text", quickNoteModalHeadingClass)}>{t("reminder_standalone_short")}</p>
                    <p className="mt-1 text-body text-theme-muted">{t("reminder_standalone_short_desc")}</p>
                  </button>
                </div>
              ) : null}

              {step === "pick" ? (
                <div className="space-y-3">
                  <button type="button" onClick={backFromPick} className="text-body text-theme-muted hover:underline">
                    ← {t("back")}
                  </button>
                  <MentionAtCombo
                    listboxId="quick-note-modal-mention-list"
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

              {step === "note" && selectedClient ? (
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
                  <QuickNoteForm
                    clientId={selectedClient.id}
                    sectionHeadingsClass={quickNoteModalHeadingClass}
                    stickyFooter
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
                    className="text-body text-theme-muted hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <p className="text-body text-theme-muted">{t("reminder_form_hint")}</p>
                  <QuickNoteForm
                    clientId={selectedClient.id}
                    reminderRequired
                    saveButtonKey="save_reminder"
                    sectionHeadingsClass={quickNoteModalHeadingClass}
                    stickyFooter
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
                    className="text-body text-theme-muted hover:underline"
                  >
                    ← {t("back")}
                  </button>
                  <QuickTaskForm
                    clientId={selectedClient.id}
                    sectionHeadingsClass={quickNoteModalHeadingClass}
                    stickyFooter
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
                  <button type="button" onClick={() => setStep("menu")} className="text-body text-theme-muted hover:underline">
                    ← {t("back")}
                  </button>
                  <p className="text-body text-theme-muted">{t("standalone_note_hint")}</p>
                  <QuickNoteForm
                    sectionHeadingsClass={quickNoteModalHeadingClass}
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
                  <button type="button" onClick={() => setStep("reminder_choose")} className="text-body text-theme-muted hover:underline">
                    ← {t("back")}
                  </button>
                  <p className="text-body text-theme-muted">{t("reminder_standalone_hint")}</p>
                  <QuickNoteForm
                    reminderRequired
                    saveButtonKey="save_reminder"
                    sectionHeadingsClass={quickNoteModalHeadingClass}
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

            {!hideModalFooterCancel ? (
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

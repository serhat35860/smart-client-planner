"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuickTaskForm } from "@/components/quick-task-form";
import { MentionAtCombo } from "@/components/mention-at-combo";
import { useWorkspaceClientsQuery } from "@/hooks/use-workspace-clients-query";

type ApiClient = {
  id: string;
  companyName: string;
  contactPerson: string;
};

type Step = "pick" | "task_form";

export function QuickTaskActionModal() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pick");
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
    setStep("pick");
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
    setStep("pick");
    setSelectedClient(null);
    setOpen(true);
  }

  useEffect(() => {
    const shouldAutoOpen = searchParams.get("newTask") === "1";
    if (!shouldAutoOpen || open) return;

    openModal();
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("newTask");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [open, pathname, router, searchParams]);

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
        className="flex h-full min-h-[5.25rem] w-full flex-col rounded-2xl bg-theme-primary p-3 text-left text-theme-on-primary transition hover:bg-theme-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-on-primary/50"
      >
        <p className="shrink-0 text-label font-medium uppercase tracking-wide leading-tight text-theme-on-primary/90">{t("quick_action")}</p>
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-end">
          <p className="text-body-lg font-medium uppercase tracking-wide leading-snug text-theme-on-primary">{t("add_task_fast")}</p>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-task-modal-title"
        >
          <div className="flex h-[72vh] w-full max-w-[25.5rem] flex-col overflow-hidden rounded-2xl bg-theme-card shadow-xl">
            <div className="border-b border-theme-border p-4">
              <h2 id="quick-task-modal-title" className="text-h3 font-semibold">
                {modalTitle}
              </h2>
              {step === "task_form" && selectedClient ? (
                <p className="mt-1 text-body text-theme-muted">
                  {selectedClient.companyName} — {selectedClient.contactPerson}
                </p>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {step === "pick" ? (
                <div className="space-y-3">
                  <MentionAtCombo
                    listboxId="quick-task-modal-mention-list"
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
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClient(null);
                      setStep("task_form");
                    }}
                    className="w-full rounded-xl border border-dashed border-theme-border px-3 py-2 text-left text-body font-medium text-theme-text hover:bg-theme-subtle"
                  >
                    {t("quick_option_task")} ({t("unassigned_note")})
                  </button>
                </div>
              ) : null}

              {step === "task_form" ? (
                <div className="flex h-full min-h-0 flex-col gap-3">
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
                  <div className="min-h-0 flex-1 basis-0 overflow-hidden">
                    <QuickTaskForm
                      clientId={selectedClient?.id ?? null}
                      stickyFooter
                      onCancel={closeAll}
                      onSaved={() => {
                        router.refresh();
                        closeAll();
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {step === "pick" ? (
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

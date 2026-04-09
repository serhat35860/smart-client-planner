"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { NewClientForm } from "@/components/new-client-form";
import { MentionAtCombo } from "@/components/mention-at-combo";
import { useWorkspaceClientsQuery } from "@/hooks/use-workspace-clients-query";
import { cn } from "@/lib/utils";

const clientPickerModalHeadingClass = "uppercase tracking-wide";

export function TotalClientsMetric({
  buttonClassName
}: {
  /** Ek Tailwind sınıfları (ör. özel gölge). */
  buttonClassName?: string;
} = {}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(false);
  const listActive = open && !quickAdd;
  const {
    q,
    setQ,
    setMentionUserId,
    setMentionLabel,
    mentionLabel,
    clients,
    loading
  } = useWorkspaceClientsQuery(listActive);

  useEffect(() => {
    if (!open) setQuickAdd(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function goToClient(id: string) {
    router.push(`/clients?clientId=${encodeURIComponent(id)}`);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "dash-premium-metric flex h-full min-h-[5.25rem] w-full flex-col bg-theme-primary p-3.5 text-left text-theme-on-primary hover:bg-theme-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-on-primary/50",
          buttonClassName
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <p className="shrink-0 text-label font-medium uppercase tracking-wide leading-tight text-theme-on-primary/90">
          {t("total_clients_tile_eyebrow")}
        </p>
        <div className="mt-1 flex min-h-0 flex-1 flex-col justify-end">
          <p className="text-body-lg font-medium uppercase tracking-wide leading-snug text-theme-on-primary">
            {t("total_clients_tile_subtitle")}
          </p>
        </div>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-picker-title"
        >
          <div className="flex max-h-[72vh] w-full max-w-[25.5rem] flex-col overflow-hidden rounded-2xl bg-theme-card shadow-xl">
            <div className="border-b border-theme-border p-4">
              <h2
                id="client-picker-title"
                className={cn("text-h3 font-semibold", clientPickerModalHeadingClass)}
              >
                {quickAdd ? t("quick_add_client") : t("client_picker_title")}
              </h2>
              <p className="mt-1 text-body text-theme-muted">
                {quickAdd ? t("quick_add_client_hint") : t("client_picker_subtitle")}
              </p>
              {quickAdd ? (
                <button
                  type="button"
                  onClick={() => setQuickAdd(false)}
                  className="mt-3 text-body text-theme-muted underline hover:text-theme-text"
                >
                  ← {t("back_to_client_list")}
                </button>
              ) : (
                <>
                  <MentionAtCombo
                    listboxId="total-clients-metric-mention-list"
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
                    className="mt-3 w-full"
                    inputClassName="w-full"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setQuickAdd(true)}
                    className={cn(
                      "mt-3 w-full rounded-xl border border-dashed border-theme-border px-3 py-2.5 text-button font-medium font-medium text-theme-text transition hover:border-theme-primary hover:bg-theme-subtle",
                      clientPickerModalHeadingClass
                    )}
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
                      router.push(`/clients/${c.id}`);
                      router.refresh();
                    }}
                  />
                </div>
              ) : loading ? (
                <p className="p-4 text-center text-body text-theme-muted">{t("loading")}</p>
              ) : clients.length === 0 ? (
                <p className="p-4 text-center text-body text-theme-muted">{t("no_clients_found")}</p>
              ) : (
                <ul className="space-y-1">
                  {clients.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => goToClient(c.id)}
                        className="w-full rounded-xl border border-transparent px-3 py-3 text-left transition hover:border-theme-border hover:bg-theme-subtle"
                      >
                        <span className="block font-medium">{c.companyName}</span>
                        <span className="block text-body text-theme-muted">{c.contactPerson}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-theme-border p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl border px-4 py-2 text-button font-medium"
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

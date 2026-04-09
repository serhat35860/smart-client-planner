"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { NewClientForm } from "@/components/new-client-form";

export function ClientsAddClientPanel({
  preserveQuery,
  preserveStatus,
  preserveMentionedUserId
}: {
  preserveQuery: string;
  preserveStatus: string;
  preserveMentionedUserId?: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function buildClientsUrl(clientId: string) {
    const p = new URLSearchParams();
    p.set("clientId", clientId);
    if (preserveQuery) p.set("q", preserveQuery);
    if (preserveStatus && preserveStatus !== "ALL") p.set("status", preserveStatus);
    if (preserveMentionedUserId) p.set("mentionedUserId", preserveMentionedUserId);
    return `/clients?${p.toString()}`;
  }

  return (
    <>
      <div className="rounded-2xl bg-theme-card p-3 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full rounded-xl px-4 py-3 text-left text-button font-medium text-[var(--ui-accent-contrast)] transition hover:opacity-95 active:opacity-90"
          style={{ backgroundColor: "var(--ui-accent)" }}
        >
          {t("add_client")}
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clients-new-client-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[72vh] w-full max-w-[25.5rem] overflow-y-auto rounded-2xl bg-theme-card p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <h2 id="clients-new-client-title" className="text-h3 font-semibold text-theme-text">
                {t("add_client")}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-theme-muted transition hover:bg-theme-subtle-hover hover:text-theme-text"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            <NewClientForm
              hideHeading
              stickyFooter
              className="rounded-none bg-transparent p-0 shadow-none"
              onCreated={(c) => {
                setOpen(false);
                router.push(buildClientsUrl(c.id));
                router.refresh();
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

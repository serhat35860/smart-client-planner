"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  mailtoContactUrl,
  phoneDigitsOnly,
  whatsAppDesktopUrl,
  whatsAppWebUrl
} from "@/lib/client-contact-urls";
import type { AdditionalContact } from "@/lib/client-additional-contacts";
import { cn } from "@/lib/utils";

export function ClientContactLinks({
  contactPerson,
  phone,
  email,
  additionalContacts = [],
  className
}: {
  contactPerson: string;
  phone: string;
  email: string;
  additionalContacts?: AdditionalContact[];
  className?: string;
}) {
  const { t } = useTranslation();
  const [waPickerOpen, setWaPickerOpen] = useState(false);
  const [contactKey, setContactKey] = useState("primary");

  const extrasKey = useMemo(
    () =>
      JSON.stringify(
        additionalContacts.map((c) => ({ n: c.name, p: c.phone, j: c.jobTitle ?? "" }))
      ),
    [additionalContacts]
  );

  useEffect(() => {
    setContactKey("primary");
  }, [contactPerson, phone, extrasKey]);

  const active = useMemo((): { name: string; phone: string; jobTitle?: string } => {
    if (contactKey === "primary") {
      return { name: contactPerson, phone };
    }
    const idx = Number(contactKey.replace("extra-", ""));
    if (!Number.isFinite(idx) || idx < 0 || idx >= additionalContacts.length) {
      return { name: contactPerson, phone };
    }
    const c = additionalContacts[idx];
    return { name: c.name, phone: c.phone ?? "", jobTitle: c.jobTitle };
  }, [contactKey, contactPerson, phone, additionalContacts]);

  const digits = phoneDigitsOnly(active.phone);
  const webHref = whatsAppWebUrl(digits, "");
  const desktopHref = whatsAppDesktopUrl(digits, "");
  const mailHref = mailtoContactUrl(email, "", "");
  const waEnabled = Boolean(digits);
  const hasMultipleContacts = additionalContacts.length > 0;
  const alignEnd = Boolean(className?.includes("justify-end"));

  useEffect(() => {
    if (!waPickerOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setWaPickerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [waPickerOpen]);

  const linkRow = (
    <div
      className={cn(
        className ?? "flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1",
        hasMultipleContacts && "justify-end"
      )}
    >
      <button
        type="button"
        disabled={!waEnabled}
        onClick={() => setWaPickerOpen(true)}
        className="text-body text-theme-success hover:underline disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t("whatsapp")}
      </button>
      <a href={mailHref} className="text-body text-theme-primary hover:underline">
        {t("contact_by_email")}
      </a>
    </div>
  );

  const picker = waPickerOpen ? (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-picker-title"
      onClick={() => setWaPickerOpen(false)}
    >
      <div
        className="relative w-full max-w-[19.2rem] rounded-2xl bg-theme-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="wa-picker-title" className="text-h3 font-semibold text-theme-text">
          {t("client_contact_whatsapp_choose_title")}
        </h2>
        <p className="mt-1 text-body text-theme-muted">{t("client_contact_whatsapp_choose_hint")}</p>
        <div className="mt-4 flex flex-col gap-2">
          <a
            href={webHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setWaPickerOpen(false)}
            className="rounded-xl border border-theme-border bg-theme-card px-4 py-3 text-center text-body font-medium text-theme-text hover:bg-theme-subtle"
          >
            {t("client_contact_whatsapp_open_web")}
          </a>
          <a
            href={desktopHref}
            onClick={() => setWaPickerOpen(false)}
            className="rounded-xl border border-theme-success/40 bg-theme-success-soft px-4 py-3 text-center text-body font-medium text-theme-text hover:bg-theme-success/22"
          >
            {t("client_contact_whatsapp_open_desktop")}
          </a>
        </div>
        <button
          type="button"
          onClick={() => setWaPickerOpen(false)}
          className="mt-3 w-full rounded-xl border border-theme-border px-4 py-2 text-body text-theme-text hover:bg-theme-subtle"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  ) : null;

  if (!hasMultipleContacts) {
    return (
      <>
        {linkRow}
        {picker}
      </>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex w-full max-w-md flex-col gap-2",
          alignEnd ? "ml-auto items-end" : "items-stretch"
        )}
      >
        <label
          className={cn(
            "flex min-w-0 flex-col gap-1",
            alignEnd ? "w-full sm:w-64 sm:max-w-[16rem]" : "w-full max-w-md"
          )}
        >
          <span className="text-xs font-medium text-theme-muted">{t("client_contact_pick_person")}</span>
          <select
            value={contactKey}
            onChange={(e) => setContactKey(e.target.value)}
            className="w-full rounded-lg border border-theme-border bg-theme-card px-2 py-1.5 text-body text-theme-text"
            aria-label={t("client_contact_pick_person")}
          >
            <option value="primary">
              {contactPerson} — {t("client_contact_role_primary")}
            </option>
            {additionalContacts.map((c, i) => (
              <option key={`${c.name}-${i}`} value={`extra-${i}`}>
                {c.jobTitle ? `${c.name} — ${c.jobTitle}` : c.name}
              </option>
            ))}
          </select>
        </label>
        {active.jobTitle?.trim() ? (
          <p
            className={cn(
              "w-full text-xs text-theme-muted",
              alignEnd ? "text-right sm:max-w-[16rem]" : "text-left"
            )}
          >
            {active.jobTitle}
          </p>
        ) : null}
        {active.phone.trim() ? (
          <p
            className={cn(
              "w-full text-xs text-theme-muted",
              alignEnd ? "text-right sm:max-w-[16rem]" : "text-left"
            )}
          >
            {active.name}: {active.phone}
          </p>
        ) : null}
        {linkRow}
      </div>
      {picker}
    </>
  );
}

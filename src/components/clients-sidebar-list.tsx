"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Phone } from "lucide-react";
import { AddedByLine } from "@/components/added-by-line";
import {
  mailtoContactUrl,
  phoneDigitsOnly,
  whatsAppDesktopUrl
} from "@/lib/client-contact-urls";
import type { CreatorPreview } from "@/lib/creator-preview";
import type { AdditionalContact } from "@/lib/client-additional-contacts";
import { defaultLanguage, isSupportedLanguage } from "@/i18n/settings";

export type ClientSidebarItem = {
  id: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  sector: string | null;
  generalNotes: string | null;
  status: "ACTIVE" | "PASSIVE" | "POTENTIAL";
  notesCount: number;
  createdBy?: CreatorPreview | null;
  additionalContacts?: AdditionalContact[];
};

function buildListHref(
  clientId: string,
  query: string,
  statusFilter: string,
  mentionedUserId: string | null | undefined
) {
  const q = query ? `&q=${encodeURIComponent(query)}` : "";
  const st = statusFilter ? `&status=${statusFilter}` : "";
  const m = mentionedUserId ? `&mentionedUserId=${encodeURIComponent(mentionedUserId)}` : "";
  return `/clients?clientId=${clientId}${q}${st}${m}`;
}

function telUrl(phone: string) {
  const d = phoneDigitsOnly(phone);
  if (!d) return "";
  return `tel:${d}`;
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function ContactIconLink({
  href,
  label,
  disabled,
  className,
  children
}: {
  href: string;
  label: string;
  disabled?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  if (disabled || !href || href === "#") {
    return (
      <span
        role="link"
        aria-disabled="true"
        aria-label={label}
        className={`inline-flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full opacity-40 ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      aria-label={label}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </a>
  );
}

function ContactIconButton({
  label,
  disabled,
  className,
  onClick,
  children
}: {
  label: string;
  disabled?: boolean;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  if (disabled) {
    return (
      <span
        role="button"
        aria-disabled="true"
        aria-label={label}
        className={`inline-flex h-12 w-12 cursor-not-allowed items-center justify-center rounded-full opacity-40 ${className}`}
      >
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] focus-visible:ring-offset-2 ${className}`}
    >
      {children}
    </button>
  );
}

function buildCallableTargets(detail: ClientSidebarItem): { name: string; phone: string }[] {
  const rows = [
    { name: detail.contactPerson, phone: detail.phone },
    ...(detail.additionalContacts ?? []).map((c) => ({ name: c.name, phone: c.phone }))
  ];
  return rows.filter((r) => phoneDigitsOnly(r.phone).length > 0);
}

export function ClientsSidebarList({
  clients,
  selectedClientId,
  query,
  statusFilter,
  mentionedUserId,
  rowStyle = "card"
}: {
  clients: ClientSidebarItem[];
  selectedClientId: string | undefined;
  query: string;
  statusFilter: string;
  mentionedUserId?: string | null;
  /** `button`: tam genişlik dikdörtgen satırlar (müşteriler paneli). */
  rowStyle?: "card" | "button";
}) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [detail, setDetail] = useState<ClientSidebarItem | null>(null);
  const [contactPickOpen, setContactPickOpen] = useState(false);
  const [contactPickKind, setContactPickKind] = useState<"tel" | "whatsapp">("tel");
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (!detail && !contactPickOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (contactPickOpen) {
        setContactPickOpen(false);
        return;
      }
      if (detail) setDetail(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, contactPickOpen]);

  useEffect(() => {
    setContactPickOpen(false);
  }, [detail?.id]);

  function scheduleNavigate(href: string) {
    clearTimer();
    clickTimer.current = setTimeout(() => {
      router.push(href);
      clickTimer.current = null;
    }, 280);
  }

  function onRowDoubleClick(e: React.MouseEvent, client: ClientSidebarItem) {
    e.preventDefault();
    clearTimer();
    setDetail(client);
  }

  const activeLang = i18n.resolvedLanguage || i18n.language;
  const modalHtmlLang = isSupportedLanguage(activeLang) ? activeLang : defaultLanguage;

  const phoneTargets = useMemo(() => (detail ? buildCallableTargets(detail) : []), [detail]);

  const detailMail =
    detail &&
    (() => ({
      mail: mailtoContactUrl(detail.email, "", ""),
      hasEmail: Boolean(detail.email.trim())
    }))();

  const hasCallablePhone = phoneTargets.length > 0;
  const needsContactPick = phoneTargets.length > 1;
  const singleTarget = phoneTargets.length === 1 ? phoneTargets[0] : null;
  const singleWaHref = singleTarget && whatsAppDesktopUrl(phoneDigitsOnly(singleTarget.phone), "");

  return (
    <>
      <div className={rowStyle === "button" ? "flex flex-col gap-2" : "space-y-2"}>
        {clients.map((client) => {
          const active = client.id === selectedClientId;
          const href = buildListHref(client.id, query, statusFilter, mentionedUserId);
          const isBtn = rowStyle === "button";
          return (
            <div
              key={client.id}
              role="button"
              tabIndex={0}
              onClick={() => scheduleNavigate(href)}
              onDoubleClick={(e) => onRowDoubleClick(e, client)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  scheduleNavigate(href);
                }
              }}
              title={t("double_click_client_details")}
              className={
                isBtn
                  ? `relative w-full cursor-pointer rounded-xl border-2 px-4 py-3 pb-8 text-left transition outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] ${
                      active
                        ? "border-[var(--ui-accent)] bg-theme-subtle shadow-sm"
                        : "border-theme-border bg-theme-card hover:border-theme-border hover:bg-theme-subtle"
                    }`
                  : `relative block w-full cursor-pointer rounded-xl border p-3 pb-8 text-left transition outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[var(--ui-accent)] ${
                      active ? "border-theme-text bg-theme-subtle" : "border-theme-border hover:bg-theme-subtle"
                    }`
              }
            >
              <p className={`font-semibold ${isBtn ? "text-sm" : ""}`}>{client.companyName}</p>
              <p className={`text-theme-muted ${isBtn ? "text-xs" : "text-sm"}`}>
                {client.contactPerson} — {t(client.status.toLowerCase() as "active" | "passive" | "potential")}
              </p>
              <p className="mt-1 text-caption text-theme-muted">
                {client.notesCount} {t("notes").toLowerCase()}
              </p>
              <AddedByLine creator={client.createdBy} position="corner" />
            </div>
          );
        })}
      </div>

      {detail && detailMail ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-theme-text/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-detail-title"
          onClick={() => setDetail(null)}
        >
          <div
            key={modalHtmlLang}
            className="max-h-[72vh] w-full max-w-[22.5rem] overflow-y-auto rounded-2xl bg-theme-card p-5 shadow-xl"
            lang={modalHtmlLang}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="client-detail-title" className="text-h3 font-semibold text-theme-text">
              {t("client_details_modal_title")}
            </h2>
            <div className="relative mt-3 pb-5">
              <p className="text-h2 font-semibold text-theme-text">{detail.companyName}</p>
              <AddedByLine creator={detail.createdBy} position="corner" />
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("contact_person")}</dt>
                <dd className="mt-0.5 text-theme-text">{detail.contactPerson}</dd>
              </div>
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("phone")}</dt>
                <dd className="mt-0.5 text-theme-text">{detail.phone || "—"}</dd>
              </div>
              {detail.additionalContacts && detail.additionalContacts.length > 0 ? (
                <div>
                  <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">
                    {t("client_additional_contacts_heading")}
                  </dt>
                  <dd className="mt-0.5 space-y-1 text-theme-text">
                    {detail.additionalContacts.map((c, i) => (
                      <p key={`${c.name}-${i}`} className="text-sm">
                        {c.name}
                        {c.jobTitle ? ` — ${c.jobTitle}` : ""}
                        <span className="text-theme-muted"> — {c.phone}</span>
                      </p>
                    ))}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("email")}</dt>
                <dd className="mt-0.5 break-all text-theme-text">{detail.email || "—"}</dd>
              </div>
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("sector")}</dt>
                <dd className="mt-0.5 text-theme-text">{detail.sector?.trim() || "—"}</dd>
              </div>
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("status")}</dt>
                <dd className="mt-0.5 text-theme-text">
                  {t(detail.status.toLowerCase() as "active" | "passive" | "potential")}
                </dd>
              </div>
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("notes")}</dt>
                <dd className="mt-0.5 text-theme-text">{detail.notesCount}</dd>
              </div>
              <div>
                <dt className="text-label font-medium uppercase tracking-wide text-theme-muted">{t("general_notes")}</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-theme-text">
                  {detail.generalNotes?.trim() || "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-theme-border pt-4">
              <p className="text-center text-caption font-medium uppercase tracking-wide text-theme-muted">
                {t("client_detail_contact_section")}
              </p>
              <div className="mt-3 flex items-center justify-center gap-6">
                {needsContactPick ? (
                  <ContactIconButton
                    label={t("client_detail_action_call")}
                    disabled={!hasCallablePhone}
                    onClick={() => {
                      setContactPickKind("tel");
                      setContactPickOpen(true);
                    }}
                    className="bg-theme-primary/12 text-theme-primary hover:bg-theme-primary/20"
                  >
                    <Phone className="h-6 w-6" strokeWidth={2} />
                  </ContactIconButton>
                ) : (
                  <ContactIconLink
                    href={singleTarget ? telUrl(singleTarget.phone) : ""}
                    label={t("client_detail_action_call")}
                    disabled={!hasCallablePhone}
                    className="bg-theme-primary/12 text-theme-primary hover:bg-theme-primary/20"
                  >
                    <Phone className="h-6 w-6" strokeWidth={2} />
                  </ContactIconLink>
                )}
                {needsContactPick ? (
                  <ContactIconButton
                    label={t("client_detail_action_whatsapp")}
                    disabled={!hasCallablePhone}
                    onClick={() => {
                      setContactPickKind("whatsapp");
                      setContactPickOpen(true);
                    }}
                    className="bg-theme-success-soft text-theme-success hover:bg-theme-success/22"
                  >
                    <WhatsAppGlyph className="h-6 w-6" />
                  </ContactIconButton>
                ) : (
                  <ContactIconLink
                    href={singleWaHref || "#"}
                    label={t("client_detail_action_whatsapp")}
                    disabled={!hasCallablePhone}
                    className="bg-theme-success-soft text-theme-success hover:bg-theme-success/22"
                  >
                    <WhatsAppGlyph className="h-6 w-6" />
                  </ContactIconLink>
                )}
                <ContactIconLink
                  href={detailMail.mail}
                  label={t("client_detail_action_email")}
                  disabled={!detailMail.hasEmail}
                  className="bg-theme-primary/12 text-theme-primary hover:bg-theme-primary/20"
                >
                  <Mail className="h-6 w-6" strokeWidth={2} />
                </ContactIconLink>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href={`/clients/${detail.id}`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-theme-primary px-4 py-2.5 text-center text-body font-medium text-theme-on-primary hover:bg-theme-primary-hover"
              >
                {t("client_open_edit_page")}
              </Link>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-xl border border-theme-border px-4 py-2.5 text-body text-theme-text hover:bg-theme-subtle"
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {contactPickOpen && detail && hasCallablePhone ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-theme-text/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="client-pick-contact-title"
          onClick={() => setContactPickOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-theme-card p-5 shadow-xl"
            lang={modalHtmlLang}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="client-pick-contact-title" className="text-h3 font-semibold text-theme-text">
              {contactPickKind === "tel"
                ? t("client_pick_contact_phone_title")
                : t("client_pick_contact_whatsapp_title")}
            </h3>
            <p className="mt-1 text-body text-theme-muted">{t("client_pick_contact_hint")}</p>
            <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto">
              {phoneTargets.map((target, i) => {
                const d = phoneDigitsOnly(target.phone);
                const href =
                  contactPickKind === "tel" ? telUrl(target.phone) : whatsAppDesktopUrl(d, "");
                return (
                  <li key={`${target.name}-${i}-${d}`}>
                    <a
                      href={href}
                      onClick={() => setContactPickOpen(false)}
                      className="block rounded-xl border border-theme-border px-4 py-3 text-left text-body transition hover:bg-theme-subtle"
                    >
                      <span className="block font-medium text-theme-text">{target.name}</span>
                      <span className="mt-0.5 block text-theme-muted">{target.phone}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <button
              type="button"
              onClick={() => setContactPickOpen(false)}
              className="mt-4 w-full rounded-xl border border-theme-border px-4 py-2.5 text-body text-theme-text hover:bg-theme-subtle"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}

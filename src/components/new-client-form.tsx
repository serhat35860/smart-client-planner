"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  canAddExtraContact,
  ClientExtraContactRows,
  PrimaryContactWithPlus,
  type ExtraContact
} from "@/components/client-extra-contact-rows";
import { cn } from "@/lib/utils";

export function NewClientForm({
  onSaved,
  onCreated,
  className,
  hideHeading,
  stickyFooter = false
}: {
  onSaved?: () => void;
  onCreated?: (client: { id: string }) => void;
  className?: string;
  hideHeading?: boolean;
  stickyFooter?: boolean;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    phone: "",
    email: "",
    sector: "",
    generalNotes: "",
    status: "POTENTIAL"
  });
  const [extraContacts, setExtraContacts] = useState<ExtraContact[]>([]);
  const [loading, setLoading] = useState(false);

  function addExtraContact() {
    if (!canAddExtraContact(extraContacts.length)) return;
    setExtraContacts((prev) => [...prev, { name: "", phone: "", jobTitle: "" }]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const additionalContacts = extraContacts
      .map((x) => {
        const jt = x.jobTitle.trim();
        return {
          name: x.name.trim(),
          phone: x.phone.trim(),
          ...(jt ? { jobTitle: jt } : {})
        };
      })
      .filter((x) => x.name && x.phone);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        additionalContacts
      })
    });
    setLoading(false);
    if (!res.ok) return;
    const created = (await res.json()) as { id: string };
    setForm({
      companyName: "",
      contactPerson: "",
      phone: "",
      email: "",
      sector: "",
      generalNotes: "",
      status: "POTENTIAL"
    });
    setExtraContacts([]);
    onCreated?.(created);
    onSaved?.();
  }

  return (
    <form
      onSubmit={submit}
      className={cn("rounded-2xl bg-theme-card p-4 shadow-sm", stickyFooter ? "flex h-full min-h-0 flex-col" : "space-y-2", className)}
    >
      <div className={cn(stickyFooter ? "min-h-0 flex-1 space-y-2 overflow-y-auto pr-1" : "space-y-2")}>
        {hideHeading ? null : <h3 className="text-sm font-semibold">{t("add_client")}</h3>}
        <input
          placeholder={t("company_name")}
          value={form.companyName}
          onChange={(e) => setForm({ ...form, companyName: e.target.value })}
          required
        />
        <PrimaryContactWithPlus
          contactPerson={form.contactPerson}
          phone={form.phone}
          onContactPerson={(v) => setForm({ ...form, contactPerson: v })}
          onPhone={(v) => setForm({ ...form, phone: v })}
          onAddExtra={addExtraContact}
          addDisabled={!canAddExtraContact(extraContacts.length)}
        />
        <ClientExtraContactRows contacts={extraContacts} onChange={setExtraContacts} />
        <input placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder={t("sector")} value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
        <textarea
          placeholder={t("general_notes")}
          value={form.generalNotes}
          onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
        />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="ACTIVE">{t("active")}</option>
          <option value="PASSIVE">{t("passive")}</option>
          <option value="POTENTIAL">{t("potential")}</option>
        </select>
      </div>
      <div className={cn(stickyFooter ? "mt-2 shrink-0 border-t border-theme-border pt-3" : "")}>
        <button
          disabled={loading}
          className="w-full rounded-xl bg-theme-primary px-3 py-2 text-button font-medium text-theme-on-primary hover:bg-theme-primary-hover"
        >
          {loading ? t("saving") : t("create_client")}
        </button>
      </div>
    </form>
  );
}

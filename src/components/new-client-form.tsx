"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function NewClientForm({
  onSaved,
  onCreated,
  className,
  hideHeading
}: {
  onSaved?: () => void;
  onCreated?: (client: { id: string }) => void;
  className?: string;
  hideHeading?: boolean;
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
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
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
    onCreated?.(created);
    onSaved?.();
  }

  return (
    <form onSubmit={submit} className={cn("space-y-2 rounded-2xl bg-white p-4 shadow-sm", className)}>
      {hideHeading ? null : <h3 className="text-sm font-semibold">{t("add_client")}</h3>}
      <input
        placeholder={t("company_name")}
        value={form.companyName}
        onChange={(e) => setForm({ ...form, companyName: e.target.value })}
        required
      />
      <input
        placeholder={t("contact_person")}
        value={form.contactPerson}
        onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
        required
      />
      <input placeholder={t("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
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
      <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm text-white hover:bg-slate-700">
        {loading ? t("saving") : t("create_client")}
      </button>
    </form>
  );
}

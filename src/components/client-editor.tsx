"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  client: {
    id: string;
    companyName: string;
    contactPerson: string;
    phone: string;
    email: string;
    sector: string | null;
    generalNotes: string | null;
    status: "ACTIVE" | "PASSIVE" | "POTENTIAL";
  };
};

export function ClientEditor({ client }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    companyName: client.companyName,
    contactPerson: client.contactPerson,
    phone: client.phone,
    email: client.email,
    sector: client.sector ?? "",
    generalNotes: client.generalNotes ?? "",
    status: client.status
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(t("delete_confirm"))) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/clients");
  }

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-4 rounded-2xl bg-white px-4 py-3 shadow-sm">
        <a
          href={`https://wa.me/${client.phone.replace(/[^\d]/g, "")}`}
          className="text-sm text-emerald-700 hover:underline"
        >
          {t("whatsapp")}
        </a>
        <a href={`mailto:${encodeURIComponent(client.email)}`} className="text-sm text-sky-700 hover:underline">
          {t("contact_by_email")}
        </a>
      </div>
      <form onSubmit={save} className="mb-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2">
      <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
      <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} required />
      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
      <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
      <input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} placeholder={t("sector")} />
      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Props["client"]["status"] })}>
        <option value="ACTIVE">{t("active")}</option>
        <option value="PASSIVE">{t("passive")}</option>
        <option value="POTENTIAL">{t("potential")}</option>
      </select>
      <textarea
        className="md:col-span-2"
        value={form.generalNotes}
        onChange={(e) => setForm({ ...form, generalNotes: e.target.value })}
        placeholder={t("general_notes")}
      />
      <div className="flex gap-2 md:col-span-2">
        <button disabled={loading} className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white">
          {loading ? t("saving") : t("save_client")}
        </button>
        <button type="button" onClick={remove} className="rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700">
          {t("delete")}
        </button>
      </div>
    </form>
    </>
  );
}

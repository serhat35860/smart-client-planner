"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddedByLine } from "@/components/added-by-line";
import { ClientContactLinks } from "@/components/client-contact-links";
import {
  canAddExtraContact,
  ClientExtraContactRows,
  PrimaryContactWithPlus,
  type ExtraContact
} from "@/components/client-extra-contact-rows";
import type { CreatorPreview } from "@/lib/creator-preview";
import { parseAdditionalContacts } from "@/lib/client-additional-contacts";
import type { Prisma } from "@prisma/client";

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
    createdBy?: CreatorPreview | null;
    additionalContacts?: Prisma.JsonValue | null;
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
  const [extraContacts, setExtraContacts] = useState<ExtraContact[]>(() =>
    parseAdditionalContacts(client.additionalContacts).map((c) => ({
      name: c.name,
      phone: c.phone,
      jobTitle: c.jobTitle ?? ""
    }))
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const contactsSyncKey = useMemo(
    () => JSON.stringify(parseAdditionalContacts(client.additionalContacts)),
    [client.additionalContacts]
  );

  useEffect(() => {
    setForm({
      companyName: client.companyName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      email: client.email,
      sector: client.sector ?? "",
      generalNotes: client.generalNotes ?? "",
      status: client.status
    });
    setExtraContacts(
      parseAdditionalContacts(client.additionalContacts).map((c) => ({
        name: c.name,
        phone: c.phone,
        jobTitle: c.jobTitle ?? ""
      }))
    );
  }, [client.id, contactsSyncKey, client.companyName, client.contactPerson, client.phone, client.email, client.sector, client.generalNotes, client.status]);

  function addExtraContact() {
    if (!canAddExtraContact(extraContacts.length)) return;
    setExtraContacts((prev) => [...prev, { name: "", phone: "", jobTitle: "" }]);
  }

  async function save(e: React.FormEvent) {
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
    await fetch(`/api/clients/${client.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, additionalContacts })
    });
    setLoading(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(t("delete_confirm"))) return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    router.push("/clients");
  }

  const parsedExtras = parseAdditionalContacts(client.additionalContacts);

  return (
    <>
      <div className="relative mb-3 rounded-2xl bg-white px-4 py-3 pb-8 shadow-sm">
        <ClientContactLinks
          companyName={client.companyName}
          contactPerson={client.contactPerson}
          phone={client.phone}
          email={client.email}
          additionalContacts={parsedExtras}
          className="flex flex-wrap gap-4"
        />
        <AddedByLine creator={client.createdBy} position="corner" />
      </div>
      <form onSubmit={save} className="mb-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2">
        <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} required />
        <div className="md:col-span-2 space-y-2">
          <PrimaryContactWithPlus
            contactPerson={form.contactPerson}
            phone={form.phone}
            onContactPerson={(v) => setForm({ ...form, contactPerson: v })}
            onPhone={(v) => setForm({ ...form, phone: v })}
            onAddExtra={addExtraContact}
            addDisabled={!canAddExtraContact(extraContacts.length)}
          />
          <ClientExtraContactRows contacts={extraContacts} onChange={setExtraContacts} />
        </div>
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

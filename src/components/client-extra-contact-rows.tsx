"use client";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export type ExtraContact = { name: string; phone: string; jobTitle: string };

const MAX_EXTRA = 20;

export function PrimaryContactWithPlus({
  contactPerson,
  phone,
  onContactPerson,
  onPhone,
  onAddExtra,
  addDisabled
}: {
  contactPerson: string;
  phone: string;
  onContactPerson: (v: string) => void;
  onPhone: (v: string) => void;
  onAddExtra: () => void;
  addDisabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-center gap-2">
        <input
          className="min-w-0 flex-1"
          placeholder={t("contact_person")}
          value={contactPerson}
          onChange={(e) => onContactPerson(e.target.value)}
          required
        />
        <button
          type="button"
          disabled={addDisabled}
          onClick={onAddExtra}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t("client_add_contact_plus")}
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="min-w-0 flex-1"
          placeholder={t("phone")}
          value={phone}
          onChange={(e) => onPhone(e.target.value)}
          required
        />
        <button
          type="button"
          disabled={addDisabled}
          onClick={onAddExtra}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={t("client_add_contact_plus")}
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </>
  );
}

export function ClientExtraContactRows({
  contacts,
  onChange
}: {
  contacts: ExtraContact[];
  onChange: (next: ExtraContact[]) => void;
}) {
  const { t } = useTranslation();

  function remove(i: number) {
    onChange(contacts.filter((_, j) => j !== i));
  }

  function update(i: number, patch: Partial<ExtraContact>) {
    onChange(contacts.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  }

  return (
    <>
      {contacts.map((row, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <div className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1"
              placeholder={t("contact_person")}
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
              aria-label={t("client_remove_extra_contact")}
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <input
            className="w-full"
            placeholder={t("client_extra_contact_job_title")}
            value={row.jobTitle}
            onChange={(e) => update(i, { jobTitle: e.target.value })}
          />
          <input
            className="w-full"
            placeholder={t("phone")}
            value={row.phone}
            onChange={(e) => update(i, { phone: e.target.value })}
          />
        </div>
      ))}
    </>
  );
}

export function canAddExtraContact(currentExtraCount: number) {
  return currentExtraCount < MAX_EXTRA;
}

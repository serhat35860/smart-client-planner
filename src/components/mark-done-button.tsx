"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function MarkDoneButton({ taskId }: { taskId: string }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  async function complete() {
    setLoading(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" })
    });
    setLoading(false);
    router.refresh();
  }
  return (
    <button onClick={complete} disabled={loading} className="rounded-lg border px-2 py-1 text-xs hover:bg-slate-50">
      {loading ? t("loading") : t("mark_done")}
    </button>
  );
}

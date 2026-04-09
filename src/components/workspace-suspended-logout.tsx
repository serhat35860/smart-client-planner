"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

export function WorkspaceSuspendedLogout() {
  const { t } = useTranslation();
  const router = useRouter();

  async function out() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      type="button"
      onClick={() => void out()}
      className="rounded-xl border border-theme-border px-4 py-2 text-button font-medium hover:bg-theme-subtle"
    >
      {t("logout")}
    </button>
  );
}

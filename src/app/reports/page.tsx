import type { Metadata } from "next";
import { AppShell } from "@/components/shell";
import { ReportsClient } from "@/components/reports-client";
import { getServerT } from "@/i18n/server";
import { canManageWorkspace, requireWorkspacePage } from "@/lib/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("reports") };
}

export default async function ReportsPage() {
  const ctx = await requireWorkspacePage();
  if (!canManageWorkspace(ctx.role)) {
    return (
      <AppShell>
        <div className="rounded-2xl bg-theme-card p-4 text-body text-theme-muted shadow-sm">Bu alan sadece admin rolüne açık.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ReportsClient />
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/shell";
import { ReportsClient } from "@/components/reports-client";
import { getServerT } from "@/i18n/server";
import { requireWorkspacePage } from "@/lib/workspace";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("reports") };
}

export default async function ReportsPage() {
  await requireWorkspacePage();

  return (
    <AppShell>
      <ReportsClient />
    </AppShell>
  );
}

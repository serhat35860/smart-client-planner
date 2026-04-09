import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/i18n/server";

export default async function JoinPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const sp = await searchParams;
  const token = sp.token?.trim();
  if (!token) redirect("/dashboard");

  const user = await requireUser();
  if (!user) redirect(`/register?invite=${encodeURIComponent(token)}`);

  const { t } = await getServerT();

  return (
    <AppShell>
      <div className="mx-auto max-w-md rounded-2xl bg-theme-card p-6 shadow-sm">
        <h1 className="mb-2">{t("join_title")}</h1>
        <p className="text-body-lg text-theme-muted">{t("join_logged_in_hint")}</p>
        <p className="mt-4 text-body">
          <Link href="/team" className="font-medium text-theme-primary underline">
            {t("team")}
          </Link>
        </p>
      </div>
    </AppShell>
  );
}

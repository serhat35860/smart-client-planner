import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { WorkspaceSuspendedLogout } from "@/components/workspace-suspended-logout";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("team_workspace_suspended_title") };
}

export default async function WorkspaceSuspendedPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const member = await prisma.workspaceMember.findUnique({ where: { userId: user.id } });
  if (!member) redirect("/dashboard");
  if (member.isActive) redirect("/dashboard");

  const { t } = await getServerT();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-h2 font-semibold text-theme-text">{t("team_workspace_suspended_title")}</h1>
      <p className="max-w-md text-body text-theme-muted">{t("team_workspace_suspended_body")}</p>
      <WorkspaceSuspendedLogout />
      <p className="text-xs text-theme-muted">{t("team_workspace_suspended_logout_hint")}</p>
    </div>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell";
import { TeamProfileForm } from "@/components/team-profile-form";
import { TeamCreateMemberForm, TeamInviteSection, TeamMembersModernPanel, TeamRenameForm } from "@/components/team-workspace-panel";
import { requireWorkspacePage, workspaceMembersVisibleWhere } from "@/lib/workspace";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("team") };
}

export default async function TeamPage() {
  const ctx = await requireWorkspacePage();
  const { t } = await getServerT();

  const canInvite = ctx.role === "ADMIN";
  const members = await prisma.workspaceMember.findMany({
    where: canInvite
      ? workspaceMembersVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id)
      : { workspaceId: ctx.workspace.id, userId: ctx.user.id },
    include: { user: { select: { email: true, name: true, username: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <AppShell>
      <h1 className="mb-2 text-h2 font-semibold">{t("team_title")}</h1>
      <p className="mb-6 max-w-2xl text-body text-theme-muted">
        {canInvite ? t("team_intro") : t("team_intro_member")}
      </p>

      <div className="w-full max-w-6xl space-y-6">
        <section className="rounded-2xl bg-theme-card p-5 shadow-sm">
          <h2 className="mb-3 text-label font-semibold text-theme-text">{t("team_workspace_name")}</h2>
          {canInvite ? (
            <TeamRenameForm initialName={ctx.workspace.name} />
          ) : (
            <p className="text-h3 font-medium text-theme-text">{ctx.workspace.name}</p>
          )}
          {!canInvite ? <p className="mt-2 text-xs text-theme-muted">{t("team_owner_only_rename")}</p> : null}
        </section>

        <section className="rounded-2xl bg-theme-card p-5 shadow-sm">
          <h2 className="mb-3 text-label font-semibold text-theme-text">{t("team_profile_heading")}</h2>
          <TeamProfileForm initialName={ctx.user.name} initialEmail={ctx.user.email} />
        </section>

        <section className="rounded-2xl bg-theme-card p-5 shadow-sm">
          <h2 className="mb-3 text-label font-semibold text-theme-text">
            {canInvite ? t("team_members") : t("team_my_membership")}
          </h2>
          <TeamMembersModernPanel
            canManage={canInvite}
            members={members.map((m) => ({
              id: m.id,
              userId: m.userId,
              name: m.user.name,
              email: m.user.email,
              username: m.user.username,
              role: m.role,
              isActive: m.isActive,
              createdAtIso: m.createdAt.toISOString()
            }))}
          />
        </section>

        {canInvite ? (
          <section className="rounded-2xl bg-theme-card p-5 shadow-sm">
            <TeamInviteSection />
            <TeamCreateMemberForm />
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}

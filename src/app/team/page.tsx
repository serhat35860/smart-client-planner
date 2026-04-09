import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell";
import { TeamProfileForm } from "@/components/team-profile-form";
import { TeamCreateMemberForm, TeamInviteSection, TeamRenameForm } from "@/components/team-workspace-panel";
import { TeamMemberOwnerRow } from "@/components/team-member-owner-row";
import { canManageWorkspace, requireWorkspacePage, workspaceMembersVisibleWhere } from "@/lib/workspace";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("team") };
}

export default async function TeamPage() {
  const ctx = await requireWorkspacePage();
  const { t } = await getServerT();

  const canInvite = canManageWorkspace(ctx.role);
  const members = await prisma.workspaceMember.findMany({
    where: workspaceMembersVisibleWhere(ctx.workspace.id, ctx.role, ctx.user.id),
    include: { user: { select: { email: true, name: true, username: true } } },
    orderBy: { createdAt: "asc" }
  });

  return (
    <AppShell>
      <h1 className="mb-2 text-h2 font-semibold">{t("team_title")}</h1>
      <p className="mb-6 max-w-2xl text-body text-theme-muted">
        {canInvite ? t("team_intro") : t("team_intro_member")}
      </p>

      <div className="max-w-2xl space-y-6">
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
          <ul className="divide-y divide-theme-border">
            {canInvite
              ? members.map((m) => (
                  <TeamMemberOwnerRow
                    key={m.id}
                    userId={m.userId}
                    email={m.user.email}
                    username={m.user.username}
                    initialName={m.user.name}
                    role={m.role}
                    initialIsActive={m.isActive}
                  />
                ))
              : members.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-theme-text">{m.user.name?.trim() || m.user.email}</p>
                      <p className="text-xs text-theme-muted">{m.user.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-theme-subtle-hover px-2 py-0.5 text-caption text-theme-text">
                        {m.role === "ADMIN" ? t("team_role_owner") : t("team_role_member")}
                      </span>
                      {!m.isActive ? (
                        <span className="rounded-full bg-theme-warning/15 px-2 py-0.5 text-caption text-theme-text">
                          {t("team_member_status_passive")}
                        </span>
                      ) : null}
                    </div>
                  </li>
                ))}
          </ul>
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

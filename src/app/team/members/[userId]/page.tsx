import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell";
import { TeamMemberAdminEditorForm } from "@/components/team-member-admin-editor-form";
import { canManageWorkspace, requireWorkspacePage } from "@/lib/workspace";
import { getServerT } from "@/i18n/server";

type Props = { params: Promise<{ userId: string }> };

export default async function TeamMemberEditPage({ params }: Props) {
  const ctx = await requireWorkspacePage();
  if (!canManageWorkspace(ctx.role)) notFound();

  const { userId } = await params;
  const { t } = await getServerT();

  const member = await prisma.workspaceMember.findFirst({
    where: { workspaceId: ctx.workspace.id, userId },
    include: { user: { select: { id: true, name: true, email: true, username: true } } }
  });
  if (!member) notFound();

  return (
    <AppShell>
      <div className="max-w-2xl space-y-4">
        <h1 className="text-h2 font-semibold">{t("team_member_edit_title")}</h1>
        <p className="text-body text-theme-muted">{t("team_member_edit_intro")}</p>
        <section className="rounded-2xl bg-theme-card p-5 shadow-sm">
          <TeamMemberAdminEditorForm
            userId={member.user.id}
            initialName={member.user.name}
            initialEmail={member.user.email}
            initialUsername={member.user.username}
            initialRole={member.role}
            initialIsActive={member.isActive}
          />
        </section>
      </div>
    </AppShell>
  );
}

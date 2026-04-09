import type { Prisma, Workspace, WorkspaceRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type WorkspaceContext = {
  user: { id: string; email: string; name: string | null };
  workspace: Workspace;
  role: WorkspaceRole;
};

type ResolveResult =
  | { status: "ok"; ctx: WorkspaceContext }
  | { status: "no_session" }
  | { status: "inactive" };

export function defaultWorkspaceName(user: { email: string; name: string | null }) {
  if (user.name?.trim()) return `${user.name.trim()} workspace`;
  const local = user.email.split("@")[0] ?? "team";
  return `${local} workspace`;
}

async function resolveWorkspace(): Promise<ResolveResult> {
  const user = await requireUser();
  if (!user) return { status: "no_session" };
  const member = await prisma.workspaceMember.findUnique({
    where: { userId: user.id },
    include: { workspace: true }
  });
  if (!member) {
    const workspace = await prisma.workspace.create({
      data: {
        name: defaultWorkspaceName(user),
        members: { create: { userId: user.id, role: "ADMIN", isActive: true } }
      }
    });
    return {
      status: "ok",
      ctx: { user, workspace, role: "ADMIN" }
    };
  }
  if (!member.isActive) return { status: "inactive" };
  return {
    status: "ok",
    ctx: { user, workspace: member.workspace, role: member.role }
  };
}

/** API ve genel kullanım: pasif üye veya oturum yok → `null`. */
export async function requireWorkspace(): Promise<WorkspaceContext | null> {
  const r = await resolveWorkspace();
  if (r.status === "ok") return r.ctx;
  return null;
}

/** Sunucu bileşenleri: pasif üyeyi askı sayfasına yönlendirir. */
export async function requireWorkspacePage(): Promise<WorkspaceContext> {
  const r = await resolveWorkspace();
  if (r.status === "no_session") redirect("/login");
  if (r.status === "inactive") redirect("/workspace-suspended");
  return r.ctx;
}

export function canManageWorkspace(role: WorkspaceRole) {
  return role === "ADMIN";
}

/** Üye listesi sorgusu: sahip tüm üyeleri, diğerleri yalnızca kendisini görür. */
export function workspaceMembersVisibleWhere(
  workspaceId: string,
  role: WorkspaceRole,
  userId: string
): Prisma.WorkspaceMemberWhereInput {
  return role === "ADMIN" ? { workspaceId } : { workspaceId, userId };
}

/** Görev görünürlüğü: admin tümünü, user kendi/etiketli/atanan görevleri görür. */
export function workspaceTasksVisibleWhere(
  workspaceId: string,
  role: WorkspaceRole,
  userId: string
): Prisma.TaskWhereInput {
  return role === "ADMIN"
    ? { workspaceId }
    : {
        workspaceId,
        OR: [{ createdByUserId: userId }, { mentions: { some: { userId } } }, { assigneeUserId: userId }]
      };
}

/** Not görünürlüğü: admin tümünü, user yalnızca etiketlendiği notları görür. */
export function workspaceNotesVisibleWhere(
  workspaceId: string,
  role: WorkspaceRole,
  userId: string
): Prisma.NoteWhereInput {
  return role === "ADMIN"
    ? { workspaceId }
    : {
        workspaceId,
        OR: [{ createdByUserId: userId }, { mentions: { some: { userId } } }]
      };
}

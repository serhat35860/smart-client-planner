import type { WorkspaceRole } from "@prisma/client";

export function isAdminRole(role: WorkspaceRole) {
  return role === "ADMIN" || role === "USER";
}

export function canViewByCreatorOrMention(input: {
  role: WorkspaceRole;
  currentUserId: string;
  createdByUserId: string | null;
  mentionedUserIds: string[];
}) {
  if (isAdminRole(input.role)) return true;
  if (input.createdByUserId && input.createdByUserId === input.currentUserId) return true;
  return input.mentionedUserIds.includes(input.currentUserId);
}

export function canEditOwnedResource(role: WorkspaceRole, createdByUserId: string | null, currentUserId: string) {
  if (isAdminRole(role)) return true;
  return createdByUserId === currentUserId;
}

export function canEditTaskFieldSet(input: {
  role: WorkspaceRole;
  currentUserId: string;
  createdByUserId: string | null;
  wantsStructuralUpdate: boolean;
}) {
  if (isAdminRole(input.role)) return true;
  if (input.createdByUserId === input.currentUserId) return true;
  return !input.wantsStructuralUpdate;
}

/**
 * Canonical audit event names for workspace activity and auth.
 * Use these with `logWorkspaceActivity` / `logAuditEvent` so reports and filters stay stable.
 */
export const AuditEventType = {
  AUTH_LOGIN_SUCCEEDED: "auth.login.succeeded",
  AUTH_LOGIN_FAILED: "auth.login.failed",
  AUTH_LOGIN_RATE_LIMITED: "auth.login.rate_limited",
  AUTH_LOGOUT: "auth.logout",
  AUTH_REGISTER_RATE_LIMITED: "auth.register.rate_limited",
  AUTH_REGISTER_JOINED_WORKSPACE: "auth.register.joined_workspace",
  AUTH_REGISTER_CREATED_WORKSPACE: "auth.register.created_workspace",
  USER_PROFILE_UPDATED: "user.profile_updated",
  USER_PASSWORD_CHANGED: "user.password_changed",
  WORKSPACE_RENAMED: "workspace.renamed",
  WORKSPACE_INVITE_CREATED: "workspace.invite_created",
  WORKSPACE_JOINED: "workspace.joined",
  WORKSPACE_MEMBER_CREATED: "workspace.member_created",
  WORKSPACE_MEMBER_UPDATED: "workspace.member_updated",
  WORKSPACE_MEMBER_DELETED: "workspace.member_deleted",
  CLIENT_CREATED: "client.created",
  CLIENT_UPDATED: "client.updated",
  CLIENT_DELETED: "client.deleted",
  CLIENT_IMPORT_DENIED: "client.import_denied",
  CLIENT_IMPORT_COMPLETED: "client.import_completed",
  CLIENT_EXPORT_DENIED: "client.export_denied",
  CLIENT_EXPORT_COMPLETED: "client.export_completed",
  CLIENT_IMPORT_TEMPLATE_DENIED: "client.import_template_denied",
  CLIENT_IMPORT_TEMPLATE_DOWNLOADED: "client.import_template_downloaded",
  NOTE_CREATED: "note.created",
  NOTE_UPDATED: "note.updated",
  NOTE_DELETED: "note.deleted",
  NOTE_REMINDER_CLEARED: "note.reminder_cleared",
  TASK_CREATED: "task.created",
  TASK_UPDATED: "task.updated"
} as const;

export type AuditEventTypeName = (typeof AuditEventType)[keyof typeof AuditEventType];

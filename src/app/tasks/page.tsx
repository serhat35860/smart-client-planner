import type { Metadata } from "next";
import type { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mapTaskMentions } from "@/lib/creator-preview";
import { taskRowInclude } from "@/lib/task-include";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { parseTaskListFilter } from "@/lib/parse-task-list-filter";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";
import { canManageWorkspace, requireWorkspacePage, workspaceTasksVisibleWhere } from "@/lib/workspace";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { EditableTaskRow } from "@/components/editable-task-row";
import { RepeatCompletedTaskCard } from "@/components/repeat-completed-task-card";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickTaskActionModal } from "@/components/quick-task-action-modal";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("tasks_followups") };
}

const OPEN_TASK_STATUSES: TaskStatus[] = ["PENDING", "FAILED"];

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ taskFilter?: string }>;
}) {
  const ctx = await requireWorkspacePage();
  const ws = ctx.workspace;
  const { t } = await getServerT();
  const sp = await searchParams;
  const listFilter = parseTaskListFilter(sp.taskFilter);
  const canManage = canManageWorkspace(ctx.role);
  const showCompleted = listFilter === "completed";
  const showIncompleteAttention = listFilter === "incomplete";
  const showMine = listFilter === "mine";
  const now = new Date();

  const visibleTaskWhere = workspaceTasksVisibleWhere(ws.id, ctx.role, ctx.user.id);
  const taskWhere =
    showCompleted
      ? { ...visibleTaskWhere, status: "DONE" as const }
      : showMine
        ? {
            ...visibleTaskWhere,
            status: { in: OPEN_TASK_STATUSES },
            OR: [{ createdByUserId: ctx.user.id }, { assigneeUserId: ctx.user.id, acceptedAt: { not: null } }]
          }
      : showIncompleteAttention
        ? { ...pendingAttentionTaskWhere(ws.id, now), ...visibleTaskWhere }
        : { ...visibleTaskWhere, status: { in: OPEN_TASK_STATUSES } };

  const [tasks, activeTasksCounts] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      include: taskRowInclude,
      orderBy: showCompleted ? { updatedAt: "desc" } : { createdAt: "desc" }
    }),
    getActiveTasksCounts(ws.id, ctx.role, ctx.user.id)
  ]);
  const nowMs = Date.now();

  const emptyMessage = showCompleted
    ? t("no_completed_tasks")
    : showIncompleteAttention
      ? t("no_incomplete_tasks")
      : t("no_pending_tasks");

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActiveTasksMetric
          completedCount={activeTasksCounts.completedCount}
          syncTaskListToUrl
          urlTaskListFilter={listFilter}
        />
        {canManage ? <TotalClientsMetric /> : <div />}
        {canManage ? <QuickTaskActionModal /> : <div />}
      </div>

      <h1 className="mb-4 text-h2 font-semibold">{t("tasks_followups")}</h1>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-2xl bg-theme-card p-4 text-body text-theme-muted shadow-card-lift">{emptyMessage}</p>
        ) : showCompleted ? (
          tasks.map((task) => (
            <RepeatCompletedTaskCard
              key={task.id}
              taskId={task.id}
              title={task.title}
              clientName={task.client?.companyName ?? null}
              deadlineIso={task.deadline.toISOString()}
              completedAtIso={task.updatedAt.toISOString()}
              color={task.color}
              priority={task.priority}
              completionNotes={task.completionNotes}
              createdBy={task.createdBy}
              updatedBy={task.updatedBy}
              editedByOtherMember={task.editedByOtherMember}
              mentions={mapTaskMentions(task.mentions)}
            />
          ))
        ) : (
          tasks.map((task) => (
            <EditableTaskRow
              key={task.id}
              nowMs={nowMs}
              task={{
                id: task.id,
                title: task.title,
                deadlineIso: task.deadline.toISOString(),
                priority: task.priority,
                color: task.color,
                notCompletedReason: task.notCompletedReason,
                remindBeforeMinutes: task.remindBeforeMinutes,
                client: task.client
                  ? {
                      id: task.client.id,
                      companyName: task.client.companyName,
                      contactPerson: task.client.contactPerson
                    }
                  : null,
                status: task.status,
                assignee: task.assignee,
                assigneeUserId: task.assigneeUserId,
                acceptedAtIso: task.acceptedAt ? task.acceptedAt.toISOString() : null,
                createdBy: task.createdBy,
                updatedBy: task.updatedBy,
                editedByOtherMember: task.editedByOtherMember,
                mentions: mapTaskMentions(task.mentions)
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

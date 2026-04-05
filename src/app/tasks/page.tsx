import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapTaskMentions } from "@/lib/creator-preview";
import { taskRowInclude } from "@/lib/task-include";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { parseTaskListFilter } from "@/lib/parse-task-list-filter";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";
import { requireWorkspacePage } from "@/lib/workspace";
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
  const showCompleted = listFilter === "completed";
  const showIncompleteAttention = listFilter === "incomplete";
  const now = new Date();

  const taskWhere =
    showCompleted
      ? { workspaceId: ws.id, status: "DONE" as const }
      : showIncompleteAttention
        ? pendingAttentionTaskWhere(ws.id, now)
        : { workspaceId: ws.id, status: "PENDING" as const };

  const [tasks, activeTasksCounts] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      include: taskRowInclude,
      orderBy: showCompleted ? { updatedAt: "desc" } : { createdAt: "desc" }
    }),
    getActiveTasksCounts(ws.id)
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
        <TotalClientsMetric />
        <QuickTaskActionModal />
      </div>

      <h1 className="mb-4 text-xl font-semibold">{t("tasks_followups")}</h1>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{emptyMessage}</p>
        ) : showCompleted ? (
          tasks.map((task) => (
            <RepeatCompletedTaskCard
              key={task.id}
              taskId={task.id}
              title={task.title}
              clientName={task.client.companyName}
              deadlineIso={task.deadline.toISOString()}
              completedAtIso={task.updatedAt.toISOString()}
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
                notCompletedReason: task.notCompletedReason,
                remindBeforeMinutes: task.remindBeforeMinutes,
                client: {
                  id: task.client.id,
                  companyName: task.client.companyName,
                  contactPerson: task.client.contactPerson
                },
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

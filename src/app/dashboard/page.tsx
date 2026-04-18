import type { Metadata } from "next";
import type { TaskStatus } from "@prisma/client";
import Link from "next/link";
import { Bell, CheckCircle2, FileText, ListTodo } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { parseTaskListFilter } from "@/lib/parse-task-list-filter";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";
import { requireWorkspacePage, workspaceNotesVisibleWhere, workspaceTasksVisibleWhere } from "@/lib/workspace";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { EditableNoteCard } from "@/components/editable-note-card";
import { TaskIncompleteReasonBlock, TaskPendingActions } from "@/components/task-pending-actions";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickNoteActionModal } from "@/components/quick-note-action-modal";
import { RepeatCompletedTaskCard } from "@/components/repeat-completed-task-card";
import { TaggedMembersChips } from "@/components/tagged-members-chips";
import { getServerT } from "@/i18n/server";
import { formatDateTime24 } from "@/lib/format-date";
import {
  mapNoteMentions,
  mapNoteTagsToDisplay,
  mapTaskMentions,
  type CreatorPreview
} from "@/lib/creator-preview";
import { noteCardInclude } from "@/lib/note-include";
import { taskRowInclude } from "@/lib/task-include";
import { cn } from "@/lib/utils";
import { CreatorUpdaterCorner } from "@/components/added-by-line";
import { DashboardViewModeToggle } from "@/components/dashboard-view-mode-toggle";
import { DashboardEmptyState } from "@/components/dashboard-empty-state";
import { noteSurfaceBgStyle } from "@/lib/note-surface";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("dashboard") };
}

type CompletedTaskRow = {
  id: string;
  title: string;
  deadline: Date;
  updatedAt: Date;
  priority: "LOW" | "MEDIUM" | "HIGH";
  color: string;
  completionNotes: string | null;
  client: { companyName: string } | null;
  createdBy: CreatorPreview | null;
  updatedBy: CreatorPreview | null;
  editedByOtherMember: boolean;
  mentions: { user: { id: string; name: string | null; email: string } }[];
};

type PendingTaskRow = {
  id: string;
  title: string;
  content: string | null;
  deadline: Date;
  priority: "LOW" | "MEDIUM" | "HIGH";
  color: string;
  notCompletedReason: string | null;
  client: { companyName: string } | null;
  createdBy: CreatorPreview | null;
  updatedBy: CreatorPreview | null;
  editedByOtherMember: boolean;
  mentions: { user: { id: string; name: string | null; email: string } }[];
};

const OPEN_TASK_STATUSES: TaskStatus[] = ["PENDING", "FAILED"];

type DashboardNote = {
  id: string;
  title: string | null;
  content: string;
  createdAt: Date;
  color: string;
  nextActionDate: Date | null;
  remindBeforeMinutes: number | null;
  clientId: string | null;
  client: { companyName: string } | null;
  task: { id: string } | null;
  tags: { tag: { name: string; createdBy: CreatorPreview | null } }[];
  mentions: { user: { id: string; name: string | null; email: string } }[];
  createdBy: CreatorPreview | null;
  updatedBy: CreatorPreview | null;
  editedByOtherMember: boolean;
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ activeTasks?: string; taskFilter?: string; viewMode?: string }>;
}) {
  const ctx = await requireWorkspacePage();
  const { workspace: ws } = ctx;
  const { t, lang } = await getServerT();
  const sp = await searchParams;
  const viewMode: "list" | "table" = sp.viewMode === "table" ? "table" : "list";
  const listFilter = parseTaskListFilter(sp.taskFilter, sp.activeTasks);
  const showExpandedIncomplete = listFilter === "incomplete";
  const showExpandedCompleted = listFilter === "completed";
  const showMine = listFilter === "mine";
  const now = new Date();
  const visibleTaskWhere = workspaceTasksVisibleWhere(ws.id, ctx.role, ctx.user.id);
  const visibleNoteWhere = workspaceNotesVisibleWhere(ws.id, ctx.role, ctx.user.id);

  const [activeTasksCounts, incompleteTasksForList, completedTasksForExpanded] = await Promise.all([
    getActiveTasksCounts(ws.id, ctx.role, ctx.user.id),
      showExpandedIncomplete
        ? prisma.task.findMany({
            where: { ...pendingAttentionTaskWhere(ws.id, now), ...visibleTaskWhere },
            include: taskRowInclude,
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve([] as PendingTaskRow[]),
      showExpandedCompleted
        ? prisma.task.findMany({
            where: { ...visibleTaskWhere, status: "DONE" },
            include: taskRowInclude,
            orderBy: { updatedAt: "desc" }
          })
        : Promise.resolve([] as CompletedTaskRow[])
    ]);

  const pendingWhere =
    listFilter === "incomplete"
      ? { ...pendingAttentionTaskWhere(ws.id, now), ...visibleTaskWhere }
      : showMine
        ? {
            ...visibleTaskWhere,
            status: { in: OPEN_TASK_STATUSES },
            OR: [{ createdByUserId: ctx.user.id }, { assigneeUserId: ctx.user.id, acceptedAt: { not: null } }]
          }
        : { ...visibleTaskWhere, status: { in: OPEN_TASK_STATUSES } };

  const [recentNotes, reminderNotes, pendingTasks, completedTasks] = await Promise.all([
    prisma.note.findMany({
      where: { ...visibleNoteWhere, clientId: null, nextActionDate: null },
      include: {
        ...noteCardInclude,
        client: true
      },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.note.findMany({
      where: { ...visibleNoteWhere, nextActionDate: { not: null } },
      include: {
        ...noteCardInclude,
        client: true
      },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.task.findMany({
      where: pendingWhere,
      include: taskRowInclude,
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.task.findMany({
      where: { ...visibleTaskWhere, status: "DONE" },
      include: taskRowInclude,
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const recent = recentNotes as DashboardNote[];
  const reminders = reminderNotes as DashboardNote[];
  const pending = pendingTasks as PendingTaskRow[];
  const incompleteListed = incompleteTasksForList as PendingTaskRow[];
  const completedExpanded = completedTasksForExpanded as CompletedTaskRow[];
  const doneTasks = completedTasks as CompletedTaskRow[];

  return (
    <AppShell>
      <div className="dashboard-page-root flex flex-col gap-6 md:gap-7">
        <div className="dashboard-cta-bar dashboard-cta-row flex flex-col justify-between gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="min-w-0">
            <p className="text-h3 font-semibold text-theme-text">{t("dashboard_quick_start")}</p>
            <p className="mt-1 text-body leading-relaxed text-theme-muted">{t("dashboard_quick_start_hint")}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2.5 sm:gap-3">
            <Link href="/clients" className="ui-btn-primary">
              {t("dashboard_add_client")}
            </Link>
            <Link href="/tasks?newTask=1" className="ui-btn-secondary">
              {t("dashboard_add_task")}
            </Link>
          </div>
        </div>
        <div className="dashboard-top-metrics-grid grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          <QuickNoteActionModal />
          <TotalClientsMetric />
          <ActiveTasksMetric
            completedCount={activeTasksCounts.completedCount}
            syncTaskListToUrl
            urlTaskListFilter={listFilter}
          />
        </div>
        <DashboardViewModeToggle initialMode={viewMode} />

        {showExpandedIncomplete ? (
          <section className="min-w-0" aria-labelledby="dashboard-incomplete-tasks-heading">
            <h2 id="dashboard-incomplete-tasks-heading" className="mb-4 text-h1 font-semibold text-theme-text">
              {t("incomplete_tasks_list_title")}
            </h2>
            {incompleteListed.length === 0 ? (
              <DashboardEmptyState
                message={t("no_incomplete_tasks")}
                actionHref="/tasks"
                actionLabel={t("empty_cta_add_task")}
                icon="incomplete"
              />
            ) : (
              <div className="w-full space-y-3">
                {incompleteListed.map((task) => {
                const overdue = task.deadline < now;
                const showUpdatedCorner = Boolean(task.updatedBy && task.editedByOtherMember);
                const taskArticlePb =
                  showUpdatedCorner && task.createdBy ? "pb-11" : showUpdatedCorner ? "pb-9" : "pb-7";
                return (
                  <article
                    key={task.id}
                    className={cn("dashboard-task-card relative rounded-2xl bg-theme-card p-3 shadow-card-lift", taskArticlePb)}
                    style={noteSurfaceBgStyle(task.color)}
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
                      <div className="min-w-0">
                        <h3 className="text-h3 font-semibold leading-snug break-words">{task.title}</h3>
                        {task.content?.trim() ? (
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-theme-muted [overflow-wrap:anywhere]">
                            {task.content.trim()}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-caption text-theme-muted">
                          {task.client?.companyName ? `${task.client.companyName} · ` : ""}
                          {formatDateTime24(task.deadline, lang)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {overdue ? (
                          <span className="rounded-full bg-theme-danger-soft px-2 py-0.5 text-caption font-medium text-theme-error">{t("overdue")}</span>
                        ) : null}
                        <TaskPendingActions taskId={task.id} existingReason={task.notCompletedReason} />
                      </div>
                    </div>
                    {task.notCompletedReason ? <TaskIncompleteReasonBlock text={task.notCompletedReason} /> : null}
                    <TaggedMembersChips members={mapTaskMentions(task.mentions)} />
                    <CreatorUpdaterCorner
                      creator={task.createdBy}
                      updatedBy={task.updatedBy}
                      editedByOtherMember={task.editedByOtherMember}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {showExpandedCompleted ? (
        <section className="min-w-0" aria-labelledby="dashboard-completed-tasks-expanded-heading">
          <h2 id="dashboard-completed-tasks-expanded-heading" className="mb-4 text-h1 font-semibold text-theme-text">
            {t("completed_tasks_list")}
          </h2>
          {completedExpanded.length === 0 ? (
            <DashboardEmptyState
              message={t("no_completed_tasks")}
              actionHref="/tasks"
              actionLabel={t("empty_cta_add_task")}
              icon="done"
            />
          ) : (
            <div className="w-full space-y-3">
              {completedExpanded.map((task) => (
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
                  articleClassName="shadow-card-lift"
                  createdBy={task.createdBy}
                  updatedBy={task.updatedBy}
                  editedByOtherMember={task.editedByOtherMember}
                  mentions={mapTaskMentions(task.mentions)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div className="dashboard-main-grid grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 xl:grid-cols-4 xl:gap-7">
        <section
          className="dashboard-panel-shell min-w-0 dash-theme-panel dash-theme-panel--light"
          aria-labelledby="dashboard-standalone-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-center gap-3 pb-3">
            <span className="dash-panel-section-icon" aria-hidden>
              <FileText className="size-5 sm:size-6" strokeWidth={2} />
            </span>
            <h2 id="dashboard-standalone-heading" className="dash-panel-section-title text-theme-text">
              {t("recent_standalone_notes")}
            </h2>
          </div>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <DashboardEmptyState
                message={t("no_standalone_notes_recent")}
                actionHref="/clients"
                actionLabel={t("empty_cta_add_client")}
                icon="notes"
              />
            ) : viewMode === "table" ? (
              <div className="dashboard-table-shell overflow-x-auto rounded-2xl bg-theme-card shadow-card-lift">
                <table className="min-w-full text-body">
                  <thead className="bg-theme-subtle text-label font-medium text-theme-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t("reports_col_title")}</th>
                      <th className="px-3 py-2 text-left">{t("reports_col_date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((note) => (
                      <tr key={note.id} className="border-t border-theme-border">
                        <td className="px-3 py-2">{note.title?.trim() || t("note_no_title")}</td>
                        <td className="px-3 py-2 text-theme-muted">{formatDateTime24(note.createdAt, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              recent.map((note) => (
                <div key={note.id}>
                  <EditableNoteCard
                    noteId={note.id}
                    title={note.title}
                    content={note.content}
                    createdAt={note.createdAt}
                    color={note.color}
                    nextActionDate={note.nextActionDate}
                    remindBeforeMinutes={note.remindBeforeMinutes}
                    tags={mapNoteTagsToDisplay(note.tags)}
                    clientId={note.clientId}
                    hasLinkedTask={!!note.task}
                    surfaceShadowClass="dashboard-note-card-surface"
                    createdBy={note.createdBy}
                    updatedBy={note.updatedBy}
                    editedByOtherMember={note.editedByOtherMember}
                    mentions={mapNoteMentions(note.mentions)}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="dashboard-panel-shell min-w-0 dash-theme-panel"
          aria-labelledby="dashboard-reminders-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="dash-panel-section-icon" aria-hidden>
                <Bell className="size-5 sm:size-6" strokeWidth={2} />
              </span>
              <h2 id="dashboard-reminders-heading" className="dash-panel-section-title min-w-0 text-theme-text">
                {t("reminders")}
              </h2>
            </div>
            <Link href="/reminders" className="dash-theme-panel-link shrink-0 px-2 py-1">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <DashboardEmptyState
                message={t("no_reminders")}
                actionHref="/reminders"
                actionLabel={t("empty_cta_view_reminders")}
                icon="reminders"
              />
            ) : viewMode === "table" ? (
              <div className="dashboard-table-shell overflow-x-auto rounded-2xl bg-theme-card shadow-card-lift">
                <table className="min-w-full text-body">
                  <thead className="bg-theme-subtle text-label font-medium text-theme-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t("reports_col_title")}</th>
                      <th className="px-3 py-2 text-left">{t("reports_col_client")}</th>
                      <th className="px-3 py-2 text-left">{t("reminder_datetime_required")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reminders.map((note) => (
                      <tr key={note.id} className="border-t border-theme-border">
                        <td className="px-3 py-2">{note.title?.trim() || t("note_no_title")}</td>
                        <td className="px-3 py-2">{note.client?.companyName || t("unassigned_note")}</td>
                        <td className="px-3 py-2 text-theme-muted">
                          {note.nextActionDate ? formatDateTime24(note.nextActionDate, lang) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              reminders.map((note) => (
                <div key={note.id}>
                  <EditableNoteCard
                    noteId={note.id}
                    title={note.title}
                    content={note.content}
                    createdAt={note.createdAt}
                    color={note.color}
                    nextActionDate={note.nextActionDate}
                    remindBeforeMinutes={note.remindBeforeMinutes}
                    tags={mapNoteTagsToDisplay(note.tags)}
                    clientId={note.clientId}
                    hasLinkedTask={!!note.task}
                    surfaceShadowClass="dashboard-note-card-surface"
                    createdBy={note.createdBy}
                    updatedBy={note.updatedBy}
                    editedByOtherMember={note.editedByOtherMember}
                    mentions={mapNoteMentions(note.mentions)}
                    clientLine={note.client?.companyName || undefined}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section
          className="dashboard-panel-shell min-w-0 dash-theme-panel dash-theme-panel--strong"
          aria-labelledby="dashboard-tasks-panel-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-center justify-between gap-3 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="dash-panel-section-icon" aria-hidden>
                <ListTodo className="size-5 sm:size-6" strokeWidth={2} />
              </span>
              <h2 id="dashboard-tasks-panel-heading" className="dash-panel-section-title min-w-0 text-theme-text">
                {t("tasks")}
              </h2>
            </div>
            <Link href="/tasks" className="dash-theme-panel-link shrink-0 px-2 py-1">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-3">
            {pending.length === 0 ? (
              <DashboardEmptyState
                message={listFilter === "incomplete" ? t("no_incomplete_tasks") : t("no_pending_tasks")}
                actionHref="/tasks"
                actionLabel={t("empty_cta_add_task")}
                icon="tasks"
              />
            ) : viewMode === "table" ? (
              <div className="dashboard-table-shell overflow-x-auto rounded-2xl bg-theme-card shadow-card-lift">
                <table className="min-w-full text-body">
                  <thead className="bg-theme-subtle text-label font-medium text-theme-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t("reports_col_title")}</th>
                      <th className="px-3 py-2 text-left">{t("reports_col_client")}</th>
                      <th className="px-3 py-2 text-left">{t("task_deadline_label")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pending.map((task) => (
                      <tr key={task.id} className="border-t border-theme-border">
                        <td className="px-3 py-2">{task.title}</td>
                        <td className="px-3 py-2">{task.client?.companyName || "-"}</td>
                        <td className="px-3 py-2 text-theme-muted">{formatDateTime24(task.deadline, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              pending.map((task) => {
                const overdue = task.deadline < now;
                const showUpdatedCorner = Boolean(task.updatedBy && task.editedByOtherMember);
                const taskArticlePb =
                  showUpdatedCorner && task.createdBy ? "pb-11" : showUpdatedCorner ? "pb-9" : "pb-7";
                return (
                  <article
                    key={task.id}
                    className={cn("dashboard-task-card relative rounded-2xl bg-theme-card p-3 shadow-card-lift", taskArticlePb)}
                    style={noteSurfaceBgStyle(task.color)}
                  >
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-2">
                      <div className="min-w-0">
                        <h3 className="text-h3 font-semibold leading-snug break-words">{task.title}</h3>
                        {task.content?.trim() ? (
                          <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm text-theme-muted [overflow-wrap:anywhere]">
                            {task.content.trim()}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-caption text-theme-muted">
                          {task.client?.companyName ? `${task.client.companyName} · ` : ""}
                          {formatDateTime24(task.deadline, lang)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {overdue ? (
                          <span className="rounded-full bg-theme-danger-soft px-2 py-0.5 text-caption font-medium text-theme-error">{t("overdue")}</span>
                        ) : null}
                        <TaskPendingActions taskId={task.id} existingReason={task.notCompletedReason} />
                      </div>
                    </div>
                    {task.notCompletedReason ? (
                      <TaskIncompleteReasonBlock text={task.notCompletedReason} />
                    ) : null}
                    <TaggedMembersChips members={mapTaskMentions(task.mentions)} />
                    <CreatorUpdaterCorner
                      creator={task.createdBy}
                      updatedBy={task.updatedBy}
                      editedByOtherMember={task.editedByOtherMember}
                    />
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section
          className="dashboard-panel-shell min-w-0 dash-theme-panel"
          aria-labelledby="dashboard-completed-panel-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-center gap-3 pb-3">
            <span className="dash-panel-section-icon" aria-hidden>
              <CheckCircle2 className="size-5 sm:size-6" strokeWidth={2} />
            </span>
            <h2 id="dashboard-completed-panel-heading" className="dash-panel-section-title text-theme-text">
              {t("dashboard_completed_tasks")}
            </h2>
          </div>
          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <DashboardEmptyState
                message={t("no_completed_tasks")}
                actionHref="/tasks"
                actionLabel={t("empty_cta_add_task")}
                icon="done"
              />
            ) : viewMode === "table" ? (
              <div className="dashboard-table-shell overflow-x-auto rounded-2xl bg-theme-card shadow-card-lift">
                <table className="min-w-full text-body">
                  <thead className="bg-theme-subtle text-label font-medium text-theme-muted">
                    <tr>
                      <th className="px-3 py-2 text-left">{t("reports_col_title")}</th>
                      <th className="px-3 py-2 text-left">{t("reports_col_client")}</th>
                      <th className="px-3 py-2 text-left">{t("task_completed_on")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doneTasks.map((task) => (
                      <tr key={task.id} className="border-t border-theme-border">
                        <td className="px-3 py-2">{task.title}</td>
                        <td className="px-3 py-2">{task.client?.companyName || "-"}</td>
                        <td className="px-3 py-2 text-theme-muted">{formatDateTime24(task.updatedAt, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              doneTasks.map((task) => (
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
                  articleClassName="shadow-card-lift"
                  createdBy={task.createdBy}
                  updatedBy={task.updatedBy}
                  editedByOtherMember={task.editedByOtherMember}
                  mentions={mapTaskMentions(task.mentions)}
                />
              ))
            )}
          </div>
        </section>
      </div>
      </div>
    </AppShell>
  );
}

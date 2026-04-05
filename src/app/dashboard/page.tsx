import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { parseTaskListFilter } from "@/lib/parse-task-list-filter";
import { pendingAttentionTaskWhere } from "@/lib/pending-attention-tasks";
import { requireWorkspacePage } from "@/lib/workspace";
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

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("dashboard") };
}

type CompletedTaskRow = {
  id: string;
  title: string;
  deadline: Date;
  updatedAt: Date;
  completionNotes: string | null;
  client: { companyName: string };
  createdBy: CreatorPreview | null;
  updatedBy: CreatorPreview | null;
  editedByOtherMember: boolean;
  mentions: { user: { id: string; name: string | null; email: string } }[];
};

type PendingTaskRow = {
  id: string;
  title: string;
  deadline: Date;
  notCompletedReason: string | null;
  client: { companyName: string };
  createdBy: CreatorPreview | null;
  updatedBy: CreatorPreview | null;
  editedByOtherMember: boolean;
  mentions: { user: { id: string; name: string | null; email: string } }[];
};

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
  searchParams: Promise<{ activeTasks?: string; taskFilter?: string }>;
}) {
  const ctx = await requireWorkspacePage();
  const { workspace: ws } = ctx;
  const { t, lang } = await getServerT();
  const sp = await searchParams;
  const listFilter = parseTaskListFilter(sp.taskFilter, sp.activeTasks);
  const showExpandedIncomplete = listFilter === "incomplete";
  const showExpandedCompleted = listFilter === "completed";
  const now = new Date();

  const [activeTasksCounts, incompleteTasksForList, completedTasksForExpanded] = await Promise.all([
    getActiveTasksCounts(ws.id),
      showExpandedIncomplete
        ? prisma.task.findMany({
            where: pendingAttentionTaskWhere(ws.id, now),
            include: taskRowInclude,
            orderBy: { createdAt: "desc" }
          })
        : Promise.resolve([] as PendingTaskRow[]),
      showExpandedCompleted
        ? prisma.task.findMany({
            where: { workspaceId: ws.id, status: "DONE" },
            include: taskRowInclude,
            orderBy: { updatedAt: "desc" }
          })
        : Promise.resolve([] as CompletedTaskRow[])
    ]);

  const pendingColumnWhere =
    listFilter === "incomplete" ? pendingAttentionTaskWhere(ws.id, now) : { workspaceId: ws.id, status: "PENDING" as const };

  const [recentNotes, reminderNotes, pendingTasks, completedTasks] = await Promise.all([
    prisma.note.findMany({
      where: { workspaceId: ws.id, clientId: null, nextActionDate: null },
      include: {
        ...noteCardInclude,
        client: true
      },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.note.findMany({
      where: { workspaceId: ws.id, nextActionDate: { not: null } },
      include: {
        ...noteCardInclude,
        client: true
      },
      orderBy: { createdAt: "desc" },
      take: 3
    }),
    prisma.task.findMany({
      where: pendingColumnWhere,
      include: taskRowInclude,
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.task.findMany({
      where: { workspaceId: ws.id, status: "DONE" },
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
      <div className="mb-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickNoteActionModal />
        <TotalClientsMetric />
        <ActiveTasksMetric
          completedCount={activeTasksCounts.completedCount}
          className="shadow-card-lift"
          syncTaskListToUrl
          urlTaskListFilter={listFilter}
        />
      </div>

      {showExpandedIncomplete ? (
        <section className="mb-8" aria-labelledby="dashboard-incomplete-tasks-heading">
          <h2 id="dashboard-incomplete-tasks-heading" className="mb-3 text-lg font-semibold">
            {t("incomplete_tasks_list_title")}
          </h2>
          {incompleteListed.length === 0 ? (
            <p className="max-w-3xl rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_incomplete_tasks")}</p>
          ) : (
            <div className="max-w-3xl space-y-2">
              {incompleteListed.map((task) => {
                const overdue = task.deadline < now;
                const showUpdatedCorner = Boolean(task.updatedBy && task.editedByOtherMember);
                const taskArticlePb =
                  showUpdatedCorner && task.createdBy ? "pb-11" : showUpdatedCorner ? "pb-9" : "pb-7";
                return (
                  <article
                    key={task.id}
                    className={cn("relative rounded-2xl bg-white p-3 shadow-card-lift", taskArticlePb)}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {task.client.companyName} · {formatDateTime24(task.deadline, lang)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {overdue ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{t("overdue")}</span>
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
        <section className="mb-8" aria-labelledby="dashboard-completed-tasks-expanded-heading">
          <h2 id="dashboard-completed-tasks-expanded-heading" className="mb-3 text-lg font-semibold">
            {t("completed_tasks_list")}
          </h2>
          {completedExpanded.length === 0 ? (
            <p className="max-w-3xl rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_completed_tasks")}</p>
          ) : (
            <div className="max-w-3xl space-y-3">
              {completedExpanded.map((task) => (
                <RepeatCompletedTaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  clientName={task.client.companyName}
                  deadlineIso={task.deadline.toISOString()}
                  completedAtIso={task.updatedAt.toISOString()}
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <section
          className="min-w-0 dash-theme-panel dash-theme-panel--light p-4 md:p-5"
          aria-labelledby="dashboard-standalone-heading"
        >
          <h2
            id="dashboard-standalone-heading"
            className="dash-theme-panel-rule mb-4 pb-3 text-lg font-bold tracking-tight text-slate-900"
          >
            {t("recent_standalone_notes")}
          </h2>
          <div className="space-y-3">
            {recent.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_standalone_notes_recent")}</p>
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
          className="min-w-0 dash-theme-panel p-4 md:p-5"
          aria-labelledby="dashboard-reminders-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-baseline justify-between gap-2 pb-3">
            <h2 id="dashboard-reminders-heading" className="text-lg font-bold tracking-tight text-slate-900">
              {t("reminders")}
            </h2>
            <Link href="/reminders" className="dash-theme-panel-link shrink-0 px-2 py-1 text-xs sm:text-sm">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_reminders")}</p>
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
          className="min-w-0 dash-theme-panel dash-theme-panel--strong p-4 md:p-5"
          aria-labelledby="dashboard-tasks-panel-heading"
        >
          <div className="dash-theme-panel-rule mb-4 flex items-baseline justify-between gap-2 pb-3">
            <h2 id="dashboard-tasks-panel-heading" className="text-lg font-bold tracking-tight text-slate-900">
              {t("tasks")}
            </h2>
            <Link href="/tasks" className="dash-theme-panel-link shrink-0 px-2 py-1 text-xs sm:text-sm">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">
                {listFilter === "incomplete" ? t("no_incomplete_tasks") : t("no_pending_tasks")}
              </p>
            ) : (
              pending.map((task) => {
                const overdue = task.deadline < now;
                const showUpdatedCorner = Boolean(task.updatedBy && task.editedByOtherMember);
                const taskArticlePb =
                  showUpdatedCorner && task.createdBy ? "pb-11" : showUpdatedCorner ? "pb-9" : "pb-7";
                return (
                  <article
                    key={task.id}
                    className={cn("relative rounded-2xl bg-white p-3 shadow-card-lift", taskArticlePb)}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold leading-snug">{task.title}</h3>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {task.client.companyName} · {formatDateTime24(task.deadline, lang)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {overdue ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">{t("overdue")}</span>
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
          className="min-w-0 dash-theme-panel p-4 md:p-5"
          aria-labelledby="dashboard-completed-panel-heading"
        >
          <h2
            id="dashboard-completed-panel-heading"
            className="dash-theme-panel-rule mb-4 pb-3 text-lg font-bold tracking-tight text-slate-900"
          >
            {t("dashboard_completed_tasks")}
          </h2>
          <div className="space-y-3">
            {doneTasks.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_completed_tasks")}</p>
            ) : (
              doneTasks.map((task) => (
                <RepeatCompletedTaskCard
                  key={task.id}
                  taskId={task.id}
                  title={task.title}
                  clientName={task.client.companyName}
                  deadlineIso={task.deadline.toISOString()}
                  completedAtIso={task.updatedAt.toISOString()}
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
    </AppShell>
  );
}

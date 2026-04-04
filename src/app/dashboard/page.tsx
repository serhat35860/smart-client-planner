import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { getPendingFollowupsCountsByPeriod } from "@/lib/followups-counts";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { FollowupsMetric } from "@/components/followups-metric";
import { EditableNoteCard } from "@/components/editable-note-card";
import { TaskIncompleteReasonBlock, TaskPendingActions } from "@/components/task-pending-actions";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickNoteActionModal } from "@/components/quick-note-action-modal";
import { RepeatCompletedTaskCard } from "@/components/repeat-completed-task-card";
import { getServerT } from "@/i18n/server";
import { formatDateTime24 } from "@/lib/format-date";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("dashboard") };
}

type CompletedTaskRow = {
  id: string;
  title: string;
  deadline: Date;
  updatedAt: Date;
  client: { companyName: string };
};

type PendingTaskRow = {
  id: string;
  title: string;
  deadline: Date;
  notCompletedReason: string | null;
  client: { companyName: string };
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
  tags: { tag: { name: string } }[];
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ activeTasks?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { t, lang } = await getServerT();
  const sp = await searchParams;
  const showIncompleteTaskList = sp.activeTasks === "incomplete";

  const [totalClients, activeTasksCounts, followupsCounts, incompleteTasksForList] = await Promise.all([
    prisma.client.count({ where: { userId: user.id } }),
    getActiveTasksCounts(user.id),
    getPendingFollowupsCountsByPeriod(user.id),
    showIncompleteTaskList
      ? prisma.task.findMany({
          where: {
            userId: user.id,
            status: "PENDING",
            notCompletedReason: { not: null }
          },
          include: { client: true },
          orderBy: { createdAt: "desc" }
        })
      : Promise.resolve([] as PendingTaskRow[])
  ]);

  const [recentNotes, reminderNotes, pendingTasks, completedTasks] = await Promise.all([
    prisma.note.findMany({
      where: { userId: user.id, clientId: null, nextActionDate: null },
      include: { tags: { include: { tag: true } }, client: true, task: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.note.findMany({
      where: { userId: user.id, nextActionDate: { not: null } },
      include: { tags: { include: { tag: true } }, client: true, task: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    prisma.task.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 8
    }),
    prisma.task.findMany({
      where: { userId: user.id, status: "DONE" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const recent = recentNotes as DashboardNote[];
  const reminders = reminderNotes as DashboardNote[];
  const pending = pendingTasks as PendingTaskRow[];
  const incompleteListed = incompleteTasksForList as PendingTaskRow[];
  const doneTasks = completedTasks as CompletedTaskRow[];
  const now = new Date();

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TotalClientsMetric title={t("total_clients")} count={totalClients} buttonClassName="shadow-card-lift" />
        <ActiveTasksMetric
          allPendingCount={activeTasksCounts.allPending}
          incompletePendingCount={activeTasksCounts.incompletePending}
          className="shadow-card-lift"
          syncIncompleteListToUrl
          urlTaskFilter={showIncompleteTaskList ? "incomplete" : "all"}
        />
        <FollowupsMetric
          dailyCount={followupsCounts.daily}
          weeklyCount={followupsCounts.weekly}
          monthlyCount={followupsCounts.monthly}
          className="shadow-card-lift"
        />
        <QuickNoteActionModal />
      </div>

      {showIncompleteTaskList ? (
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
                return (
                  <article key={task.id} className="rounded-2xl bg-white p-3 shadow-card-lift">
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
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">{t("recent_standalone_notes")}</h2>
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
                    tags={note.tags.map((tag) => tag.tag.name)}
                    nextLabel={t("next")}
                    clientId={note.clientId}
                    hasLinkedTask={!!note.task}
                    surfaceShadowClass="shadow-card-lift"
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("reminders")}</h2>
            <Link href="/reminders" className="shrink-0 text-xs text-slate-600 hover:underline sm:text-sm">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-3">
            {reminders.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_reminders")}</p>
            ) : (
              reminders.map((note) => (
                <div key={note.id}>
                  <p className="mb-1 text-xs text-slate-500">
                    {note.nextActionDate ? formatDateTime24(note.nextActionDate, lang) : ""} ·{" "}
                    {note.client?.companyName ?? t("unassigned_note")}
                  </p>
                  <EditableNoteCard
                    noteId={note.id}
                    title={note.title}
                    content={note.content}
                    createdAt={note.createdAt}
                    color={note.color}
                    nextActionDate={note.nextActionDate}
                    remindBeforeMinutes={note.remindBeforeMinutes}
                    tags={note.tags.map((tag) => tag.tag.name)}
                    nextLabel={t("next")}
                    clientId={note.clientId}
                    hasLinkedTask={!!note.task}
                    surfaceShadowClass="shadow-card-lift"
                  />
                </div>
              ))
            )}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{t("tasks")}</h2>
            <Link href="/tasks" className="shrink-0 text-xs text-slate-600 hover:underline sm:text-sm">
              {t("view_all")}
            </Link>
          </div>
          <div className="space-y-2">
            {pending.length === 0 ? (
              <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card-lift">{t("no_pending_tasks")}</p>
            ) : (
              pending.map((task) => {
                const overdue = task.deadline < now;
                return (
                  <article key={task.id} className="rounded-2xl bg-white p-3 shadow-card-lift">
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
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="mb-3 text-lg font-semibold">{t("dashboard_completed_tasks")}</h2>
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
                  articleClassName="shadow-card-lift"
                />
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

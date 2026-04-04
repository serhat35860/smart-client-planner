import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { getPendingFollowupsCountsByPeriod } from "@/lib/followups-counts";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { FollowupsMetric } from "@/components/followups-metric";
import { EditableTaskRow } from "@/components/editable-task-row";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickTaskActionModal } from "@/components/quick-task-action-modal";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("tasks_followups") };
}

export default async function TasksPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { t } = await getServerT();

  const [tasks, totalClients, activeTasksCounts, followupsCounts] = await Promise.all([
    prisma.task.findMany({
      where: { userId: user.id, status: "PENDING" },
      include: { client: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.client.count({ where: { userId: user.id } }),
    getActiveTasksCounts(user.id),
    getPendingFollowupsCountsByPeriod(user.id)
  ]);
  const nowMs = Date.now();

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TotalClientsMetric title={t("total_clients")} count={totalClients} />
        <ActiveTasksMetric
          allPendingCount={activeTasksCounts.allPending}
          incompletePendingCount={activeTasksCounts.incompletePending}
        />
        <FollowupsMetric
          dailyCount={followupsCounts.daily}
          weeklyCount={followupsCounts.weekly}
          monthlyCount={followupsCounts.monthly}
        />
        <QuickTaskActionModal />
      </div>

      <h1 className="mb-4 text-xl font-semibold">{t("tasks_followups")}</h1>
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{t("no_pending_tasks")}</p>
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
                }
              }}
            />
          ))
        )}
      </div>
    </AppShell>
  );
}

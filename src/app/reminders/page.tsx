import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { getPendingFollowupsCountsByPeriod } from "@/lib/followups-counts";
import { requireUser } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { FollowupsMetric } from "@/components/followups-metric";
import { EditableNoteCard } from "@/components/editable-note-card";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickReminderActionModal } from "@/components/quick-reminder-action-modal";
import { getServerT } from "@/i18n/server";
import { formatDateTime24 } from "@/lib/format-date";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("reminders") };
}

type ReminderNote = {
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

export default async function RemindersPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { t, lang } = await getServerT();

  const [reminderNotes, totalClients, activeTasksCounts, followupsCounts] = await Promise.all([
    prisma.note.findMany({
      where: { userId: user.id, nextActionDate: { not: null } },
      include: { tags: { include: { tag: true } }, client: true, task: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    prisma.client.count({ where: { userId: user.id } }),
    getActiveTasksCounts(user.id),
    getPendingFollowupsCountsByPeriod(user.id)
  ]);

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
        <QuickReminderActionModal />
      </div>

      <h1 className="mb-1 text-xl font-semibold text-slate-900">{t("reminders")}</h1>
      <p className="mb-6 max-w-xl text-sm text-slate-600">{t("reminders_intro")}</p>

      <div className="space-y-3">
        {reminderNotes.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600 shadow-sm">{t("no_reminders")}</p>
        ) : (
          reminderNotes.map((note) => (
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
              />
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

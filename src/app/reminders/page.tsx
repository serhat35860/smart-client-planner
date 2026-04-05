import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { mapNoteMentions, mapNoteTagsToDisplay } from "@/lib/creator-preview";
import { noteCardInclude } from "@/lib/note-include";
import { getActiveTasksCounts } from "@/lib/active-tasks-counts";
import { requireWorkspacePage } from "@/lib/workspace";
import { AppShell } from "@/components/shell";
import { ActiveTasksMetric } from "@/components/active-tasks-metric";
import { EditableNoteCard } from "@/components/editable-note-card";
import { TotalClientsMetric } from "@/components/total-clients-metric";
import { QuickReminderActionModal } from "@/components/quick-reminder-action-modal";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("reminders") };
}

export default async function RemindersPage() {
  const ctx = await requireWorkspacePage();
  const ws = ctx.workspace;
  const { t } = await getServerT();

  const [reminderNotes, activeTasksCounts] = await Promise.all([
    prisma.note.findMany({
      where: { workspaceId: ws.id, nextActionDate: { not: null } },
      include: {
        ...noteCardInclude,
        client: true
      },
      orderBy: { createdAt: "desc" },
      take: 200
    }),
    getActiveTasksCounts(ws.id)
  ]);

  return (
    <AppShell>
      <div className="mb-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ActiveTasksMetric completedCount={activeTasksCounts.completedCount} />
        <TotalClientsMetric />
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
                surfaceShadowClass="shadow-card-lift"
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
    </AppShell>
  );
}

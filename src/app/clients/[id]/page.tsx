import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { creatorSelect, mapNoteMentions, mapNoteTagsToDisplay } from "@/lib/creator-preview";
import { noteCardInclude } from "@/lib/note-include";
import { canManageWorkspace, requireWorkspace, requireWorkspacePage } from "@/lib/workspace";
import { EditableNoteCard } from "@/components/editable-note-card";
import { QuickNoteFormWithRefresh } from "@/components/quick-note-form-with-refresh";
import { ClientEditor } from "@/components/client-editor";
import { ClientNotesFilterForm } from "@/components/client-notes-filter-form";
import { getServerT } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { t } = await getServerT();
  const { id } = await params;
  const ctx = await requireWorkspace();
  if (!ctx) return { title: t("clients") };
  const row = await prisma.client.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    select: { companyName: true }
  });
  return { title: row?.companyName ?? t("clients") };
}

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; tag?: string; mentionedUserId?: string }>;
}) {
  const ctx = await requireWorkspacePage();
  if (!canManageWorkspace(ctx.role)) redirect("/dashboard");
  const { id } = await params;
  const filters = await searchParams;
  const mentionedUserId = (filters.mentionedUserId ?? "").trim() || null;

  const client = await prisma.client.findFirst({
    where: { id, workspaceId: ctx.workspace.id },
    include: {
      createdBy: { select: creatorSelect },
      notes: {
        include: noteCardInclude,
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!client) redirect("/clients");

  const notes = client.notes.filter((n) => {
    const q = filters.q?.toLowerCase().trim();
    const tagNeedle = filters.tag?.toLowerCase().trim();
    const byQ = q ? `${n.title ?? ""} ${n.content}`.toLowerCase().includes(q) : true;
    const byTag = tagNeedle ? n.tags.some((tag) => tag.tag.name.includes(tagNeedle)) : true;
    const byMention = mentionedUserId ? n.mentions.some((m) => m.userId === mentionedUserId) : true;
    return byQ && byTag && byMention;
  });

  return (
    <AppShell>
      <ClientEditor client={client} />

      <QuickNoteFormWithRefresh
        clientId={client.id}
        optionalNextDateLabelKey="clients_quick_note_reminder_heading"
      />

      <ClientNotesFilterForm
        clientId={client.id}
        initialQ={filters.q ?? ""}
        initialTag={filters.tag ?? ""}
        initialMentionUserId={mentionedUserId}
      />

      <section className="space-y-3">
        {notes.map((note) => (
          <EditableNoteCard
            key={note.id}
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
            createdBy={note.createdBy}
            updatedBy={note.updatedBy}
            editedByOtherMember={note.editedByOtherMember}
            mentions={mapNoteMentions(note.mentions)}
          />
        ))}
      </section>
    </AppShell>
  );
}

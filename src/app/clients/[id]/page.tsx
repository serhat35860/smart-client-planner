import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { EditableNoteCard } from "@/components/editable-note-card";
import { QuickNoteForm } from "@/components/quick-note-form";
import { ClientEditor } from "@/components/client-editor";
import { getServerT } from "@/i18n/server";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { t } = await getServerT();
  const { id } = await params;
  const user = await requireUser();
  if (!user) return { title: t("clients") };
  const row = await prisma.client.findFirst({
    where: { id, userId: user.id },
    select: { companyName: true }
  });
  return { title: row?.companyName ?? t("clients") };
}

export default async function ClientDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { t } = await getServerT();
  const { id } = await params;
  const filters = await searchParams;

  const client = await prisma.client.findFirst({
    where: { id, userId: user.id },
    include: {
      notes: {
        include: { tags: { include: { tag: true } }, task: { select: { id: true } } },
        orderBy: { createdAt: "desc" }
      }
    }
  });
  if (!client) redirect("/clients");

  const notes = client.notes.filter((n) => {
    const q = filters.q?.toLowerCase().trim();
    const t = filters.tag?.toLowerCase().trim();
    const byQ = q ? `${n.title ?? ""} ${n.content}`.toLowerCase().includes(q) : true;
    const byTag = t ? n.tags.some((tag) => tag.tag.name.includes(t)) : true;
    return byQ && byTag;
  });

  return (
    <AppShell>
      <ClientEditor client={client} />

      <QuickNoteForm clientId={client.id} />

      <form className="my-4 grid gap-2 rounded-2xl bg-white p-4 shadow-sm sm:grid-cols-2">
        <input name="q" placeholder={t("keyword_filter")} defaultValue={filters.q ?? ""} />
        <input name="tag" placeholder={t("tag_filter")} defaultValue={filters.tag ?? ""} />
      </form>

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
            tags={note.tags.map((x) => x.tag.name)}
            nextLabel={t("next")}
            clientId={note.clientId}
            hasLinkedTask={!!note.task}
          />
        ))}
      </section>
    </AppShell>
  );
}

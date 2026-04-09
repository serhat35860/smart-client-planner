import type { Metadata } from "next";
import { AppShell } from "@/components/shell";
import { ClientsAddClientPanel } from "@/components/clients-add-client-panel";
import { QuickNoteFormWithRefresh } from "@/components/quick-note-form-with-refresh";
import { EditableNoteCard } from "@/components/editable-note-card";
import { ClientContactLinks } from "@/components/client-contact-links";
import { ClientsSidebarList } from "@/components/clients-sidebar-list";
import { ClientsFiltersForm } from "@/components/clients-filters-form";
import { prisma } from "@/lib/prisma";
import { creatorSelect, mapNoteMentions, mapNoteTagsToDisplay } from "@/lib/creator-preview";
import { noteCardInclude } from "@/lib/note-include";
import { canManageWorkspace, requireWorkspacePage } from "@/lib/workspace";
import { getServerT } from "@/i18n/server";
import { parseAdditionalContacts } from "@/lib/client-additional-contacts";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("clients") };
}

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{
    clientId?: string;
    q?: string;
    status?: "ACTIVE" | "PASSIVE" | "POTENTIAL" | "ALL";
    mentionedUserId?: string;
  }>;
}) {
  const ctx = await requireWorkspacePage();
  const { t } = await getServerT();
  const ws = ctx.workspace;
  if (!canManageWorkspace(ctx.role)) return <AppShell><div className="rounded-2xl bg-theme-card p-4 text-body text-theme-muted shadow-sm">{t("forbidden_area")}</div></AppShell>;
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const statusFilter = params.status ?? "ALL";
  const mentionedUserId = (params.mentionedUserId ?? "").trim() || null;

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: ws.id,
      ...(query
        ? {
            OR: [{ companyName: { contains: query } }, { contactPerson: { contains: query } }]
          }
        : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      ...(mentionedUserId
        ? {
            notes: {
              some: {
                mentions: { some: { userId: mentionedUserId } }
              }
            }
          }
        : {})
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      email: true,
      sector: true,
      generalNotes: true,
      status: true,
      additionalContacts: true,
      _count: { select: { notes: true } },
      createdBy: { select: creatorSelect }
    }
  });

  const selectedClientId = params.clientId && clients.some((c) => c.id === params.clientId) ? params.clientId : clients[0]?.id;
  const selectedClient = selectedClientId
    ? await prisma.client.findFirst({
        where: { id: selectedClientId, workspaceId: ws.id },
        include: {
          createdBy: { select: creatorSelect },
          notes: {
            include: noteCardInclude,
            orderBy: { createdAt: "desc" }
          }
        }
      })
    : null;

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(280px,340px)_1fr]">
        <aside className="flex min-h-0 flex-col gap-4 lg:max-h-[calc(100vh-8rem)]">
          <ClientsAddClientPanel
            preserveQuery={query}
            preserveStatus={statusFilter}
            preserveMentionedUserId={mentionedUserId}
          />
          <section className="flex min-h-0 flex-1 flex-col rounded-2xl bg-theme-card p-3 shadow-sm">
            <h2 className="mb-2 shrink-0 text-label font-semibold text-theme-muted">{t("clients")}</h2>
            <ClientsFiltersForm
              initialQ={query}
              initialStatus={statusFilter}
              initialMentionUserId={mentionedUserId}
              selectedClientId={selectedClientId}
            />
            <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
              <ClientsSidebarList
                clients={clients.map((c) => ({
                  id: c.id,
                  companyName: c.companyName,
                  contactPerson: c.contactPerson,
                  phone: c.phone,
                  email: c.email,
                  sector: c.sector,
                  generalNotes: c.generalNotes,
                  status: c.status,
                  notesCount: c._count.notes,
                  createdBy: c.createdBy,
                  additionalContacts: parseAdditionalContacts(c.additionalContacts)
                }))}
                selectedClientId={selectedClientId}
                query={query}
                statusFilter={statusFilter}
                mentionedUserId={mentionedUserId}
                rowStyle="button"
              />
              {clients.length === 0 ? <p className="text-body text-theme-muted">{t("no_clients_found")}</p> : null}
            </div>
          </section>
        </aside>

        <section className="min-w-0 space-y-4">
          {selectedClient ? (
            <>
              <div className="rounded-2xl bg-theme-card p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-h2 font-semibold">{selectedClient.companyName}</h2>
                    <p className="text-body text-theme-muted">{selectedClient.contactPerson}</p>
                  </div>
                  <div className="flex min-w-0 max-w-full flex-col items-end gap-2 sm:max-w-[min(100%,24rem)]">
                    <ClientContactLinks
                      contactPerson={selectedClient.contactPerson}
                      phone={selectedClient.phone}
                      email={selectedClient.email}
                      additionalContacts={parseAdditionalContacts(selectedClient.additionalContacts)}
                      className="flex flex-wrap justify-end gap-x-4 gap-y-1"
                    />
                  </div>
                </div>
                <QuickNoteFormWithRefresh
                  clientId={selectedClient.id}
                  optionalNextDateLabelKey="clients_quick_note_reminder_heading"
                />
              </div>

              <div className="rounded-2xl bg-theme-card p-4 shadow-sm">
                <h3 className="mb-3 text-label font-semibold text-theme-muted">{t("notes")}</h3>
                {selectedClient.notes.length === 0 ? (
                  <p className="text-body text-theme-muted">{t("no_notes_yet")}</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedClient.notes.map((note) => (
                      <EditableNoteCard
                        key={note.id}
                        listPresentation="compact"
                        noteId={note.id}
                        title={note.title}
                        content={note.content}
                        createdAt={note.createdAt}
                        nextActionDate={note.nextActionDate}
                        remindBeforeMinutes={note.remindBeforeMinutes}
                        tags={mapNoteTagsToDisplay(note.tags)}
                        color={note.color}
                        clientId={note.clientId}
                        hasLinkedTask={!!note.task}
                        createdBy={note.createdBy}
                        updatedBy={note.updatedBy}
                        editedByOtherMember={note.editedByOtherMember}
                        mentions={mapNoteMentions(note.mentions)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-theme-card p-4 text-body text-theme-muted shadow-sm">{t("select_client")}</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell";
import { NewClientForm } from "@/components/new-client-form";
import { QuickNoteForm } from "@/components/quick-note-form";
import { EditableNoteCard } from "@/components/editable-note-card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return { title: t("clients") };
}

export default async function ClientsPage({
  searchParams
}: {
  searchParams: Promise<{ clientId?: string; q?: string; status?: "ACTIVE" | "PASSIVE" | "POTENTIAL" | "ALL" }>;
}) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { t } = await getServerT();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const statusFilter = params.status ?? "ALL";

  const clients = await prisma.client.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [{ companyName: { contains: query } }, { contactPerson: { contains: query } }]
          }
        : {}),
      ...(statusFilter !== "ALL" ? { status: statusFilter } : {})
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      companyName: true,
      contactPerson: true,
      phone: true,
      status: true,
      _count: { select: { notes: true } }
    }
  });

  const selectedClientId = params.clientId && clients.some((c) => c.id === params.clientId) ? params.clientId : clients[0]?.id;
  const selectedClient = selectedClientId
    ? await prisma.client.findFirst({
        where: { id: selectedClientId, userId: user.id },
        include: {
          notes: {
            include: { tags: { include: { tag: true } }, task: { select: { id: true } } },
            orderBy: { createdAt: "desc" }
          }
        }
      })
    : null;

  return (
    <AppShell>
      <div className="grid gap-5 lg:grid-cols-[320px_1fr_2fr]">
        <aside className="space-y-4">
          <NewClientForm />
        </aside>

        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-600">{t("clients")}</h2>
          <form className="mb-3 space-y-2">
            <input name="q" defaultValue={query} placeholder={t("search_clients_placeholder")} />
            <div className="flex gap-2">
              <select name="status" defaultValue={statusFilter} className="w-full">
                <option value="ALL">{t("all_statuses")}</option>
                <option value="ACTIVE">{t("active")}</option>
                <option value="PASSIVE">{t("passive")}</option>
                <option value="POTENTIAL">{t("potential")}</option>
              </select>
              <button
                type="submit"
                className="rounded-xl px-3 py-2 text-sm text-[var(--ui-accent-contrast)]"
                style={{ backgroundColor: "var(--ui-accent)" }}
              >
                {t("filter")}
              </button>
            </div>
            {selectedClientId ? <input type="hidden" name="clientId" value={selectedClientId} /> : null}
          </form>
          <div className="space-y-2">
            {clients.map((client) => {
              const active = client.id === selectedClientId;
              return (
                <Link
                  key={client.id}
                  href={`/clients?clientId=${client.id}${query ? `&q=${encodeURIComponent(query)}` : ""}${
                    statusFilter ? `&status=${statusFilter}` : ""
                  }`}
                  className={`block rounded-xl border p-3 transition ${
                    active ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold">{client.companyName}</p>
                  <p className="text-sm text-slate-600">
                    {client.contactPerson} - {t(client.status.toLowerCase() as "active" | "passive" | "potential")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{client._count.notes} {t("notes").toLowerCase()}</p>
                </Link>
              );
            })}
            {clients.length === 0 ? <p className="text-sm text-slate-500">{t("no_clients_found")}</p> : null}
          </div>
        </section>

        <section className="space-y-4">
          {selectedClient ? (
            <>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedClient.companyName}</h2>
                    <p className="text-sm text-slate-600">{selectedClient.contactPerson}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1">
                    <a
                      href={`https://wa.me/${selectedClient.phone.replace(/[^\d]/g, "")}`}
                      className="text-sm text-emerald-700 hover:underline"
                    >
                      {t("whatsapp")}
                    </a>
                    <a
                      href={`mailto:${encodeURIComponent(selectedClient.email)}`}
                      className="text-sm text-sky-700 hover:underline"
                    >
                      {t("contact_by_email")}
                    </a>
                  </div>
                </div>
                <QuickNoteForm clientId={selectedClient.id} />
              </div>

              <div className="space-y-3">
                {selectedClient.notes.length === 0 ? (
                  <p className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{t("no_notes_yet")}</p>
                ) : (
                  selectedClient.notes.map((note) => (
                    <EditableNoteCard
                      key={note.id}
                      noteId={note.id}
                      title={note.title}
                      content={note.content}
                      createdAt={note.createdAt}
                      nextActionDate={note.nextActionDate}
                      remindBeforeMinutes={note.remindBeforeMinutes}
                      tags={note.tags.map((tag) => tag.tag.name)}
                      color={note.color}
                      nextLabel={t("next")}
                      clientId={note.clientId}
                      hasLinkedTask={!!note.task}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-sm">{t("select_client")}</div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

import type { Metadata } from "next";
import { AppShell } from "@/components/shell";
import { requireWorkspacePage } from "@/lib/workspace";
import { productCapabilities, versionNotes } from "@/lib/version-notes";

export const metadata: Metadata = {
  title: "Versiyon Notları"
};

export default async function VersionNotesPage() {
  await requireWorkspacePage();

  return (
    <AppShell>
      <h1 className="mb-2 text-h2 font-semibold">Versiyon Notları</h1>
      <p className="mb-6 max-w-3xl text-body text-theme-muted">
        Bu ekranda uygulamaya eklenen geliştirmeleri sürüm numarasıyla sıralı görebilirsiniz.
      </p>

      <section className="mb-6 rounded-2xl bg-theme-card p-5 shadow-sm">
        <h2 className="mb-3 text-label font-semibold text-theme-text">Program neler yapabiliyor?</h2>
        <ul className="list-disc space-y-1 pl-5 text-body text-theme-text">
          {productCapabilities.map((cap) => (
            <li key={cap}>{cap}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        {versionNotes.map((note) => (
          <article key={note.version} className="rounded-2xl bg-theme-card p-5 shadow-sm">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-theme-subtle-hover px-2 py-0.5 text-caption font-medium text-theme-text">
                {note.version}
              </span>
              <span className="text-xs text-theme-muted">{note.date}</span>
            </div>
            <h3 className="mb-2 text-h2 font-semibold text-theme-text">{note.title}</h3>
            <ol className="list-decimal space-y-1 pl-5 text-body text-theme-text">
              {note.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

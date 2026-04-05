"use client";

import type { ComponentProps } from "react";
import { useRouter } from "next/navigation";
import { QuickNoteForm } from "@/components/quick-note-form";

type QuickNoteProps = ComponentProps<typeof QuickNoteForm>;

/** Müşteri bağlamında not kaydından sonra sunucu verisini yeniler (not listesi, sayaçlar). */
export function QuickNoteFormWithRefresh({
  clientId,
  ...rest
}: Omit<QuickNoteProps, "onSaved" | "clientId"> & { clientId: string }) {
  const router = useRouter();
  return (
    <QuickNoteForm
      {...rest}
      clientId={clientId}
      onSaved={() => {
        router.refresh();
      }}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";

export type ApiClientRow = {
  id: string;
  companyName: string;
  contactPerson: string;
  status?: string;
};

/**
 * `/api/clients` ile metin + isteğe bağlı mentionUserId filtreli liste (modal müşteri seçicileri).
 */
export function useWorkspaceClientsQuery(active: boolean) {
  const [q, setQ] = useState("");
  const [mentionUserId, setMentionUserId] = useState<string | null>(null);
  const [mentionLabel, setMentionLabel] = useState<string | null>(null);
  const [clients, setClients] = useState<ApiClientRow[]>([]);
  const [loading, setLoading] = useState(false);

  const resetPicker = useCallback(() => {
    setQ("");
    setMentionUserId(null);
    setMentionLabel(null);
  }, []);

  useEffect(() => {
    if (!active) {
      resetPicker();
      setClients([]);
      setLoading(false);
    }
  }, [active, resetPicker]);

  useEffect(() => {
    if (!active) return;
    if (q.startsWith("@")) {
      setClients([]);
      setLoading(false);
      return;
    }
    const tmr = setTimeout(() => {
      setLoading(true);
      const p = new URLSearchParams();
      if (q.trim()) p.set("q", q.trim());
      if (mentionUserId) p.set("mentionedUserId", mentionUserId);
      void fetch(`/api/clients?${p.toString()}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data: unknown) => {
          setClients(Array.isArray(data) ? (data as ApiClientRow[]) : []);
        })
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(tmr);
  }, [active, q, mentionUserId]);

  return {
    q,
    setQ,
    mentionUserId,
    setMentionUserId,
    mentionLabel,
    setMentionLabel,
    clients,
    loading
  };
}

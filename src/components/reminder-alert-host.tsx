"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { playSoftReminderChime } from "@/lib/play-soft-chime";
import { appLanguageFromI18n, formatDateTime24 } from "@/lib/format-date";
import { SNOOZE_MINUTES_OPTIONS } from "@/lib/snooze-minutes-options";
import type { TFunction } from "i18next";

type AlertItem =
  | {
      kind: "note";
      id: string;
      title: string | null;
      content: string;
      at: string;
      remindBeforeMinutes: number;
      clientName: string | null;
    }
  | {
      kind: "task";
      id: string;
      title: string;
      content: string;
      at: string;
      remindBeforeMinutes: number;
      clientName: string;
    };

const POLL_MS = 35_000;
const AFTER_EVENT_MS = 60 * 60 * 1000;

function fireAtMs(atIso: string, remindBeforeMinutes: number) {
  const T = new Date(atIso).getTime();
  return T - remindBeforeMinutes * 60 * 1000;
}

function dismissKey(item: AlertItem, fireMs: number) {
  return `reminder-dismissed-${item.kind}-${item.id}-${fireMs}`;
}

function soundKey(item: AlertItem, fireMs: number) {
  return `reminder-chimed-${item.kind}-${item.id}-${fireMs}`;
}

function snoozeUntilKey(item: AlertItem, fireMs: number) {
  return `reminder-snooze-until-${item.kind}-${item.id}-${fireMs}`;
}

function isSnoozed(item: AlertItem, fireMs: number, now: number): boolean {
  try {
    const raw = sessionStorage.getItem(snoozeUntilKey(item, fireMs));
    if (!raw) return false;
    const until = Number(raw);
    return Number.isFinite(until) && until > now;
  } catch {
    return false;
  }
}

function stableId(item: AlertItem, fireMs: number) {
  return `${item.kind}-${item.id}-${fireMs}`;
}

/** Eski yanıt: sadece not alanları (nextActionDate). */
function normalizePayload(raw: unknown): AlertItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const r = row as Record<string, unknown>;
    if (r.kind === "task" && typeof r.at === "string" && typeof r.title === "string") {
      return {
        kind: "task",
        id: String(r.id),
        title: r.title,
        content: typeof r.content === "string" ? r.content : "",
        at: r.at,
        remindBeforeMinutes: typeof r.remindBeforeMinutes === "number" ? r.remindBeforeMinutes : 0,
        clientName: typeof r.clientName === "string" ? r.clientName : ""
      };
    }
    if (r.kind === "note" && typeof r.at === "string") {
      return {
        kind: "note",
        id: String(r.id),
        title: (r.title as string | null) ?? null,
        content: typeof r.content === "string" ? r.content : "",
        at: r.at,
        remindBeforeMinutes: typeof r.remindBeforeMinutes === "number" ? r.remindBeforeMinutes : 0,
        clientName: typeof r.clientName === "string" || r.clientName === null ? (r.clientName as string | null) : null
      };
    }
    // Legacy: nextActionDate
    if (typeof r.nextActionDate === "string") {
      return {
        kind: "note",
        id: String(r.id),
        title: (r.title as string | null) ?? null,
        content: typeof r.content === "string" ? r.content : "",
        at: r.nextActionDate,
        remindBeforeMinutes: typeof r.remindBeforeMinutes === "number" ? r.remindBeforeMinutes : 0,
        clientName: typeof r.clientName === "string" || r.clientName === null ? (r.clientName as string | null) : null
      };
    }
    return null;
  }).filter((x): x is AlertItem => x !== null);
}

function TaskReminderSnooze({ onSnooze, t }: { onSnooze: (minutes: number) => void; t: TFunction }) {
  const [minutes, setMinutes] = useState(15);

  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-medium text-slate-600">{t("task_reminder_snooze_label")}</span>
        <select
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="w-full max-w-[13rem] rounded-lg border border-amber-200/80 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-amber-400"
        >
          {SNOOZE_MINUTES_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {t(`snooze_option_${m}`)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        onClick={() => onSnooze(minutes)}
        className="shrink-0 rounded-lg border border-amber-400/90 bg-amber-100/80 px-3 py-1.5 text-xs font-medium text-amber-950 hover:bg-amber-200/80"
      >
        {t("task_reminder_snooze_button")}
      </button>
    </div>
  );
}

export function ReminderAlertHost() {
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const lang = appLanguageFromI18n(i18n.language);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());

  const isLogin = pathname === "/login";

  const check = useCallback(async () => {
    if (isLogin) return;
    try {
      const res = await fetch("/api/notes/reminder-schedule", { cache: "no-store" });
      if (!res.ok) return;
      const list = normalizePayload(await res.json());
      const now = Date.now();
      const active: AlertItem[] = [];
      const nextSoundIds = new Set<string>();

      for (const n of list) {
        const F = fireAtMs(n.at, n.remindBeforeMinutes);
        const T = new Date(n.at).getTime();
        if (typeof window === "undefined") continue;
        if (sessionStorage.getItem(dismissKey(n, F))) continue;
        if (isSnoozed(n, F, now)) continue;
        if (now < F || now > T + AFTER_EVENT_MS) continue;
        active.push(n);
        const sk = soundKey(n, F);
        if (!sessionStorage.getItem(sk)) {
          nextSoundIds.add(sk);
        }
      }

      const newAlert = active.some((a) => {
        const F = fireAtMs(a.at, a.remindBeforeMinutes);
        const id = stableId(a, F);
        return !prevIdsRef.current.has(id);
      });

      if (newAlert && nextSoundIds.size > 0) {
        playSoftReminderChime();
        nextSoundIds.forEach((k) => sessionStorage.setItem(k, "1"));
      }

      prevIdsRef.current = new Set(active.map((a) => stableId(a, fireAtMs(a.at, a.remindBeforeMinutes))));
      setAlerts(active);
    } catch {
      /* ignore */
    }
  }, [isLogin]);

  useEffect(() => {
    if (isLogin) {
      setAlerts([]);
      return;
    }
    void check();
    const id = window.setInterval(() => void check(), POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [check, isLogin]);

  function dismiss(n: AlertItem) {
    const F = fireAtMs(n.at, n.remindBeforeMinutes);
    try {
      sessionStorage.setItem(dismissKey(n, F), "1");
    } catch {
      /* ignore */
    }
    setAlerts((prev) =>
      prev.filter((x) => !(x.kind === n.kind && x.id === n.id && fireAtMs(x.at, x.remindBeforeMinutes) === F))
    );
  }

  function snoozeTask(item: AlertItem, minutes: number) {
    if (item.kind !== "task") return;
    const F = fireAtMs(item.at, item.remindBeforeMinutes);
    const until = Date.now() + minutes * 60 * 1000;
    try {
      sessionStorage.setItem(snoozeUntilKey(item, F), String(until));
      sessionStorage.removeItem(soundKey(item, F));
    } catch {
      /* ignore */
    }
    setAlerts((prev) =>
      prev.filter(
        (x) => !(x.kind === item.kind && x.id === item.id && fireAtMs(x.at, x.remindBeforeMinutes) === F)
      )
    );
  }

  if (isLogin || alerts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[25] flex flex-col items-center gap-2 px-3 md:top-[calc(4rem+env(safe-area-inset-top))]"
      aria-live="polite"
    >
      {alerts.map((n) => {
        const F = fireAtMs(n.at, n.remindBeforeMinutes);
        const when = formatDateTime24(new Date(n.at), lang);
        const preview =
          n.kind === "note"
            ? n.content.length > 160
              ? `${n.content.slice(0, 157)}…`
              : n.content
            : null;
        const alertTitle = n.kind === "task" ? t("task_reminder_alert_title") : t("reminder_alert_title");
        return (
          <div
            key={stableId(n, F)}
            className="pointer-events-auto w-full max-w-lg rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 shadow-lg shadow-amber-900/10 backdrop-blur-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">{alertTitle}</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {n.kind === "note" ? n.title?.trim() || t("quick_note_modal_title") : n.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {when}
                  {n.clientName ? ` · ${n.clientName}` : ""}
                </p>
                {preview ? <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{preview}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(n)}
                className="shrink-0 rounded-lg border border-amber-300/80 bg-white/80 px-2 py-1 text-xs text-slate-700 hover:bg-white"
              >
                {t("reminder_alert_dismiss")}
              </button>
            </div>
            <div className="mt-2 space-y-2 border-t border-amber-200/60 pt-2">
              {n.kind === "task" ? (
                <>
                  <TaskReminderSnooze t={t} onSnooze={(mins) => snoozeTask(n, mins)} />
                  <Link href="/tasks" className="inline-block text-xs font-medium text-amber-900 underline hover:no-underline">
                    {t("reminder_alert_open_tasks")}
                  </Link>
                </>
              ) : (
                <Link href="/reminders" className="text-xs font-medium text-amber-900 underline hover:no-underline">
                  {t("reminder_alert_open_reminders")}
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

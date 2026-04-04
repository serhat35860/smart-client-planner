/** Görev hatırlatması erteleme süreleri (dakika). */
export const SNOOZE_MINUTES_OPTIONS = [5, 10, 15, 30, 60, 120, 360, 1440] as const;

export type SnoozeMinutes = (typeof SNOOZE_MINUTES_OPTIONS)[number];

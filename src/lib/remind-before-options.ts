/** Dakika cinsinden; 0 = hatırlatma anında. */
export const REMIND_BEFORE_MINUTES_OPTIONS = [0, 5, 15, 30, 60, 120, 360, 1440] as const;

export type RemindBeforeMinutes = (typeof REMIND_BEFORE_MINUTES_OPTIONS)[number];

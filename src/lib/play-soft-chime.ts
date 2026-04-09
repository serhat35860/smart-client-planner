export type ReminderSound = "soft" | "bell" | "digital";

export const REMINDER_SOUND_STORAGE_KEY = "reminderSoundPreference";
const REMINDER_WAV_PATH = "/sounds/reminder.wav";

function resolveTone(sound: ReminderSound) {
  if (sound === "bell") return { type: "triangle" as const, frequency: 987.77, duration: 0.34, gain: 1.4 };
  if (sound === "digital") return { type: "square" as const, frequency: 659.25, duration: 0.24, gain: 1.0 };
  return { type: "sine" as const, frequency: 783.99, duration: 0.3, gain: 1.2 };
}

export function getReminderSoundPreference(): ReminderSound {
  try {
    const raw = localStorage.getItem(REMINDER_SOUND_STORAGE_KEY);
    if (raw === "bell" || raw === "digital" || raw === "soft") return raw;
  } catch {
    /* ignore */
  }
  return "soft";
}

/** Kısa bildirim sesi (tarayıcı izin verirse). */
export function playSoftReminderChime(sound: ReminderSound = "soft") {
  const fallbackTone = () => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const tone = resolveTone(sound);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = tone.type;
      osc.frequency.value = tone.frequency;
      const t0 = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(tone.gain, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.08, tone.duration - 0.02));
      osc.start(t0);
      osc.stop(t0 + tone.duration);
      osc.onended = () => void ctx.close();
    } catch {
      /* autoplay / AudioContext */
    }
  };

  try {
    const audio = new Audio(REMINDER_WAV_PATH);
    audio.preload = "auto";
    void audio.play().catch(() => fallbackTone());
    return;
  } catch {
    /* fallback to generated tone */
  }
  fallbackTone();
}

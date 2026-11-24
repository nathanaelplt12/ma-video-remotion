import durations from "./voiceDurations.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1800;

export const C = {
  night: "#161320",
  slate: "#242033",
  black: "#0b0910",
  danger: "#ef4444",
  mustard: "#eab308",
  cold: "#9db8ff",
  paleYellow: "#fff3b0",
  orange: "#f97316",
  blue: "#3b82f6",
  skin: "#d9b8a4",
  skinDark: "#b8927c",
};

export const FONT =
  "'Arial Black', 'Impact', 'Helvetica Neue', Arial, sans-serif";

/** Découpage des scènes (frames absolues). */
export const SCENES = {
  s1: { from: 0, duration: 180 },
  s2: { from: 180, duration: 270 },
  s3: { from: 450, duration: 330 },
  s4: { from: 780, duration: 240 },
  s5: { from: 1020, duration: 360 },
  s6: { from: 1380, duration: 420 },
} as const;

/** Frame (relative à la scène) où démarre la voix off de chaque scène. */
export const VOICE_START = { s1: 15, s2: 30, s3: 40, s4: 10, s5: 20, s6: 20 } as const;

export type SceneKey = keyof typeof SCENES;

/** Durée réelle de la voix off en frames (mesurée sur les fichiers générés). */
export const voiceFrames = (k: SceneKey) => {
  const n = k.replace("s", "scene") as keyof typeof durations;
  return Math.ceil(durations[n] * FPS);
};

/** Horloge du HUD (en secondes écoulées depuis 03:12:00), avec rembobinage. */
export const REWIND = { from: 1380, to: 1455, fromSec: 46, toSec: 26 };
export const clockSeconds = (frame: number) => {
  if (frame < REWIND.from) return frame / FPS;
  if (frame < REWIND.to) {
    const p = (frame - REWIND.from) / (REWIND.to - REWIND.from);
    const e = p * p * (3 - 2 * p);
    return REWIND.fromSec + (REWIND.toSec - REWIND.fromSec) * e;
  }
  return REWIND.toSec + (frame - REWIND.to) / FPS;
};
export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const p = (n: number) => String(n).padStart(2, "0");
  return `03:${p(12 + Math.floor(s / 60))}:${p(s % 60)}`;
};

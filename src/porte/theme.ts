import timings from "./voiceTimings.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL_FRAMES = 1800;

/** Palette « flat design » sombre. */
export const C = {
  night: "#0f0d1a",
  dusk: "#1b172b",
  wall: "#221d36",
  black: "#07060b",
  screen: "#38bdf8",
  danger: "#ef4444",
  mustard: "#eab308",
  orange: "#f97316",
  blue: "#2563eb",
  green: "#22c55e",
  white: "#f8fafc",
  pale: "#e7e1ea",
  paleShade: "#bfb4c4",
};

export const FONT = "'Montserrat', 'Arial Black', Impact, sans-serif";

/** Découpage imposé : 8 scènes, 1800 frames. */
export const SCENES = {
  scene1: { from: 0, duration: 150 },
  scene2: { from: 150, duration: 150 },
  scene3: { from: 300, duration: 180 },
  scene4: { from: 480, duration: 210 },
  scene5: { from: 690, duration: 300 },
  scene6: { from: 990, duration: 120 },
  scene7: { from: 1110, duration: 330 },
  scene8: { from: 1440, duration: 360 },
} as const;
export type SceneKey = keyof typeof SCENES;

/** Frame (relative à la scène) où démarre la voix off : quasi immédiat, zéro temps mort. */
export const VOICE_START: Record<SceneKey, number> = {
  scene1: 6, scene2: 8, scene3: 6, scene4: 6, scene5: 8, scene6: 4, scene7: 8, scene8: 8,
};

/** Segments de voix (= sous-titres) en frames relatives à la scène, mesurés sur les mp3 générés. */
export const segs = (k: SceneKey) =>
  timings[k].segments.map((s) => ({
    sub: s.sub,
    start: VOICE_START[k] + Math.round(s.start * FPS),
    end: VOICE_START[k] + Math.round(s.end * FPS),
  }));
export const seg = (k: SceneKey, i: number) => segs(k)[i];

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/* ───────── Horloge du HUD : 03:00:00 qui défile, recule pendant le rembobinage ───────── */
export const REWIND = { from: 990, to: 1075, toSec: 16 };
export const clockSeconds = (f: number) => {
  const fromSec = REWIND.from / FPS;
  if (f < REWIND.from) return f / FPS;
  if (f < REWIND.to) {
    const p = (f - REWIND.from) / (REWIND.to - REWIND.from);
    return fromSec + (REWIND.toSec - fromSec) * p * p;
  }
  return REWIND.toSec + (f - REWIND.to) / FPS;
};
export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const p = (n: number) => String(n).padStart(2, "0");
  return `03:${p(Math.floor(s / 60))}:${p(s % 60)}`;
};

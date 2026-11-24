import { interpolate, random } from "remotion";
import voiceData from "./voiceData.json";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
export const TOTAL = 1800;

export const C = {
  night: "#0c0a15",
  slate: "#1d192b",
  slate2: "#2a2540",
  slate3: "#363052",
  phone: "#38bdf8",
  danger: "#ef4444",
  hoodie: "#eab308",
  hoodieDark: "#a37c06",
  skin: "#c9a48e",
  skinShade: "#9c7b6a",
  pale: "#e7e2ea",
  orange: "#f97316",
  blue: "#3b82f6",
  black: "#050408",
};

export const FONT = "'Inter', 'Arial Black', 'Helvetica Neue', Arial, sans-serif";

/** Début (frame absolue) de chaque scène. */
export const SC = { s1: 0, s2: 120, s3: 330, s4: 578, s5: 720, s6: 900, s7: 1170, s8: 1500, end: TOTAL } as const;

/** Repères sonores et visuels (frames absolues). */
export const T = {
  flash: 52,
  knocks: 180,
  knockGap: 18.6,
  bubble: 222,
  vibrate1: 398,
  sms: 406,
  faceCut: 528,
  creak: 590,
  crackOpen: 652,
  countdown: 750,
  choiceOrange: 842,
  feetIn: 935,
  feetStop: 985,
  silence: 1062,
  jumpscare: 1092,
  badge: 1122,
  rewind: 1170,
  rewindEnd: 1226,
  blueChecked: 1226,
  closeEyes: 1282,
  approach: 1300,
  closest: 1378,
  recede: 1405,
  doorClose: 1462,
  doorShut: 1480,
  relief: 1510,
  vibrate2: 1588,
  airdrop: 1590,
  photo: 1640,
  photoText: 1706,
  closetBurst: 1772,
  black: 1778,
};

export type VoiceLine = {
  start: number;
  voice: "narrator" | "mimic";
  frames: number;
  speechEnd: number;
  cues: { text: string; from: number }[];
};
export const VOICE = voiceData as Record<string, VoiceLine>;

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (f: number, i: number[], o: number[], easing?: (t: number) => number) =>
  interpolate(f, i, o, { ...clamp, easing });

export const shake = (f: number, amount: number, seed = "s") => ({
  x: (random(`${seed}x${f}`) - 0.5) * 2 * amount,
  y: (random(`${seed}y${f}`) - 0.5) * 2 * amount,
});

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};

/** Horloge du HUD : 02:47:00 + temps écoulé, recule pendant le rembobinage. */
export const clockSeconds = (f: number) => {
  const a = T.rewind, b = T.rewindEnd, back = 15;
  if (f < a) return f / FPS;
  if (f < b) {
    const p = (f - a) / (b - a);
    return a / FPS - back * (p * p * (3 - 2 * p));
  }
  return a / FPS - back + (f - b) / FPS;
};
export const formatClock = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const p = (n: number) => String(n).padStart(2, "0");
  return `02:${p(47 + Math.floor(s / 60))}:${p(s % 60)}`;
};

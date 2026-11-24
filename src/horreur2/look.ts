import { interpolate, random } from "remotion";

export const FPS = 30;
export const W = 1080;
export const H = 1920;
export const TOTAL = 2400;
export const SHOT = 60; // un plan = 2 s maximum

export const FONT = "'Inter', 'Inter Display', 'Liberation Sans', Arial, sans-serif";
export const MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace";

export const PAL = {
  amber: "#f59e0b",
  warmBg: "#261e18",
  coldBg: "#0b0e17",
  coldLight: "#6f8fc9",
  red: "#ef4444",
  hoodieYellow: "#e0a91c",
  hoodieDark: "#16171c",
  skin: "#d7a98a",
  skinShade: "#8a5a44",
  jeans: "#1e2533",
};

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Mélange de deux couleurs hex (t=0 -> a, t=1 -> b). */
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a), B = hex(b), k = Math.max(0, Math.min(1, t));
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
};

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (f: number, i: number[], o: number[], easing?: (t: number) => number) =>
  interpolate(f, i, o, { ...cl, easing });

/**
 * Chaleur de l'image selon la frame absolue : 1 = ambre rassurant, 0 = bleu nuit glacial.
 * Hook (flash-forward) froid, soirée chaude, bascule à l'interrupteur (18.5 s), puis glaciation.
 */
export const warmth = (abs: number) => {
  if (abs < 120) return 0.12;
  if (abs < 556) return lerp(abs, [120, 420, 556], [1, 1, 0.82]);
  return lerp(abs, [556, 600, 960], [0.3, 0.22, 0]);
};
export const bgAt = (abs: number) => mix(PAL.coldBg, PAL.warmBg, warmth(abs));
export const lightAt = (abs: number) => mix(PAL.coldLight, PAL.amber, warmth(abs));

/** Tremblement déterministe. */
export const shake = (f: number, amt: number, seed = "s") => ({
  x: (random(`${seed}x${f}`) - 0.5) * 2 * amt,
  y: (random(`${seed}y${f}`) - 0.5) * 2 * amt,
});

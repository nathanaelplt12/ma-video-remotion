import { interpolate } from "remotion";
import { FPS, SCENES, TOTAL_FRAMES, seg } from "./theme";

const S = SCENES;
/** Événements clés (frames absolues), calés sur la voix off. */
export const EV = {
  notif: S.scene2.from + 4,
  jumpscare: S.scene5.from + seg("scene5", 2).start + 20,
  leave: S.scene7.from + seg("scene7", 5).start,
  airdrop: S.scene8.from + seg("scene8", 1).start,
  closet: S.scene8.from + 332,
};

/** Rythme cardiaque affiché dans le HUD, frame par frame. */
const KEYS: [number, number][] = [
  [0, 82], [S.scene2.from, 82], [EV.notif + 2, 125], [S.scene3.from, 128],
  [S.scene4.from, 140], [S.scene5.from, 146], [EV.jumpscare - 1, 150], [EV.jumpscare + 3, 165],
  [S.scene6.from, 165], [S.scene6.from + 80, 112], [S.scene7.from, 118], [S.scene7.from + 90, 168],
  [EV.leave, 168], [S.scene8.from + 30, 90], [EV.airdrop, 90], [EV.airdrop + 20, 138],
  [EV.closet, 158], [EV.closet + 4, 172], [TOTAL_FRAMES, 172],
];
export const bpmAt = (f: number) =>
  Math.round(interpolate(f, KEYS.map((k) => k[0]), KEYS.map((k) => k[1]), { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

/** Frames des battements (intégration du BPM) : sert au pouls du HUD et aux sons. */
export const BEATS: number[] = (() => {
  const out: number[] = [];
  let phase = 0;
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    phase += bpmAt(f) / 60 / FPS;
    if (phase >= 1) { phase -= 1; out.push(f); }
  }
  return out;
})();

/** 0→1 juste après un battement (pour l'animation du cœur). */
export const pulseAt = (f: number) => {
  let last = -100;
  for (const b of BEATS) { if (b <= f) last = b; else break; }
  return Math.max(0, 1 - (f - last) / 6);
};

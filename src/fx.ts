import { random } from "remotion";

/** Tremblement de caméra déterministe. */
export const shake = (frame: number, amount: number, seed = "shake") => ({
  x: (random(`${seed}x${frame}`) - 0.5) * 2 * amount,
  y: (random(`${seed}y${frame}`) - 0.5) * 2 * amount,
  r: (random(`${seed}r${frame}`) - 0.5) * 2 * amount * 0.03,
});

/** Luminosité d'un néon qui vacille (0.15 → 1). */
export const flicker = (frame: number, strength = 1, seed = "fl") => {
  const slot = Math.floor(frame / 2);
  const r = random(`${seed}${slot}`);
  const dead = random(`${seed}d${Math.floor(frame / 9)}`) > 1 - 0.35 * strength;
  return dead ? 0.15 + r * 0.35 : 1 - r * 0.15 * strength;
};

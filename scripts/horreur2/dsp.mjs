// Petite boîte à outils DSP partagée (mono, 44.1 kHz) pour les bruitages et la musique.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const SR = 44100;
export const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "audio", "h2");
mkdirSync(OUT, { recursive: true });

let seed = 4242;
export const reseed = (s) => (seed = s >>> 0);
/** Bruit blanc déterministe dans [-1, 1]. */
export const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
/** Aléatoire déterministe dans [0, 1]. */
export const u = () => (rnd() + 1) / 2;
export const N = (sec) => Math.floor(sec * SR);
export const buf = (sec) => new Float32Array(N(sec));

export const save = (name, x, gain = 0.9) => {
  let peak = 0;
  for (const s of x) peak = Math.max(peak, Math.abs(s));
  const k = peak > 0 ? gain / peak : 1;
  const b = Buffer.alloc(44 + x.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write("WAVEfmt ", 8);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22);
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i] * k)) * 32767), 44 + i * 2);
  writeFileSync(join(OUT, name), b);
  console.log(name.padEnd(20), (x.length / SR).toFixed(2) + "s");
};

/** Biquad RBJ : lp | hp | bp. */
export const biquad = (type, f, q = 0.707) => {
  const w = (2 * Math.PI * Math.min(f, SR * 0.45)) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; }
  const a0 = 1 + a, a1 = -2 * c, a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
};
export const filt = (x, ...fs) => { for (const f of fs) for (let i = 0; i < x.length; i++) x[i] = f(x[i]); return x; };

/** Somme de sinus amortis (modes) déclenchée à `at`. */
export const modal = (x, at, modes, amp = 1) => {
  const i0 = N(at);
  for (const [f, decay, a] of modes) {
    if (f > SR * 0.45) continue;
    const ph = u() * 6.28, len = N(Math.min(5 / decay, 4));
    for (let i = 0; i < len && i0 + i < x.length; i++) {
      const t = i / SR;
      x[i0 + i] += amp * a * Math.sin(2 * Math.PI * f * t + ph) * Math.exp(-decay * t) * Math.min(1, t * 8000);
    }
  }
};

/** Rafale de bruit filtrée passe-bande. */
export const burst = (x, at, len, amp, f, q = 2, shape = 40) => {
  const bp = biquad("bp", f, q), i0 = N(at);
  for (let i = 0; i < N(len) && i0 + i < x.length; i++) {
    const t = i / SR;
    x[i0 + i] += amp * bp(rnd()) * Math.exp(-shape * t) * Math.min(1, t * 4000);
  }
};

/**
 * Choc métallique réaliste : micro-impulsion de bruit excitant des résonateurs aigus
 * à fort Q (spectre dense et inharmonique, comme deux clés qui s'entrechoquent).
 */
export const clink = (x, at, amp = 1, modes = [3200, 5100, 6900, 8800, 11200], q = 45) => {
  const i0 = N(at), len = N(0.12);
  const bps = modes.map((f) => biquad("bp", f * (0.97 + 0.06 * u()), q * (0.7 + 0.6 * u())));
  const ex = N(0.0015 + 0.002 * u());
  for (let i = 0; i < len && i0 + i < x.length; i++) {
    const e = i < ex ? rnd() * (1 - i / ex) : 0;
    let s = 0;
    for (let k = 0; k < bps.length; k++) s += bps[k](e) * (1 - k * 0.12);
    x[i0 + i] += amp * (s * 6 + e * 0.15);
  }
};

/** Jeu de résonances d'une clé (chaque clé a sa « voix »). */
export const keyVoice = (base) => [base, base * 1.47, base * 2.09, base * 2.76, base * 3.51];

/** Cliquetis de trousseau : `swings` oscillations, chocs groupés aux points de retournement. */
export const jingle = (x, at, len, amp = 1, swingsPerSec = 3.2) => {
  const voices = [2900, 3600, 4300, 5200].map(keyVoice);
  let t = 0;
  while (t < len) {
    const phase = (t * swingsPerSec) % 1;
    const dens = Math.pow(Math.abs(Math.cos(Math.PI * phase)), 6); // plus de chocs aux retournements
    const env = Math.min(1, t / 0.05) * Math.exp(-t * (1.2 / len));
    if (u() < 0.25 + 0.75 * dens) {
      const v = voices[Math.floor(u() * voices.length)];
      clink(x, at + t, amp * env * (0.3 + 0.7 * u()) * (0.4 + 0.6 * dens), v);
    }
    t += 0.008 + 0.03 * u();
  }
};

/** Choc de bois. */
export const woodKnock = (x, at, amp = 1, f = 180) => {
  modal(x, at, [[f, 30, 1], [f * 2.3, 45, 0.5], [f * 3.9, 70, 0.3]], amp);
  burst(x, at, 0.05, amp * 1.5, f * 6, 1, 90);
};

/** Grincement (stick-slip) : train d'impulsions à cadence variable dans des résonateurs. */
export const creak = (x, at, len, f0, amp = 1, rate0 = 60, rate1 = 120) => {
  const r1 = biquad("bp", f0, 6), r2 = biquad("bp", f0 * 2.1, 5), r3 = biquad("bp", f0 * 3.4, 4);
  const i0 = N(at); let ph = 0;
  for (let i = 0; i < N(len) && i0 + i < x.length; i++) {
    const k = i / N(len), t = i / SR;
    const rate = rate0 + (rate1 - rate0) * Math.sin(Math.PI * k) + 25 * Math.sin(2 * Math.PI * 3.1 * t);
    ph += rate / SR;
    let imp = 0;
    if (ph >= 1) { ph -= 1; imp = 1 + 0.6 * rnd(); }
    const env = Math.sin(Math.PI * Math.min(1, k * 1.05)) ** 0.6;
    x[i0 + i] += amp * env * (r1(imp) + r2(imp) * 0.6 + r3(imp) * 0.35 + 0.02 * rnd() * env);
  }
};

/** Réverb Schroeder (size ~1 = pièce, ~2.5 = grande salle). */
export const reverb = (x, mix = 0.25, size = 1, tail = 0.82) => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => ({ d: Math.floor(d * size), b: null, i: 0, lp: 0 }));
  combs.forEach((c) => (c.b = new Float32Array(c.d)));
  const aps = [225, 556, 441].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.b[c.i]; c.lp = y * 0.6 + c.lp * 0.4;
      c.b[c.i] = x[n] + c.lp * tail; c.i = (c.i + 1) % c.d; s += y;
    }
    s /= combs.length;
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * 0.5; s = y - s * 0.5; a.i = (a.i + 1) % a.d; }
    out[n] = x[n] * (1 - mix) + s * mix * 2.4;
  }
  return out;
};
export const fadeOut = (x, sec) => { const n = N(sec); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; };
export const loopable = (x, sec) => {
  const n = N(sec), y = x.slice(0, x.length - n);
  for (let i = 0; i < n; i++) { const k = i / n; y[i] = y[i] * k + x[x.length - n + i] * (1 - k); }
  return y;
};

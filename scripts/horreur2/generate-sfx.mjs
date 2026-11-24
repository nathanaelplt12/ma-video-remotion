// Bruitages « Le double des clés » synthétisés (mono 16 bits, 44.1 kHz) -> public/audio/h2/
// Synthèse modale (résonateurs) + bruit filtré + petite réverb de pièce pour un rendu réaliste.
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "audio", "h2");
mkdirSync(OUT, { recursive: true });

let seed = 4242;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const N = (sec) => Math.floor(sec * SR);
const buf = (sec) => new Float32Array(N(sec));

const save = (name, x, gain = 0.9) => {
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

// Biquad (RBJ)
const biquad = (type, f, q = 0.707) => {
  const w = (2 * Math.PI * f) / SR, c = Math.cos(w), s = Math.sin(w), a = s / (2 * q);
  let b0, b1, b2, a0, a1, a2;
  if (type === "lp") { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
  else if (type === "hp") { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
  else { b0 = a; b1 = 0; b2 = -a; } // bp
  a0 = 1 + a; a1 = -2 * c; a2 = 1 - a;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x) => {
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y; return y;
  };
};
const filt = (x, ...fs) => { for (const f of fs) for (let i = 0; i < x.length; i++) x[i] = f(x[i]); return x; };

// Résonateur modal : impulsion -> somme de sinus amortis
const modal = (x, at, modes, amp = 1) => {
  const i0 = N(at);
  for (const [f, decay, a] of modes) {
    const ph = Math.random() * 6.28;
    for (let i = 0; i < N(Math.min(4 / decay, 3)) && i0 + i < x.length; i++) {
      const t = i / SR;
      x[i0 + i] += amp * a * Math.sin(2 * Math.PI * f * t + ph) * Math.exp(-decay * t);
    }
  }
};
// Rafale de bruit filtrée
const burst = (x, at, len, amp, f, q = 2, shape = 40) => {
  const bp = biquad("bp", f, q), i0 = N(at);
  for (let i = 0; i < N(len) && i0 + i < x.length; i++) {
    const t = i / SR;
    x[i0 + i] += amp * bp(rnd()) * Math.exp(-shape * t) * Math.min(1, t * 4000);
  }
};
// Réverb Schroeder (petite pièce)
const reverb = (x, mix = 0.25, size = 1, tail = 0.82) => {
  const combs = [1557, 1617, 1491, 1422].map((d) => ({ d: Math.floor(d * size), b: null, i: 0, lp: 0 }));
  combs.forEach((c) => (c.b = new Float32Array(c.d)));
  const aps = [225, 556].map((d) => ({ d, b: new Float32Array(d), i: 0 }));
  const out = new Float32Array(x.length);
  for (let n = 0; n < x.length; n++) {
    let s = 0;
    for (const c of combs) {
      const y = c.b[c.i]; c.lp = y * 0.7 + c.lp * 0.3;
      c.b[c.i] = x[n] + c.lp * tail; c.i = (c.i + 1) % c.d; s += y;
    }
    s /= 4;
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * 0.5; s = y - s * 0.5; a.i = (a.i + 1) % a.d; }
    out[n] = x[n] * (1 - mix) + s * mix * 2.2;
  }
  return out;
};
const fadeOut = (x, sec) => { const n = N(sec); for (let i = 0; i < n; i++) x[x.length - 1 - i] *= i / n; return x; };
const fadeIn = (x, sec) => { const n = N(sec); for (let i = 0; i < n; i++) x[i] *= i / n; return x; };
// Bouclage propre : fondu croisé fin -> début
const loopable = (x, sec) => {
  const n = N(sec), y = x.slice(0, x.length - n);
  for (let i = 0; i < n; i++) { const k = i / n; y[i] = y[i] * k + x[x.length - n + i] * (1 - k); }
  return y;
};

// Clé/métal : petits clics inharmoniques
const metalTick = (x, at, amp = 1, base = 2600) =>
  modal(x, at, [[base, 60, 1], [base * 1.73, 80, 0.7], [base * 2.41, 110, 0.5], [base * 3.3, 140, 0.35], [base * 0.61, 45, 0.4]], amp);
// Bois : choc grave
const woodKnock = (x, at, amp = 1, f = 180) => {
  modal(x, at, [[f, 30, 1], [f * 2.3, 45, 0.5], [f * 3.9, 70, 0.3]], amp);
  burst(x, at, 0.05, amp * 1.5, f * 6, 1, 90);
};
// Craquement de parquet / porte : stick-slip (train d'impulsions à cadence variable)
const creak = (x, at, len, f0, f1, amp = 1, rate0 = 60, rate1 = 120) => {
  const r1 = biquad("bp", f0, 6), r2 = biquad("bp", f0 * 2.1, 5), r3 = biquad("bp", f0 * 3.4, 4);
  const i0 = N(at); let ph = 0;
  for (let i = 0; i < N(len) && i0 + i < x.length; i++) {
    const k = i / N(len), t = i / SR;
    const rate = rate0 + (rate1 - rate0) * Math.sin(Math.PI * k) + 25 * Math.sin(2 * Math.PI * 3.1 * t);
    ph += rate / SR;
    let imp = 0;
    if (ph >= 1) { ph -= 1; imp = 1 + 0.6 * rnd(); }
    const env = Math.sin(Math.PI * Math.min(1, k * 1.05)) ** 0.6;
    const f = f0 + (f1 - f0) * k; void f;
    x[i0 + i] += amp * env * (r1(imp) * 1.0 + r2(imp) * 0.6 + r3(imp) * 0.35 + 0.02 * rnd() * env);
  }
};

// ---------- SONS ----------

// Poignée qui tourne seule (hook) : grincement métallique + ressort
{
  const x = buf(2.2);
  creak(x, 0.0, 1.9, 900, 1300, 0.6, 90, 260);
  metalTick(x, 0.02, 0.4, 3100); metalTick(x, 1.7, 0.8, 2200);
  save("handle_turn.wav", fadeOut(reverb(x, 0.3), 0.2));
}
// Whoosh sourd (punch-in)
{
  const x = buf(0.45), bp = biquad("bp", 300, 0.8);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = bp(rnd()) * Math.sin(Math.PI * Math.min(1, t / 0.45)) ** 2; }
  save("whoosh.wav", x, 0.6);
}
// Impact grave (cut)
{
  const x = buf(1.6); let ph = 0;
  for (let i = 0; i < x.length; i++) { const t = i / SR; ph += (2 * Math.PI * (38 + 40 * Math.exp(-t * 8))) / SR; x[i] = Math.sin(ph) * Math.exp(-t * 2.6); }
  burst(x, 0, 0.2, 0.5, 900, 0.6, 30);
  save("impact.wav", reverb(x, 0.3, 1.4, 0.86));
}
// Porte d'entrée qui s'ouvre : clenche + grincement + air
{
  const x = buf(1.8);
  metalTick(x, 0.0, 1, 1900); metalTick(x, 0.06, 0.6, 2400);
  creak(x, 0.15, 1.1, 420, 520, 0.5, 40, 90);
  const lp = biquad("lp", 400);
  for (let i = N(0.1); i < x.length; i++) x[i] += 0.15 * lp(rnd()) * Math.exp(-(i / SR - 0.1) * 1.5);
  save("door_open.wav", fadeOut(reverb(x, 0.3, 1.2), 0.3));
}
// Clés posées dans le vide-poche (cliquetis + clic métallique net)
{
  const x = buf(1.3);
  for (let k = 0; k < 9; k++) metalTick(x, 0.05 + Math.random() * 0.35, 0.25 + Math.random() * 0.3, 2400 + Math.random() * 2600);
  metalTick(x, 0.48, 1, 3300); modal(x, 0.48, [[820, 18, 0.5], [1960, 25, 0.3]], 0.8); // céramique
  for (let k = 0; k < 4; k++) metalTick(x, 0.52 + k * 0.05 + Math.random() * 0.03, 0.3, 3000 + Math.random() * 2000);
  save("keys_tray.wav", reverb(x, 0.2));
}
// Micro-ondes : ronronnement + 3 bips à la fin (fin à 1.9 s)
{
  const x = buf(2.6);
  const lp = biquad("lp", 900);
  for (let i = 0; i < N(1.35); i++) { const t = i / SR; x[i] = 0.25 * Math.sin(2 * Math.PI * 100 * t) + 0.12 * Math.sin(2 * Math.PI * 200 * t) + 0.3 * lp(rnd()); }
  metalTick(x, 1.35, 0.3, 1500); // relais
  for (let b = 0; b < 3; b++) {
    const s = N(1.45 + b * 0.28);
    for (let i = 0; i < N(0.17); i++) { const t = i / SR; x[s + i] += 0.6 * Math.tanh(3 * Math.sin(2 * Math.PI * 2050 * t)) * Math.min(1, t * 300) * Math.min(1, (0.17 - t) * 300); }
  }
  save("microwave.wav", reverb(x, 0.18));
}
// Assis sur le canapé : coussin + tissu
{
  const x = buf(1.0), lp = biquad("lp", 250), bp = biquad("bp", 2500, 0.7);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 1.2 * lp(rnd()) * Math.exp(-t * 7) * Math.min(1, t * 80) + 0.15 * bp(rnd()) * Math.exp(-t * 3); }
  woodKnock(x, 0.04, 0.15, 90);
  save("sofa.wav", x, 0.6);
}
// Défilement téléphone : petits tics haptiques
{
  const x = buf(1.8);
  for (let k = 0; k < 7; k++) burst(x, 0.1 + k * 0.23 + Math.random() * 0.04, 0.02, 0.6, 3800, 3, 400);
  save("scroll.wav", x, 0.35);
}
// Pluie contre la vitre (boucle 20 s)
{
  const x = buf(21), lp = biquad("lp", 3200), hp = biquad("hp", 300), lp2 = biquad("lp", 500);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.35 * hp(lp(rnd())) + 0.25 * lp2(rnd()) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.13 * t)); }
  for (let k = 0; k < 1300; k++) burst(x, Math.random() * 20.9, 0.03, 0.12 + Math.random() * 0.25, 2000 + Math.random() * 5000, 4, 200 + Math.random() * 200);
  save("rain.wav", loopable(x, 1), 0.7);
}
// Horloge en accéléré
{
  const x = buf(2.0); let t = 0, gap = 0.22;
  while (t < 1.9) { metalTick(x, t, 0.5, 4200); t += gap; gap = Math.max(0.035, gap * 0.82); }
  save("clock_ff.wav", x, 0.5);
}
// Interrupteur
{
  const x = buf(0.4);
  burst(x, 0, 0.03, 1, 3000, 1.5, 250); woodKnock(x, 0.004, 0.4, 600);
  save("switch.wav", reverb(x, 0.25));
}
// Pas feutrés du protagoniste (chaussettes sur parquet)
{
  const x = buf(2.0), lp = biquad("lp", 350);
  for (const at of [0.1, 0.62, 1.12, 1.6]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.18); i++) { const t = i / SR; x[i0 + i] += lp(rnd()) * 2.2 * Math.exp(-t * 26) * Math.min(1, t * 400); }
    woodKnock(x, at + 0.01, 0.12, 120);
  }
  save("steps_soft.wav", reverb(x, 0.3), 0.6);
}
// Ambiance chaude (frigo lointain, pièce) — boucle
{
  const x = buf(21), lp = biquad("lp", 180), lp2 = biquad("lp", 1200);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.18 * Math.sin(2 * Math.PI * 60 * t) + 0.08 * Math.sin(2 * Math.PI * 120 * t) + 0.5 * lp(rnd()) + 0.06 * lp2(rnd()); }
  save("room_warm.wav", loopable(x, 1), 0.5);
}
// Drone froid (tension, sans pulsation) — boucle
{
  const x = buf(21), lp = biquad("lp", 140), bp = biquad("bp", 600, 4);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = 0.35 * Math.sin(2 * Math.PI * 41 * t + 0.6 * Math.sin(2 * Math.PI * 0.1 * t)) + 0.22 * Math.sin(2 * Math.PI * 41.5 * t)
      + 0.12 * Math.sin(2 * Math.PI * 82.3 * t) + 0.6 * lp(rnd()) + 0.05 * bp(rnd()) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.05 * t));
  }
  save("drone.wav", loopable(x, 1.5), 0.6);
}
// Bruit sec dans la cuisine (objet qui tombe/placard)
{
  const x = buf(1.8);
  woodKnock(x, 0.0, 1, 160); metalTick(x, 0.01, 0.35, 1800); woodKnock(x, 0.14, 0.25, 210);
  const lp = biquad("lp", 1800);
  save("bang.wav", filt(reverb(x, 0.45, 1.6, 0.85), lp));
}
// Latte de parquet qui grince
{
  const x = buf(1.8);
  creak(x, 0.05, 1.3, 260, 330, 1, 35, 85); woodKnock(x, 0.05, 0.3, 140);
  save("creak.wav", fadeOut(reverb(x, 0.35, 1.3), 0.3));
}
// Porte de chambre qui se ferme (sans verrou)
{
  const x = buf(1.2);
  creak(x, 0, 0.5, 500, 560, 0.3, 50, 80); woodKnock(x, 0.52, 1, 130); metalTick(x, 0.53, 0.6, 2100);
  save("door_close.wav", reverb(x, 0.35));
}
// Alerte appli (notification)
{
  const x = buf(0.9);
  for (const [at, f] of [[0, 1318.5], [0.12, 1760]]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.6); i++) { const t = i / SR; x[i0 + i] += (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t)) * Math.exp(-t * 8) * Math.min(1, t * 600); }
  }
  save("notif.wav", reverb(x, 0.15), 0.6);
}
// Tap UI
{
  const x = buf(0.15); burst(x, 0, 0.04, 1, 2500, 2, 300); save("tap.wav", x, 0.5);
}
// Glitch numérique
{
  const x = buf(0.7); let hold = 0, v = 0;
  for (let i = 0; i < x.length; i++) {
    if (hold-- <= 0) { hold = Math.floor(30 + Math.random() * 900); v = Math.random() < 0.3 ? 0 : rnd(); }
    const t = i / SR; x[i] = (v * 0.6 + 0.3 * Math.sign(Math.sin(2 * Math.PI * (200 + 3000 * Math.random() * (v > 0)) * t)) * Math.abs(v)) * (Math.random() < 0.97 ? 1 : 0);
  }
  save("glitch.wav", filt(x, biquad("lp", 6000)), 0.5);
}
// Souffle électrique du flux caméra — boucle
{
  const x = buf(11), hp = biquad("hp", 2500), lp = biquad("lp", 9000);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.25 * lp(hp(rnd())) + 0.05 * Math.sin(2 * Math.PI * 50 * t) + 0.02 * Math.sin(2 * Math.PI * 15625 * t); }
  save("cctv_hiss.wav", loopable(x, 1), 0.35);
}
// Porte de salle de bain qui s'ouvre lentement (lointaine, via micro caméra)
{
  const x = buf(2.2);
  creak(x, 0.05, 1.9, 380, 460, 0.8, 25, 70);
  save("bathroom_door.wav", filt(fadeOut(reverb(x, 0.5, 1.5), 0.3), biquad("lp", 2500), biquad("hp", 200)));
}
// Téléphone qui tombe sur la couette
{
  const x = buf(0.6), lp = biquad("lp", 300);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = lp(rnd()) * 2 * Math.exp(-t * 18) * Math.min(1, t * 500); }
  burst(x, 0.01, 0.05, 0.15, 2000, 1, 80);
  save("phone_drop.wav", x, 0.6);
}
// Pas lourds derrière la porte (deux, le 2e s'arrête net)
{
  const x = buf(1.6), lp = biquad("lp", 260);
  for (const [at, a] of [[0.05, 0.8], [0.72, 1]]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.25); i++) { const t = i / SR; x[i0 + i] += a * lp(rnd()) * 3 * Math.exp(-t * 16) * Math.min(1, t * 300); }
    woodKnock(x, at + 0.005, a * 0.5, 95);
  }
  creak(x, 0.78, 0.35, 240, 260, 0.25, 30, 50);
  save("steps_heavy.wav", reverb(x, 0.3, 1.1), 0.95);
}
// Clé qui glisse dans la serrure (frottement + goupilles)
{
  const x = buf(1.6), bp = biquad("bp", 4200, 1.5);
  for (let i = N(0.05); i < N(0.75); i++) { const t = i / SR; x[i] += 0.25 * bp(rnd()) * Math.sin(Math.PI * (t - 0.05) / 0.7); }
  for (let k = 0; k < 5; k++) metalTick(x, 0.12 + k * 0.12, 0.6, 3600 + k * 300);
  metalTick(x, 0.78, 1, 2300); // butée
  creak(x, 1.05, 0.3, 1700, 1800, 0.2, 120, 200); metalTick(x, 1.35, 1, 1700); modal(x, 1.35, [[420, 25, 0.6]], 1); // pêne
  save("key_insert.wav", reverb(x, 0.2), 0.95);
}
// Poignée qui descend d'un coup sec
{
  const x = buf(0.6);
  metalTick(x, 0, 1, 1600); modal(x, 0, [[310, 20, 0.8], [720, 30, 0.4]], 1); burst(x, 0, 0.04, 0.8, 1200, 1, 120);
  save("handle_down.wav", reverb(x, 0.25), 0.95);
}
// Verrou (écran final)
{
  const x = buf(0.9);
  metalTick(x, 0, 1, 1700); modal(x, 0.0, [[260, 22, 0.8]], 1); metalTick(x, 0.09, 0.8, 2100); modal(x, 0.09, [[180, 18, 0.9]], 1);
  save("lock.wav", reverb(x, 0.3));
}

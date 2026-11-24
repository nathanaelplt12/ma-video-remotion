// Musique de suspense « Le double des clés » (80 s, synchronisée à la vidéo) -> public/audio/h2/score.wav
// Boîte à musique (berceuse en ré mineur) -> nappes froides, piano épars, cordes en trémolo,
// ostinato de piano, montée, silence total (70–72 s), note de verre, rappel déformé de la berceuse.
import { SR, N, buf, save, rnd, u, reseed, biquad, reverb } from "./dsp.mjs";

reseed(777);
const LEN = 80;
let x = buf(LEN);
const sections = [];
/** Chaque section a sa propre réverb, coupée net à `end` (pas de traîne qui ressurgit). */
const section = (end, fn) => { x = buf(LEN); fn(); sections.push({ x, end }); };
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const env = (t, dur, att, rel) => Math.min(1, t / att) * Math.min(1, Math.max(0, (dur - t) / rel));

/** Nappe de cordes/synthé : 3 dents de scie désaccordées par note, filtrées. */
const pad = (t0, dur, notes, amp, { att = 1, rel = 1, cut = 800, trem = 0, tremRate = 7, swell = 0 } = {}) => {
  for (const m of notes) {
    for (const d of [-0.006, 0, 0.0055]) {
      const f = hz(m) * (1 + d), lp1 = biquad("lp", cut), lp2 = biquad("lp", cut * 1.3);
      let ph = u();
      const i0 = N(t0);
      for (let i = 0; i < N(dur) && i0 + i < x.length; i++) {
        const t = i / SR;
        ph += (f * (1 + 0.002 * Math.sin(2 * Math.PI * 5.2 * t + d * 900))) / SR;
        const saw = (ph % 1) * 2 - 1;
        const tr = trem ? 1 - trem + trem * (0.5 + 0.5 * Math.sin(2 * Math.PI * tremRate * t)) ** 2 : 1;
        const sw = swell ? 1 + swell * (t / dur) : 1;
        x[i0 + i] += lp2(lp1(saw)) * amp * sw * tr * env(t, dur, att, rel) / notes.length;
      }
    }
  }
};

/** Piano : partiels légèrement inharmoniques + marteau. */
const piano = (t0, m, amp, dur = 5) => {
  const f0 = hz(m), i0 = N(t0);
  for (let n = 1; n <= 9; n++) {
    const f = n * f0 * Math.sqrt(1 + 0.0004 * n * n);
    if (f > 12000) break;
    const a = amp / Math.pow(n, 1.3), dec = 0.6 + n * 0.55 + f0 / 900;
    const ph = u() * 6.28;
    for (let i = 0; i < N(dur) && i0 + i < x.length; i++) {
      const t = i / SR;
      x[i0 + i] += a * Math.sin(2 * Math.PI * f * t + ph) * Math.exp(-dec * t) * Math.min(1, t * 1500);
    }
  }
  const bp = biquad("bp", 2500, 1);
  for (let i = 0; i < N(0.02); i++) x[i0 + i] += amp * 0.15 * bp(rnd()) * (1 - i / N(0.02));
};

/** Boîte à musique : lames métalliques (partiels 1, 2.76, 5.4), légèrement fausse. */
const musicBox = (t0, m, amp, cents = 0) => {
  const f0 = hz(m) * Math.pow(2, cents / 1200), i0 = N(t0);
  for (const [k, a, dec] of [[1, 1, 2.2], [2.76, 0.25, 7], [5.4, 0.12, 14], [8.9, 0.05, 25]]) {
    const ph = u() * 6.28;
    for (let i = 0; i < N(2.5) && i0 + i < x.length; i++) {
      const t = i / SR;
      x[i0 + i] += amp * a * Math.sin(2 * Math.PI * f0 * k * t + ph) * Math.exp(-dec * t) * Math.min(1, t * 3000);
    }
  }
};

/** Note de verre / scie musicale : battements lents, vibrato. */
const glass = (t0, dur, m, amp) => {
  const f = hz(m), i0 = N(t0);
  for (let i = 0; i < N(dur) && i0 + i < x.length; i++) {
    const t = i / SR, v = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
    x[i0 + i] += amp * env(t, dur, dur * 0.4, dur * 0.3) *
      (Math.sin(2 * Math.PI * f * v * t) + 0.8 * Math.sin(2 * Math.PI * f * 1.007 * v * t) + 0.15 * Math.sin(2 * Math.PI * f * 2.01 * t));
  }
};

/** Montée : bruit filtré qui s'ouvre + glissando. */
const riser = (t0, dur, amp) => {
  const i0 = N(t0); let ph = 0; let bp = biquad("bp", 300, 2);
  for (let i = 0; i < N(dur); i++) {
    const t = i / SR, k = t / dur;
    if (i % 64 === 0) bp = biquad("bp", 300 + 3500 * k * k, 2);
    ph += (80 + 600 * k * k) / SR;
    x[i0 + i] += amp * k * k * (bp(rnd()) * 0.8 + 0.25 * Math.sin(2 * Math.PI * ph));
  }
};

/** Cuivre grave (« braam » doux). */
const brass = (t0, dur, notes, amp) => pad(t0, dur, notes, amp, { att: 0.08, rel: dur * 0.7, cut: 500 });

section(18.42, () => {
/* ------------------------------ 0–4 s : hook ------------------------------ */
pad(0, 4.1, [38, 39], 0.35, { att: 0.05, rel: 0.3, cut: 500 });
pad(0, 4.1, [81, 82], 0.06, { att: 0.3, rel: 0.3, cut: 4000, trem: 0.8, tremRate: 9 });
piano(0.0, 26, 0.7); piano(0.0, 38, 0.5);
piano(2.0, 26, 0.6); piano(2.0, 39, 0.35);

/* ------------------- 4–18.4 s : berceuse rassurante (chaud) ------------------- */
const beat = 0.45;
const tune = [81, 77, 74, 77, 81, 79, 77, 76, 74, 76, 77, 81, 79, 0, 0, 0, 81, 77, 74, 77, 82, 81, 79, 77, 76, 74, 73, 76, 74, 0, 0, 0];
tune.forEach((m, i) => { if (m) musicBox(4.0 + i * beat, m, 0.22, (u() - 0.5) * 18); });
[[4.0, [62, 65, 69]], [7.6, [58, 62, 65]], [11.2, [55, 58, 62]], [14.8, [57, 61, 64]]].forEach(([t, ch]) =>
  pad(t, 3.75, ch, 0.12, { att: 0.8, rel: 0.6, cut: 900 }));
pad(4.0, 14.4, [38], 0.08, { att: 1.5, rel: 0.2, cut: 300 });

});
section(70.0, () => {
/* --------------- 18.5–32 s : lumière éteinte, détail étrange (froid) --------------- */
piano(18.5, 26, 0.8); piano(18.5, 27, 0.4);
pad(18.6, 13.4, [38, 45, 52], 0.2, { att: 2.5, rel: 1, cut: 420 });
[[20.0, 81], [22.1, 82], [24.0, 81], [26.0, 76], [26.05, 77], [28.1, 86], [30.0, 73]].forEach(([t, m]) => piano(t, m, 0.22, 6));
glass(22.0, 5, 88, 0.035);
pad(26.0, 4, [39, 51], 0.16, { att: 1.5, rel: 1.5, cut: 350 });

/* ------------------ 32–46 s : le bruit, quelqu'un est là ------------------ */
pad(32.0, 3.45, [50, 51], 0.12, { att: 0.5, rel: 0.05, cut: 1200, trem: 0.7, tremRate: 7, swell: 0.8 });
pad(36.0, 10, [77, 78, 79], 0.05, { att: 2, rel: 0.6, cut: 3500, trem: 0.6, tremRate: 8, swell: 1.8 });
pad(36.0, 10, [38, 44], 0.2, { att: 1.2, rel: 0.6, cut: 380 });
[38, 40, 42, 44].forEach((t) => piano(t, 26, 0.45, 4));

/* ------------------ 46–62 s : la caméra du salon ------------------ */
{
  const ost = [50, 57, 63, 57];
  for (let k = 0, t = 46.0; t < 61.0; k++, t += 0.3) piano(t, ost[k % 4], 0.1 + 0.22 * ((t - 46) / 15), 1.2);
}
pad(46.0, 16, [38, 45, 46], 0.15, { att: 2, rel: 1, cut: 450, swell: 0.8 });
glass(50.0, 6, 93, 0.025);
riser(57.5, 3.5, 0.3);
brass(61.0, 3.5, [26, 38, 45], 0.5);
pad(61.0, 9, [80, 81, 82, 83], 0.07, { att: 0.05, rel: 0.05, cut: 4500, trem: 0.5, tremRate: 10, swell: 2.5 });

/* ------------------ 62–70 s : il vient vers la chambre ------------------ */
pad(62.0, 8.0, [38, 39, 45, 50, 51], 0.18, { att: 1, rel: 0.02, cut: 700, trem: 0.4, tremRate: 6, swell: 2.2 });
riser(66.0, 4.0, 0.25);

});
/* 70–72 s : SILENCE TOTAL */
section(74.55, () => {
/* ------------------ 72–74.5 s : la clé ------------------ */
glass(72.0, 2.55, 93, 0.03); glass(72.0, 2.55, 94, 0.025);

});
section(80, () => {
/* ------------------ 76–80 s : écran final, berceuse déformée ------------------ */
[81, 77, 74, 77, 81, 79].forEach((m, i) => musicBox(76.1 + i * 0.6 + i * i * 0.03, m, 0.2, -i * 22));
pad(76.0, 4, [38, 45], 0.12, { att: 0.5, rel: 1.5, cut: 400 });

});

/* ------------------------------ mixage ------------------------------ */
const out = buf(LEN);
for (const sec of sections) {
  const wet = reverb(sec.x, 0.38, 2.4, 0.87);
  const e = N(sec.end), fade = N(0.02);
  for (let i = 0; i < out.length; i++) {
    const g = i < e - fade ? 1 : i < e ? (e - i) / fade : 0;
    out[i] += wet[i] * g;
  }
}
const hp = biquad("hp", 30);
for (let i = 0; i < out.length; i++) out[i] = hp(out[i]);
for (let i = N(70); i < N(72); i++) out[i] = 0; // silence total garanti
save("score.wav", out, 0.85);

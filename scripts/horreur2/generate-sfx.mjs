// Bruitages « Le double des clés » synthétisés -> public/audio/h2/*.wav
import {
  SR, N, buf, save, rnd, u, biquad, filt, modal, burst, clink, keyVoice, jingle,
  woodKnock, creak, reverb, fadeOut, loopable,
} from "./dsp.mjs";

/* ---------- serrurerie (mécanismes) ---------- */
// Clic de mécanisme de serrure : pêne/ressort, plus mat et plus grave qu'une clé
const latch = (x, at, amp = 1, f = 1500) => {
  clink(x, at, amp * 0.8, [f, f * 1.6, f * 2.5, f * 3.7], 30);
  modal(x, at, [[f * 0.28, 35, 0.6], [f * 0.55, 45, 0.3]], amp * 0.6);
  burst(x, at, 0.02, amp * 0.6, 2500, 1, 200);
};

// Poignée qui tourne seule : frottement métallique sourd + ressort qui se tend + loquet
{
  const x = buf(2.2), bp = biquad("bp", 1800, 3), lp = biquad("lp", 3000);
  for (let i = 0; i < N(1.7); i++) {
    const t = i / SR, k = t / 1.7;
    const grit = (u() < 0.02 ? rnd() * 3 : 0) + rnd() * 0.3;
    x[i] += 0.5 * lp(bp(grit)) * Math.sin(Math.PI * Math.min(1, k * 1.1)) * (0.6 + 0.4 * Math.sin(t * 23));
  }
  creak(x, 0.2, 1.3, 2400, 0.12, 120, 260); // ressort
  latch(x, 0.03, 0.5, 1700); latch(x, 1.72, 1, 1400);
  save("handle_turn.wav", fadeOut(reverb(x, 0.25), 0.2));
}

// Clés posées dans le vide-poche : cliquetis réaliste + choc céramique + rebonds
{
  const x = buf(1.6);
  jingle(x, 0.0, 0.45, 0.7, 4);
  // impact dans la coupelle : céramique (modes moyens, plus longs) + toutes les clés
  modal(x, 0.47, [[1180, 22, 0.5], [2730, 30, 0.35], [4120, 40, 0.2]], 0.5);
  for (let k = 0; k < 6; k++) clink(x, 0.47 + k * 0.006 * u(), 1, keyVoice(2900 + k * 450));
  // rebonds et petit glissement
  for (const [d, a] of [[0.09, 0.45], [0.16, 0.3], [0.21, 0.2], [0.26, 0.12]])
    for (let k = 0; k < 3; k++) clink(x, 0.47 + d + 0.01 * u(), a * (0.6 + 0.4 * u()), keyVoice(3000 + u() * 2000));
  save("keys_tray.wav", reverb(x, 0.18, 0.8));
}

// Trousseau qui se balance dans la main (entendu via le micro de la caméra)
{
  const x = buf(1.8);
  jingle(x, 0.05, 1.6, 1, 2.4);
  save("keys_jingle.wav", filt(reverb(x, 0.35, 1.3), biquad("lp", 6500), biquad("hp", 400)));
}

// Clé qui glisse dans la serrure : frottement + goupilles une à une + rotation + pêne
{
  const x = buf(1.7), bp = biquad("bp", 4800, 1.2);
  for (let i = N(0.05); i < N(0.75); i++) { const t = i / SR; x[i] += 0.2 * bp(rnd()) * Math.sin(Math.PI * (t - 0.05) / 0.7); }
  for (let k = 0; k < 5; k++) clink(x, 0.12 + k * 0.12 + 0.02 * u(), 0.55, keyVoice(3800 + k * 250));
  latch(x, 0.8, 0.8, 1900); // butée
  const fr = biquad("bp", 1400, 4);
  for (let i = N(1.0); i < N(1.33); i++) x[i] += 0.25 * fr(rnd()) * Math.sin(Math.PI * (i / SR - 1.0) / 0.33);
  latch(x, 1.35, 1.2, 1300); // le pêne recule
  save("key_insert.wav", reverb(x, 0.2), 0.95);
}

// Poignée qui descend d'un coup sec
{
  const x = buf(0.8);
  latch(x, 0, 1.3, 1300); modal(x, 0, [[290, 22, 0.9], [640, 30, 0.4]], 1); woodKnock(x, 0.004, 0.5, 140);
  save("handle_down.wav", reverb(x, 0.25), 0.95);
}

// Double tour de verrou (écran final)
{
  const x = buf(1.0);
  latch(x, 0, 1, 1600); modal(x, 0, [[240, 20, 0.8]], 0.8);
  latch(x, 0.16, 1.1, 1450); modal(x, 0.16, [[200, 18, 0.9]], 0.9);
  save("lock.wav", reverb(x, 0.3));
}

/* ---------- maison ---------- */
// Porte d'entrée : serrure + gond qui grince + air extérieur
{
  const x = buf(1.9);
  latch(x, 0.0, 1, 1700);
  creak(x, 0.18, 1.0, 380, 0.35, 30, 70);
  const lp = biquad("lp", 500);
  for (let i = N(0.1); i < x.length; i++) x[i] += 0.12 * lp(rnd()) * Math.exp(-(i / SR - 0.1) * 1.5);
  save("door_open.wav", fadeOut(reverb(x, 0.3, 1.2), 0.3));
}

// Micro-ondes : ronron + relais + 3 bips (le 1er bip à 1.45 s)
{
  const x = buf(2.6), lp = biquad("lp", 900);
  for (let i = 0; i < N(1.35); i++) { const t = i / SR; x[i] = 0.2 * Math.sin(2 * Math.PI * 100 * t) + 0.1 * Math.sin(2 * Math.PI * 200 * t) + 0.25 * lp(rnd()); }
  latch(x, 1.35, 0.25, 1500);
  for (let b = 0; b < 3; b++) {
    const s = N(1.45 + b * 0.28);
    for (let i = 0; i < N(0.17); i++) { const t = i / SR; x[s + i] += 0.45 * Math.tanh(2.5 * Math.sin(2 * Math.PI * 2050 * t)) * Math.min(1, t * 300) * Math.min(1, (0.17 - t) * 300); }
  }
  save("microwave.wav", reverb(x, 0.18));
}

// Canapé : coussin + tissu
{
  const x = buf(1.0), lp = biquad("lp", 250), bp = biquad("bp", 2500, 0.7);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 1.2 * lp(rnd()) * Math.exp(-t * 7) * Math.min(1, t * 80) + 0.12 * bp(rnd()) * Math.exp(-t * 3); }
  save("sofa.wav", x, 0.6);
}
// Défilement : tics haptiques doux
{
  const x = buf(1.8);
  for (let k = 0; k < 7; k++) burst(x, 0.1 + k * 0.23 + u() * 0.04, 0.02, 0.6, 3800, 3, 400);
  save("scroll.wav", x, 0.3);
}
// Pluie lointaine (boucle) : surtout grave/médium, très douce
{
  const x = buf(21), lp = biquad("lp", 1800), hp = biquad("hp", 200), lp2 = biquad("lp", 400);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.25 * hp(lp(rnd())) + 0.3 * lp2(rnd()) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.13 * t)); }
  for (let k = 0; k < 700; k++) burst(x, u() * 20.9, 0.03, 0.08 + u() * 0.12, 1500 + u() * 2500, 3, 200 + u() * 200);
  save("rain.wav", loopable(x, 1), 0.6);
}
// Horloge en accéléré
{
  const x = buf(2.0); let t = 0, gap = 0.22;
  while (t < 1.9) { clink(x, t, 0.5, [4200, 6100, 8300], 25); t += gap; gap = Math.max(0.035, gap * 0.82); }
  save("clock_ff.wav", x, 0.45);
}
// Interrupteur
{
  const x = buf(0.4);
  burst(x, 0, 0.03, 1, 3000, 1.5, 250); woodKnock(x, 0.004, 0.4, 600);
  save("switch.wav", reverb(x, 0.25));
}
// Pas feutrés
{
  const x = buf(2.0), lp = biquad("lp", 350);
  for (const at of [0.1, 0.62, 1.12, 1.6]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.18); i++) { const t = i / SR; x[i0 + i] += lp(rnd()) * 2.2 * Math.exp(-t * 26) * Math.min(1, t * 400); }
    woodKnock(x, at + 0.01, 0.1, 120);
  }
  save("steps_soft.wav", reverb(x, 0.3), 0.6);
}
// Ambiance chaude
{
  const x = buf(21), lp = biquad("lp", 180), lp2 = biquad("lp", 1200);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.15 * Math.sin(2 * Math.PI * 60 * t) + 0.06 * Math.sin(2 * Math.PI * 120 * t) + 0.5 * lp(rnd()) + 0.05 * lp2(rnd()); }
  save("room_warm.wav", loopable(x, 1), 0.5);
}
// Drone froid (sans pulsation)
{
  const x = buf(21), lp = biquad("lp", 140), bp = biquad("bp", 600, 4);
  for (let i = 0; i < x.length; i++) {
    const t = i / SR;
    x[i] = 0.35 * Math.sin(2 * Math.PI * 41 * t + 0.6 * Math.sin(2 * Math.PI * 0.1 * t)) + 0.22 * Math.sin(2 * Math.PI * 41.5 * t)
      + 0.12 * Math.sin(2 * Math.PI * 82.3 * t) + 0.6 * lp(rnd()) + 0.05 * bp(rnd()) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.05 * t));
  }
  save("drone.wav", loopable(x, 1.5), 0.6);
}
// Bruit sec dans la cuisine : porte de placard qui claque + vaisselle qui tinte (étouffé, lointain)
{
  const x = buf(2.0);
  woodKnock(x, 0.0, 1, 150); woodKnock(x, 0.012, 0.5, 230);
  for (let k = 0; k < 7; k++) clink(x, 0.01 + u() * 0.12, 0.25 * (1 - k / 8), [1900 + u() * 800, 3300 + u() * 900, 5200], 60);
  save("bang.wav", filt(reverb(x, 0.45, 1.7, 0.85), biquad("lp", 1600)));
}
// Latte de parquet
{
  const x = buf(1.8);
  creak(x, 0.05, 1.3, 260, 1, 35, 85); woodKnock(x, 0.05, 0.3, 140);
  save("creak.wav", fadeOut(reverb(x, 0.35, 1.3), 0.3));
}
// Porte de chambre qui se ferme
{
  const x = buf(1.2);
  creak(x, 0, 0.5, 500, 0.25, 50, 80); woodKnock(x, 0.52, 1, 130); latch(x, 0.53, 0.6, 1800);
  save("door_close.wav", reverb(x, 0.35));
}
// Alerte appli
{
  const x = buf(0.9);
  for (const [at, f] of [[0, 1318.5], [0.12, 1760]]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.6); i++) { const t = i / SR; x[i0 + i] += (Math.sin(2 * Math.PI * f * t) + 0.25 * Math.sin(2 * Math.PI * f * 2 * t)) * Math.exp(-t * 8) * Math.min(1, t * 600); }
  }
  save("notif.wav", reverb(x, 0.15), 0.6);
}
// Tap UI
{ const x = buf(0.15); burst(x, 0, 0.04, 1, 2500, 2, 300); save("tap.wav", x, 0.5); }
// Glitch numérique (moins agressif)
{
  const x = buf(0.6); let hold = 0, v = 0;
  for (let i = 0; i < x.length; i++) {
    if (hold-- <= 0) { hold = Math.floor(30 + u() * 900); v = u() < 0.35 ? 0 : rnd(); }
    x[i] = v * 0.5 + 0.2 * rnd() * Math.abs(v);
  }
  save("glitch.wav", filt(fadeOut(x, 0.1), biquad("lp", 4500)), 0.45);
}
// Souffle du flux caméra
{
  const x = buf(11), hp = biquad("hp", 2500), lp = biquad("lp", 9000);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = 0.25 * lp(hp(rnd())) + 0.05 * Math.sin(2 * Math.PI * 50 * t); }
  save("cctv_hiss.wav", loopable(x, 1), 0.3);
}
// Porte de salle de bain qui s'ouvre lentement
{
  const x = buf(2.2);
  creak(x, 0.05, 1.9, 380, 0.8, 25, 70);
  save("bathroom_door.wav", filt(fadeOut(reverb(x, 0.5, 1.5), 0.3), biquad("lp", 2500), biquad("hp", 200)));
}
// Téléphone sur la couette
{
  const x = buf(0.6), lp = biquad("lp", 300);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = lp(rnd()) * 2 * Math.exp(-t * 18) * Math.min(1, t * 500); }
  save("phone_drop.wav", x, 0.6);
}
// Deux pas lourds, le 2e s'arrête net
{
  const x = buf(1.6), lp = biquad("lp", 260);
  for (const [at, a] of [[0.05, 0.8], [0.72, 1]]) {
    const i0 = N(at);
    for (let i = 0; i < N(0.25); i++) { const t = i / SR; x[i0 + i] += a * lp(rnd()) * 3 * Math.exp(-t * 16) * Math.min(1, t * 300); }
    woodKnock(x, at + 0.005, a * 0.5, 95);
  }
  creak(x, 0.78, 0.35, 240, 0.25, 30, 50);
  save("steps_heavy.wav", reverb(x, 0.3, 1.1), 0.95);
}

/* ---------- design sonore cinéma ---------- */
// Impact grave cinématographique (sub qui chute + souffle + longue queue)
{
  const x = buf(3.0), lp = biquad("lp", 300); let ph = 0;
  for (let i = 0; i < x.length; i++) {
    const t = i / SR; ph += (2 * Math.PI * (32 + 55 * Math.exp(-t * 6))) / SR;
    x[i] = Math.sin(ph) * Math.exp(-t * 1.6) * Math.min(1, t * 200) + 0.5 * lp(rnd()) * Math.exp(-t * 5);
  }
  save("impact.wav", fadeOut(reverb(x, 0.35, 2.2, 0.88), 0.5));
}
// Whoosh grave
{
  const x = buf(0.6), bp = biquad("bp", 260, 0.8);
  for (let i = 0; i < x.length; i++) { const t = i / SR; x[i] = bp(rnd()) * Math.sin(Math.PI * Math.min(1, t / 0.6)) ** 2; }
  save("whoosh.wav", x, 0.5);
}
// Stinger : cluster de cordes aiguës qui « crie » puis s'éteint (sans être brutal)
{
  const x = buf(3.0);
  const notes = [1046.5, 1108.7, 1174.7, 1244.5, 523.3, 554.4];
  for (const f of notes) {
    let ph = 0; const det = 1 + (u() - 0.5) * 0.01; const lp = biquad("lp", 4000);
    for (let i = 0; i < x.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * f * det * (1 + 0.004 * Math.sin(2 * Math.PI * 6 * t))) / SR;
      const saw = ((ph / (2 * Math.PI)) % 1) * 2 - 1;
      x[i] += lp(saw) * 0.15 * Math.min(1, t / 0.03) * Math.exp(-t * 1.4);
    }
  }
  const bw = biquad("bp", 3000, 0.8);
  for (let i = 0; i < x.length; i++) x[i] += bw(rnd()) * 0.25 * Math.exp(-(i / SR) * 3);
  save("stinger.wav", fadeOut(reverb(x, 0.45, 2.2, 0.86), 0.6), 0.8);
}

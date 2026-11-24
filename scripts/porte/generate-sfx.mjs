// Bruitages de « horreur-porte », synthétisés par code (.wav mono 16 bits, 44.1 kHz) dans public/audio/
// Usage : node scripts/porte/generate-sfx.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "audio");
mkdirSync(OUT, { recursive: true });

let seed = 4242;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const TAU = 2 * Math.PI;

const wav = (name, samples, gain = 0.95) => {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const k = peak > 0 ? gain / peak : 1;
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * k)) * 32767), 44 + i * 2));
  writeFileSync(join(OUT, name), buf);
  console.log(name.padEnd(14), (samples.length / SR).toFixed(2) + "s");
};
const make = (sec, fn) => Array.from({ length: Math.floor(sec * SR) }, (_, i) => fn(i / SR, i));
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };
const hp = (a) => { const l = lp(a); return (x) => x - l(x); };

// knock.wav : UN coup sourd sur une porte en bois (déclenché 3× dans la vidéo), 0.45 s
{
  const n = lp(0.08);
  wav("knock.wav", make(0.45, (t) => {
    const body = Math.sin(TAU * 92 * t) * Math.exp(-t * 28) + 0.6 * Math.sin(TAU * 185 * t + 0.4) * Math.exp(-t * 40);
    const wood = 0.5 * Math.sin(TAU * 410 * t) * Math.exp(-t * 70);
    const hit = n(rnd()) * Math.exp(-t * 90) * 2.5;
    return Math.tanh(1.6 * (body + wood + hit));
  }));
}

// notif.wav : bip de notification (deux notes claires), 0.6 s
wav("notif.wav", make(0.6, (t) => {
  const note = (f, t0) => (t >= t0 ? (Math.sin(TAU * f * (t - t0)) + 0.3 * Math.sin(TAU * 2 * f * (t - t0))) * Math.exp(-(t - t0) * 9) * Math.min(1, (t - t0) / 0.004) : 0);
  return note(1318.5, 0) * 0.8 + note(1760, 0.12);
}), 0.8);

// heartbeat.wav : un battement « lub-dub » (rejoué au rythme du BPM du HUD), 0.5 s
{
  const l1 = lp(0.05), l2 = lp(0.05);
  wav("heartbeat.wav", make(0.5, (t) => {
    const lub = Math.sin(TAU * (48 + 30 * Math.exp(-t * 30)) * t) * Math.exp(-t * 22) + l1(rnd()) * Math.exp(-t * 30) * 3;
    const t2 = t - 0.16;
    const dub = t2 > 0 ? 0.7 * Math.sin(TAU * (58 + 30 * Math.exp(-t2 * 30)) * t2) * Math.exp(-t2 * 26) + l2(rnd()) * Math.exp(-t2 * 35) * 2 : 0;
    return Math.tanh(2 * (lub + dub));
  }));
}

// jumpscare.wav : impact sub-bass + cri strident saturé, 2.5 s
{
  const n = lp(0.5); let ph = 0;
  wav("jumpscare.wav", make(2.5, (t) => {
    const f = 60 * Math.exp(-t * 1.5) + 28; ph += (TAU * f) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.8) * 1.3;
    const crack = rnd() * Math.exp(-t * 16) * 1.2;
    const scream = t < 1.5
      ? (Math.tanh(5 * Math.sin(TAU * (820 + 420 * Math.sin(TAU * 9 * t) + 250 * t) * t)) * 0.4 +
         Math.tanh(4 * Math.sin(TAU * (1190 + 300 * Math.sin(TAU * 13 * t)) * t)) * 0.25) * Math.exp(-t * 1.9) * (0.7 + 0.3 * n(rnd()))
      : 0;
    return Math.tanh(1.9 * (boom + crack + scream));
  }));
}

// rewind.wav : bande magnétique qui rembobine, 2.5 s
{
  const n = lp(0.25); let ph = 0;
  wav("rewind.wav", make(2.5, (t) => {
    const f = 700 + 900 * t + 400 * Math.sin(TAU * 11 * t); ph += (TAU * f) / SR;
    const env = Math.min(1, t / 0.08) * Math.min(1, (2.5 - t) / 0.25);
    return env * (0.25 * Math.sign(Math.sin(ph)) + 0.8 * n(rnd()) * (0.6 + 0.4 * Math.sin(TAU * 23 * t)));
  }), 0.7);
}

// drone.wav : nappe d'ambiance grave de chambre la nuit, 20 s bouclable (fréquences entières)
{
  const n = lp(0.01), h = hp(0.002);
  wav("drone.wav", make(20, (t) =>
    0.5 * Math.sin(TAU * 41 * t) + 0.3 * Math.sin(TAU * 62 * t + 1) + 0.12 * Math.sin(TAU * 123 * t) * (0.5 + 0.5 * Math.sin(TAU * 0.25 * t)) +
    0.9 * h(n(rnd())) * (0.7 + 0.3 * Math.sin(TAU * 0.1 * t))), 0.6);
}

// creak.wav : grincement de poignée / de porte, 1.6 s
{
  const n = lp(0.3); let ph = 0;
  wav("creak.wav", make(1.6, (t) => {
    const f = 180 + 90 * Math.sin(TAU * 0.7 * t) + 40 * Math.sin(TAU * 5 * t); ph += (TAU * f) / SR;
    const stick = 0.5 + 0.5 * Math.sign(Math.sin(TAU * (28 + 10 * t) * t));
    const env = Math.min(1, t / 0.1) * Math.min(1, (1.6 - t) / 0.3);
    return env * stick * (Math.tanh(3 * Math.sin(ph)) * 0.6 + 0.4 * n(rnd()));
  }), 0.7);
}

// slam.wav : porte qui claque, 1.2 s
{
  const n = lp(0.15);
  wav("slam.wav", make(1.2, (t) => {
    const body = Math.sin(TAU * (70 + 40 * Math.exp(-t * 20)) * t) * Math.exp(-t * 6);
    const rattle = n(rnd()) * Math.exp(-t * 12) * 2.5;
    return Math.tanh(2.2 * (body + rattle + rnd() * Math.exp(-t * 60)));
  }));
}

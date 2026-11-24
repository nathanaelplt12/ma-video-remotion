// Synthétise les bruitages en .wav (mono 16 bits, 44.1 kHz) dans public/audio/
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
mkdirSync(OUT, { recursive: true });

let seed = 1337;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const wav = (name, samples) => {
  let peak = 0;
  for (const s of samples) peak = Math.max(peak, Math.abs(s));
  const k = peak > 0 ? 0.95 / peak : 1;
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write("WAVEfmt ", 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s * k)) * 32767), 44 + i * 2));
  writeFileSync(join(OUT, name), buf);
  console.log(name, (samples.length / SR).toFixed(1) + "s");
};
const make = (sec, fn) => Array.from({ length: Math.floor(sec * SR) }, (_, i) => fn(i / SR, i));
const lp = (a) => { let y = 0; return (x) => (y += a * (x - y)); };

// hum.wav : bourdonnement grave d'ascenseur, 20 s, bouclable (fréquences entières)
{
  const n = lp(0.02);
  wav("hum.wav", make(20, (t) =>
    0.6 * Math.sin(2 * Math.PI * 50 * t) + 0.35 * Math.sin(2 * Math.PI * 100 * t) +
    0.15 * Math.sin(2 * Math.PI * 150 * t + 1) + 0.5 * n(rnd()) * (0.8 + 0.2 * Math.sin(2 * Math.PI * 0.5 * t))));
}
// vibrate.wav : 3 bourdonnements de vibreur, 1.6 s
wav("vibrate.wav", make(1.6, (t) => {
  const seg = t % 0.5, on = t < 1.5 && seg < 0.32 ? 1 : 0;
  const env = on * Math.min(1, seg / 0.02) * Math.min(1, (0.32 - seg) / 0.03);
  return env * (Math.sin(2 * Math.PI * 160 * t) * (0.7 + 0.3 * Math.sin(2 * Math.PI * 28 * t)) + 0.2 * rnd());
}));
// jumpscare.wav : impact sub-bass + cri saturé, 3 s
{
  const n = lp(0.4); let ph = 0;
  wav("jumpscare.wav", make(3, (t) => {
    const f = 55 * Math.exp(-t * 1.2) + 30; ph += (2 * Math.PI * f) / SR;
    const boom = Math.sin(ph) * Math.exp(-t * 1.6) * 1.2;
    const crack = rnd() * Math.exp(-t * 14);
    const scream = t < 1.4 ? Math.tanh(4 * Math.sin(2 * Math.PI * (700 + 500 * Math.sin(2 * Math.PI * 7 * t) + 300 * t) * t)) * 0.35 * Math.exp(-t * 2.2) * n(1) : 0;
    return Math.tanh(1.8 * (boom + crack + scream));
  }));
}
// rewind.wav : bande magnétique accélérée, 3 s
{
  const n = lp(0.25); let ph = 0;
  wav("rewind.wav", make(3, (t) => {
    const f = 900 + 500 * Math.sin(2 * Math.PI * 11 * t) + 200 * Math.sin(2 * Math.PI * 37 * t); ph += (2 * Math.PI * f) / SR;
    const env = Math.min(1, t / 0.1) * Math.min(1, (3 - t) / 0.3);
    return env * (0.35 * Math.sign(Math.sin(ph)) * 0.6 + 0.8 * n(rnd()) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 23 * t)));
  }));
}

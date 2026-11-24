import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import voice from "./voice.json";
import { SHOTS } from "./shots";
import { Subs } from "./Subs";
import { FONT, FPS, H, SHOT, TOTAL, W, lightAt, mix, warmth } from "./look";

const a = (n: string) => staticFile(`audio/h2/${n}`);
const SILENCE_FROM = 2100; // 70 s : silence total
const SILENCE_TO = 2160;

/** Bruitages ponctuels calés sur les coupes (frame absolue). */
const SFX: { at: number; f: string; v: number }[] = [
  { at: 0, f: "handle_turn.wav", v: 0.9 }, { at: 0, f: "impact.wav", v: 0.45 },
  { at: 60, f: "whoosh.wav", v: 0.7 }, { at: 60, f: "impact.wav", v: 0.3 },
  { at: 120, f: "door_open.wav", v: 0.75 }, { at: 140, f: "steps_soft.wav", v: 0.45 },
  { at: 188, f: "keys_tray.wav", v: 0.9 },
  { at: 238, f: "microwave.wav", v: 0.55 },
  { at: 306, f: "sofa.wav", v: 0.7 },
  { at: 362, f: "notif.wav", v: 0.5 }, { at: 372, f: "scroll.wav", v: 0.4 },
  { at: 480, f: "clock_ff.wav", v: 0.6 }, { at: 480, f: "whoosh.wav", v: 0.4 },
  { at: 555, f: "switch.wav", v: 0.95 }, { at: 556, f: "impact.wav", v: 0.3 },
  { at: 600, f: "steps_soft.wav", v: 0.5 },
  { at: 660, f: "whoosh.wav", v: 0.5 }, { at: 664, f: "stinger.wav", v: 0.22 },
  { at: 914, f: "door_close.wav", v: 0.8 },
  { at: 962, f: "scroll.wav", v: 0.35 },
  { at: 1062, f: "bang.wav", v: 1 },
  { at: 1080, f: "whoosh.wav", v: 0.6 }, { at: 1080, f: "impact.wav", v: 0.3 },
  { at: 1202, f: "creak.wav", v: 1 },
  { at: 1264, f: "steps_heavy.wav", v: 0.45 }, { at: 1322, f: "notif.wav", v: 0.6 },
  { at: 1399, f: "tap.wav", v: 0.8 }, { at: 1402, f: "notif.wav", v: 0.55 },
  { at: 1449, f: "glitch.wav", v: 0.5 },
  { at: 1452, f: "tap.wav", v: 0.5 }, { at: 1488, f: "stinger.wav", v: 0.2 }, { at: 1500, f: "glitch.wav", v: 0.4 },
  { at: 1562, f: "bathroom_door.wav", v: 0.9 },
  { at: 1622, f: "steps_soft.wav", v: 0.35 },
  { at: 1682, f: "keys_jingle.wav", v: 0.6 }, { at: 1688, f: "glitch.wav", v: 0.3 },
  { at: 1740, f: "whoosh.wav", v: 0.6 }, { at: 1740, f: "impact.wav", v: 0.3 },
  { at: 1830, f: "impact.wav", v: 0.6 }, { at: 1830, f: "stinger.wav", v: 0.45 }, { at: 1830, f: "glitch.wav", v: 0.6 },
  { at: 1862, f: "steps_soft.wav", v: 0.35 },
  { at: 1930, f: "phone_drop.wav", v: 0.9 },
  { at: 2040, f: "steps_heavy.wav", v: 1 },
  // 2100–2160 : SILENCE TOTAL
  { at: 2162, f: "key_insert.wav", v: 1 },
  { at: 2233, f: "handle_down.wav", v: 1 }, { at: 2238, f: "impact.wav", v: 0.8 },
  { at: 2260, f: "glitch.wav", v: 0.35 }, { at: 2270, f: "glitch.wav", v: 0.25 }, { at: 2280, f: "glitch.wav", v: 0.6 }, { at: 2282, f: "lock.wav", v: 0.8 }, { at: 2308, f: "glitch.wav", v: 0.4 },
  { at: 2340, f: "glitch.wav", v: 0.5 }, { at: 2342, f: "notif.wav", v: 0.5 }, { at: 2390, f: "glitch.wav", v: 0.5 },
];

/** Ambiances en boucle avec automation de volume (frame absolue). */
const BEDS: { f: string; from: number; to: number; vol: (abs: number) => number }[] = [
  { f: "drone.wav", from: 0, to: 130, vol: (t) => interpolate(t, [0, 110, 130], [0.3, 0.3, 0], { extrapolateRight: "clamp" }) },
  { f: "room_warm.wav", from: 120, to: 560, vol: () => 0.3 },
  { f: "rain.wav", from: 425, to: SILENCE_FROM, vol: (t) => interpolate(t, [425, 470, 556, 600, 900, 1380, 2090, 2100], [0, 0.07, 0.07, 0.05, 0.035, 0.03, 0.03, 0], { extrapolateRight: "clamp" }) },
  { f: "drone.wav", from: 556, to: SILENCE_FROM, vol: (t) => interpolate(t, [556, 700, 1060, 1380, 1800, 2040, 2096, 2100], [0.04, 0.08, 0.14, 0.18, 0.24, 0.3, 0.3, 0], { extrapolateRight: "clamp" }) },
  { f: "cctv_hiss.wav", from: 1500, to: 1740, vol: () => 0.22 },
  { f: "cctv_hiss.wav", from: 1800, to: 1920, vol: () => 0.22 },
  { f: "drone.wav", from: SILENCE_TO, to: 2238, vol: () => 0.25 },
];

/** Musique : baissée (« ducking ») pendant que la voix parle, pour rester en fond. */
const VOICE_SPANS = Object.values(voice).map((v) => {
  const w = v.words;
  return [v.at + Math.round(w[0].t * FPS), v.at + Math.round((w[w.length - 1].t + w[w.length - 1].d) * FPS)];
});
const scoreVol = (fr: number) => {
  const d = Math.min(...VOICE_SPANS.map(([s, e]) => (fr < s ? s - fr : fr > e ? fr - e : 0)));
  return 0.5 * interpolate(d, [0, 8], [0.45, 1], { extrapolateRight: "clamp" });
};

const Bed: React.FC<{ f: string; from: number; vol: (abs: number) => number }> = ({ f, from, vol }) => (
  <Audio src={a(f)} loop volume={(fr) => vol(fr + from)} />
);

/** Heure de l'histoire en haut à gauche (safe zone). */
const Hud: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  let label = "";
  let since = 0;
  if (f >= 120 && f < 480) { label = "SAMEDI • 02:47"; since = 120; }
  else if (f >= 540 && f < 960) { label = "SAMEDI • 04:00"; since = 540; }
  else if (f >= 960 && f < 1380) { label = "SAMEDI • 04:12"; since = 960; }
  else if ((f >= 1740 && f < 1800) || (f >= 1920 && f < 2238)) { label = "SAMEDI • 04:13"; since = f < 1800 ? 1740 : 1920; }
  if (!label) return null;
  const pop = spring({ frame: f - since, fps, config: { damping: 12, stiffness: 260 } });
  const w = warmth(f);
  return (
    <div style={{ position: "absolute", left: 64, top: 210, transform: `scale(${0.7 + 0.3 * pop})`, transformOrigin: "left center" }}>
      <div style={{
        fontFamily: FONT, fontWeight: 900, fontSize: 44, letterSpacing: 3, color: "#fff",
        background: mix("#111827", "#2a1c10", w) + "cc", border: `3px solid ${lightAt(f)}`,
        padding: "10px 24px", borderRadius: 14, boxShadow: `0 0 30px ${lightAt(f)}55`,
      }}>
        {label}
      </div>
    </div>
  );
};

/** Étalonnage global : teinte chaude -> bleu nuit glacial. */
const Grade: React.FC = () => {
  const f = useCurrentFrame();
  const w = warmth(f);
  if (f >= 2238 && f < 2280) return null;
  return (
    <>
      <AbsoluteFill style={{ background: mix("#0b0e17", "#f59e0b", w), mixBlendMode: "soft-light", opacity: 0.35 }} />
      <AbsoluteFill style={{ background: mix("#0b0e17", "#261e18", w), mixBlendMode: "multiply", opacity: 0.18 + 0.12 * (1 - w) }} />
    </>
  );
};

export const Horreur2: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s, i) => (
        <Sequence key={i} from={i * SHOT} durationInFrames={SHOT} name={s.name}>
          <s.C abs={i * SHOT} />
        </Sequence>
      ))}
      <Grade />
      <Hud />
      <Subs />
      {/* Audio */}
      {BEDS.map((b, i) => (
        <Sequence key={`b${i}`} from={b.from} durationInFrames={b.to - b.from} name={`Ambiance ${b.f}`} layout="none">
          <Bed f={b.f} from={b.from} vol={b.vol} />
        </Sequence>
      ))}
      <Sequence name="Musique de suspense" layout="none">
        <Audio src={a("score.wav")} volume={scoreVol} />
      </Sequence>
      {SFX.map((s, i) => (
        <Sequence key={`s${i}`} from={s.at} durationInFrames={3 * fps} name={`SFX ${s.f}`} layout="none">
          <Audio src={a(s.f)} volume={s.v} />
        </Sequence>
      ))}
      {Object.entries(voice).map(([id, v]) => (
        <Sequence key={id} from={v.at} durationInFrames={Math.ceil(v.dur * fps)} name={`Voix ${id}`} layout="none">
          <Audio src={a(`v_${id}.mp3`)} volume={1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

export const Horreur2Composition = () => (
  <Composition id="HorreurPartie1V2" component={Horreur2} durationInFrames={TOTAL} fps={FPS} width={W} height={H} />
);


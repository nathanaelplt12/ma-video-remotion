import { AbsoluteFill, random } from "remotion";
import { T, TOTAL, VOICE } from "./theme";

/** Vraies coupes de montage (scènes + coupes internes) : micro-glitch de 2 frames. */
export const CUTS = [0, 120, 330, T.vibrate1 + 6, T.faceCut, 578, T.crackOpen, 720, 900, T.jumpscare, T.rewind, T.rewindEnd, T.closeEyes, T.doorClose, 1500, T.vibrate2, T.photo, T.closetBurst];

/** Coupes franches sur les mots-clés (cues contenant un mot en rouge). */
const KEYWORD_CUTS = Object.values(VOICE).flatMap((l) => l.cues.filter((c) => c.text.includes("**")).map((c) => c.from));

/** Plans : jamais plus de 2,5 s (75 frames) sans variation. */
const MAX = 72;
export const SHOTS = (() => {
  const marks = [...new Set([...CUTS, ...KEYWORD_CUTS, TOTAL])]
    // pas de coupe pendant la seconde de silence ni pendant le rush final
    .filter((m) => !(m > T.silence && m < T.jumpscare) && !(m > T.closetBurst && m < TOTAL))
    .sort((a, b) => a - b);
  const out: number[] = [];
  marks.forEach((m, i) => {
    if (i > 0 && m - out[out.length - 1] < 18) return; // évite les plans trop courts
    const prev = out[out.length - 1];
    if (prev !== undefined && m - prev > MAX) {
      const n = Math.ceil((m - prev) / MAX);
      for (let k = 1; k < n; k++) out.push(Math.round(prev + ((m - prev) * k) / n));
    }
    out.push(m);
  });
  return out;
})();

const shotAt = (f: number) => {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1] <= f) i++;
  return { i, start: SHOTS[i], end: SHOTS[i + 1] ?? TOTAL };
};

/** Caméra « à l'épaule » + zoom progressif 1 → 1.08 par plan, recadrage franc à chaque coupe, glitch 2 frames. */
export const Camera: React.FC<{ f: number; children: React.ReactNode }> = ({ f, children }) => {
  const { i, start, end } = shotAt(f);
  const p = (f - start) / Math.max(1, end - start);
  const base = i % 2 === 0 ? 1 : 1.06; // alternance de cadrage → coupe franche visible
  const scale = base * (1 + 0.08 * p);
  const ox = 50 + (random(`ox${i}`) - 0.5) * 16;
  const oy = 46 + (random(`oy${i}`) - 0.5) * 12;
  const hx = Math.sin(f / 21) * 7 + Math.sin(f / 9.3) * 2.5;
  const hy = Math.sin(f / 26 + 1) * 6 + Math.sin(f / 11.7) * 2;
  const hr = Math.sin(f / 33) * 0.45;
  const g = CUTS.some((c) => c > 0 && f >= c && f < c + 2) ? 1 : 0;
  const gs = random(`g${f}`);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transformOrigin: `${ox}% ${oy}%`,
          transform: `translate(${hx + (g ? (gs - 0.5) * 60 : 0)}px, ${hy}px) rotate(${hr}deg) scale(${scale}) ${g ? `skewX(${(gs - 0.5) * 10}deg)` : ""}`,
          filter: g ? "contrast(1.5) saturate(2.2) hue-rotate(-25deg)" : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {g ? (
        <>
          {[0, 1, 2, 3, 4].map((k) => (
            <div key={k} style={{ position: "absolute", left: 0, right: 0, top: random(`gy${f}${k}`) * 1920, height: 20 + random(`gh${f}${k}`) * 90, background: k % 2 ? "rgba(239,68,68,0.55)" : "rgba(56,189,248,0.45)", mixBlendMode: "screen", transform: `translateX(${(random(`gx${f}${k}`) - 0.5) * 200}px)` }} />
          ))}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

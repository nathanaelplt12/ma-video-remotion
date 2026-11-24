import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { shake } from "../../fx";
import { BEATS, bpmAt, pulseAt } from "../bpm";
import { C, FONT, REWIND, TOTAL_FRAMES, clamp, clockSeconds, formatClock } from "../theme";

/**
 * Caméra : zoom lent permanent (Ken Burns) + tremblement de fond + impulsions de choc.
 * kicks = frames (de la séquence) où un coup secoue l'image.
 */
export const Cam: React.FC<{
  from?: number; to?: number; dur: number; origin?: string; shake?: number;
  kicks?: number[]; kickAmt?: number; panX?: [number, number]; panY?: [number, number];
  children: React.ReactNode; style?: React.CSSProperties;
}> = ({ from = 1, to = 1.08, dur, origin = "50% 50%", shake: amt = 1.5, kicks = [], kickAmt = 26, panX = [0, 0], panY = [0, 0], children, style }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, dur], [0, 1], clamp);
  const ease = p * (2 - p) * 0.5 + p * 0.5;
  const kick = kicks.reduce((acc, k) => acc + (f >= k ? Math.exp(-(f - k) / 4) : 0), 0);
  const s = shake(f, amt + kick * kickAmt, "cam");
  const scale = from + (to - from) * ease + kick * 0.035;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${s.x + panX[0] + (panX[1] - panX[0]) * ease}px, ${s.y + panY[0] + (panY[1] - panY[0]) * ease}px) rotate(${s.r}deg) scale(${scale})`,
        transformOrigin: origin, ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Flash plein écran qui décroît. */
export const Flash: React.FC<{ at: number; color?: string; len?: number; max?: number }> = ({ at, color = "#fff", len = 10, max = 0.9 }) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [at, at + 1, at + len], [0, max, 0], clamp);
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, zIndex: 45, pointerEvents: "none" }} />;
};

/* ───────── HUD permanent ───────── */
export const HUD: React.FC = () => {
  const f = useCurrentFrame();
  const blink = Math.floor(f / 15) % 2 === 0;
  const bpm = bpmAt(f);
  const panic = bpm >= 140;
  const crazy = bpm >= 160;
  const pulse = pulseAt(f);
  const flashing = crazy && Math.floor(f / 4) % 2 === 0;
  const rewinding = f >= REWIND.from && f < REWIND.to;
  const col = panic ? C.danger : C.white;
  return (
    <div style={{ position: "absolute", top: 78, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontFamily: FONT, color: C.white, zIndex: 50, textShadow: "0 3px 14px rgba(0,0,0,0.9)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 34, letterSpacing: 6 }}>
        <span style={{ width: 24, height: 24, borderRadius: 12, background: C.danger, opacity: blink ? 1 : 0.15, boxShadow: blink ? `0 0 18px ${C.danger}` : "none" }} />
        NUIT 1 • TA CHAMBRE
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
        <div style={{ fontSize: 78, fontVariantNumeric: "tabular-nums", letterSpacing: 3, color: rewinding ? C.danger : C.white, transform: rewinding ? `translateX(${(random(`clk${f}`) - 0.5) * 14}px)` : undefined }}>
          {formatClock(clockSeconds(f))}
        </div>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "8px 22px", borderRadius: 40,
            background: panic ? "rgba(239,68,68,0.18)" : "rgba(255,255,255,0.08)",
            border: `4px solid ${panic ? C.danger : "rgba(255,255,255,0.25)"}`,
            fontSize: 50, color: col, fontVariantNumeric: "tabular-nums",
            opacity: flashing ? 0.45 : 1, transform: `scale(${1 + 0.06 * pulse * (panic ? 1.6 : 1)})`,
            boxShadow: panic ? `0 0 ${20 + 30 * pulse}px rgba(239,68,68,0.6)` : "none",
          }}
        >
          <svg width={52} height={48} viewBox="0 0 52 48" style={{ transform: `scale(${1 + 0.25 * pulse})` }}>
            <path d="M26 46 C 8 32 0 22 0 13 C 0 5 6 0 13.5 0 C 19 0 23.5 3 26 8 C 28.5 3 33 0 38.5 0 C 46 0 52 5 52 13 C 52 22 44 32 26 46 Z" fill={C.danger} />
          </svg>
          {bpm} BPM
        </div>
      </div>
      {/* barre de progression de la vidéo */}
      <ProgressLine />
    </div>
  );
};

const ProgressLine: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{ width: 600, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden", marginTop: 4 }}>
      <div style={{ width: `${(f / TOTAL_FRAMES) * 100}%`, height: "100%", background: C.danger }} />
    </div>
  );
};

/** Vrai si un battement tombe sur cette frame (le son est géré par la composition). */
export const isBeat = (f: number) => BEATS.includes(f);

/* ───────── Sous-titres : 1 à 3 mots, pop rapide, mots-clés en rouge ───────── */
const renderText = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? <span key={i} style={{ color: C.danger }}>{part.slice(2, -2)}</span> : <span key={i}>{part}</span>,
  );

export const Subtitles: React.FC<{ cues: { sub: string; start: number; end: number }[]; tail?: number; top?: number }> = ({ cues, tail = 14, top = 1360 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = cues.findIndex((c, i) => f >= c.start && f < (cues[i + 1]?.start ?? c.end + tail));
  if (idx < 0) return null;
  const c = cues[idx];
  const pop = spring({ frame: f - c.start, fps, config: { damping: 8, stiffness: 320, mass: 0.5 } });
  const wob = (random(`sub${idx}${Math.floor(f / 3)}`) - 0.5) * 1.2;
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top, height: 300, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div
        style={{
          transform: `scale(${0.55 + 0.45 * pop}) rotate(${wob}deg)`, textAlign: "center", color: C.white,
          fontFamily: FONT, fontWeight: 900, fontSize: 118, lineHeight: 1.02, textTransform: "uppercase", letterSpacing: 1,
          WebkitTextStroke: `12px ${C.black}`, paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,0.8)",
        }}
      >
        {renderText(c.sub)}
      </div>
    </div>
  );
};

/* ───────── Grain + vignette + scintillement léger (toujours en mouvement) ───────── */
export const Atmosphere: React.FC = () => {
  const f = useCurrentFrame();
  const dots = Array.from({ length: 40 }, (_, i) => ({
    x: random(`gx${i}${f}`) * 1080, y: random(`gy${i}${f}`) * 1920, o: random(`go${i}${f}`) * 0.25,
  }));
  const dust = Array.from({ length: 14 }, (_, i) => ({
    x: (random(`dx${i}`) * 1080 + f * (0.6 + random(`dv${i}`))) % 1080,
    y: (random(`dy${i}`) * 1920 + Math.sin((f + i * 40) / 40) * 30) % 1920,
    r: 2 + random(`dr${i}`) * 3,
  }));
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
      <svg width={1080} height={1920} style={{ position: "absolute" }}>
        {dust.map((d, i) => <circle key={`d${i}`} cx={d.x} cy={d.y} r={d.r} fill="#fff" opacity={0.12} />)}
        {dots.map((d, i) => <rect key={i} x={d.x} y={d.y} width={3} height={3} fill="#fff" opacity={d.o} />)}
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 48%, transparent 45%, rgba(0,0,0,0.75) 100%)" }} />
      <AbsoluteFill style={{ background: "#000", opacity: 0.04 + random(`fl${Math.floor(f / 2)}`) * 0.05 }} />
    </AbsoluteFill>
  );
};

/** Badge / bandeau qui claque. */
export const Slam: React.FC<{ at: number; top: number; bg: string; children: React.ReactNode; size?: number; rotate?: number }> = ({ at, top, bg, children, size = 58, rotate = -3 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < at) return null;
  const s = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 260 } });
  const jitter = (random(`sl${f}`) - 0.5) * 6;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top, display: "flex", justifyContent: "center", zIndex: 55 }}>
      <div style={{ transform: `scale(${2.2 - 1.2 * s}) rotate(${rotate + jitter * 0.3}deg) translateX(${jitter}px)`, opacity: Math.min(1, s * 2), background: bg, color: C.white, fontFamily: FONT, fontSize: size, padding: "22px 40px", borderRadius: 18, textAlign: "center", lineHeight: 1.1, boxShadow: "0 16px 50px rgba(0,0,0,0.6)", border: "6px solid rgba(255,255,255,0.9)", maxWidth: 940 }}>
        {children}
      </div>
    </div>
  );
};

/** Effet VHS : scanlines, bandes de tracking, aberration chromatique, libellé « << REMBOBINAGE ». */
export const VHS: React.FC<{ strength?: number; label?: boolean }> = ({ strength = 1, label = true }) => {
  const f = useCurrentFrame();
  const bands = Array.from({ length: 7 }, (_, i) => ({
    y: ((f * (26 + i * 11) + i * 330) % 2100) - 100,
    h: 12 + random(`bh${i}`) * 80,
    dx: (random(`bx${i}${Math.floor(f / 2)}`) - 0.5) * 160,
  }));
  return (
    <AbsoluteFill style={{ zIndex: 42, pointerEvents: "none", opacity: strength }}>
      <AbsoluteFill style={{ background: "rgba(56,40,120,0.25)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0 3px, transparent 3px 7px)" }} />
      {bands.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.dx, right: -b.dx, top: b.y, height: b.h, background: "rgba(255,255,255,0.16)", boxShadow: `-14px 0 rgba(239,68,68,0.4), 14px 0 rgba(56,189,248,0.4)` }} />
      ))}
      <AbsoluteFill style={{ background: `rgba(255,255,255,${random(`vn${f}`) * 0.08})` }} />
      {label && (
        <div style={{ position: "absolute", left: 60, top: 330, fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 72, color: C.white, letterSpacing: 4, textShadow: `4px 0 ${C.danger}, -4px 0 ${C.screen}`, opacity: Math.floor(f / 6) % 2 === 0 ? 1 : 0.5 }}>
          {"◀◀"} REMBOBINAGE
        </div>
      )}
      {label && (
        <div style={{ position: "absolute", right: 60, bottom: 330, fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 48, color: C.white, textShadow: `3px 0 ${C.danger}, -3px 0 ${C.screen}` }}>
          PLAY ◀◀ x16
        </div>
      )}
    </AbsoluteFill>
  );
};

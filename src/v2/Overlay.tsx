import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, VOICE, clockSeconds, formatClock, T, lerp } from "./theme";

export const HUD: React.FC = () => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  const rewinding = frame >= T.rewind && frame < T.rewindEnd;
  return (
    <div style={{ position: "absolute", top: 80, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: FONT, color: "#e2e8f0", zIndex: 50, textShadow: "0 2px 14px rgba(0,0,0,0.9)", opacity: 0.88 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 800, letterSpacing: 6 }}>
        <span style={{ width: 18, height: 18, borderRadius: 9, background: C.danger, opacity: blink ? 1 : 0.15, boxShadow: blink ? `0 0 14px ${C.danger}` : "none" }} />
        NUIT 1 • SEUL À LA MAISON
      </div>
      <div style={{ fontSize: 62, fontWeight: 800, letterSpacing: 3, fontVariantNumeric: "tabular-nums", color: rewinding ? C.danger : "#e2e8f0" }}>
        {formatClock(clockSeconds(frame))}
      </div>
    </div>
  );
};

const renderText = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? <span key={i} style={{ color: C.danger }}>{part.slice(2, -2)}</span> : <span key={i}>{part}</span>,
  );

const CUES = Object.values(VOICE).flatMap((l) =>
  l.cues.map((c, i) => ({ ...c, end: i + 1 < l.cues.length ? l.cues[i + 1].from : l.speechEnd + 6 })),
).sort((a, b) => a.from - b.from);

export const Subtitles: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const active = [...CUES].reverse().find((c) => frame >= c.from && frame < c.end);
  if (!active) return null;
  const pop = spring({ frame: frame - active.from, fps, config: { damping: 10, stiffness: 320, mass: 0.5 } });
  return (
    <div style={{ position: "absolute", left: 50, right: 50, top: 1400, height: 260, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }}>
      <div
        style={{
          transform: `scale(${0.55 + 0.45 * pop})`, opacity: Math.min(1, pop * 2), textAlign: "center", color: "white",
          fontFamily: FONT, fontWeight: 900, fontSize: 110, lineHeight: 1.02, letterSpacing: 1,
          WebkitTextStroke: "12px #050408", paintOrder: "stroke fill", textShadow: "0 10px 30px rgba(0,0,0,0.8)",
        }}
      >
        {renderText(active.text)}
      </div>
    </div>
  );
};

export const Banner: React.FC<{ text: string; from: number; color?: string; f?: number }> = ({ text, from, color = C.danger, f }) => {
  const cur = useCurrentFrame();
  const frame = f ?? cur;
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - from, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", top: 250, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 55 }}>
      <div style={{ transform: `translateY(${(1 - p) * -60}px)`, opacity: p, fontFamily: FONT, fontWeight: 900, fontSize: 42, letterSpacing: 2, color: "white", background: color, padding: "18px 34px", borderRadius: 14, boxShadow: `0 0 40px ${color}88` }}>
        {text}
      </div>
    </div>
  );
};

/** Choix interactif : titre, compte à rebours, deux boutons. */
export const Choice: React.FC<{ from: number; countdownFrom?: number; selected?: "orange" | "blue"; selectAt?: number; checked?: boolean; f?: number }> = ({
  from, countdownFrom, selected, selectAt = 0, checked = false, f,
}) => {
  const cur = useCurrentFrame();
  const frame = f ?? cur;
  const { fps } = useVideoConfig();
  const inP = (d: number) => spring({ frame: frame - from - d, fps, config: { damping: 12, stiffness: 180 } });
  const sel = selected ? spring({ frame: frame - selectAt, fps, config: { damping: 9, stiffness: 260 } }) : 0;
  const bar = countdownFrom !== undefined ? lerp(frame, [countdownFrom, countdownFrom + 90], [1, 0]) : 1;
  const num = countdownFrom !== undefined ? Math.max(1, 3 - Math.floor((frame - countdownFrom) / 30)) : 3;
  const btn = (key: "orange" | "blue", label: string, color: string, d: number) => {
    const isSel = selected === key;
    const other = selected && !isSel;
    return (
      <div
        style={{
          width: 880, padding: "46px 30px", borderRadius: 36, background: color, color: "white",
          fontFamily: FONT, fontWeight: 900, fontSize: 56, textAlign: "center", lineHeight: 1.1,
          transform: `scale(${(0.6 + 0.4 * inP(d)) * (isSel ? 1 + 0.08 * sel : 1)})`, opacity: inP(d) * (other ? 1 - 0.6 * sel : 1),
          boxShadow: isSel ? `0 0 ${80 * sel}px ${color}, 0 0 0 ${10 * sel}px white` : `0 10px 0 rgba(0,0,0,0.35)`,
          position: "relative",
        }}
      >
        {label}
        {isSel && checked && (
          <div style={{ position: "absolute", right: -26, top: -26, width: 86, height: 86, borderRadius: 43, background: "white", color, fontSize: 60, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${sel})` }}>✓</div>
        )}
      </div>
    );
  };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 380, gap: 50, zIndex: 30 }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 112, color: "white", transform: `scale(${inP(0)})`, textShadow: "0 0 40px rgba(239,68,68,0.5)" }}>QUE FAIS-TU ?</div>
      {countdownFrom !== undefined && (
        <div style={{ display: "flex", alignItems: "center", gap: 24, opacity: inP(4) }}>
          <div style={{ width: 640, height: 30, borderRadius: 15, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div style={{ width: `${bar * 100}%`, height: "100%", background: C.danger, boxShadow: `0 0 20px ${C.danger}` }} />
          </div>
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 80, color: C.danger, width: 70 }}>{frame >= countdownFrom ? num : 3}</div>
        </div>
      )}
      {btn("orange", "TE CACHER SOUS LE LIT", C.orange, 8)}
      {btn("blue", "FAIRE SEMBLANT DE DORMIR", C.blue, 14)}
    </div>
  );
};

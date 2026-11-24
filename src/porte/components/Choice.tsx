import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, clamp } from "../theme";

const Btn: React.FC<{ color: string; label: string; state: "idle" | "on" | "off"; sel: number; pulse: number }> = ({ color, label, state, sel, pulse }) => (
  <div
    style={{
      position: "relative", width: 900, padding: "50px 30px", borderRadius: 40, background: color, color: C.white,
      fontFamily: FONT, fontSize: 62, textAlign: "center", lineHeight: 1.1,
      transform: `scale(${(state === "on" ? 1 + 0.08 * sel : state === "off" ? 1 - 0.06 * sel : 1) + 0.05 * pulse})`,
      opacity: state === "off" ? 1 - 0.6 * sel : 1,
      border: `10px solid ${state === "on" && sel > 0.1 ? C.white : "transparent"}`,
      boxShadow: `0 14px 40px rgba(0,0,0,0.55), 0 0 ${state === "on" ? 70 * sel : 0}px ${color}`,
    }}
  >
    {label}
    {state === "on" && (
      <svg width={110} height={110} viewBox="0 0 90 90" style={{ position: "absolute", right: -26, top: -44, transform: `scale(${sel})` }}>
        <circle cx={45} cy={45} r={42} fill={C.white} />
        <path d="M24 46 L40 62 L68 28" stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

/**
 * Écran de choix interactif. Le compte à rebours (barre rouge) court de timerFrom à selectAt.
 * pulses : frames où un bouton « pulse » (quand la voix le cite).
 */
export const Choice: React.FC<{ selected: "orange" | "blue"; selectAt: number; timerFrom?: number | null; pulseOrange?: number; pulseBlue?: number }> = ({ selected, selectAt, timerFrom = null, pulseOrange = -99, pulseBlue = -99 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 12, stiffness: 200 } });
  const sel = f >= selectAt ? spring({ frame: f - selectAt, fps, config: { damping: 10, stiffness: 200 } }) : 0;
  const bar = timerFrom === null ? 0 : interpolate(f, [timerFrom, selectAt], [1, 0], clamp);
  const secs = timerFrom === null ? 0 : Math.ceil(((selectAt - f) / (selectAt - timerFrom)) * 3);
  const urgent = timerFrom !== null && f >= timerFrom && f < selectAt;
  const p = (at: number) => Math.max(0, 1 - Math.abs(f - at - 4) / 6);
  const state = (c: "orange" | "blue") => (sel > 0 ? (c === selected ? "on" : "off") : "idle");
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 20 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 380, display: "flex", flexDirection: "column", alignItems: "center", gap: 46, transform: `scale(${0.75 + 0.25 * enter})`, opacity: enter }}>
        <div style={{ fontFamily: FONT, fontSize: 132, color: C.white, WebkitTextStroke: `10px ${C.black}`, paintOrder: "stroke fill", transform: `scale(${1 + (urgent && secs !== Math.ceil(((selectAt - f + 1) / (selectAt - timerFrom!)) * 3) ? 0.06 : 0)})` }}>
          QUE FAIS-TU ?
        </div>
        {timerFrom !== null && (
          <div style={{ width: 900, display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ flex: 1, height: 44, borderRadius: 22, background: "rgba(255,255,255,0.15)", overflow: "hidden", border: "4px solid rgba(255,255,255,0.3)" }}>
              <div style={{ width: `${bar * 100}%`, height: "100%", background: C.danger, boxShadow: `0 0 30px ${C.danger}` }} />
            </div>
            <div style={{ width: 90, fontFamily: FONT, fontSize: 80, color: urgent ? C.danger : C.white, textAlign: "center" }}>{urgent ? secs : 0}</div>
          </div>
        )}
        <Btn color={C.orange} label="TE CACHER SOUS LE LIT" state={state("orange")} sel={sel} pulse={p(pulseOrange)} />
        <Btn color={C.blue} label="FAIRE SEMBLANT DE DORMIR" state={state("blue")} sel={sel} pulse={p(pulseBlue)} />
      </div>
    </div>
  );
};

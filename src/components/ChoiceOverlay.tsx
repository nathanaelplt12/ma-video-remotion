import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

type Props = {
  /** frame (de la séquence) où le choix est sélectionné */
  selectAt: number;
  selected: "orange" | "blue";
  /** affiche le compte à rebours 3-2-1 */
  countdownFrom?: number;
  showCountdown?: boolean;
};

const Btn: React.FC<{ color: string; label: string; selected: boolean; sel: number }> = ({ color, label, selected, sel }) => (
  <div
    style={{
      position: "relative", width: 860, padding: "44px 30px", borderRadius: 36,
      background: color, color: "white", fontFamily: FONT, fontSize: 60, textAlign: "center",
      transform: `scale(${selected ? 1 + 0.07 * sel : 1 - 0.03 * sel})`,
      opacity: selected ? 1 : 1 - 0.45 * sel,
      border: selected && sel > 0.1 ? "10px solid white" : "10px solid transparent",
      boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
    }}
  >
    {label}
    {selected && (
      <svg width={90} height={90} viewBox="0 0 90 90" style={{ position: "absolute", right: -20, top: -34, opacity: sel }}>
        <circle cx={45} cy={45} r={42} fill="white" />
        <path d="M24 46 L40 62 L68 28" stroke={color} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )}
  </div>
);

export const ChoiceOverlay: React.FC<Props> = ({ selectAt, selected, countdownFrom = 30, showCountdown = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 14 } });
  const sel = spring({ frame: frame - selectAt, fps, config: { damping: 12, stiffness: 160 } });
  const secs = Math.ceil(Math.max(0, selectAt - frame) / fps);
  const ring = interpolate(frame, [countdownFrom, Math.max(selectAt, countdownFrom + 1)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(11,9,16,0.55)", backdropFilter: "blur(10px)", zIndex: 20 }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 50, transform: `scale(${0.8 + 0.2 * enter})`, opacity: enter }}>
        <div style={{ fontFamily: FONT, fontSize: 124, color: "white", WebkitTextStroke: "8px #0b0910", paintOrder: "stroke fill" }}>QUE FAIS-TU ?</div>
        <Btn color={C.orange} label="APPUYER SUR FERMER" selected={selected === "orange"} sel={frame >= selectAt ? sel : 0} />
        <Btn color={C.blue} label="REGARDER LE SOL" selected={selected === "blue"} sel={frame >= selectAt ? sel : 0} />
        {showCountdown && frame >= countdownFrom && frame < selectAt && (
          <div style={{ position: "relative", width: 200, height: 200 }}>
            <svg width={200} height={200} viewBox="0 0 200 200">
              <circle cx={100} cy={100} r={86} fill="none" stroke="#3b3652" strokeWidth={14} />
              <circle cx={100} cy={100} r={86} fill="none" stroke={C.danger} strokeWidth={14} strokeDasharray={540} strokeDashoffset={540 * (1 - ring)} transform="rotate(-90 100 100)" strokeLinecap="round" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT, fontSize: 110, color: "white" }}>{secs}</div>
          </div>
        )}
      </div>
    </div>
  );
};

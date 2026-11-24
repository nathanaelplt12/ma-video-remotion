import { useCurrentFrame } from "remotion";
import { C, FONT, clockSeconds, formatClock, REWIND } from "../theme";

export const HUD: React.FC = () => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 15) % 2 === 0;
  const rewinding = frame >= REWIND.from && frame < REWIND.to;
  return (
    <div
      style={{
        position: "absolute", top: 70, left: 0, right: 0,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        fontFamily: FONT, color: "white", zIndex: 50,
        textShadow: "0 2px 12px rgba(0,0,0,0.8)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, letterSpacing: 8 }}>
        <span
          style={{
            width: 20, height: 20, borderRadius: 10, background: C.danger,
            opacity: blink ? 1 : 0.15, boxShadow: blink ? `0 0 14px ${C.danger}` : "none",
          }}
        />
        NUIT 1 • ASCENSEUR
      </div>
      <div
        style={{
          fontSize: 84, fontWeight: 900, letterSpacing: 4,
          fontVariantNumeric: "tabular-nums",
          color: rewinding ? C.danger : "white",
        }}
      >
        {formatClock(clockSeconds(frame))}
      </div>
    </div>
  );
};

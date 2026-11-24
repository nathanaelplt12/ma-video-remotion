import { interpolate, random, useCurrentFrame } from "remotion";
import { C } from "../theme";

/** Effet VHS : scanlines, bandes de tracking, aberration chromatique, libellé. */
export const RewindEffect: React.FC<{ duration: number; label?: boolean }> = ({ duration, label = true }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 4, duration - 10, duration], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const bands = Array.from({ length: 6 }, (_, i) => ({
    y: ((frame * (18 + i * 9) + i * 400) % 2100) - 100,
    h: 14 + random(`bh${i}`) * 70,
    dx: (random(`bx${i}${Math.floor(frame / 2)}`) - 0.5) * 120,
  }));
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, pointerEvents: "none", opacity: fade }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(40,30,90,0.25)", mixBlendMode: "screen" }} />
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 3px, transparent 3px 7px)" }} />
      {bands.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: b.dx, right: -b.dx, top: b.y, height: b.h, background: "rgba(255,255,255,0.14)", boxShadow: "-12px 0 rgba(239,68,68,0.35), 12px 0 rgba(59,130,246,0.35)" }} />
      ))}
      <div style={{ position: "absolute", inset: 0, background: `rgba(255,255,255,${random(`n${frame}`) * 0.07})` }} />
      {label && (
        <div style={{ position: "absolute", left: 50, top: 230, fontFamily: "'Courier New', monospace", fontWeight: 900, fontSize: 50, color: "white", letterSpacing: 4, textShadow: `3px 0 ${C.danger}, -3px 0 ${C.blue}`, opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0.55 }}>
          {"<<"} REMBOBINAGE
        </div>
      )}
    </div>
  );
};

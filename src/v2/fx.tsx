import { AbsoluteFill, useCurrentFrame } from "remotion";

/** Grain de film + vignette sombre, posés par-dessus toute l'image. */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const f = useCurrentFrame();
  const seed = Math.floor(f / 2) % 50;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 40 }}>
      <svg width="100%" height="100%" viewBox="0 0 540 960" preserveAspectRatio="none" style={{ opacity, mixBlendMode: "screen" }}>
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.4" />
        </filter>
        <rect width="540" height="960" filter={`url(#g${seed})`} />
      </svg>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.85) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Scène SVG plein cadre 1080x1920. */
export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Person } from "./art";
import { Grain } from "./art";
import { H, MONO, PAL, W, lerp, shake } from "./look";

/**
 * Caméra d'un plan : dérive continue (z0 -> z1), punch-in brutal optionnel (1.0 -> 1.15 en 4 frames)
 * à une frame donnée, et tremblement. Origine du zoom en pixels.
 */
export const Cam: React.FC<{
  children: React.ReactNode;
  z0?: number; z1?: number;
  x0?: number; x1?: number; y0?: number; y1?: number;
  punchAt?: number;
  shakeAmt?: number;
  ox?: number; oy?: number;
  bg?: string;
  /** 0–1 : balancement + vision dédoublée (alcool) */
  drunk?: number;
}> = ({ children, z0 = 1, z1 = 1.06, x0 = 0, x1 = 0, y0 = 0, y1 = 0, punchAt, shakeAmt = 0, ox = 540, oy = 960, bg = "#000", drunk = 0 }) => {
  const f = useCurrentFrame();
  const drift = lerp(f, [0, 59], [z0, z1]);
  const punch = punchAt === undefined ? 1 : lerp(f, [punchAt, punchAt + 4], [1, 1.15]);
  const s = shake(f, shakeAmt, "cam");
  const tx = lerp(f, [0, 59], [x0, x1]) + s.x;
  const ty = lerp(f, [0, 59], [y0, y1]) + s.y;
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translate(${tx + drunk * 14 * Math.sin(f * 0.07)}px, ${ty}px) scale(${drift * punch}) rotate(${drunk * 2.2 * Math.sin(f * 0.09 + 1)}deg)`,
          transformOrigin: `${ox}px ${oy}px`,
        }}
      >
        {children}
      </AbsoluteFill>
      {drunk > 0 && (
        <AbsoluteFill
          style={{
            opacity: 0.22 * drunk,
            transform: `translate(${tx + drunk * (26 + 14 * Math.sin(f * 0.11))}px, ${ty + 6 * drunk}px) scale(${drift * punch * 1.01}) rotate(${drunk * 2.2 * Math.sin(f * 0.09 + 1.3)}deg)`,
            transformOrigin: `${ox}px ${oy}px`,
          }}
        >
          {children}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, ...style }}>
    {children}
  </svg>
);

/** Halo lumineux radial. */
export const Glow: React.FC<{ id: string; cx: number; cy: number; r: number; color: string; o?: number }> = ({ id, cx, cy, r, color, o = 0.6 }) => (
  <>
    <defs>
      <radialGradient id={id}>
        <stop offset="0" stopColor={color} stopOpacity={o} />
        <stop offset="0.4" stopColor={color} stopOpacity={o * 0.35} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={r} fill={`url(#${id})`} />
  </>
);

/** Vignette + grain par-dessus chaque plan. */
export const Finish: React.FC<{ vig?: number; grain?: number }> = ({ vig = 0.75, grain = 0.14 }) => {
  const f = useCurrentFrame();
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 60% at 50% 48%, rgba(0,0,0,0) 40%, rgba(0,0,0,${vig}) 100%)` }} />
      <Grain f={f} amt={grain} />
    </>
  );
};

/** Décalage RVB / tranches pour les glitchs. */
export const Glitch: React.FC<{ on: boolean; seed: string; children: React.ReactNode }> = ({ on, seed, children }) => {
  const f = useCurrentFrame();
  if (!on) return <>{children}</>;
  const slices = Array.from({ length: 7 }).map((_, i) => ({
    y: random(`${seed}y${i}${f}`) * 100,
    h: 2 + random(`${seed}h${i}${f}`) * 9,
    dx: (random(`${seed}x${i}${f}`) - 0.5) * 160,
  }));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: "translateX(-10px)", filter: "drop-shadow(14px 0 0 rgba(255,0,60,0.6)) drop-shadow(-14px 0 0 rgba(0,220,255,0.5))" }}>
        {children}
      </AbsoluteFill>
      {slices.map((s, i) => (
        <AbsoluteFill key={i} style={{ clipPath: `inset(${s.y}% 0 ${Math.max(0, 100 - s.y - s.h)}% 0)`, transform: `translateX(${s.dx}px)` }}>
          {children}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/* Caméra de surveillance du salon (vue plongeante, gris nocturne IR)          */
/* -------------------------------------------------------------------------- */
export type ManState = { x: number; y: number; s: number; headDown: number; walk?: number; glow?: number; visible?: boolean };

export const CctvRoom: React.FC<{ door: number; man?: ManState; time: string; zoom?: { s: number; x: number; y: number }; glitch?: boolean; label?: string }> = ({
  door, man, time, zoom, glitch = false, label,
}) => {
  const f = useCurrentFrame();
  const z = zoom ?? { s: 1, x: 540, y: 960 };
  const noiseY = (f * 37) % 1920;
  const scene = (
    <AbsoluteFill style={{ filter: "grayscale(1) contrast(1.25) brightness(1.15)", transform: `scale(${z.s})`, transformOrigin: `${z.x}px ${z.y}px` }}>
      <Svg>
        <defs>
          <radialGradient id="irl" cx="0.5" cy="0.55" r="0.7">
            <stop offset="0" stopColor="#8d8d8d" />
            <stop offset="1" stopColor="#1b1b1b" />
          </radialGradient>
        </defs>
        {/* mur du fond */}
        <rect x={0} y={0} width={1080} height={820} fill="#5a5a5a" />
        <rect x={0} y={0} width={1080} height={820} fill="url(#irl)" opacity={0.6} />
        {/* plafond / corniche */}
        <polygon points="0,0 1080,0 1080,120 0,160" fill="#3c3c3c" />
        {/* sol en perspective */}
        <polygon points="0,820 1080,780 1080,1920 0,1920" fill="#4a4a4a" />
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={-400 + i * 140} y1={1920} x2={180 + i * 70} y2={810} stroke="#3a3a3a" strokeWidth={3} />
        ))}
        {/* porte de la salle de bain (au fond à gauche) */}
        <rect x={210} y={330} width={210} height={480} fill="#2a2a2a" />
        <rect x={200} y={320} width={230} height={14} fill="#6e6e6e" />
        <polygon
          points={`210,330 ${210 + 210 * (1 - door * 0.75)},${330 + door * 18} ${210 + 210 * (1 - door * 0.75)},${810 - door * 10} 210,810`}
          fill="#7b7b7b"
        />
        <polygon points={`${210 + 210 * (1 - door * 0.75)},${330 + door * 18} 420,330 420,810 ${210 + 210 * (1 - door * 0.75)},${810 - door * 10}`} fill="#090909" />
        {/* couloir à droite */}
        <polygon points="930,300 1080,250 1080,1100 930,860" fill="#121212" />
        {/* tableau, télé */}
        <rect x={560} y={380} width={220} height={150} fill="#3a3a3a" stroke="#7a7a7a" strokeWidth={8} />
        {/* canapé */}
        <rect x={430} y={980} width={520} height={210} rx={40} fill="#6a6a6a" />
        <rect x={430} y={1120} width={520} height={160} rx={30} fill="#5b5b5b" />
        <rect x={400} y={1000} width={70} height={280} rx={30} fill="#727272" />
        <rect x={910} y={1000} width={70} height={280} rx={30} fill="#727272" />
        {/* la veste « ramenée », posée sur l'accoudoir */}
        <path d="M 820 1010 Q 900 980 960 1030 L 975 1190 Q 930 1215 880 1185 L 860 1100 Q 830 1080 820 1010 Z" fill="#2b2b2b" />
        <path d="M 880 1040 L 900 1180" stroke="#1a1a1a" strokeWidth={6} />
        {/* tapis + table basse */}
        <ellipse cx={600} cy={1520} rx={420} ry={170} fill="#3f3f3f" />
        <rect x={460} y={1400} width={300} height={140} rx={12} fill="#2c2c2c" />
        {/* lampe éteinte */}
        <line x1={160} y1={1300} x2={160} y2={880} stroke="#252525" strokeWidth={14} />
        <polygon points="100,880 220,880 190,800 130,800" fill="#8a8a8a" />
        {/* l'homme */}
        {man && man.visible !== false && (
          <g transform={`translate(${man.x} ${man.y}) scale(${man.s})`}>
            <ellipse cx={0} cy={0} rx={150} ry={26} fill="#000" opacity={0.35} />
            <Person uid="intr" hoodie="#202024" hoodUp headDown={man.headDown} walk={man.walk} light="#ffffff" lightAmt={0.12} eyeGlow={man.glow ?? 0} holdKeys />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Glitch on={glitch} seed="cc">{scene}</Glitch>
      {/* lignes de balayage + bande de bruit */}
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 2px, rgba(0,0,0,0) 2px 5px)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: noiseY, height: 70, background: "rgba(255,255,255,0.06)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)" }} />
      <Grain f={f} amt={0.32} />
      {/* interface de l'application */}
      <div style={{ position: "absolute", left: 70, top: 250, fontFamily: MONO, fontWeight: 700, fontSize: 46, color: "#f2f2f2", textShadow: "0 0 10px #000" }}>
        <span style={{ color: PAL.red, opacity: Math.floor(f / 12) % 2 === 0 ? 1 : 0.2 }}>●</span> REC • SALON
      </div>
      <div style={{ position: "absolute", left: 70, top: 312, fontFamily: MONO, fontSize: 34, color: "#d0d0d0" }}>CAM 01 • IR NUIT</div>
      <div style={{ position: "absolute", right: 200, top: 260, fontFamily: MONO, fontSize: 38, color: "#e6e6e6" }}>{time}</div>
      {label && (
        <div style={{ position: "absolute", left: 70, top: 380, fontFamily: MONO, fontSize: 36, color: "#fff", background: "rgba(239,68,68,0.85)", padding: "4px 14px" }}>
          {label}
        </div>
      )}
      {/* cadre de visée */}
      <Svg>
        {[
          [60, 230, 1], [1020, 230, -1],
        ].map(([x, y, d], i) => (
          <path key={i} d={`M ${x} ${y + 70} L ${x} ${y} L ${x + d * 70} ${y}`} stroke="#fff" strokeWidth={5} fill="none" opacity={0.7} />
        ))}
        <path d="M 60 1420 L 60 1490 L 130 1490" stroke="#fff" strokeWidth={5} fill="none" opacity={0.7} />
        <path d="M 1020 1420 L 1020 1490 L 950 1490" stroke="#fff" strokeWidth={5} fill="none" opacity={0.7} />
      </Svg>
    </AbsoluteFill>
  );
};


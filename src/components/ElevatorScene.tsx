import { AbsoluteFill } from "remotion";
import { C, FONT, WIDTH, HEIGHT } from "../theme";
import { Entity } from "./Entity";

export type Pose = "back" | "down" | "reach" | "none";

export type ElevatorProps = {
  display: string;
  displayVisible?: boolean;
  /** 0 = portes fermées, 1 = grandes ouvertes */
  doorOpen: number;
  /** 0–1, luminosité du plafonnier */
  light: number;
  lightColor?: string;
  pose?: Pose;
  /** 0–1 : le bras se tend vers le panneau */
  reach?: number;
  /** 0–1 : la silhouette de l'entité apparaît dans l'encadrement */
  entity?: number;
  entitySway?: number;
  /** 0–1 : deux longues mains bloquent les portes */
  hands?: number;
  /** 0–1 : deux pieds sombres avancent vers le protagoniste (-1 = absents) */
  feet?: number;
};

const DOOR = { x: 240, y: 440, w: 600, h: 900 };

const Protagonist: React.FC<{ pose: Pose; reach: number }> = ({ pose, reach }) => {
  if (pose === "none") return null;
  const down = pose === "down";
  const headY = down ? 1455 : 1410;
  const armEnd = { x: 640 + (905 - 640) * reach, y: 1540 + (1010 - 1540) * reach };
  return (
    <g>
      {/* bras tendu vers le panneau */}
      {pose === "reach" && (
        <g>
          <line x1={650} y1={1560} x2={armEnd.x} y2={armEnd.y} stroke={C.mustard} strokeWidth={70} strokeLinecap="round" />
          <circle cx={armEnd.x} cy={armEnd.y} r={38} fill={C.skin} />
        </g>
      )}
      {/* corps : sweat jaune vu de dos */}
      <path d="M330 1920 L350 1590 Q 360 1490 540 1480 Q 720 1490 730 1590 L750 1920 Z" fill={C.mustard} />
      <path d="M540 1500 L540 1920" stroke="#a37e08" strokeWidth={6} />
      {/* capuche */}
      <path d="M420 1500 Q 540 1420 660 1500 Q 650 1560 540 1570 Q 430 1560 420 1500 Z" fill="#c99a07" />
      {/* tête noire */}
      <circle cx={540} cy={headY} r={98} fill={C.black} stroke="#000" strokeWidth={4} />
      <path d={`M 450 ${headY + 10} Q 540 ${headY - 120} 630 ${headY + 10} Q 600 ${headY - 40} 540 ${headY - 55} Q 480 ${headY - 40} 450 ${headY + 10} Z`} fill={C.mustard} opacity={0.9} />
      {down && (
        <path d={`M 470 ${headY + 70} Q 540 ${headY + 95} 610 ${headY + 70}`} stroke="#0b0910" strokeWidth={10} fill="none" />
      )}
    </g>
  );
};

const Feet: React.FC<{ p: number }> = ({ p }) => {
  if (p < 0) return null;
  const y = 1380 + (1790 - 1380) * p;
  const s = 0.35 + 0.9 * p;
  const shoe = (x: number) => (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={70} ry={150} fill="#050407" />
      <rect x={-34} y={-420} width={68} height={300} fill="#050407" />
    </g>
  );
  return <g opacity={Math.min(1, p * 6)}>{shoe(470)}{shoe(620)}</g>;
};

export const ElevatorScene: React.FC<ElevatorProps> = ({
  display, displayVisible = true, doorOpen, light, lightColor = C.cold, pose = "back",
  reach = 0, entity = 0, entitySway = 0, hands = 0, feet = -1,
}) => {
  const slide = 285 * doorOpen;
  const dark = 1 - light;
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={C.night} />
            <stop offset="1" stopColor={C.slate} />
          </linearGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1b1729" />
            <stop offset="1" stopColor={C.black} />
          </linearGradient>
          <linearGradient id="door" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3b3652" />
            <stop offset="0.5" stopColor="#4a4565" />
            <stop offset="1" stopColor="#332f48" />
          </linearGradient>
          <radialGradient id="corridor" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor="#1d2a4a" />
            <stop offset="0.5" stopColor="#0d1020" />
            <stop offset="1" stopColor="#030206" />
          </radialGradient>
          <radialGradient id="cone" cx="0.5" cy="0" r="1">
            <stop offset="0" stopColor={lightColor} stopOpacity={0.5} />
            <stop offset="1" stopColor={lightColor} stopOpacity={0} />
          </radialGradient>
          <clipPath id="doorClip"><rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} /></clipPath>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#wall)" />
        <rect y={1340} width={WIDTH} height={580} fill="url(#floor)" />
        {/* plinthe */}
        <rect y={1330} width={WIDTH} height={16} fill="#0b0910" />
        {/* parois latérales */}
        {[120, 960].map((x) => (<rect key={x} x={x} y={260} width={2} height={1080} fill="#0b0910" opacity={0.7} />))}

        {/* corridor derrière les portes */}
        <g clipPath="url(#doorClip)">
          <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="url(#corridor)" />
          {entity > 0 && (
            <g transform={`translate(540 ${DOOR.y + 20}) scale(${0.85 + 0.15 * entity}) translate(-150 0)`} opacity={Math.min(1, entity * 3)}>
              <foreignObject width={300} height={750}>
                <Entity variant="full" sway={entitySway} style={{ width: 300, height: 750 }} />
              </foreignObject>
            </g>
          )}
        </g>

        {/* portes */}
        <g clipPath="url(#doorClip)">
          <rect x={DOOR.x - slide} y={DOOR.y} width={DOOR.w / 2} height={DOOR.h} fill="url(#door)" />
          <rect x={DOOR.x + DOOR.w / 2 + slide} y={DOOR.y} width={DOOR.w / 2} height={DOOR.h} fill="url(#door)" />
          <rect x={DOOR.x + DOOR.w / 2 - 3 - slide} y={DOOR.y} width={6} height={DOOR.h} fill="#0b0910" />
          <rect x={DOOR.x + DOOR.w / 2 - 3 + slide} y={DOOR.y} width={6} height={DOOR.h} fill="#0b0910" />
        </g>
        {/* cadre */}
        <rect x={DOOR.x - 14} y={DOOR.y - 14} width={DOOR.w + 28} height={DOOR.h + 28} fill="none" stroke="#0b0910" strokeWidth={14} />

        {/* mains blanches qui bloquent les portes */}
        {hands > 0 && (
          <g clipPath="url(#doorClip)" opacity={Math.min(1, hands * 4)} transform={`translate(${(1 - hands) * 0} 0)`}>
            <foreignObject x={DOOR.x - 20 + (1 - hands) * -200} y={DOOR.y + 80} width={400} height={900}>
              <Entity variant="hands" style={{ width: 400, height: 900 }} />
            </foreignObject>
            <foreignObject x={DOOR.x + DOOR.w - 380 + (1 - hands) * 200} y={DOOR.y + 80} width={400} height={900}>
              <Entity variant="hands" style={{ width: 400, height: 900, transform: "scaleX(-1)" }} />
            </foreignObject>
          </g>
        )}

        {/* afficheur d'étage */}
        <rect x={380} y={290} width={320} height={110} rx={14} fill="#050407" stroke="#2f2a44" strokeWidth={6} />
        {displayVisible && (
          <text x={540} y={375} textAnchor="middle" fontFamily="'Courier New', monospace" fontWeight={900} fontSize={96} fill={C.danger} style={{ filter: `drop-shadow(0 0 14px ${C.danger})` }}>
            {display}
          </text>
        )}

        {/* panneau de boutons */}
        <rect x={880} y={780} width={100} height={340} rx={16} fill="#15111f" stroke="#2f2a44" strokeWidth={5} />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={930} cy={830 + i * 80} r={22} fill={i === 3 && reach > 0.9 ? C.danger : "#4a4565"} />
        ))}

        {/* plafonnier */}
        <rect x={300} y={225} width={480} height={26} rx={10} fill={lightColor} opacity={0.2 + 0.8 * light} />
        <polygon points="300,251 780,251 1040,1340 40,1340" fill="url(#cone)" opacity={light * 0.55} />

        <Protagonist pose={pose} reach={reach} />
        <Feet p={feet} />

        {/* obscurité liée au vacillement */}
        <rect width={WIDTH} height={HEIGHT} fill="#000" opacity={dark * 0.85} />
        {/* vignette */}
        <rect width={WIDTH} height={HEIGHT} fill="url(#vig)" />
        <defs>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.75} />
          </radialGradient>
        </defs>
      </svg>
      <div style={{ fontFamily: FONT }} />
    </AbsoluteFill>
  );
};

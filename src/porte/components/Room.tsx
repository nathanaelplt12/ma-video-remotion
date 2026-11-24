import { interpolate, random } from "remotion";
import { C, clamp } from "../theme";
import { EntityFace, PaleFoot } from "./Characters";

const HALL = "#dbeafe"; // lumière froide du couloir

/** Murs + sol communs (viewBox 1080x1920). */
const Walls: React.FC<{ floorY?: number }> = ({ floorY = 1460 }) => (
  <g>
    <defs>
      <linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.night} />
        <stop offset="1" stopColor={C.dusk} />
      </linearGradient>
      <linearGradient id="floorG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#14111f" />
        <stop offset="1" stopColor={C.black} />
      </linearGradient>
    </defs>
    <rect width={1080} height={1920} fill="url(#wallG)" />
    <rect y={floorY} width={1080} height={1920 - floorY} fill="url(#floorG)" />
    <rect y={floorY - 18} width={1080} height={18} fill="#2a2440" />
  </g>
);

/**
 * Vue frontale de la porte de la chambre.
 * open : 0 fermé → 1 grand ouvert. light : intensité de la fente du couloir. shadowX : ombre de pieds (-1 hors champ → 0 centre).
 * waves : âges (en frames) des ondes de choc actives.
 */
export const DoorView: React.FC<{ open?: number; light?: number; handle?: number; shadowX?: number | null; waves?: number[]; knockKick?: number }> = ({ open = 0, light = 1, handle = 0, shadowX = null, waves = [], knockKick = 0 }) => {
  const x0 = 300, x1 = 780, y0 = 480, y1 = 1450;
  const w = (x1 - x0) * (1 - open * 0.85);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <Walls />
      {/* poster et étagère (décor minimal) */}
      <rect x={70} y={620} width={150} height={210} rx={6} fill="#2b2542" />
      <circle cx={145} cy={700} r={40} fill="#3a3358" />
      <rect x={860} y={760} width={170} height={14} fill="#2b2542" />
      <rect x={880} y={700} width={40} height={60} fill="#3a3358" />
      <rect x={930} y={720} width={26} height={40} fill="#332d4d" />
      {/* lumière du couloir sous la porte, sur le sol */}
      <path d={`M ${x0 + 20} ${y1} L ${x1 - 20} ${y1} L ${x1 + 160} 1920 L ${x0 - 160} 1920 Z`} fill={HALL} opacity={0.07 * light} />
      {/* encadrement */}
      <rect x={x0 - 26} y={y0 - 26} width={x1 - x0 + 52} height={y1 - y0 + 26} fill="#2e2747" />
      {/* couloir derrière la porte */}
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={HALL} opacity={0.12 + 0.5 * open * light} />
      {/* fente lumineuse sous la porte */}
      <rect x={x0 + 6} y={y1 - 10} width={x1 - x0 - 12} height={10} fill={HALL} opacity={0.9 * light} />
      {shadowX !== null && (
        <g opacity={0.95}>
          <rect x={540 + shadowX * 500 - 120} y={y1 - 10} width={95} height={10} fill={C.black} />
          <rect x={540 + shadowX * 500 + 25} y={y1 - 10} width={95} height={10} fill={C.black} />
        </g>
      )}
      {/* battant de porte */}
      <g transform={`translate(${knockKick * 6} 0)`}>
        <rect x={x0} y={y0} width={w} height={y1 - y0 - 10} fill="#3b3358" />
        <rect x={x0 + w * 0.12} y={y0 + 70} width={w * 0.76} height={340} rx={10} fill="none" stroke="#2e2747" strokeWidth={10} />
        <rect x={x0 + w * 0.12} y={y0 + 500} width={w * 0.76} height={340} rx={10} fill="none" stroke="#2e2747" strokeWidth={10} />
        {/* poignée */}
        <g transform={`rotate(${-handle * 40} ${x0 + w - 60} 990)`}>
          <circle cx={x0 + w - 60} cy={990} r={20} fill="#8b84a8" />
          <rect x={x0 + w - 130} y={980} width={80} height={20} rx={10} fill="#a59fc0" />
        </g>
      </g>
      {/* ondes de choc des coups */}
      {waves.map((age, i) => {
        const p = age / 26;
        return <circle key={i} cx={540} cy={860} r={60 + p * 520} fill="none" stroke={C.white} strokeWidth={22 * (1 - p)} opacity={0.85 * (1 - p)} />;
      })}
      {/* coin du lit au premier plan */}
      <path d="M 0 1700 L 380 1700 Q 420 1700 420 1740 L 420 1920 L 0 1920 Z" fill="#1d1830" />
      <path d="M 0 1660 L 340 1660 Q 400 1665 400 1710 L 0 1710 Z" fill="#2c2546" />
    </svg>
  );
};

/** Gros plan sur la poignée qui tourne. */
export const HandleCloseup: React.FC<{ angle: number; f: number }> = ({ angle, f }) => {
  const vib = (random(`hv${f}`) - 0.5) * 6;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <rect width={1080} height={1920} fill="#2f2848" />
      <rect x={-20} y={0} width={180} height={1920} fill="#251f3a" />
      <rect x={980} y={0} width={140} height={1920} fill={C.night} />
      <rect x={972} y={0} width={10} height={1920} fill={HALL} opacity={0.25} />
      <rect x={220} y={200} width={600} height={520} rx={18} fill="none" stroke="#251f3a" strokeWidth={18} />
      <rect x={220} y={1350} width={600} height={520} rx={18} fill="none" stroke="#251f3a" strokeWidth={18} />
      <g transform={`translate(${vib} ${vib * 0.5})`}>
        <rect x={690} y={790} width={150} height={420} rx={40} fill="#6f6890" />
        <circle cx={765} cy={1100} r={22} fill={C.black} />
        <g transform={`rotate(${-angle} 765 960)`}>
          <circle cx={765} cy={960} r={64} fill="#a59fc0" />
          <rect x={360} y={928} width={420} height={64} rx={32} fill="#c4bfd9" />
          <rect x={380} y={940} width={360} height={14} rx={7} fill="#e2def0" opacity={0.6} />
        </g>
      </g>
    </svg>
  );
};

/** Bas de la porte : la fente lumineuse et l'ombre qui glisse devant. shadowX : -1.4 hors champ → 0 centre. */
export const DoorBottom: React.FC<{ shadowX: number; f: number }> = ({ shadowX, f }) => {
  const sx = 540 + shadowX * 700;
  const breath = Math.sin(f / 6) * 6;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <rect width={1080} height={1920} fill={C.black} />
      <rect x={0} y={0} width={1080} height={1080} fill="#3b3358" />
      <rect x={80} y={-200} width={920} height={900} rx={20} fill="none" stroke="#2e2747" strokeWidth={22} />
      <rect x={0} y={1080} width={1080} height={50} fill={HALL} />
      {/* rayons de lumière au sol */}
      <path d="M 0 1130 L 1080 1130 L 1500 1920 L -420 1920 Z" fill={HALL} opacity={0.13} />
      {/* ombre des pieds qui bloque la lumière */}
      <g transform={`translate(${sx} 0)`}>
        <rect x={-260} y={1080} width={210} height={50} fill={C.black} />
        <rect x={50 + breath * 0.3} y={1080} width={210} height={50} fill={C.black} />
        <path d={`M -260 1130 L -50 1130 L 30 1920 L -520 1920 Z`} fill={C.black} opacity={0.85} />
        <path d={`M 50 1130 L 260 1130 L 560 1920 L 10 1920 Z`} fill={C.black} opacity={0.85} />
      </g>
      <rect x={0} y={1060} width={1080} height={20} fill="#2e2747" />
    </svg>
  );
};

/**
 * Vue ras du sol depuis sous le lit.
 * open : porte au fond. walk : 0 (dans l'encadrement) → 1 (devant le lit). head : 0 → 1 tête à l'envers qui descend.
 */
export const UnderBed: React.FC<{ open: number; walk: number; head: number; f: number }> = ({ open, walk, head, f }) => {
  const doorW = 260 * (1 - open * 0.9);
  // les pieds approchent : position + échelle
  const sc = interpolate(walk, [0, 1], [0.35, 1.55], clamp);
  const fy = interpolate(walk, [0, 1], [1120, 1440], clamp);
  const step = Math.sin(walk * Math.PI * 6);
  const lift = (k: number) => (walk < 1 ? Math.max(0, k * step) * 30 * sc : 0);
  const twitch = walk >= 1 ? Math.max(0, Math.sin(f / 3)) * 3 : 0;
  const headY = interpolate(head, [0, 1], [-500, 900], clamp);
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <rect width={1080} height={1920} fill={C.black} />
      {/* fond de la chambre aperçu par la fente */}
      <rect x={0} y={650} width={1080} height={560} fill={C.dusk} />
      <rect x={0} y={1110} width={1080} height={810} fill="#110e1b" />
      {/* porte au fond */}
      <rect x={410} y={720} width={260} height={400} fill={HALL} opacity={0.15 + 0.75 * open} />
      <rect x={410} y={720} width={doorW} height={400} fill="#3b3358" />
      <path d={`M 410 1120 L 670 1120 L ${670 + 380 * open} 1500 L ${410 - 380 * open} 1500 Z`} fill={HALL} opacity={0.2 * open} />
      {/* pieds nus pâles */}
      {walk > 0 && (
        <g transform={`translate(540 ${fy}) scale(${sc})`}>
          <g transform={`translate(-120 ${-lift(1)})`}><PaleFoot /></g>
          <g transform={`translate(120 ${-lift(-1) - twitch})`}><PaleFoot flip /></g>
        </g>
      )}
      {/* dessous du sommier (lattes) */}
      <rect x={0} y={0} width={1080} height={660} fill="#0b0912" />
      {Array.from({ length: 7 }, (_, i) => <rect key={i} x={0} y={120 + i * 78} width={1080} height={30} fill="#16121f" />)}
      <rect x={0} y={640} width={1080} height={26} fill="#1d1830" />
      {/* pieds du lit */}
      <rect x={0} y={600} width={70} height={1320} fill="#0b0912" />
      <rect x={1010} y={600} width={70} height={1320} fill="#0b0912" />
      {/* tête de l'entité, à l'envers, qui descend depuis le bord du lit */}
      {head > 0 && (
        <g transform={`translate(540 ${headY}) rotate(180)`}>
          <rect x={-40} y={200} width={80} height={1400} fill={C.black} />
          <g transform="scale(1.45)">
            <EntityFace open={head} pupil={0.1} />
          </g>
        </g>
      )}
      {/* poussière au sol (premier plan) */}
      <rect x={0} y={1820} width={1080} height={100} fill={C.black} />
    </svg>
  );
};

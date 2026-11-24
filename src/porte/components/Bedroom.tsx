import { C } from "../theme";
import { EntityFace, EntityFull, HeroHead } from "./Characters";

const HALL = "#dbeafe";

/**
 * Chambre vue de côté : porte au fond à gauche, placard à droite, lit au premier plan.
 * entityX : position des pieds de l'entité (null = absente). lean : inclinaison vers le lit.
 * door : ouverture de la porte de chambre. closet : ouverture du placard (0 = entrouvert, 1 = grand ouvert).
 */
export const Bedroom: React.FC<{
  eyes: "open" | "shut" | "wide"; tremble?: number; entityX?: number | null; lean?: number; door?: number;
  closet?: number; closetEyes?: number; phone?: number; f: number; sweat?: boolean; smileOpen?: number;
}> = ({ eyes, tremble = 0, entityX = null, lean = 0, door = 0, closet = 0, closetEyes = 0, phone = 0, f, sweat = false, smileOpen = 0 }) => {
  const doorW = 300 * (1 - door * 0.85);
  const closetGap = 26 + closet * 330;
  const breathe = Math.sin(f / 9) * 6;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <defs>
        <linearGradient id="bw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.night} />
          <stop offset="1" stopColor={C.dusk} />
        </linearGradient>
        <radialGradient id="phoneGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={C.screen} stopOpacity={0.55} />
          <stop offset="1" stopColor={C.screen} stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#bw)" />
      <rect y={1300} width={1080} height={620} fill="#100d1a" />
      <rect y={1286} width={1080} height={16} fill="#2a2440" />
      {/* porte de la chambre (fond gauche) */}
      <rect x={70} y={560} width={300} height={740} fill={HALL} opacity={0.1 + 0.55 * door} />
      <rect x={70} y={560} width={doorW} height={740} fill="#3b3358" />
      <rect x={52} y={542} width={336} height={18} fill="#2e2747" />
      {doorW > 120 && <circle cx={70 + doorW - 40} cy={960} r={14} fill="#8b84a8" />}
      {/* placard (droite), entrouvert */}
      <rect x={640} y={420} width={400} height={880} fill="#2e2747" />
      <rect x={660} y={440} width={360} height={860} fill={C.black} />
      {closetEyes > 0 && (
        <g opacity={closetEyes}>
          <circle cx={680 + closetGap * 0.45} cy={760} r={14} fill={C.white} />
          <circle cx={680 + closetGap * 0.45 + 36} cy={760} r={14} fill={C.white} />
        </g>
      )}
      {closet > 0.15 && (
        <g transform={`translate(${840} 900) scale(${0.8 + closet * 0.5})`} opacity={Math.min(1, (closet - 0.15) * 3)}>
          <EntityFace open={closet} pupil={0.1} />
        </g>
      )}
      <rect x={660 + closetGap} y={440} width={Math.max(0, 360 - closetGap)} height={860} fill="#3b3358" />
      <rect x={660 + closetGap} y={440} width={10} height={860} fill="#2e2747" />
      {/* l'entité */}
      {entityX !== null && (
        <g transform={`translate(${entityX} 1300) scale(0.82)`}>
          <EntityFull lean={lean} open={smileOpen} armSwing={Math.sin(f / 8) * 0.3} dx={1} />
        </g>
      )}
      {/* lit + couette */}
      <rect x={120} y={1430} width={960} height={90} rx={10} fill="#241e38" />
      <rect x={120} y={1520} width={40} height={140} fill="#1a1529" />
      <rect x={1000} y={1520} width={40} height={140} fill="#1a1529" />
      <rect x={140} y={1310} width={260} height={150} rx={60} fill="#cbd5e1" opacity={0.85} />
      {/* protagoniste allongé : tête sur l'oreiller */}
      <g transform={`translate(285 ${1270 + breathe * 0.2}) rotate(-8)`}>
        <rect x={60} y={40} width={90} height={60} fill={C.mustard} rx={20} />
        <HeroHead eyes={eyes} tremble={tremble} sweat={sweat} glow={phone} look={phone > 0 ? 1 : 0} />
      </g>
      {/* couette (moutarde foncée → bleu nuit) qui monte et descend */}
      <path d={`M 360 ${1330 + breathe} Q 700 ${1250 + breathe} 1080 ${1310 + breathe} L 1080 1470 L 330 1470 Q 320 ${1380 + breathe} 360 ${1330 + breathe} Z`} fill="#3a3466" />
      <path d={`M 360 ${1330 + breathe} Q 700 ${1250 + breathe} 1080 ${1310 + breathe}`} fill="none" stroke="#4c4583" strokeWidth={14} />
      {phone > 0 && (
        <g>
          <circle cx={470} cy={1270} r={260} fill="url(#phoneGlow)" opacity={phone} />
          <rect x={420} y={1230} width={70} height={120} rx={12} fill={C.black} transform="rotate(-20 455 1290)" />
          <rect x={427} y={1238} width={56} height={104} rx={8} fill={C.screen} opacity={phone} transform="rotate(-20 455 1290)" />
        </g>
      )}
    </svg>
  );
};

/** Gros plan : visage du protagoniste, l'entité penchée à 2 cm. near : 0 loin → 1 collée. */
export const FaceCloseup: React.FC<{ near: number; f: number; tremble: number; smileOpen?: number }> = ({ near, f, tremble, smileOpen = 0 }) => {
  const ex = 1300 - near * 560;
  const ey = 350 + near * 320;
  return (
    <svg viewBox="0 0 1080 1920" width={1080} height={1920}>
      <rect width={1080} height={1920} fill={C.night} />
      <rect x={0} y={1180} width={1080} height={740} fill="#cbd5e1" opacity={0.8} />
      <g transform={`translate(460 1240) scale(3.6)`}>
        <HeroHead eyes="shut" tremble={tremble / 3.6} sweat={Math.floor(f / 20) % 2 === 0} />
      </g>
      <path d={`M -20 ${1520 + Math.sin(f / 9) * 8} Q 500 1420 1100 1500 L 1100 1920 L -20 1920 Z`} fill="#3a3466" />
      {/* l'entité entre par le coin supérieur droit, tête penchée */}
      <g transform={`translate(${ex} ${ey}) rotate(${-38 + near * 12}) scale(${1.4 + near * 0.6})`}>
        <rect x={-30} y={-1600} width={60} height={1400} fill={C.black} transform="rotate(30)" />
        <EntityFace open={smileOpen} pupil={0.09 + 0.03 * Math.sin(f / 2)} dx={-1} />
      </g>
    </svg>
  );
};

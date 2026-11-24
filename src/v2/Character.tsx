import { C, mix } from "./theme";

export type FaceProps = {
  /** Taille de l'iris/pupille (1 normal, 0.3 = terreur). */
  pupil?: number;
  /** Paupière supérieure : 0 grand ouvert, 0.45 fatigué. */
  lid?: number;
  /** Yeux fermés très fort. */
  squeeze?: boolean;
  mouth?: "smile" | "neutral" | "fear" | "tight";
  brows?: "relaxed" | "fear" | "squeeze";
  /** Progression de la goutte de sueur (0–1), undefined = aucune. */
  sweat?: number;
  /** Phase du souffle (0–1), undefined = aucun. */
  breath?: number;
  /** Hauteur (y) du bord de la couette, undefined = pas de couette. */
  blanket?: number;
  /** 0 = éclairé, 1 = noir complet (seuls les yeux restent visibles). */
  dark?: number;
  /** Intensité de la lumière bleue du téléphone (0–1). */
  phoneLight?: number;
  /** Décalage des yeux (tremblement du regard). */
  eyeJitter?: { x: number; y: number };
  /** Tremblement des mains sur la couette. */
  handJitter?: { x: number; y: number };
  id?: string;
};

const EYE_Y = 860;
const EYES = [400, 680];

/** Gros plan du protagoniste (sweat jaune), coordonnées 1080x1920, tête centrée en (540, 900). */
export const Face: React.FC<FaceProps> = ({
  pupil = 1, lid = 0, squeeze = false, mouth = "neutral", brows = "relaxed", sweat, breath, blanket,
  dark = 0, phoneLight = 0, eyeJitter = { x: 0, y: 0 }, handJitter = { x: 0, y: 0 }, id = "f",
}) => {
  const d = (c: string) => mix(c, "#050408", dark);
  const skin = d(C.skin), shade = d(C.skinShade), hood = d(C.hoodie), hoodD = d(C.hoodieDark);
  const line = d("#2a1e1a");
  const browY = brows === "fear" ? -16 : brows === "squeeze" ? 18 : 0;

  return (
    <g>
      <defs>
        <radialGradient id={`${id}pl`} cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor={C.phone} stopOpacity={0.55 * phoneLight} />
          <stop offset="60%" stopColor={C.phone} stopOpacity={0.12 * phoneLight} />
          <stop offset="100%" stopColor={C.phone} stopOpacity={0} />
        </radialGradient>
        <clipPath id={`${id}head`}><circle cx={540} cy={900} r={330} /></clipPath>
        {EYES.map((x, i) => (
          <clipPath key={i} id={`${id}eye${i}`}><ellipse cx={x} cy={EYE_Y} rx={98} ry={84} /></clipPath>
        ))}
      </defs>

      {/* capuche + sweat */}
      <path d="M 70 1920 Q 90 1360 300 1250 L 780 1250 Q 990 1360 1010 1920 Z" fill={hood} />
      <ellipse cx={540} cy={880} rx={440} ry={470} fill={hood} />
      <ellipse cx={540} cy={900} rx={372} ry={400} fill={hoodD} />
      <line x1={420} y1={1290} x2={400} y2={1560} stroke={d("#f5f5f4")} strokeWidth={14} strokeLinecap="round" />
      <line x1={660} y1={1290} x2={680} y2={1560} stroke={d("#f5f5f4")} strokeWidth={14} strokeLinecap="round" />

      {/* tête */}
      <circle cx={540} cy={900} r={330} fill={skin} />
      <g clipPath={`url(#${id}head)`}>
        <ellipse cx={720} cy={1000} rx={260} ry={360} fill={shade} opacity={0.55} />
        {/* frange */}
        <path d="M 200 760 Q 260 520 540 540 Q 840 520 890 780 Q 800 640 640 690 Q 560 610 470 690 Q 330 630 200 760 Z" fill={d("#1c1310")} />
      </g>
      <ellipse cx={540} cy={990} rx={26} ry={16} fill={shade} />

      {/* yeux */}
      {squeeze ? (
        EYES.map((x, i) => {
          const s = i === 0 ? 1 : -1;
          return (
            <g key={i} stroke={line} strokeWidth={16} strokeLinecap="round" fill="none">
              <path d={`M ${x - 70 * s} ${EYE_Y - 30} L ${x + 40 * s} ${EYE_Y + 5} L ${x - 70 * s} ${EYE_Y + 40}`} />
              <path d={`M ${x + 60 * s} ${EYE_Y - 55} q ${20 * s} 14 ${30 * s} 34`} strokeWidth={8} opacity={0.6} />
              <path d={`M ${x + 62 * s} ${EYE_Y + 50} q ${18 * s} -10 ${28 * s} -30`} strokeWidth={8} opacity={0.6} />
            </g>
          );
        })
      ) : (
        EYES.map((x, i) => (
          <g key={i}>
            <ellipse cx={x} cy={EYE_Y} rx={98} ry={84} fill="#f8fafc" />
            <g clipPath={`url(#${id}eye${i})`}>
              <circle cx={x + eyeJitter.x} cy={EYE_Y + eyeJitter.y} r={54 * pupil} fill={mix("#4a3426", "#050408", dark * 0.5)} />
              <circle cx={x + eyeJitter.x} cy={EYE_Y + eyeJitter.y} r={30 * pupil} fill="#050408" />
              <circle cx={x + eyeJitter.x + 16 * pupil} cy={EYE_Y + eyeJitter.y - 18 * pupil} r={10 * Math.max(pupil, 0.5)} fill="#ffffff" />
              <rect x={x - 110} y={EYE_Y - 90} width={220} height={lid * 180} fill={skin} />
              <line x1={x - 110} x2={x + 110} y1={EYE_Y - 86 + lid * 180} y2={EYE_Y - 86 + lid * 180} stroke={line} strokeWidth={10} />
            </g>
            <ellipse cx={x} cy={EYE_Y} rx={98} ry={84} fill="none" stroke={line} strokeWidth={8} />
          </g>
        ))
      )}

      {/* sourcils */}
      <g stroke={line} strokeWidth={20} strokeLinecap="round" fill="none">
        <path d={`M 320 ${720 + browY} Q 400 ${700 + browY * (brows === "fear" ? 0.2 : 1)} 470 ${716 + (brows === "fear" ? browY * 2 : brows === "squeeze" ? browY * 1.6 : 0)}`} />
        <path d={`M 760 ${720 + browY} Q 680 ${700 + browY * (brows === "fear" ? 0.2 : 1)} 610 ${716 + (brows === "fear" ? browY * 2 : brows === "squeeze" ? browY * 1.6 : 0)}`} />
      </g>

      {/* bouche */}
      <g stroke={line} strokeWidth={14} strokeLinecap="round" fill="none">
        {mouth === "smile" && <path d="M 450 1090 Q 540 1150 630 1090" />}
        {mouth === "neutral" && <path d="M 480 1105 Q 540 1112 600 1105" />}
        {mouth === "tight" && <path d="M 470 1105 q 18 -10 35 0 t 35 0 t 35 0 t 35 0" />}
      </g>
      {mouth === "fear" && <ellipse cx={540} cy={1110} rx={34} ry={44} fill={d("#2a1212")} stroke={line} strokeWidth={8} />}

      {/* goutte de sueur */}
      {sweat !== undefined && sweat > 0 && (() => {
        const y = 690 + Math.pow(sweat, 1.4) * 380;
        const x = 800 - sweat * 20;
        const o = sweat > 0.92 ? (1 - sweat) / 0.08 : 1;
        return (
          <g opacity={o}>
            <path d={`M ${x} ${690} Q ${x + 6} ${(690 + y) / 2} ${x} ${y - 20}`} stroke="#cfe8ff" strokeWidth={5} opacity={0.35} fill="none" />
            <path d={`M ${x} ${y - 44} Q ${x + 24} ${y - 6} ${x + 18} ${y + 8} A 19 19 0 1 1 ${x - 18} ${y + 8} Q ${x - 24} ${y - 6} ${x} ${y - 44} Z`} fill="#dbeafe" stroke="#93c5fd" strokeWidth={4} />
            <ellipse cx={x - 6} cy={y + 4} rx={5} ry={8} fill="#ffffff" />
          </g>
        );
      })()}

      {/* lumière du téléphone */}
      {phoneLight > 0 && <rect x={0} y={400} width={1080} height={1200} fill={`url(#${id}pl)`} style={{ mixBlendMode: "screen" }} />}

      {/* couette (+ mains crispées) */}
      {blanket !== undefined && (
        <g>
          <path d={`M -20 ${blanket + 30} Q 200 ${blanket - 25} 400 ${blanket + 10} Q 560 ${blanket + 40} 720 ${blanket} Q 900 ${blanket - 30} 1100 ${blanket + 25} L 1100 1940 L -20 1940 Z`} fill={d(C.slate3)} />
          <path d={`M 160 ${blanket + 120} Q 260 ${blanket + 260} 230 ${blanket + 520}`} stroke={d(C.slate2)} strokeWidth={14} fill="none" />
          <path d={`M 860 ${blanket + 100} Q 780 ${blanket + 300} 840 ${blanket + 560}`} stroke={d(C.slate2)} strokeWidth={14} fill="none" />
          {[400, 680].map((x, i) => (
            <g key={i} transform={`translate(${handJitter.x * (i ? -1 : 1)} ${handJitter.y})`}>
              <rect x={x - 80} y={blanket - 34} width={160} height={70} rx={34} fill={skin} />
              {[0, 1, 2, 3].map((k) => (
                <line key={k} x1={x - 54 + k * 36} x2={x - 54 + k * 36} y1={blanket - 16} y2={blanket + 22} stroke={shade} strokeWidth={6} strokeLinecap="round" />
              ))}
            </g>
          ))}
        </g>
      )}

      {/* souffle (air froid) */}
      {breath !== undefined && [0, 1, 2].map((k) => {
        const p = (breath + k / 3) % 1;
        const by = (blanket !== undefined ? Math.min(blanket, 1110) : 1120) - p * 220;
        return <circle key={k} cx={560 + Math.sin(p * 6 + k) * 30} cy={by} r={26 + p * 60} fill="#e2e8f0" opacity={0.16 * Math.sin(p * Math.PI)} />;
      })}
    </g>
  );
};

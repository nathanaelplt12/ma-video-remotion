import { C } from "../theme";

/* Tous les personnages sont des <g> SVG à placer dans un <svg>. */

type Eyes = "open" | "shut" | "wide";

/** Protagoniste : tête ronde noire, grands yeux ronds blancs, sweat jaune moutarde. Centre de la tête = (0,0), rayon 100. */
export const HeroHead: React.FC<{ eyes: Eyes; look?: number; tremble?: number; sweat?: boolean; glow?: number }> = ({ eyes, look = 0, tremble = 0, sweat = false, glow = 0 }) => (
  <g transform={`translate(${tremble} 0)`}>
    {glow > 0 && <circle cx={0} cy={0} r={150} fill={C.screen} opacity={0.18 * glow} />}
    <circle cx={0} cy={0} r={100} fill={C.black} />
    {glow > 0 && <path d="M -100 0 A 100 100 0 0 0 100 0 Z" fill={C.screen} opacity={0.12 * glow} />}
    {eyes === "shut" ? (
      <g stroke={C.white} strokeWidth={9} strokeLinecap="round" fill="none">
        {/* yeux plissés très fort : > < */}
        <path d="M -62 -22 L -30 -8 L -62 8" />
        <path d="M 62 -22 L 30 -8 L 62 8" />
        <path d="M -70 -40 L -28 -30 M 70 -40 L 28 -30" strokeWidth={6} opacity={0.6} />
      </g>
    ) : (
      <g>
        <circle cx={-38} cy={-12} r={eyes === "wide" ? 36 : 30} fill={C.white} />
        <circle cx={38} cy={-12} r={eyes === "wide" ? 36 : 30} fill={C.white} />
        <circle cx={-38 + look * 14} cy={-10} r={eyes === "wide" ? 7 : 11} fill={C.black} />
        <circle cx={38 + look * 14} cy={-10} r={eyes === "wide" ? 7 : 11} fill={C.black} />
      </g>
    )}
    {sweat && <path d="M 82 -50 q 10 20 0 28 q -10 -8 0 -28 Z" fill={C.screen} opacity={0.85} />}
  </g>
);

/** Buste : sweat jaune moutarde (sous la tête). */
export const HeroBody: React.FC = () => (
  <g>
    <path d="M -150 230 Q -150 110 -60 92 L 60 92 Q 150 110 150 230 Z" fill={C.mustard} />
    <path d="M -50 92 Q 0 135 50 92" fill="none" stroke="#a16207" strokeWidth={10} />
    <path d="M -95 160 L -95 230 M 95 160 L 95 230" stroke="#a16207" strokeWidth={8} />
  </g>
);

/** Grand sourire blanc rempli de dents. Centre (cx, cy), largeur w, hauteur h. */
export const Smile: React.FC<{ cx: number; cy: number; w: number; h: number; open?: number }> = ({ cx, cy, w, h, open = 0 }) => {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const top = cy - h * 0.15 - open * h * 0.2;
  const bot = cy + h + open * h * 0.4;
  const n = 14;
  const sw = Math.max(2, w / 80);
  return (
    <g>
      <path d={`M ${x0} ${cy - h * 0.2} Q ${cx} ${top + h * 0.3} ${x1} ${cy - h * 0.2} Q ${cx} ${bot + h * 0.6} ${x0} ${cy - h * 0.2} Z`} fill={C.white} />
      {Array.from({ length: n - 1 }, (_, i) => {
        const t = (i + 1) / n;
        const x = x0 + w * t;
        const k = 4 * t * (1 - t);
        return <line key={i} x1={x} y1={cy - h * 0.2 + (top + h * 0.3 - (cy - h * 0.2)) * k * 0.5} x2={x} y2={cy - h * 0.2 + (bot + h * 0.6 - (cy - h * 0.2)) * k * 0.5} stroke={C.black} strokeWidth={sw} />;
      })}
      <path d={`M ${x0 + w * 0.04} ${cy + h * 0.12} Q ${cx} ${cy + h * 0.12 + (bot - cy) * 0.75} ${x1 - w * 0.04} ${cy + h * 0.12}`} fill="none" stroke={C.black} strokeWidth={sw * 1.4} />
    </g>
  );
};

const BigEye: React.FC<{ cx: number; cy: number; r: number; pupil?: number; dx?: number }> = ({ cx, cy, r, pupil = 0.16, dx = 0 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={C.white} />
    <circle cx={cx + dx * r * 0.4} cy={cy} r={r * pupil} fill={C.black} />
  </g>
);

/** Visage de l'Entité. Centre (0,0), rayon 200. */
export const EntityFace: React.FC<{ open?: number; pupil?: number; dx?: number }> = ({ open = 0, pupil = 0.14, dx = 0 }) => (
  <g>
    <ellipse cx={0} cy={0} rx={190} ry={215} fill={C.black} />
    <BigEye cx={-78} cy={-70} r={58} pupil={pupil} dx={dx} />
    <BigEye cx={78} cy={-70} r={58} pupil={pupil} dx={dx} />
    <Smile cx={0} cy={45} w={340} h={70} open={open} />
  </g>
);

/**
 * L'Entité en pied : silhouette noire immense et fine. Les pieds sont en (0,0), hauteur ~1500.
 * lean : 0 = droite, 1 = penchée à ~80° vers la droite (le torse pivote aux hanches).
 */
export const EntityFull: React.FC<{ lean?: number; open?: number; armSwing?: number; dx?: number }> = ({ lean = 0, open = 0, armSwing = 0, dx = 0 }) => (
  <g>
    {/* jambes interminables */}
    <path d="M -30 0 L -18 -620 L 18 -620 L 30 0 Z" fill={C.black} />
    <path d="M -30 0 L -60 0 M 30 0 L 64 0" stroke={C.black} strokeWidth={22} strokeLinecap="round" />
    <g transform={`rotate(${lean * 78} 0 -620)`}>
      <path d="M -30 -620 L -48 -1200 L 48 -1200 L 30 -620 Z" fill={C.black} />
      {/* bras qui pendent */}
      <path d={`M -40 -1180 Q ${-120 - armSwing * 40} -900 ${-90 + armSwing * 60} -560`} stroke={C.black} strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d={`M 40 -1180 Q ${120 + armSwing * 40} -900 ${95 - armSwing * 60} -560`} stroke={C.black} strokeWidth={22} fill="none" strokeLinecap="round" />
      <rect x={-12} y={-1290} width={24} height={110} fill={C.black} />
      <g transform="translate(0 -1390) scale(0.55)">
        <EntityFace open={open} dx={dx} />
      </g>
    </g>
  </g>
);

/** Pied nu pâle (vue de profil-trois-quarts), orteils vers la caméra. Taille ~ 220x120. */
export const PaleFoot: React.FC<{ flip?: boolean }> = ({ flip = false }) => (
  <g transform={flip ? "scale(-1 1)" : undefined}>
    <path d="M -40 -260 L 40 -260 L 46 -60 L -46 -60 Z" fill={C.paleShade} />
    <path d="M -80 0 Q -100 -70 -50 -90 L 50 -90 Q 100 -70 90 0 Z" fill={C.pale} />
    {[-62, -32, -4, 24, 52].map((x, i) => (
      <ellipse key={i} cx={x + 4} cy={-4} rx={i === 0 ? 20 : 15} ry={14} fill={C.pale} stroke={C.paleShade} strokeWidth={4} />
    ))}
    <path d="M -30 -60 Q -10 -40 -20 -20" stroke={C.paleShade} strokeWidth={4} fill="none" />
  </g>
);

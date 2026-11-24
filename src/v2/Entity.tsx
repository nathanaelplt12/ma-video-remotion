import { C } from "./theme";

const Smile: React.FC<{ w: number; h: number; teeth?: number }> = ({ w, h, teeth = 14 }) => {
  const x0 = -w / 2, x1 = w / 2;
  return (
    <g>
      <path d={`M ${x0} 0 Q 0 ${h * 1.9} ${x1} 0 Q 0 ${h * 0.35} ${x0} 0 Z`} fill="#f4f4f5" />
      {Array.from({ length: teeth - 1 }, (_, i) => {
        const t = (i + 1) / teeth;
        const x = x0 + w * t;
        const top = h * 0.35 * 4 * t * (1 - t) * 0.5 + 2;
        const bot = h * 1.9 * 4 * t * (1 - t) * 0.5;
        return <line key={i} x1={x} y1={top} x2={x} y2={bot} stroke={C.black} strokeWidth={Math.max(2, w / 90)} />;
      })}
      <path d={`M ${x0 + w * 0.05} ${h * 0.42} Q 0 ${h * 1.12} ${x1 - w * 0.05} ${h * 0.42}`} fill="none" stroke={C.black} strokeWidth={Math.max(2, w / 80)} />
    </g>
  );
};

/** Visage de l'entité, centré en (0,0), rayon ~200. */
export const EntityFace: React.FC<{ pupil?: number; smile?: number }> = ({ pupil = 1, smile = 1 }) => (
  <g>
    <ellipse cx={0} cy={0} rx={190} ry={215} fill={C.black} />
    {[-78, 78].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy={-50} rx={46} ry={38} fill="#f4f4f5" />
        <circle cx={x} cy={-48} r={9 * pupil} fill={C.black} />
      </g>
    ))}
    <g transform="translate(0 45)">
      <Smile w={330 * smile} h={78} />
    </g>
  </g>
);

/** Silhouette entière : très grande, maigre, bras interminables. Pieds en (0,0), hauteur ~1500. */
export const EntityBody: React.FC<{ lean?: number }> = ({ lean = 0 }) => (
  <g transform={`rotate(${lean} 0 -700)`}>
    <path d="M -70 -1130 Q -190 -650 -150 -120" stroke={C.black} strokeWidth={28} fill="none" strokeLinecap="round" />
    <path d="M 70 -1130 Q 190 -650 150 -120" stroke={C.black} strokeWidth={28} fill="none" strokeLinecap="round" />
    <path d="M -80 -1170 L 80 -1170 L 50 -380 L 26 0 L 6 0 L 0 -380 L -6 0 L -26 0 L -50 -380 Z" fill={C.black} />
    <rect x={-18} y={-1250} width={36} height={100} fill={C.black} />
    <g transform="translate(0 -1390) scale(0.72)">
      <EntityFace />
    </g>
  </g>
);

/** Deux pieds pâles et décharnés vus de face, posés au sol en (0,0). step: 0–1 phase de marche. */
export const Feet: React.FC<{ step?: number; walking?: boolean }> = ({ step = 0, walking = false }) => {
  const foot = (side: number, lift: number) => (
    <g transform={`translate(${side * 95} ${-lift * 70})`}>
      <rect x={-30} y={-420} width={60} height={360} fill="#d8d4dc" />
      <path d="M -52 -70 Q -60 -10 -46 0 L 46 0 Q 62 -10 50 -70 Q 0 -100 -52 -70 Z" fill="#e7e3ea" />
      {[-36, -18, 0, 18, 36].map((x, i) => (
        <path key={i} d={`M ${x} -6 q ${x * 0.15} 22 ${x * 0.05} 40`} stroke="#e7e3ea" strokeWidth={14} strokeLinecap="round" fill="none" />
      ))}
      {[-36, -18, 0, 18, 36].map((x, i) => (
        <circle key={i} cx={x + x * 0.2} cy={36} r={4} fill="#9ca3af" />
      ))}
      <path d="M -14 -300 Q -4 -200 -16 -120" stroke="#a8a2b0" strokeWidth={5} fill="none" opacity={0.7} />
    </g>
  );
  const a = walking ? Math.max(0, Math.sin(step * Math.PI * 2)) : 0;
  const b = walking ? Math.max(0, -Math.sin(step * Math.PI * 2)) : 0;
  return (
    <g>
      <ellipse cx={0} cy={44} rx={210} ry={22} fill="#000" opacity={0.6} />
      {foot(-1, a)}
      {foot(1, b)}
    </g>
  );
};

/** Tête de l'entité à l'envers (cheveux qui pendent), centrée en (0,0). */
export const UpsideDownHead: React.FC<{ sway?: number }> = ({ sway = 0 }) => (
  <g>
    <rect x={-40} y={-1400} width={80} height={1250} fill={C.black} />
    <g transform="rotate(180)">
      <EntityFace pupil={0.7} smile={1.08} />
    </g>
    {Array.from({ length: 22 }, (_, i) => {
      const x = -170 + i * 16;
      const len = 260 + ((i * 37) % 9) * 32;
      return <path key={i} d={`M ${x} 170 q ${sway * 20 + ((i % 3) - 1) * 18} ${len / 2} ${sway * 34 + ((i % 5) - 2) * 10} ${len}`} stroke={C.black} strokeWidth={14} fill="none" strokeLinecap="round" />;
    })}
  </g>
);

import { C } from "../theme";

/** L'entité : silhouette fine et allongée, sourire géant. Coordonnées dans un viewBox 0 0 400 1000. */
const Smile: React.FC<{ cx: number; cy: number; w: number; h: number }> = ({ cx, cy, w, h }) => {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const teeth = 11;
  return (
    <g>
      <path d={`M ${x0} ${cy} Q ${cx} ${cy + h * 1.9} ${x1} ${cy} Q ${cx} ${cy + h * 0.25} ${x0} ${cy} Z`} fill="#fafafa" />
      {Array.from({ length: teeth - 1 }, (_, i) => {
        const t = (i + 1) / teeth;
        const x = x0 + w * t;
        const top = cy + h * 0.25 * 4 * t * (1 - t) * 0.9 + 1;
        const bot = cy + h * 1.9 * 4 * t * (1 - t) * 0.5;
        return <line key={i} x1={x} y1={top} x2={x} y2={bot} stroke={C.black} strokeWidth={Math.max(2, w / 70)} />;
      })}
      <path d={`M ${x0 + w * 0.06} ${cy + h * 0.5} Q ${cx} ${cy + h * 1.15} ${x1 - w * 0.06} ${cy + h * 0.5}`} fill="none" stroke={C.black} strokeWidth={Math.max(2, w / 70)} />
    </g>
  );
};

const Eye: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#fafafa" />
    <circle cx={cx} cy={cy} r={r * 0.2} fill={C.black} />
  </g>
);

type Props = { variant: "full" | "face" | "hands"; style?: React.CSSProperties; sway?: number };

export const Entity: React.FC<Props> = ({ variant, style, sway = 0 }) => {
  if (variant === "face") {
    return (
      <svg viewBox="0 0 400 400" style={style}>
        <circle cx={200} cy={200} r={190} fill="#050407" />
        <Eye cx={125} cy={140} r={52} />
        <Eye cx={275} cy={140} r={52} />
        <Smile cx={200} cy={225} w={330} h={95} />
      </svg>
    );
  }
  if (variant === "hands") {
    const hand = (flip: boolean) => (
      <g transform={flip ? "translate(400 0) scale(-1 1)" : undefined}>
        <rect x={0} y={420} width={150} height={60} rx={28} fill="#f4f4f5" />
        <rect x={140} y={410} width={190} height={80} rx={34} fill="#f4f4f5" />
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={300 - (i === 3 ? 30 : 0)} y={400 + i * 24} width={i === 3 ? 160 : 210} height={20} rx={10} fill="#f4f4f5" transform={`rotate(${-6 + i * 4} 320 ${440 + i * 24})`} />
        ))}
      </g>
    );
    return <svg viewBox="0 0 400 900" style={style}>{hand(false)}</svg>;
  }
  return (
    <svg viewBox="0 0 400 1000" style={style}>
      <g transform={`rotate(${sway} 200 600)`}>
        {/* bras interminables */}
        <path d="M150 330 Q 60 600 85 930" stroke="#050407" strokeWidth={20} fill="none" strokeLinecap="round" />
        <path d="M250 330 Q 340 600 315 930" stroke="#050407" strokeWidth={20} fill="none" strokeLinecap="round" />
        {/* torse fin */}
        <path d="M150 300 L250 300 L232 1000 L168 1000 Z" fill="#050407" />
        <rect x={188} y={230} width={24} height={90} fill="#050407" />
        {/* tête */}
        <circle cx={200} cy={150} r={105} fill="#050407" />
        <Eye cx={160} cy={118} r={30} />
        <Eye cx={240} cy={118} r={30} />
        <Smile cx={200} cy={170} w={170} h={52} />
      </g>
    </svg>
  );
};

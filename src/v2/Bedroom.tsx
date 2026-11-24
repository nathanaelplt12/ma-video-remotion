import { C } from "./theme";
import { Face, FaceProps } from "./Character";
import { EntityBody } from "./Entity";

export type BedroomProps = {
  /** Ouverture de la porte (0 fermée, 1 = grand ouvert). */
  door?: number;
  /** Angle de la poignée en degrés (0 = repos). */
  handle?: number;
  face?: FaceProps;
  /** Le personnage se redresse (0–1). */
  rise?: number;
  tremble?: { x: number; y: number };
  phone?: number;
  /** Silhouette de l'entité dans l'encadrement (0–1). */
  figure?: number;
  /** Yeux dans l'entrebâillement du placard (0–1). */
  closetEyes?: number;
  /** Secousse de la porte (coups). */
  doorKick?: number;
};

export const Bedroom: React.FC<BedroomProps> = ({
  door = 0, handle = 0, face = {}, rise = 0, tremble = { x: 0, y: 0 }, phone = 1, figure = 0, closetEyes = 0, doorKick = 0,
}) => {
  const fx = 60, fy = 430, fw = 300, fh = 810; // encadrement de porte
  const panelW = fw * (1 - 0.62 * door);
  const gapX = fx + panelW;
  const headX = 850, headY = 1000 - rise * 70;
  const s = 0.2;
  return (
    <g>
      <defs>
        <linearGradient id="br-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14111f" />
          <stop offset="1" stopColor={C.slate} />
        </linearGradient>
        <radialGradient id="br-phone" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor={C.phone} stopOpacity={0.45} />
          <stop offset="1" stopColor={C.phone} stopOpacity={0} />
        </radialGradient>
        <linearGradient id="br-light" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e2e8f0" stopOpacity={0.95} />
          <stop offset="1" stopColor="#94a3b8" stopOpacity={0.7} />
        </linearGradient>
      </defs>
      <rect width={1080} height={1920} fill="url(#br-wall)" />
      <rect y={1240} width={1080} height={680} fill={C.night} />
      <line x1={0} x2={1080} y1={1240} y2={1240} stroke="#2a2540" strokeWidth={6} />

      {/* fenêtre (lune) */}
      <rect x={430} y={420} width={220} height={280} fill="#0f1a2e" stroke="#2a2540" strokeWidth={14} />
      <line x1={540} x2={540} y1={420} y2={700} stroke="#2a2540" strokeWidth={10} />
      <line x1={430} x2={650} y1={560} y2={560} stroke="#2a2540" strokeWidth={10} />
      <circle cx={600} cy={480} r={26} fill="#cbd5e1" opacity={0.5} />

      {/* porte */}
      <rect x={fx - 18} y={fy - 18} width={fw + 36} height={fh + 18} fill="#120f1c" />
      {door > 0 && (
        <g>
          <rect x={gapX} y={fy} width={fx + fw - gapX} height={fh} fill="url(#br-light)" />
          <path d={`M ${gapX} ${fy + fh} L ${fx + fw} ${fy + fh} L ${fx + fw + 260 * door + 120} 1920 L ${gapX + 60} 1920 Z`} fill="#cbd5e1" opacity={0.12 + 0.1 * door} />
          <clipPath id="br-gap"><rect x={gapX} y={fy} width={fx + fw - gapX} height={fh} /></clipPath>
          {figure > 0 && (
            <g clipPath="url(#br-gap)"><g transform={`translate(${(gapX + fx + fw) / 2 + 10} ${fy + fh}) scale(0.62)`} opacity={figure}>
              <EntityBody />
            </g></g>
          )}
        </g>
      )}
      <g transform={`translate(${doorKick * 3} 0)`}>
        <rect x={fx} y={fy} width={panelW} height={fh} fill={C.slate2} />
        <rect x={fx + panelW * 0.14} y={fy + 60} width={panelW * 0.72} height={300} fill="none" stroke="#1d192b" strokeWidth={10} />
        <rect x={fx + panelW * 0.14} y={fy + 440} width={panelW * 0.72} height={300} fill="none" stroke="#1d192b" strokeWidth={10} />
        <g transform={`translate(${fx + panelW - 42} ${fy + 430}) rotate(${handle})`}>
          <circle r={16} fill="#8b8698" />
          <rect x={-70} y={-9} width={70} height={18} rx={9} fill="#a8a3b5" />
        </g>
      </g>

      {/* placard entrouvert */}
      <rect x={720} y={360} width={320} height={880} fill="#16131f" />
      <rect x={732} y={372} width={142} height={868} fill={C.slate2} />
      <rect x={890} y={372} width={140} height={868} fill={C.slate2} />
      <rect x={870} y={372} width={24} height={868} fill="#000" />
      <path d="M 894 372 L 912 360 L 912 1252 L 894 1240 Z" fill="#110e1a" />
      {closetEyes > 0 && (
        <g opacity={closetEyes} transform="translate(882 720) scale(1 0.8)">
          {/* détail caché : deux yeux dans l'entrebâillement du placard */}
          <circle cx={-4} cy={0} r={3.2} fill="#f4f4f5" />
          <circle cx={4} cy={0} r={3.2} fill="#f4f4f5" />
        </g>
      )}
      <circle cx={860} cy={800} r={8} fill="#8b8698" />
      <circle cx={904} cy={800} r={8} fill="#8b8698" />

      {/* lit */}
      <g transform={`translate(${tremble.x} ${tremble.y})`}>
        <rect x={960} y={860} width={60} height={470} rx={10} fill="#241f35" />
        <ellipse cx={850} cy={1065} rx={115} ry={42} fill="#cbd5e1" opacity={0.9} />
        <g transform={`translate(${headX - 540 * s} ${headY - 900 * s}) scale(${s})`}>
          <Face {...face} id="bed" />
        </g>
        <rect x={90} y={1110} width={920} height={220} rx={14} fill="#171427" />
        <rect x={90} y={1080} width={900} height={60} rx={24} fill="#3a3456" />
        {/* couette */}
        <path d={`M 100 1150 Q 120 1040 260 1050 Q 420 980 560 1035 Q 650 1060 720 ${1045 + rise * 40} Q 860 ${1060 + rise * 50} 960 ${1070 + rise * 40} L 980 1160 Q 540 1200 100 1150 Z`} fill={C.slate3} />
        <path d="M 260 1060 Q 330 1110 300 1160" stroke="#2a2540" strokeWidth={8} fill="none" />
        <path d="M 600 1050 Q 640 1110 610 1170" stroke="#2a2540" strokeWidth={8} fill="none" />
        {/* téléphone */}
        {phone > 0 && (
          <g opacity={phone}>
            <circle cx={745} cy={1010 - rise * 50} r={280} fill="url(#br-phone)" style={{ mixBlendMode: "screen" }} />
            <rect x={725} y={985 - rise * 50} width={38} height={62} rx={8} fill={C.phone} transform={`rotate(-20 744 ${1016 - rise * 50})`} />
          </g>
        )}
      </g>
    </g>
  );
};

import React from "react";
import { random } from "remotion";
import { PAL, mix } from "./look";

/* -------------------------------------------------------------------------- */
/* Personnage (vue de face, pieds en 0,0 ; ~1000 unités de haut)               */
/* -------------------------------------------------------------------------- */
export type PersonProps = {
  uid: string;
  hoodie: string;
  hoodUp?: boolean;
  /** 0 = tête droite, 1 = tête baissée (capuche masque tout) */
  headDown?: number;
  headTilt?: number;
  shrug?: number;
  armL?: number;
  armR?: number;
  /** phase de marche (radians) ; undefined = immobile */
  walk?: number;
  /** lumière d'appoint (côté gauche) */
  light?: string;
  lightAmt?: number;
  /** reflets IR dans les yeux (caméra de nuit) */
  eyeGlow?: number;
  /** objet tenu dans la main droite */
  holdKeys?: boolean;
  back?: boolean;
};

export const Person: React.FC<PersonProps> = ({
  uid, hoodie, hoodUp = false, headDown = 0, headTilt = 0, shrug = 0, armL = 4, armR = -4,
  walk, light = "#ffffff", lightAmt = 0.25, eyeGlow = 0, holdKeys = false, back = false,
}) => {
  const step = walk === undefined ? 0 : Math.sin(walk);
  const bob = walk === undefined ? 0 : Math.abs(Math.cos(walk)) * 8;
  const sh = -26 * shrug;
  const dark = mix(hoodie, "#000000", 0.45);
  const g = `${uid}g`, fg = `${uid}f`;
  return (
    <g transform={`translate(0 ${-bob})`}>
      <defs>
        <linearGradient id={g} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={light} stopOpacity={lightAmt} />
          <stop offset="0.55" stopColor={light} stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.45} />
        </linearGradient>
        <radialGradient id={fg} cx="0.5" cy={0.45 + headDown * 0.25} r="0.6">
          <stop offset="0" stopColor="#000" />
          <stop offset="0.7" stopColor="#050506" />
          <stop offset="1" stopColor={dark} />
        </radialGradient>
      </defs>
      {/* jambes */}
      <g fill={PAL.jeans}>
        <rect x={-92} y={-470} width={82} height={455 + step * 14} rx={30} />
        <rect x={10} y={-470} width={82} height={455 - step * 14} rx={30} />
      </g>
      <g fill="#0c0d10">
        <rect x={-104} y={-34 + step * 14} width={104} height={38} rx={18} />
        <rect x={0} y={-34 - step * 14} width={104} height={38} rx={18} />
      </g>
      {/* bras gauche */}
      <g transform={`translate(-150 ${-735 + sh}) rotate(${armL + step * 10})`}>
        <rect x={-34} y={0} width={68} height={330} rx={34} fill={hoodie} />
        <rect x={-34} y={0} width={68} height={330} rx={34} fill={`url(#${g})`} />
        <rect x={-30} y={300} width={60} height={34} rx={14} fill={dark} />
        <ellipse cx={0} cy={352} rx={30} ry={36} fill={PAL.skin} />
      </g>
      {/* torse */}
      <path
        d={`M -155 ${-745 + sh} Q 0 ${-800 + sh} 155 ${-745 + sh} L 135 -455 Q 0 -430 -135 -455 Z`}
        fill={hoodie}
      />
      {/* poche kangourou + cordons */}
      {!back && (
        <>
          <path d="M -90 -560 L 90 -560 L 110 -470 L -110 -470 Z" fill={dark} opacity={0.35} />
          {!hoodUp && (
            <g stroke={mix(hoodie, "#ffffff", 0.35)} strokeWidth={7} strokeLinecap="round">
              <line x1={-24} y1={-735 + sh} x2={-30} y2={-640 + sh} />
              <line x1={24} y1={-735 + sh} x2={30} y2={-645 + sh} />
            </g>
          )}
        </>
      )}
      <path
        d={`M -155 ${-745 + sh} Q 0 ${-800 + sh} 155 ${-745 + sh} L 135 -455 Q 0 -430 -135 -455 Z`}
        fill={`url(#${g})`}
      />
      {/* bras droit */}
      <g transform={`translate(150 ${-735 + sh}) rotate(${armR - step * 10})`}>
        <rect x={-34} y={0} width={68} height={330} rx={34} fill={hoodie} />
        <rect x={-34} y={0} width={68} height={330} rx={34} fill="#000" opacity={0.3} />
        <rect x={-30} y={300} width={60} height={34} rx={14} fill={dark} />
        <ellipse cx={0} cy={352} rx={30} ry={36} fill={mix(PAL.skin, "#000", 0.25)} />
        {holdKeys && <KeyRing x={6} y={390} scale={0.55} tag={PAL.red} swing={step * 10 + 8} />}
      </g>
      {/* tête */}
      <g transform={`translate(0 ${-800 + sh * 0.3 + headDown * 26}) rotate(${headTilt})`}>
        {hoodUp ? (
          <>
            <path d="M -112 30 Q -125 -150 0 -178 Q 125 -150 112 30 Q 60 70 0 70 Q -60 70 -112 30 Z" fill={hoodie} />
            <path d="M -112 30 Q -125 -150 0 -178 Q 125 -150 112 30 Q 60 70 0 70 Q -60 70 -112 30 Z" fill={`url(#${g})`} />
            <ellipse cx={0} cy={-38 + headDown * 18} rx={70} ry={92} fill={`url(#${fg})`} />
            {headDown < 0.4 && (
              <path d={`M -40 ${40} Q 0 ${62 - headDown * 30} 40 40`} stroke="#1b1b1f" strokeWidth={10} fill="none" opacity={0.7 * (1 - headDown * 2.5)} />
            )}
            {eyeGlow > 0 && (
              <g fill="#f4f7ff" opacity={eyeGlow}>
                <circle cx={-26} cy={-52} r={6} />
                <circle cx={26} cy={-52} r={6} />
                <circle cx={-26} cy={-52} r={16} opacity={0.25} />
                <circle cx={26} cy={-52} r={16} opacity={0.25} />
              </g>
            )}
          </>
        ) : (
          <>
            <rect x={-30} y={-10} width={60} height={60} fill={PAL.skinShade} />
            <ellipse cx={0} cy={-70} rx={72} ry={90} fill={PAL.skin} />
            <ellipse cx={0} cy={-70} rx={72} ry={90} fill={`url(#${g})`} />
            {back ? (
              <ellipse cx={0} cy={-90} rx={76} ry={80} fill="#2a1d16" />
            ) : (
              <>
                <path d="M -76 -80 Q -80 -175 0 -168 Q 82 -172 76 -84 Q 50 -132 -10 -128 Q -50 -126 -76 -80 Z" fill="#2a1d16" />
                <g fill="#2b1d17">
                  <ellipse cx={-26} cy={-70} rx={8} ry={5} />
                  <ellipse cx={26} cy={-70} rx={8} ry={5} />
                </g>
                <path d="M -18 -18 Q 0 -17 18 -18" stroke="#6b3b2c" strokeWidth={5} fill="none" />
              </>
            )}
            {/* capuche baissée dans le dos */}
            <path d="M -120 20 Q 0 70 120 20 Q 100 70 0 84 Q -100 70 -120 20 Z" fill={dark} />
          </>
        )}
      </g>
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Visage en gros plan (centre 0,0 ; ~560 de large)                            */
/* -------------------------------------------------------------------------- */
export type FaceProps = {
  uid: string;
  frown?: number;
  pupil?: number;
  lid?: number;
  light?: string;
  /** position de la source de lumière, en coordonnées visage */
  lx?: number;
  ly?: number;
  lightR?: number;
  darkness?: number;
  sweat?: number;
  mouth?: number;
  lookX?: number;
  lookY?: number;
};

export const Face: React.FC<FaceProps> = ({
  uid, frown = 0, pupil = 0.5, lid = 1, light = "#ffd9a0", lx = -220, ly = -80, lightR = 700,
  darkness = 0.6, sweat = -1, mouth = 0, lookX = 0, lookY = 0,
}) => {
  const sk = `${uid}sk`, sh = `${uid}sh`, cp = `${uid}cp`;
  const eye = (side: -1 | 1) => {
    const cx = side * 118, cy = -40;
    const ry = 34 * lid;
    return (
      <g key={side}>
        <clipPath id={`${cp}${side}`}>
          <path d={`M ${cx - 66} ${cy} Q ${cx} ${cy - ry * 1.6} ${cx + 66} ${cy} Q ${cx} ${cy + ry * 1.1} ${cx - 66} ${cy} Z`} />
        </clipPath>
        <ellipse cx={cx} cy={cy + 12} rx={84} ry={52} fill={PAL.skinShade} opacity={0.35} />
        <g clipPath={`url(#${cp}${side})`}>
          <rect x={cx - 70} y={cy - 60} width={140} height={120} fill="#e9e2da" />
          <circle cx={cx + lookX * 22} cy={cy + lookY * 10} r={29} fill="#4a2e1d" />
          <circle cx={cx + lookX * 22} cy={cy + lookY * 10} r={29} fill="none" stroke="#2a1910" strokeWidth={5} />
          <circle cx={cx + lookX * 22} cy={cy + lookY * 10} r={6 + 17 * pupil} fill="#060606" />
          <circle cx={cx + lookX * 22 - 9} cy={cy + lookY * 10 - 10} r={6} fill="#fff" opacity={0.85} />
          <rect x={cx - 70} y={cy - 60} width={140} height={120} fill={`url(#${sh})`} opacity={0.55} />
        </g>
        <path d={`M ${cx - 66} ${cy} Q ${cx} ${cy - ry * 1.6} ${cx + 66} ${cy}`} stroke="#1e130e" strokeWidth={8} fill="none" />
        <path d={`M ${cx - 60} ${cy + 4} Q ${cx} ${cy + ry * 1.1} ${cx + 60} ${cy + 4}`} stroke="#6a4232" strokeWidth={3} fill="none" opacity={0.6} />
        {/* sourcil */}
        <path
          d={`M ${cx - side * 72} ${-128 + frown * 4} Q ${cx} ${-150 + frown * 2} ${cx + side * 68} ${-126 - frown * 10}`}
          transform={`rotate(${side * frown * -12} ${cx + side * 60} -130) translate(${-side * frown * 8} ${frown * 16})`}
          stroke="#2a1b14" strokeWidth={20} strokeLinecap="round" fill="none"
        />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <radialGradient id={sk} cx={0.5 + lx / 700} cy={0.5 + ly / 900} r="0.75">
          <stop offset="0" stopColor={mix(PAL.skin, light, 0.35)} />
          <stop offset="0.55" stopColor={PAL.skin} />
          <stop offset="1" stopColor={PAL.skinShade} />
        </radialGradient>
        <radialGradient id={sh} cx="0.5" cy="0" r="0.8">
          <stop offset="0" stopColor="#000" stopOpacity={0.8} />
          <stop offset="1" stopColor="#000" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`${uid}dk`} gradientUnits="userSpaceOnUse" cx={lx} cy={ly} r={lightR}>
          <stop offset="0" stopColor="#000" stopOpacity={0} />
          <stop offset="0.5" stopColor="#000" stopOpacity={darkness * 0.5} />
          <stop offset="1" stopColor="#000" stopOpacity={darkness} />
        </radialGradient>
      </defs>
      {/* cheveux arrière + oreilles + cou */}
      <ellipse cx={0} cy={-120} rx={300} ry={330} fill="#1f150f" />
      <rect x={-150} y={250} width={300} height={400} fill={PAL.skinShade} />
      <ellipse cx={-275} cy={10} rx={40} ry={78} fill={PAL.skinShade} />
      <ellipse cx={275} cy={10} rx={40} ry={78} fill={PAL.skinShade} />
      <path d="M -270 -60 Q -280 260 -120 360 Q 0 420 120 360 Q 280 260 270 -60 Q 260 -330 0 -340 Q -260 -330 -270 -60 Z" fill={`url(#${sk})`} />
      {eye(-1)}
      {eye(1)}
      {/* nez */}
      <path d="M -10 -10 Q -20 90 -52 130 Q -20 160 0 150 Q 20 160 52 130" stroke="#7a4b38" strokeWidth={6} fill="none" opacity={0.7} />
      <path d="M 8 -10 Q 20 80 50 128 Q 30 140 10 138 Z" fill="#000" opacity={0.15} />
      {/* bouche */}
      <path d={`M -82 ${228 - frown * 4} Q 0 ${232 - frown * 14 + mouth * 20} 82 ${228 - frown * 4}`} stroke="#6b2f25" strokeWidth={11} strokeLinecap="round" fill="none" />
      {mouth > 0.05 && <ellipse cx={0} cy={250} rx={46 + 14 * mouth} ry={48 * mouth} fill="#1a0a08" />}
      {/* frange */}
      <path d="M -290 -60 Q -300 -360 0 -360 Q 300 -360 290 -60 Q 250 -230 110 -250 Q 40 -200 -60 -240 Q -200 -250 -290 -60 Z" fill="#20160f" />
      {/* goutte de sueur sur la tempe */}
      {sweat >= 0 && (
        <g transform={`translate(${-238 + sweat * 14} ${-150 + sweat * 260})`}>
          <path d="M 0 -26 Q 13 0 10 10 Q 0 22 -10 10 Q -13 0 0 -26 Z" fill="#e8f1ff" opacity={0.85} />
          <ellipse cx={-3} cy={4} rx={3} ry={5} fill="#fff" />
          <path d={`M 0 -30 L ${-sweat * 14} ${-30 - sweat * 240}`} stroke="#e8f1ff" strokeWidth={4} opacity={0.25} />
        </g>
      )}
      {/* éclairage : obscurité autour de la source */}
      <rect x={-700} y={-900} width={1400} height={1800} fill={`url(#${uid}dk)`} />
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Main (dos de la main, poignet en bas, ~ 260 x 480)                          */
/* -------------------------------------------------------------------------- */
export const Hand: React.FC<{ uid: string; sleeve?: string; thumb?: number; curl?: number; shade?: number }> = ({
  uid, sleeve = PAL.hoodieYellow, thumb = 0, curl = 0, shade = 0.2,
}) => {
  const fingers = [
    { x: -78, l: 150, a: -8 },
    { x: -26, l: 182, a: -2 },
    { x: 26, l: 172, a: 3 },
    { x: 76, l: 130, a: 9 },
  ];
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}h`} x1="0" x2="1">
          <stop offset="0" stopColor={mix(PAL.skin, "#fff", 0.12)} />
          <stop offset="1" stopColor={PAL.skinShade} />
        </linearGradient>
      </defs>
      {fingers.map((fi, i) => (
        <g key={i} transform={`translate(${fi.x} -150) rotate(${fi.a})`}>
          <rect x={-24} y={-fi.l * (1 - curl * 0.5)} width={48} height={fi.l * (1 - curl * 0.5) + 30} rx={24} fill={`url(#${uid}h)`} />
          <rect x={-14} y={-fi.l * (1 - curl * 0.5) + 6} width={28} height={22} rx={10} fill="#f1cdb8" opacity={0.6} />
        </g>
      ))}
      <path d="M -112 -160 Q -120 40 -80 110 L 80 110 Q 118 40 108 -160 Q 0 -190 -112 -160 Z" fill={`url(#${uid}h)`} />
      {/* pouce */}
      <g transform={`translate(-100 0) rotate(${-48 + thumb * 30})`}>
        <rect x={-26} y={-170} width={54} height={190} rx={27} fill={`url(#${uid}h)`} />
        <rect x={-15} y={-162} width={30} height={26} rx={12} fill="#f1cdb8" opacity={0.6} />
      </g>
      <path d="M -112 -160 Q -120 40 -80 110 L 80 110 Q 118 40 108 -160" fill="#000" opacity={shade} />
      <rect x={-120} y={100} width={240} height={260} rx={30} fill={sleeve} />
      <rect x={-120} y={100} width={240} height={50} rx={20} fill="#000" opacity={0.25} />
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Trousseau de clés                                                           */
/* -------------------------------------------------------------------------- */
export const Key: React.FC<{ rot: number; len?: number; color?: string }> = ({ rot, len = 150, color = "#c9ccd2" }) => (
  <g transform={`rotate(${rot})`}>
    <circle cx={0} cy={30} r={28} fill={color} />
    <circle cx={0} cy={22} r={9} fill="#000" opacity={0.5} />
    <rect x={-9} y={50} width={18} height={len} fill={color} />
    <path d={`M 9 ${70} l 14 8 l -14 8 l 12 10 l -12 8 l 16 10 l -16 10 Z`} fill={color} transform={`translate(0 ${len - 90})`} />
    <rect x={-9} y={50} width={6} height={len} fill="#fff" opacity={0.35} />
  </g>
);

export const KeyRing: React.FC<{ x: number; y: number; scale?: number; tag?: string; swing?: number; label?: string }> = ({
  x, y, scale = 1, tag = PAL.red, swing = 0, label,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale}) rotate(${swing})`}>
    <circle cx={0} cy={0} r={46} fill="none" stroke="#b9bcc4" strokeWidth={9} />
    <g transform="translate(0 40)">
      <Key rot={-24} />
      <Key rot={8} len={130} color="#d4b25c" />
      <Key rot={34} len={110} />
      <g transform="rotate(-60)">
        <rect x={-36} y={40} width={72} height={110} rx={20} fill={tag} />
        <circle cx={0} cy={62} r={10} fill="#000" opacity={0.4} />
        {label && (
          <text x={0} y={118} fill="#fff" fontFamily="Inter, sans-serif" fontWeight={900} fontSize={label.length > 3 ? 15 : 24} textAnchor="middle">{label}</text>
        )}
      </g>
    </g>
  </g>
);

/* -------------------------------------------------------------------------- */
/* Pluie sur une vitre (zone x,y,w,h)                                          */
/* -------------------------------------------------------------------------- */
export const Rain: React.FC<{ f: number; x: number; y: number; w: number; h: number; amt?: number; color?: string }> = ({
  f, x, y, w, h, amt = 1, color = "#bcd0ff",
}) => {
  const n = Math.round(60 * amt);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const sp = 40 + random(`rs${i}`) * 50;
        const px = x + random(`rx${i}`) * w;
        const py = y + ((random(`ry${i}`) * h + f * sp) % h);
        return <line key={i} x1={px} y1={py} x2={px - 6} y2={py + 40 + sp * 0.4} stroke={color} strokeWidth={2.5} opacity={0.35} />;
      })}
      {Array.from({ length: Math.round(26 * amt) }).map((_, i) => {
        const px = x + random(`dx${i}`) * w;
        const py = y + ((random(`dy${i}`) * h + f * (2 + random(`dv${i}`) * 4)) % h);
        return <ellipse key={`d${i}`} cx={px} cy={py} rx={5} ry={7} fill={color} opacity={0.4} />;
      })}
    </g>
  );
};

/* -------------------------------------------------------------------------- */
/* Porte (panneau vu de face), largeur w, hauteur h, origine coin haut gauche  */
/* -------------------------------------------------------------------------- */
export const DoorPanel: React.FC<{ w: number; h: number; color: string; handleAngle?: number }> = ({ w, h, color, handleAngle = 0 }) => (
  <g>
    <rect x={0} y={0} width={w} height={h} fill={color} />
    <rect x={w * 0.12} y={h * 0.06} width={w * 0.76} height={h * 0.38} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={8} />
    <rect x={w * 0.12} y={h * 0.52} width={w * 0.76} height={h * 0.42} fill="none" stroke="#000" strokeOpacity={0.35} strokeWidth={8} />
    <g transform={`translate(${w * 0.86} ${h * 0.5})`}>
      <rect x={-12} y={-40} width={24} height={110} rx={10} fill="#8d8f96" />
      <g transform={`rotate(${handleAngle})`}>
        <rect x={-110} y={-11} width={120} height={22} rx={11} fill="#b8bbc2" />
      </g>
      <rect x={-5} y={40} width={10} height={20} rx={4} fill="#111" />
    </g>
  </g>
);

/* -------------------------------------------------------------------------- */
/* Grain + vignette (calques plein cadre)                                      */
/* -------------------------------------------------------------------------- */
export const Grain: React.FC<{ f: number; amt?: number }> = ({ f, amt = 0.12 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0, opacity: amt, mixBlendMode: "overlay" }}>
    <filter id={`grain${f % 6}`}>
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 6} stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#grain${f % 6})`} />
  </svg>
);

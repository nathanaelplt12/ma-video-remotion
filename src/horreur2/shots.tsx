import React from "react";
import { AbsoluteFill, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DoorPanel, Face, Hand, KeyRing, Person, Rain } from "./art";
import { Cam, CctvRoom, Finish, Glitch, Glow, Svg } from "./kit";
import { FONT, MONO, PAL, bgAt, lerp, lightAt, mix, shake, warmth } from "./look";

type P = { abs: number };
const useF = () => useCurrentFrame();
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/* ============================== SCÈNE 1 : HOOK ============================== */

/** Poignée de porte qui tourne toute seule (dès la frame 0). */
const Handle: React.FC<{ angle: number; cold?: string; glowKey?: number }> = ({ angle, cold = PAL.coldLight, glowKey = 0 }) => (
  <Svg>
    <rect width={1080} height={1920} fill="#0d1018" />
    {/* bord de porte éclairé par un filet de lumière */}
    <rect x={0} y={0} width={1080} height={1920} fill="#151a26" />
    <rect x={40} y={0} width={16} height={1920} fill={cold} opacity={0.35} />
    <Glow id="hg" cx={560} cy={900} r={620} color={cold} o={0.28} />
    {/* rosace */}
    <rect x={480} y={640} width={150} height={620} rx={60} fill="#2e333d" />
    <rect x={488} y={648} width={30} height={600} rx={14} fill="#fff" opacity={0.08} />
    {/* entrée de clé */}
    <circle cx={555} cy={1120} r={26} fill="#05060a" />
    <rect x={543} y={1120} width={24} height={70} rx={6} fill="#05060a" />
    {glowKey > 0 && <circle cx={555} cy={1120} r={16} fill="#ffe8b0" opacity={glowKey} />}
    {/* béquille */}
    <g transform={`translate(555 820) rotate(${angle})`}>
      <circle cx={0} cy={0} r={70} fill="#4a505c" />
      <rect x={-420} y={-38} width={440} height={76} rx={38} fill="#5b616e" />
      <rect x={-420} y={-38} width={440} height={22} rx={11} fill="#cfd6e4" opacity={0.35} />
      <circle cx={0} cy={0} r={46} fill="#6c7380" />
    </g>
  </Svg>
);

export const S1a: React.FC<P> = () => {
  const f = useF();
  const a = lerp(f, [0, 50], [0, 28], ease) + shake(f, 1.6, "hd").x;
  return (
    <Cam z0={1.12} z1={1.3} shakeAmt={6} ox={420} oy={860}>
      <Handle angle={a} />
      <Finish vig={0.9} />
    </Cam>
  );
};

export const S1b: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.9} z1={2.6} punchAt={0} ox={540} oy={960} shakeAmt={4}>
      <Svg>
        <rect width={1080} height={1920} fill="#05070c" />
        <g transform="translate(540 1020) scale(1.5)">
          <Face uid="e1" lid={1.32} pupil={0.85} light={PAL.coldLight} lx={0} ly={-40} lightR={300} darkness={0.92}
            lookX={Math.sin(f * 0.6) * 0.25 + (f > 30 ? 0.4 : 0)} frown={-0.7} />
        </g>
        {/* filet de lumière horizontal sur les yeux */}
        <rect x={0} y={925} width={1080} height={70} fill={PAL.coldLight} opacity={0.08} />
      </Svg>
      <Finish vig={0.95} />
    </Cam>
  );
};

/* ===================== SCÈNE 2 : ROUTINE (CHAUD) ======================== */

const Wall: React.FC<{ abs: number; f: number }> = ({ abs, f }) => (
  <rect width={1080} height={1920} fill={bgAt(abs + f)} />
);

export const S2a: React.FC<P> = ({ abs }) => {
  const f = useF();
  const open = lerp(f, [0, 20], [0.05, 1], ease);
  const pw = 420 * Math.cos(open * 1.25);
  const px = lerp(f, [8, 59], [540, 600]);
  const ps = lerp(f, [8, 59], [0.78, 1.05]);
  return (
    <Cam z0={1.0} z1={1.08} punchAt={0}>
      <Svg>
        <Wall abs={abs} f={f} />
        <Glow id="lamp2a" cx={880} cy={500} r={900} color={PAL.amber} o={0.45} />
        {/* encadrement + extérieur nuit */}
        <rect x={310} y={500} width={460} height={1030} fill="#3a2a1d" />
        <rect x={330} y={520} width={420} height={1010} fill="#0e1424" />
        <Rain f={f} x={330} y={520} w={420} h={1010} amt={0.15} />
        {/* personnage qui entre */}
        <g transform={`translate(${px} ${1530 + (ps - 0.78) * 260}) scale(${ps})`}>
          <Person uid="p2a" hoodie={PAL.hoodieYellow} walk={f * 0.35} light={PAL.amber} lightAmt={0.35} armR={-14} />
        </g>
        {/* battant de porte */}
        <g transform={`translate(330 520) scale(${Math.max(0.02, pw / 420)} 1)`}>
          <DoorPanel w={420} h={1010} color="#6b4a2e" handleAngle={0} />
        </g>
        <rect x={0} y={1530} width={1080} height={390} fill="#3b2a1c" />
        <rect x={0} y={1530} width={1080} height={12} fill="#000" opacity={0.3} />
      </Svg>
      <Finish vig={0.55} grain={0.1} />
    </Cam>
  );
};

/** Vide-poche vu de dessus. withHand: la main pose les clés jaunes. double: le double (étiquette rouge) est là. */
const Tray: React.FC<{ abs: number; f: number; hand: boolean; double: boolean; mark?: boolean }> = ({ abs, f, hand, double, mark = false }) => {
  const w = warmth(abs + f);
  const drop = 22;
  const handY = hand ? lerp(f, [0, 16, drop, 40], [-500, 640, 660, -600], ease) : -900;
  const ky = hand ? (f < drop ? handY + 470 : 1030 - Math.abs(Math.sin((f - drop) * 0.7)) * 40 * Math.exp(-(f - drop) * 0.18)) : 1030;
  const blink = Math.floor(f / 8) % 2 === 0;
  return (
    <Svg>
      <rect width={1080} height={1920} fill={mix("#141821", "#4a3220", w)} />
      {/* grain du bois */}
      {Array.from({ length: 22 }).map((_, i) => (
        <path key={i} d={`M 0 ${i * 90 + 20} Q 540 ${i * 90 + 50 + Math.sin(i) * 30} 1080 ${i * 90 + 10}`} stroke="#000" strokeOpacity={0.15} strokeWidth={6} fill="none" />
      ))}
      <Glow id="trayg" cx={420} cy={700} r={1000} color={lightAt(abs + f)} o={0.35 + 0.2 * w} />
      {/* coupelle céramique */}
      <ellipse cx={540} cy={1080} rx={380} ry={270} fill="#000" opacity={0.35} />
      <ellipse cx={540} cy={1050} rx={370} ry={260} fill={mix("#3d4350", "#d9cfc0", w)} />
      <ellipse cx={540} cy={1060} rx={320} ry={215} fill={mix("#262a33", "#b3a693", w)} />
      {double && <KeyRing x={390} y={1010} scale={0.8} tag={PAL.red} swing={-20} />}
      {mark && (
        <g opacity={blink ? 1 : 0.35}>
          <ellipse cx={400} cy={1080} rx={170} ry={130} fill="none" stroke={PAL.red} strokeWidth={10} strokeDasharray="30 18" />
          <text x={400} y={1260} fill={PAL.red} fontFamily={FONT} fontWeight={900} fontSize={44} textAnchor="middle">?</text>
        </g>
      )}
      <KeyRing x={hand ? 680 : 690} y={ky} scale={0.78} tag={PAL.hoodieYellow} swing={hand && f < drop ? 20 + Math.sin(f) * 8 : 30} />
      {hand && (
        <g transform={`translate(700 ${handY}) rotate(180) scale(1.25)`}>
          <Hand uid="th" curl={f < drop ? 0.5 : 0.1} />
        </g>
      )}
    </Svg>
  );
};

export const S2b: React.FC<P> = ({ abs }) => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.12} punchAt={22} ox={600} oy={1040}>
      <Tray abs={abs} f={f} hand double />
      <Finish vig={0.6} grain={0.1} />
    </Cam>
  );
};

export const S2c: React.FC<P> = ({ abs }) => {
  const f = useF();
  const done = f >= 43;
  const secs = Math.max(0, 3 - Math.floor(f / 14));
  const flash = done ? lerp(f, [43, 45, 56], [0, 1, 0]) : 0;
  const plate = f * 4;
  return (
    <Cam z0={1.05} z1={1.18} ox={420} oy={950} shakeAmt={done ? 3 : 0}>
      <Svg>
        <Wall abs={abs} f={f} />
        <rect x={60} y={560} width={960} height={800} rx={40} fill="#d8d2c8" />
        <rect x={60} y={560} width={960} height={800} rx={40} fill="#000" opacity={0.25} />
        {/* fenêtre et intérieur éclairé */}
        <rect x={110} y={620} width={640} height={680} rx={24} fill="#1c120a" />
        <rect x={130} y={640} width={600} height={640} rx={18} fill={done ? "#2a1a0d" : "#ffb347"} opacity={done ? 1 : 0.55} />
        <ellipse cx={430} cy={1160} rx={230} ry={46} fill="#fff" opacity={0.25} />
        <g transform={`translate(430 1120) scale(${1 + Math.sin(plate / 30) * 0.03} 1)`}>
          <path d="M -140 0 Q 0 120 140 0 Z" fill="#e7e2db" />
          <ellipse cx={0} cy={0} rx={140} ry={26} fill="#a8652e" />
        </g>
        {/* reflets */}
        <path d="M 160 660 L 300 660 L 180 1240 L 140 1240 Z" fill="#fff" opacity={0.07} />
        {/* panneau de commande */}
        <rect x={790} y={640} width={190} height={130} rx={12} fill="#05070a" />
        <text x={885} y={732} fill={done ? (Math.floor(f / 4) % 2 ? "#5cff8a" : "#173d22") : "#5cff8a"} fontFamily={MONO} fontWeight={700} fontSize={64} textAnchor="middle">
          {`00:0${secs}`}
        </text>
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x={810 + (i % 3) * 56} y={820 + Math.floor(i / 3) * 70} width={44} height={44} rx={10} fill="#bfb8ad" />
        ))}
        <rect width={1080} height={1920} fill="#fff6dc" opacity={flash * 0.75} />
      </Svg>
      <Finish vig={0.6} grain={0.1} />
    </Cam>
  );
};

/** Salon cosy (canapé, lampe, fenêtre avec pluie). */
const LivingRoom: React.FC<{ abs: number; f: number; rain: number; sit: number; phone?: boolean; lamp?: number; back?: boolean }> = ({
  abs, f, rain, sit, phone = false, lamp = 1, back = false,
}) => {
  const w = warmth(abs + f);
  return (
    <>
      <Wall abs={abs} f={f} />
      {/* fenêtre */}
      <rect x={110} y={300} width={460} height={700} fill="#3b2a1d" />
      <rect x={130} y={320} width={420} height={660} fill="#0b1222" />
      <Rain f={f} x={130} y={320} w={420} h={660} amt={rain} />
      <line x1={340} y1={320} x2={340} y2={980} stroke="#3b2a1d" strokeWidth={14} />
      <line x1={130} y1={650} x2={550} y2={650} stroke="#3b2a1d" strokeWidth={14} />
      {/* lampe */}
      <Glow id={`lr${abs}`} cx={880} cy={760} r={900} color={PAL.amber} o={0.55 * lamp * Math.max(w, 0.15)} />
      <line x1={880} y1={1340} x2={880} y2={830} stroke="#2a1d12" strokeWidth={14} />
      <polygon points="790,830 970,830 930,700 830,700" fill={mix("#3a3f4c", "#ffd08a", lamp * w)} />
      {/* personnage assis */}
      <g transform={`translate(520 ${1420 - 40 + sit * 40}) scale(0.9)`}>
        <Person uid={`lp${abs}`} hoodie={PAL.hoodieYellow} back={back} light={PAL.amber} lightAmt={0.3 * w} armL={phone ? -40 : 8} armR={phone ? 40 : -8} />
      </g>
      {phone && <rect x={490} y={1050} width={60} height={90} rx={10} fill="#cfe2ff" opacity={0.85} />}
      {phone && <Glow id={`ph${abs}`} cx={520} cy={1000} r={220} color="#cfe2ff" o={0.4} />}
      {/* canapé (devant les jambes) */}
      <rect x={150} y={1200} width={780} height={260} rx={50} fill={mix("#262a36", "#7a4a35", w)} />
      <rect x={110} y={1160} width={120} height={420} rx={50} fill={mix("#2c3040", "#8a5640", w)} />
      <rect x={850} y={1160} width={120} height={420} rx={50} fill={mix("#2c3040", "#8a5640", w)} />
      <rect x={150} y={1420} width={780} height={180} rx={30} fill={mix("#1e212b", "#6a3e2c", w)} />
      <rect x={0} y={1600} width={1080} height={320} fill={mix("#0b0d14", "#2e2017", w)} />
    </>
  );
};

export const S2d: React.FC<P> = ({ abs }) => {
  const f = useF();
  const sit = lerp(f, [0, 10], [0, 1], ease);
  return (
    <Cam z0={1.15} z1={1.05} y0={-30} y1={0} punchAt={8} oy={1200}>
      <Svg><LivingRoom abs={abs} f={f} rain={0} sit={sit} /></Svg>
      <Finish vig={0.55} grain={0.1} />
    </Cam>
  );
};

/** Téléphone tenu en main, contenu d'écran personnalisable. */
const PhoneInHand: React.FC<{ f: number; children: React.ReactNode; thumbX: number; thumbY: number; tremble?: number; light?: string; uid: string }> = ({
  f, children, thumbX, thumbY, tremble = 0, light = "#fff", uid,
}) => {
  const t = shake(f, tremble, uid);
  return (
    <g transform={`translate(${t.x} ${t.y})`}>
      <Glow id={`${uid}g`} cx={540} cy={900} r={800} color={light} o={0.25} />
      <rect x={250} y={300} width={580} height={1160} rx={70} fill="#0b0b0d" />
      <rect x={270} y={320} width={540} height={1120} rx={56} fill="#000" />
      <svg x={270} y={320} width={540} height={1120} viewBox="0 0 540 1120">
        <rect width={540} height={1120} rx={56} fill="#101114" />
        {children}
      </svg>
      {/* main gauche qui tient */}
      <g transform="translate(250 1250) rotate(18) scale(1.1)">
        <Hand uid={`${uid}l`} curl={0.6} shade={0.05} />
      </g>
      {/* pouce droit */}
      <g transform={`translate(${thumbX} ${thumbY}) rotate(-25)`}>
        <rect x={-46} y={-30} width={92} height={420} rx={46} fill={PAL.skin} />
        <rect x={-46} y={-30} width={92} height={420} rx={46} fill="#000" opacity={0.18} />
        <ellipse cx={0} cy={6} rx={30} ry={36} fill="#f1cdb8" opacity={0.55} />
      </g>
      <rect x={780} y={1300} width={300} height={700} rx={60} fill={PAL.hoodieYellow} opacity={0} />
    </g>
  );
};

export const S2e: React.FC<P> = ({ abs }) => {
  const f = useF();
  const scroll = (f * 22) % 1400;
  const notif = lerp(f, [28, 34], [-200, 40], ease);
  return (
    <Cam z0={1.08} z1={1.16} ox={540} oy={900}>
      <Svg>
        <Wall abs={abs} f={f} />
        <PhoneInHand f={f} uid="sc" thumbX={700} thumbY={1060 - ((f * 22) % 260)} light={PAL.amber}>
          <g transform={`translate(0 ${-scroll})`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <g key={i} transform={`translate(30 ${110 + i * 240})`}>
                <rect width={480} height={210} rx={22} fill={["#3b2a4a", "#24405a", "#5a3b24", "#2f4a33"][i % 4]} />
                <rect x={24} y={150} width={300} height={18} rx={9} fill="#fff" opacity={0.5} />
                <rect x={24} y={178} width={200} height={14} rx={7} fill="#fff" opacity={0.3} />
                <circle cx={60} cy={60} r={34} fill="#fff" opacity={0.25} />
              </g>
            ))}
          </g>
          <rect width={540} height={70} fill="#101114" />
          <text x={40} y={50} fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={28}>21:47</text>
          <g transform={`translate(20 ${notif})`}>
            <rect width={500} height={120} rx={26} fill="#2a2b30" opacity={0.97} />
            <rect x={20} y={24} width={70} height={70} rx={18} fill="#22c55e" />
            <text x={110} y={52} fill="#fff" fontFamily={FONT} fontWeight={800} fontSize={26}>Maman</text>
            <text x={110} y={88} fill="#ddd" fontFamily={FONT} fontSize={24}>Bien rentré ? Bisous</text>
          </g>
        </PhoneInHand>
      </Svg>
      <Finish vig={0.6} grain={0.1} />
    </Cam>
  );
};

export const S2f: React.FC<P> = ({ abs }) => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.07} x0={30} x1={-20} ox={340} oy={700}>
      <Svg><LivingRoom abs={abs} f={f} rain={lerp(f, [0, 40], [0.1, 1])} sit={1} phone back /></Svg>
      <Finish vig={0.6} grain={0.11} />
    </Cam>
  );
};

/** Accéléré 21:15 -> 23:10 : salon en time-lapse + grande horloge qui défile. */
export const S2g: React.FC<P> = ({ abs }) => {
  const f = useF();
  const mins = Math.round(lerp(f, [0, 52], [21 * 60 + 15, 23 * 60 + 10], (t) => t * t * (3 - 2 * t)));
  const hh = String(Math.floor(mins / 60)).padStart(2, "0"), mm = String(mins % 60).padStart(2, "0");
  const pose = Math.floor(f / 6) % 3;
  return (
    <Cam z0={1.02} z1={1.1}>
      <Svg>
        <g transform={`translate(${pose * 6 - 6} 0)`}>
          <LivingRoom abs={abs} f={f * 3} rain={1.3} sit={1} phone={pose !== 1} lamp={1 - pose * 0.08} back={pose === 2} />
        </g>
      </Svg>
      <AbsoluteFill style={{ background: "rgba(10,14,30,0.25)" }} />
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: MONO, fontWeight: 800, fontSize: 200, color: "#fff", textShadow: `0 0 40px ${PAL.amber}` }}>
        {hh}:{mm}
      </div>
      <div style={{ position: "absolute", top: 540, width: "100%", textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 48, color: PAL.amber, letterSpacing: 8 }}>
        ▶▶ x120
      </div>
      <Finish vig={0.6} grain={0.12} />
    </Cam>
  );
};

/* ===================== SCÈNE 3 : LE DÉTAIL ÉTRANGE ======================= */

export const S3a: React.FC<P> = () => {
  const f = useF();
  const off = f >= 16;
  const press = lerp(f, [6, 14, 16, 30], [0, 1, 1, 0.3]);
  return (
    <Cam z0={1.1} z1={1.2} punchAt={16} ox={540} oy={950}>
      <Svg>
        <rect width={1080} height={1920} fill={off ? "#0d1220" : "#6a4a2c"} />
        {!off && <Glow id="sw" cx={300} cy={500} r={1200} color={PAL.amber} o={0.6} />}
        {off && <Glow id="swc" cx={900} cy={300} r={900} color={PAL.coldLight} o={0.18} />}
        <rect x={380} y={680} width={320} height={480} rx={30} fill={off ? "#3a4256" : "#f0e6d6"} />
        <rect x={380} y={680} width={320} height={480} rx={30} fill="#000" opacity={0.15} />
        <rect x={480} y={770} width={120} height={300} rx={20} fill={off ? "#2a3142" : "#ddd0bc"} />
        <rect x={490} y={off ? 920 : 785} width={100} height={140} rx={16} fill={off ? "#4a5468" : "#fffaf0"} />
        <g transform={`translate(${560} ${lerp(press, [0, 1], [380, 600])}) rotate(180) scale(1.35)`}>
          <Hand uid="swh" curl={0.15} sleeve={off ? mix(PAL.hoodieYellow, "#0b0e17", 0.7) : PAL.hoodieYellow} shade={off ? 0.6 : 0.2} />
        </g>
      </Svg>
      <Finish vig={off ? 0.9 : 0.5} />
    </Cam>
  );
};

/** Couloir en perspective (point de fuite au centre), porte de salle de bain au fond à gauche. */
const Corridor: React.FC<{ f: number; ajar: number; who?: React.ReactNode; hint?: number }> = ({ f, ajar, who, hint = 0 }) => (
  <>
    <rect width={1080} height={1920} fill="#090c15" />
    <polygon points="0,0 1080,0 700,700 380,700" fill="#0c1120" />
    <polygon points="0,1920 1080,1920 700,1150 380,1150" fill="#0a0d16" />
    {Array.from({ length: 9 }).map((_, i) => (
      <line key={i} x1={-200 + i * 185} y1={1920} x2={380 + i * 40} y2={1150} stroke="#000" strokeOpacity={0.5} strokeWidth={4} />
    ))}
    <polygon points="0,0 380,700 380,1150 0,1920" fill="#111829" />
    <polygon points="1080,0 700,700 700,1150 1080,1920" fill="#0e1422" />
    {/* fond du couloir : porte de la salle de bain */}
    <rect x={380} y={700} width={320} height={450} fill="#0f1626" />
    <rect x={470} y={790} width={150} height={360} fill="#1b2335" />
    <rect x={470} y={790} width={Math.max(2, 150 * ajar)} height={360} fill="#020305" />
    {hint > 0 && <ellipse cx={478} cy={860} rx={8} ry={28} fill="#1d2233" opacity={hint} />}
    {/* porte de chambre à droite */}
    <polygon points="900,330 1000,170 1000,1660 900,1450" fill="#1a2132" />
    <circle cx={920} cy={890} r={10} fill="#5a6478" />
    {/* veilleuse au sol */}
    <Glow id={`cg${Math.round(ajar * 100)}`} cx={300} cy={1350} r={420} color={PAL.coldLight} o={0.18 + Math.sin(f * 0.3) * 0.01} />
    {who}
  </>
);

export const S3b: React.FC<P> = () => {
  const f = useF();
  const t = lerp(f, [0, 59], [0, 1]);
  return (
    <Cam z0={1.0} z1={1.08} y0={10} y1={-10} shakeAmt={2}>
      <Svg>
        <Corridor f={f} ajar={0.12} who={
          <g transform={`translate(${520 + t * 200} ${1700 - t * 320}) scale(${1.05 - t * 0.35})`}>
            <Person uid="cw" hoodie={mix(PAL.hoodieYellow, "#0b0e17", 0.65)} back walk={f * 0.38} light={PAL.coldLight} lightAmt={0.2} />
          </g>
        } />
      </Svg>
      <Finish vig={0.85} />
    </Cam>
  );
};

export const S3c: React.FC<P> = ({ abs }) => {
  const f = useF();
  return (
    <Cam z0={1.05} z1={1.3} punchAt={0} ox={400} oy={1060}>
      <Tray abs={abs} f={f} hand={false} double={false} mark />
      <Finish vig={0.85} />
    </Cam>
  );
};

export const S3d: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.12} punchAt={18} oy={900}>
      <Svg>
        <rect width={1080} height={1920} fill="#080b13" />
        <g transform="translate(560 1000) scale(1.35)">
          <Face uid="fr" frown={lerp(f, [4, 22], [0, 1], ease)} pupil={0.45} light={PAL.coldLight} lx={-300} ly={-60} lightR={650} darkness={0.75}
            lookX={lerp(f, [10, 30], [0, -0.6])} lookY={lerp(f, [10, 30], [0, 0.5])} />
        </g>
      </Svg>
      <Finish vig={0.85} />
    </Cam>
  );
};

export const S3e: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.14} ox={540} oy={930}>
      <Svg><Corridor f={f} ajar={0.18} hint={lerp(f, [10, 40], [0, 0.55])} /></Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

export const S3f: React.FC<P> = () => {
  const f = useF();
  const sh = lerp(f, [6, 16, 32, 44], [0, 1, 1, 0], ease);
  return (
    <Cam z0={1.2} z1={1.28} oy={800}>
      <Svg>
        <rect width={1080} height={1920} fill="#0a0e18" />
        <Glow id="shg" cx={200} cy={700} r={900} color={PAL.coldLight} o={0.25} />
        <g transform="translate(540 1900) scale(1.6)">
          <Person uid="sh" hoodie={mix(PAL.hoodieYellow, "#0b0e17", 0.6)} shrug={sh} headTilt={sh * 8} armL={8 + sh * 14} armR={-8 - sh * 14} light={PAL.coldLight} lightAmt={0.3} />
        </g>
      </Svg>
      <Finish vig={0.85} />
    </Cam>
  );
};

export const S3g: React.FC<P> = () => {
  const f = useF();
  const ps = lerp(f, [0, 28], [0.7, 1.0]);
  const close = lerp(f, [28, 46], [0, 1], (t) => t * t);
  const pw = 400 * (1 - Math.cos(close * Math.PI / 2) * 0.98);
  return (
    <Cam z0={1.0} z1={1.06} shakeAmt={f > 44 && f < 50 ? 6 : 0}>
      <Svg>
        <rect width={1080} height={1920} fill="#0b0f19" />
        <rect x={340} y={480} width={400} height={1050} fill="#05070c" />
        <Glow id="bdg" cx={540} cy={1000} r={500} color={PAL.coldLight} o={0.12} />
        {f < 40 && (
          <g transform={`translate(540 ${1530 + (ps - 0.7) * 300}) scale(${ps})`} opacity={lerp(f, [26, 34], [1, 0])}>
            <Person uid="bd" hoodie={mix(PAL.hoodieYellow, "#0b0e17", 0.65)} walk={f * 0.35} light={PAL.coldLight} lightAmt={0.2} />
          </g>
        )}
        {/* battant qui se referme (charnière à droite) */}
        <g transform={`translate(${740 - pw} 480)`}>
          <DoorPanel w={Math.max(4, pw)} h={1050} color="#2a3242" />
        </g>
        <rect x={0} y={1530} width={1080} height={400} fill="#07090f" />
      </Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

/* ===================== SCÈNE 4 : LE BRUIT ======================== */

/** Visage au lit éclairé par le téléphone (lumière froide par le bas). */
const BedFace: React.FC<{ uid: string; f: number; pupil?: number; lid?: number; phoneY?: number; phoneLight?: number; frown?: number; mouth?: number; sweat?: number }> = ({
  uid, f, pupil = 0.4, lid = 0.85, phoneY = 1500, phoneLight = 1, frown = 0, mouth = 0, sweat = -1,
}) => (
  <>
    <rect width={1080} height={1920} fill="#05070d" />
    {/* oreiller */}
    <ellipse cx={540} cy={700} rx={560} ry={330} fill="#1a2030" />
    <g transform="translate(540 860) scale(1.25)">
      <Face uid={uid} pupil={pupil} lid={lid} frown={frown} mouth={mouth} sweat={sweat} light="#dfe9ff" lx={0} ly={(phoneY - 860) / 1.25} lightR={420 + 380 * phoneLight} darkness={0.97 - phoneLight * 0.12} lookY={0.6} />
    </g>
    {/* couette */}
    <path d="M -50 1300 Q 300 1180 540 1260 Q 800 1180 1130 1300 L 1130 1920 L -50 1920 Z" fill="#141a28" />
    <path d="M -50 1300 Q 300 1180 540 1260 Q 800 1180 1130 1300" stroke="#2a3348" strokeWidth={8} fill="none" />
    {/* dos du téléphone + halo */}
    <Glow id={`${uid}pg`} cx={540} cy={phoneY - 120} r={500 * phoneLight + 60} color="#dfe9ff" o={0.35 * phoneLight} />
    <rect x={400} y={phoneY} width={280} height={520} rx={40} fill="#16181d" />
    <rect x={400} y={phoneY} width={280} height={8} rx={4} fill="#dfe9ff" opacity={0.6 * phoneLight} />
    <circle cx={460} cy={phoneY + 70} r={26} fill="#0a0b0d" />
    <rect x={0} y={0} width={0} height={0} opacity={f * 0} />
  </>
);

export const S4a: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.1} punchAt={0} oy={900}>
      <Svg><BedFace uid="b1" f={f} lid={0.8} phoneY={1320} /></Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

/** Onde sonore qui traverse le mur depuis la cuisine. */
export const S4b: React.FC<P> = () => {
  const f = useF();
  const hit = 42;
  const t = f - hit;
  return (
    <Cam z0={1.05} z1={1.1} shakeAmt={t >= 0 && t < 8 ? 14 : 1}>
      <Svg>
        <rect width={1080} height={1920} fill="#0b0f19" />
        <rect x={0} y={1500} width={1080} height={420} fill="#070910" />
        {/* cadre photo au mur */}
        <g transform={`rotate(${t >= 0 ? Math.min(4, t * 1.5) : 0} 700 600)`}>
          <rect x={600} y={480} width={220} height={280} fill="#1c2232" stroke="#39425a" strokeWidth={12} />
        </g>
        {/* pan de mur côté cuisine */}
        <rect x={0} y={0} width={70} height={1920} fill="#141a2a" />
        <text x={110} y={1440} fill="#4c5a78" fontFamily={MONO} fontSize={36} opacity={0.8}>← CUISINE</text>
        {t >= 0 &&
          [0, 6, 12, 18].map((d) => {
            const r = Math.max(0, (t - d) * 70);
            return (
              <circle key={d} cx={-60} cy={980} r={r} fill="none" stroke="#c9d8ff" strokeWidth={14 - d * 0.5} opacity={Math.max(0, 0.7 - r / 1500)} />
            );
          })}
        {t >= 0 && t < 3 && <rect width={1080} height={1920} fill="#c9d8ff" opacity={0.12} />}
      </Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

export const S4c: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.04} punchAt={0} oy={800} shakeAmt={1.5}>
      <Svg><BedFace uid="b2" f={f} pupil={lerp(f, [2, 12], [0.6, 0.08])} lid={lerp(f, [0, 4], [0.85, 1.3])} frown={lerp(f, [0, 6], [0, -0.6])} phoneY={1320} /></Svg>
      <Finish vig={0.92} />
    </Cam>
  );
};

export const S4d: React.FC<P> = () => {
  const f = useF();
  const k = lerp(f, [4, 50], [0, 1], ease);
  return (
    <Cam z0={1.05} z1={1.0} oy={900}>
      <Svg><BedFace uid="b3" f={f} pupil={0.12} lid={1.2} frown={-0.5} phoneY={1320 + k * 420} phoneLight={1 - k * 0.7} /></Svg>
      <Finish vig={0.92} />
    </Cam>
  );
};

/** Plan ras du sol sur le parquet : une latte vibre. */
export const S4e: React.FC<P> = () => {
  const f = useF();
  const vib = lerp(f, [3, 8, 40, 50], [0, 1, 1, 0]) * Math.sin(f * 2.2) * 9;
  return (
    <Cam z0={1.05} z1={1.15} shakeAmt={vib !== 0 ? 2 : 0} oy={1300}>
      <Svg>
        <rect width={1080} height={1920} fill="#07090f" />
        <Glow id="flg" cx={540} cy={820} r={700} color={PAL.coldLight} o={0.22} />
        {/* lattes : bandes horizontales en perspective forte */}
        {Array.from({ length: 14 }).map((_, i) => {
          const y0 = 900 + Math.pow(i / 14, 2) * 1050, y1 = 900 + Math.pow((i + 1) / 14, 2) * 1050;
          const isIt = i === 9;
          const dy = isIt ? vib : 0;
          return (
            <g key={i}>
              <polygon points={`-200,${y0 + dy} 1280,${y0 + dy} 1280,${y1 + dy} -200,${y1 + dy}`} fill={i % 2 ? "#1a1e2a" : "#161a25"} />
              <line x1={-200} y1={y0 + dy} x2={1280} y2={y0 + dy} stroke="#000" strokeWidth={2 + i * 0.6} />
              {isIt && <line x1={-200} y1={y0 + dy + 2} x2={1280} y2={y0 + dy + 2} stroke="#c9d8ff" strokeOpacity={Math.abs(vib) / 20} strokeWidth={4} />}
            </g>
          );
        })}
        {/* fond de couloir */}
        <rect x={0} y={0} width={1080} height={900} fill="#0b0f19" />
        <rect x={420} y={420} width={240} height={480} fill="#05070c" />
        {/* poussière qui saute */}
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={random(`p${i}`) * 1080} cy={1600 - Math.abs(Math.sin(f * 0.3 + i)) * 30 * (Math.abs(vib) / 9)} r={3} fill="#c9d8ff" opacity={0.35} />
        ))}
      </Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

/** Bas de la porte de chambre : filet de lumière + ombre de pieds. */
const DoorBottom: React.FC<{ f: number; feet: number; stopShake?: number; keyGlow?: boolean }> = ({ f, feet, stopShake = 0 }) => {
  const fx = lerp(feet, [0, 1], [-400, 540]);
  return (
    <>
      <rect width={1080} height={1920} fill="#06080d" />
      <g transform={`translate(${shake(f, stopShake, "db").x} 0)`}>
        <rect x={60} y={0} width={960} height={1380} fill="#1a2030" />
        <rect x={140} y={120} width={800} height={1100} fill="none" stroke="#000" strokeOpacity={0.4} strokeWidth={10} />
      </g>
      {/* lumière sous la porte */}
      <defs>
        <linearGradient id="lg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#9fb6e8" stopOpacity={0.9} />
          <stop offset="1" stopColor="#9fb6e8" stopOpacity={0} />
        </linearGradient>
      </defs>
      <rect x={60} y={1380} width={960} height={22} fill="#b8c9ef" />
      <polygon points="60,1402 1020,1402 1180,1920 -100,1920" fill="url(#lg)" opacity={0.35} />
      {/* ombres des deux pieds */}
      <g opacity={0.95}>
        <rect x={fx - 170} y={1376} width={150} height={30} fill="#000" />
        <rect x={fx + 20} y={1376} width={150} height={30} fill="#000" />
        <polygon points={`${fx - 170},1402 ${fx - 20},1402 ${fx + 10},1920 ${fx - 260},1920`} fill="#000" opacity={0.6} />
        <polygon points={`${fx + 20},1402 ${fx + 170},1402 ${fx + 260},1920 ${fx - 10},1920`} fill="#000" opacity={0.6} />
      </g>
      <rect x={0} y={1400} width={60} height={520} fill="#06080d" />
      <rect x={1020} y={1400} width={60} height={520} fill="#06080d" />
    </>
  );
};

export const S4f: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.15} z1={1.3} ox={540} oy={1400} punchAt={30}>
      <Svg><DoorBottom f={f} feet={lerp(f, [6, 30], [0, 0.85], ease)} /></Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

export const S4g: React.FC<P> = () => {
  const f = useF();
  const tr = shake(f, 7, "tr");
  return (
    <Cam z0={1.0} z1={1.05}>
      <Svg>
        <rect width={1080} height={1920} fill="#05070d" />
        <g transform="translate(980 900) scale(2.4)">
          <Face uid="sw" pupil={0.1} lid={1.2} frown={-0.6} sweat={lerp(f, [0, 58], [0, 1])} light="#dfe9ff" lx={-150} ly={150} lightR={420} darkness={0.85} />
        </g>
        <g transform={`translate(${300 + tr.x} ${1650 + tr.y}) rotate(${-10 + tr.x * 0.4}) scale(1.2)`}>
          <Hand uid="swh2" sleeve={mix(PAL.hoodieYellow, "#0b0e17", 0.7)} curl={0.4} shade={0.55} />
        </g>
      </Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

/* ===================== SCÈNE 5 : LA CAMÉRA ======================== */

const Icon: React.FC<{ x: number; y: number; c: string; label: string; press?: number }> = ({ x, y, c, label, press = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${1 - press * 0.12})`}>
    <rect x={-50} y={-50} width={100} height={100} rx={26} fill={c} />
    <text x={0} y={84} fill="#ddd" fontFamily={FONT} fontWeight={600} fontSize={18} textAnchor="middle">{label}</text>
  </g>
);

export const S5a: React.FC<P> = () => {
  const f = useF();
  const press = lerp(f, [18, 21, 27], [0, 1, 0]);
  const ripple = f >= 20 ? (f - 20) * 14 : 0;
  return (
    <Cam z0={1.1} z1={1.25} ox={540} oy={820} punchAt={20}>
      <Svg>
        <rect width={1080} height={1920} fill="#04060b" />
        <PhoneInHand f={f} uid="hm" tremble={4} light="#dfe9ff" thumbX={lerp(f, [0, 18], [760, 556], ease)} thumbY={lerp(f, [0, 18], [1150, 840], ease)}>
          <rect width={540} height={1120} fill="#0f1730" />
          <text x={40} y={50} fill="#fff" fontFamily={FONT} fontWeight={700} fontSize={28}>00:42</text>
          {[["#e11d48", "Photos"], ["#2563eb", "Météo"], ["#16a34a", "Messages"], ["#f59e0b", "Notes"], ["#7c3aed", "Musique"], ["#0ea5e9", "Plans"]].map(([c, l], i) => (
            <Icon key={i} x={100 + (i % 3) * 170} y={200 + Math.floor(i / 3) * 190} c={c} label={l} />
          ))}
          <Icon x={270} y={590} c="#111827" label="CAMÉRA MAISON" press={press} />
          <g transform={`translate(270 590) scale(${1 - press * 0.12})`}>
            <rect x={-30} y={-18} width={44} height={36} rx={8} fill="#e5e7eb" />
            <polygon points="14,-6 32,-16 32,16 14,6" fill="#e5e7eb" />
            <circle cx={-34} cy={-34} r={9} fill={PAL.red} />
          </g>
          {ripple > 0 && <circle cx={270} cy={590} r={ripple} fill="none" stroke="#fff" strokeWidth={6} opacity={Math.max(0, 1 - ripple / 300)} />}
        </PhoneInHand>
      </Svg>
      <Finish vig={0.85} />
    </Cam>
  );
};

export const S5b: React.FC<P> = () => {
  const f = useF();
  const g = (f >= 4 && f < 9) || (f >= 33 && f < 37) || f >= 56;
  const dots = ".".repeat(1 + (Math.floor(f / 8) % 3));
  return (
    <Cam z0={1.0} z1={1.06} punchAt={33}>
      <Glitch on={g} seed="cx">
        <AbsoluteFill style={{ background: "#050608", alignItems: "center", justifyContent: "center" }}>
          <svg width={200} height={200} viewBox="-100 -100 200 200">
            <circle r={70} fill="none" stroke="#222" strokeWidth={14} />
            <circle r={70} fill="none" stroke="#e5e7eb" strokeWidth={14} strokeDasharray="110 330" transform={`rotate(${f * 14})`} />
          </svg>
          <div style={{ marginTop: 50, fontFamily: MONO, fontWeight: 800, fontSize: 64, color: "#e5e7eb", letterSpacing: 6 }}>CONNEXION{dots}</div>
          <div style={{ marginTop: 20, fontFamily: MONO, fontSize: 32, color: "#6b7280" }}>CAM 01 • SALON</div>
        </AbsoluteFill>
      </Glitch>
      <Finish vig={0.8} grain={0.2} />
    </Cam>
  );
};

const ts = (abs: number, f: number) => {
  const s = Math.floor((abs + f - 1500) / 30) + 8;
  return `24/11 00:43:${String(s % 60).padStart(2, "0")}`;
};

export const S5c: React.FC<P> = ({ abs }) => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.05} punchAt={0}>
      <CctvRoom door={0} time={ts(abs, f)} glitch={f < 3} />
    </Cam>
  );
};

export const S5d: React.FC<P> = ({ abs }) => {
  const f = useF();
  return (
    <Cam z0={1.04} z1={1.16} ox={320} oy={600}>
      <CctvRoom door={lerp(f, [4, 56], [0, 0.65], ease)} time={ts(abs, f)} />
    </Cam>
  );
};

export const S5e: React.FC<P> = ({ abs }) => {
  const f = useF();
  const t = lerp(f, [0, 59], [0, 1]);
  return (
    <Cam z0={1.12} z1={1.05} ox={320} oy={700}>
      <CctvRoom door={0.7} time={ts(abs, f)} man={{ x: 330 + t * 170, y: 820 + t * 250, s: 0.5 + t * 0.12, headDown: 1, walk: f * 0.3 }} />
    </Cam>
  );
};

export const S5f: React.FC<P> = ({ abs }) => {
  const f = useF();
  const man = { x: 520, y: 1080, s: 0.63, headDown: 1, walk: 0.5 + Math.sin(f * 0.1) * 0.1 };
  // position de la main droite de l'homme dans le décor
  const hx = man.x + 150 * man.s, hy = man.y + (-735 + 390) * man.s;
  const z = lerp(f, [0, 8], [1.2, 3.6], ease);
  return (
    <Cam z0={1} z1={1.05}>
      <CctvRoom door={0.7} time={ts(abs, f)} man={man} zoom={{ s: z, x: hx, y: hy }} label={`ZOOM x${(z * 1.1).toFixed(1)}`} glitch={f >= 8 && f < 11} />
    </Cam>
  );
};

export const S5g: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.12} punchAt={0} shakeAmt={9} oy={800}>
      <Svg><BedFace uid="b4" f={f} pupil={0.08} lid={1.45} mouth={0.75 + Math.sin(f * 0.9) * 0.2} frown={-1} phoneY={1260} /></Svg>
      <Finish vig={0.92} />
    </Cam>
  );
};

export const S5h: React.FC<P> = ({ abs }) => {
  const f = useF();
  const up = lerp(f, [6, 34], [1, 0], (t) => t * t);
  const man = { x: 540, y: 1110, s: 0.64, headDown: up, glow: lerp(f, [26, 34], [0, 1]) };
  const hy = man.y - 860 * man.s;
  const z = f < 30 ? lerp(f, [0, 29], [1.0, 1.25]) : lerp(f, [30, 34], [1.25, 2.6]);
  return (
    <Cam z0={1} z1={1} shakeAmt={f >= 30 && f < 40 ? 10 : 0}>
      <CctvRoom door={0.7} time={ts(abs, f)} man={man} zoom={{ s: z, x: man.x, y: hy }} glitch={(f >= 30 && f < 34) || f > 55} />
    </Cam>
  );
};

/* ===================== SCÈNE 6 : CLIFFHANGER ======================== */

export const S6a: React.FC<P> = ({ abs }) => {
  const f = useF();
  const t = lerp(f, [0, 59], [0, 1]);
  return (
    <Cam z0={1.08} z1={1.0}>
      <CctvRoom door={0.7} time={ts(abs, f)} man={{ x: 540 + t * 620, y: 1110 - t * 180, s: 0.64 - t * 0.12, headDown: 0.3, walk: f * 0.3 }} />
    </Cam>
  );
};

export const S6b: React.FC<P> = () => {
  const f = useF();
  const fall = lerp(f, [0, 10], [0, 1], (t) => t * t);
  const bounce = f > 10 ? Math.abs(Math.sin((f - 10) * 0.5)) * 30 * Math.exp(-(f - 10) * 0.2) : 0;
  return (
    <Cam z0={1.0} z1={1.1} punchAt={10} shakeAmt={f > 9 && f < 14 ? 6 : 0}>
      <Svg>
        <rect width={1080} height={1920} fill="#0c1220" />
        {Array.from({ length: 8 }).map((_, i) => (
          <path key={i} d={`M -50 ${200 + i * 240} Q 540 ${120 + i * 240 + Math.sin(i) * 60} 1130 ${220 + i * 240}`} stroke="#060910" strokeWidth={40} fill="none" opacity={0.5} />
        ))}
        <g transform={`translate(540 ${lerp(fall, [0, 1], [500, 1000]) - bounce}) rotate(${lerp(fall, [0, 1], [-30, 12])}) scale(${lerp(fall, [0, 1], [1.4, 1])})`}>
          <rect x={-170} y={-340} width={340} height={680} rx={48} fill="#0b0b0d" />
          <svg x={-155} y={-325} width={310} height={650} viewBox="0 0 1080 1920" preserveAspectRatio="xMidYMid slice">
            <rect width={1080} height={1920} fill="#3a3a3a" />
            <rect x={0} y={820} width={1080} height={1100} fill="#2a2a2a" />
            <rect x={210} y={330} width={210} height={480} fill="#111" />
            <text x={70} y={300} fill={PAL.red} fontFamily={MONO} fontSize={80}>● REC</text>
          </svg>
        </g>
        <Glow id="pd" cx={540} cy={1000} r={600} color="#dfe9ff" o={0.15} />
      </Svg>
      <Finish vig={0.9} />
    </Cam>
  );
};

/** Porte de chambre vue du lit. */
const BedroomDoor: React.FC<{ f: number; feet: number; shakeAmt?: number; light?: number }> = ({ f, feet, shakeAmt = 0, light = 1 }) => {
  const s = shake(f, shakeAmt, "bd");
  const fx = lerp(feet, [0, 1], [-200, 540]);
  return (
    <>
      <rect width={1080} height={1920} fill="#05070c" />
      <g transform={`translate(${s.x} ${s.y})`}>
        <rect x={250} y={380} width={580} height={1220} fill="#0a0d16" />
        <g transform="translate(280 400)"><DoorPanel w={520} h={1190} color="#161c2a" /></g>
      </g>
      <rect x={280} y={1590} width={520} height={12} fill="#b8c9ef" opacity={0.85 * light} />
      {feet > 0 && (
        <>
          <rect x={fx - 110} y={1588} width={90} height={16} fill="#000" />
          <rect x={fx + 20} y={1588} width={90} height={16} fill="#000" />
        </>
      )}
      <rect x={0} y={1600} width={1080} height={320} fill="#04050a" />
      {/* bord de couette au premier plan */}
      <path d="M -50 1800 Q 540 1700 1130 1800 L 1130 1920 L -50 1920 Z" fill="#0d1220" />
    </>
  );
};

export const S6c: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.14} oy={1000}>
      <Svg><BedroomDoor f={f} feet={0} /></Svg>
      <Finish vig={0.92} />
    </Cam>
  );
};

export const S6d: React.FC<P> = () => {
  const f = useF();
  const feet = f < 2 ? 0 : f < 24 ? lerp(f, [2, 10], [0.35, 0.7], ease) : lerp(f, [24, 28], [0.7, 0.95], ease);
  const hit = (f >= 2 && f < 7) || (f >= 24 && f < 30);
  return (
    <Cam z0={1.14} z1={1.22} oy={1100} punchAt={24} shakeAmt={hit ? 8 : 0}>
      <Svg><BedroomDoor f={f} feet={feet} shakeAmt={hit ? 3 : 0} /></Svg>
      <Finish vig={0.93} />
    </Cam>
  );
};

/** Silence total : plan serré et tendu sur la serrure. */
export const S6e: React.FC<P> = () => {
  const f = useF();
  return (
    <Cam z0={1.0} z1={1.06} ox={555} oy={1120}>
      <Handle angle={0} glowKey={lerp(f, [0, 40, 46], [0.55, 0.55, 0])} />
      <Finish vig={0.95} />
    </Cam>
  );
};

/** Clé qui glisse dans la serrure (extrême gros plan). */
export const S6f: React.FC<P> = () => {
  const f = useF();
  const ins = lerp(f, [2, 24], [0, 1], ease);
  const turn = lerp(f, [36, 42], [0, 70], ease);
  const sh = shake(f, f >= 40 && f < 46 ? 10 : f < 24 ? 2 : 0, "ky");
  return (
    <Cam z0={2.4} z1={2.6} ox={555} oy={1130} punchAt={42}>
      <Svg>
        <g transform={`translate(${sh.x} ${sh.y})`}>
          <Handle angle={0} />
          <g transform={`translate(555 1140) rotate(${turn})`}>
            <rect x={-9} y={-30} width={18} height={70} rx={4} fill="#9aa1ad" opacity={ins} />
            <rect x={-9} y={-30} width={6} height={70} rx={3} fill="#fff" opacity={ins * 0.5} />
            <circle cx={0} cy={0} r={6 + ins * 4} fill="#d8dde6" opacity={ins} />
          </g>
        </g>
      </Svg>
      <Finish vig={0.95} />
    </Cam>
  );
};

/** La poignée descend d'un coup sec -> cut au noir. */
export const S6g: React.FC<P> = () => {
  const f = useF();
  if (f >= 18) return <AbsoluteFill style={{ background: "#000" }} />;
  const a = f < 13 ? shake(f, 1.5, "hg").x : lerp(f, [13, 15], [0, -42]);
  return (
    <Cam z0={1.3} z1={1.36} ox={420} oy={860} punchAt={13} shakeAmt={f >= 13 ? 14 : 2}>
      <Handle angle={a} />
      <Finish vig={0.95} />
    </Cam>
  );
};

/** Écran final avec glitch. */
export const End: React.FC<P & { variant: 0 | 1 }> = ({ variant }) => {
  const f = useF();
  const { fps } = useVideoConfig();
  const g = f < 5 || (f >= 28 && f < 31) || (variant === 1 && f >= 50 && f < 54);
  const pop = spring({ frame: f, fps, config: { damping: 11, stiffness: 200 } });
  const pulse = 1 + Math.sin(f * 0.35) * 0.04;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Glitch on={g} seed={`end${variant}`}>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, #10162a 0%, #000 70%)", alignItems: "center", justifyContent: "flex-start", paddingTop: 520, paddingRight: 120, paddingLeft: 40 }}>
          <div style={{ transform: `scale(${variant === 0 ? 0.6 + 0.4 * pop : 1})`, textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>
            <div style={{ fontSize: 170, lineHeight: 1, color: PAL.red, textShadow: "0 0 40px rgba(239,68,68,0.6), 0 10px 0 #000" }}>PARTIE 2</div>
            <div style={{ fontSize: 92, lineHeight: 1.1, marginTop: 10, textShadow: "0 8px 0 #000" }}>DISPO BIENTÔT</div>
            <div style={{ height: 110 }} />
            <div style={{ fontSize: 58, lineHeight: 1.2, opacity: variant === 0 ? lerp(f, [20, 30], [0, 1]) : 1 }}>ABONNE-TOI<br />POUR LA SUITE</div>
            {variant === 1 && (
              <div style={{ marginTop: 50, display: "inline-block", transform: `scale(${pulse * (0.6 + 0.4 * pop)})`, background: PAL.red, borderRadius: 60, padding: "22px 60px", fontSize: 54 }}>
                + S'ABONNER
              </div>
            )}
          </div>
        </AbsoluteFill>
      </Glitch>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.25) 0 2px, rgba(0,0,0,0) 2px 5px)" }} />
      <Finish vig={0.6} grain={0.22} />
    </AbsoluteFill>
  );
};

/** Ordre des plans (un plan = 60 frames). */
export const SHOTS: { name: string; C: React.FC<P> }[] = [
  { name: "1a Poignée qui tourne", C: S1a }, { name: "1b Yeux grands ouverts", C: S1b },
  { name: "2a Il rentre", C: S2a }, { name: "2b Clés dans le vide-poche", C: S2b }, { name: "2c Micro-ondes", C: S2c },
  { name: "2d Canapé", C: S2d }, { name: "2e Scroll", C: S2e }, { name: "2f Pluie", C: S2f }, { name: "2g Accéléré", C: S2g },
  { name: "3a Interrupteur", C: S3a }, { name: "3b Couloir", C: S3b }, { name: "3c Double disparu", C: S3c },
  { name: "3d Sourcils froncés", C: S3d }, { name: "3e Couloir (salle de bain entrouverte)", C: S3e },
  { name: "3f Haussement d'épaules", C: S3f }, { name: "3g Porte de chambre", C: S3g },
  { name: "4a Lit 00:42", C: S4a }, { name: "4b Onde sonore", C: S4b }, { name: "4c Il se fige", C: S4c },
  { name: "4d Baisse le téléphone", C: S4d }, { name: "4e Parquet", C: S4e }, { name: "4f Ombre sous la porte", C: S4f },
  { name: "4g Sueur", C: S4g },
  { name: "5a Icône caméra", C: S5a }, { name: "5b Connexion", C: S5b }, { name: "5c Salon vide", C: S5c },
  { name: "5d Porte salle de bain", C: S5d }, { name: "5e L'homme entre", C: S5e }, { name: "5f Zoom clés", C: S5f },
  { name: "5g Panique", C: S5g }, { name: "5h Il fixe la caméra", C: S5h },
  { name: "6a Il sort du cadre", C: S6a }, { name: "6b Téléphone lâché", C: S6b }, { name: "6c Porte", C: S6c },
  { name: "6d Pas qui s'arrêtent", C: S6d }, { name: "6e Silence", C: S6e }, { name: "6f Clé dans la serrure", C: S6f },
  { name: "6g Poignée -> noir", C: S6g },
  { name: "Fin A", C: (p) => <End {...p} variant={0} /> }, { name: "Fin B", C: (p) => <End {...p} variant={1} /> },
];

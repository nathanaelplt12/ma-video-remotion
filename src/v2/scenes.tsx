import { AbsoluteFill, Easing } from "remotion";
import { Bedroom } from "./Bedroom";
import { Face } from "./Character";
import { EntityBody, EntityFace, Feet, UpsideDownHead } from "./Entity";
import { Stage } from "./fx";
import { Banner, Choice } from "./Overlay";
import { Phone } from "./Phone";
import { C, FONT, T, lerp, shake } from "./theme";

type P = { f: number };
const ease = Easing.inOut(Easing.cubic);
const cam = (cx: number, cy: number, s: number, dx = 0, dy = 0) =>
  `translate(${cx + dx} ${cy + dy}) scale(${s}) translate(${-cx} ${-cy})`;
const breathPhase = (f: number, period = 75) => (f % period) / period;
const knockKick = (f: number) => {
  let k = 0;
  for (let i = 0; i < 3; i++) {
    const d = f - (T.knocks + i * T.knockGap);
    if (d >= 0 && d < 10) k = Math.max(k, Math.exp(-d / 3));
  }
  return k;
};

/** Scène 1 — accroche : deux yeux grands ouverts dans le noir + flash subliminal. */
export const Scene1: React.FC<P> = ({ f }) => {
  const s = lerp(f, [0, 120], [1, 1.55], Easing.inOut(Easing.quad));
  const j = shake(f, 1.5, "e1");
  const flash = f >= T.flash && f < T.flash + 3;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage style={{ opacity: lerp(f, [0, 18], [0, 1]) }}>
        <g transform={cam(540, 860, s)}>
          <Face dark={0.94} pupil={0.85} eyeJitter={j} breath={breathPhase(f, 90)} id="s1" />
        </g>
      </Stage>
      {flash && (
        <Stage>
          <rect width={1080} height={1920} fill="#2a2540" />
          <g transform="translate(540 1960) scale(1.12)"><EntityBody /></g>
        </Stage>
      )}
    </AbsoluteFill>
  );
};

const Bubble: React.FC<P & { from: number; to: number }> = ({ f, from, to }) => {
  if (f < from || f >= to) return null;
  const j = shake(f, 4, "bub");
  const p = lerp(f, [from, from + 8], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 70, top: 300, transform: `translate(${j.x}px, ${j.y}px) scale(${0.7 + 0.3 * p})`, opacity: p, zIndex: 20 }}>
      <div style={{ background: "rgba(231,226,234,0.92)", color: "#1d192b", fontFamily: FONT, fontWeight: 800, fontStyle: "italic", fontSize: 50, padding: "26px 36px", borderRadius: 40, boxShadow: "0 0 40px rgba(226,232,240,0.35)" }}>
        « Tu dors ? Ouvre-moi... »
      </div>
      <div style={{ marginLeft: 70, width: 0, height: 0, borderLeft: "26px solid transparent", borderRight: "26px solid transparent", borderTop: "40px solid rgba(231,226,234,0.92)" }} />
    </div>
  );
};

/** Scène 2 — seul dans son lit, détendu… on frappe. */
export const Scene2: React.FC<P> = ({ f }) => {
  const k = knockKick(f);
  const j = shake(f, 9 * k, "k2");
  const alert = f > T.knocks + 6;
  const s = lerp(f, [120, 330], [1, 1.14]);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Stage>
        <g transform={cam(640, 1000, s, j.x, j.y)}>
          <Bedroom
            doorKick={k * (f % 2 ? 1 : -1)}
            closetEyes={0.35}
            face={{ lid: alert ? 0.15 : 0.5, mouth: "neutral", phoneLight: 1, eyeJitter: { x: alert ? -30 : 0, y: 0 }, breath: breathPhase(f) }}
          />
        </g>
      </Stage>
      <Bubble f={f} from={T.bubble} to={T.vibrate1} />
    </AbsoluteFill>
  );
};

/** Scène 3 — il sourit… SMS de maman… pupilles qui rétrécissent. */
export const Scene3: React.FC<P> = ({ f }) => {
  if (f < T.vibrate1 + 6) {
    const buzz = f >= T.vibrate1;
    const j = shake(f, buzz ? 5 : 0, "v3");
    return (
      <AbsoluteFill style={{ background: C.night }}>
        <Stage>
          <g transform={cam(640, 1000, 1.14 + lerp(f, [330, 404], [0, 0.04]), j.x, j.y)}>
            <Bedroom closetEyes={0.35} rise={lerp(f, [338, 392], [0, 0.6], ease)} face={{ mouth: "smile", lid: 0.05, phoneLight: 1, eyeJitter: { x: -30, y: 0 } }} />
          </g>
        </Stage>
        <Bubble f={f} from={T.bubble} to={T.vibrate1} />
      </AbsoluteFill>
    );
  }
  if (f < T.faceCut) {
    const j = shake(f, f < T.vibrate1 + 38 ? 7 : 0, "ph3");
    return (
      <AbsoluteFill style={{ background: "#05040a" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${j.x}px, ${j.y}px) scale(${lerp(f, [404, 528], [1, 1.08])})` }}>
          <Phone mode="sms" from={T.sms} textAt={486} />
        </div>
      </AbsoluteFill>
    );
  }
  const shrink = lerp(f, [T.faceCut + 3, T.faceCut + 7], [1, 0.3], Easing.out(Easing.cubic));
  const j = shake(f, 2.2, "ey3");
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Stage>
        <g transform={cam(540, 900, lerp(f, [T.faceCut, 578], [1.05, 1.18]))}>
          <Face pupil={shrink} brows="fear" mouth="fear" phoneLight={0.9} eyeJitter={j} sweat={lerp(f, [T.faceCut + 8, 578], [0, 1])} id="s3" />
        </g>
      </Stage>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, rgba(239,68,68,0.18) 100%)" }} />
    </AbsoluteFill>
  );
};

/** Scène 4 — la poignée descend… la porte n'est pas verrouillée. */
export const Scene4: React.FC<P> = ({ f }) => {
  if (f < T.crackOpen) {
    const ang = lerp(f, [T.creak, T.creak + 58], [0, 38], Easing.inOut(Easing.sin));
    const j = shake(f, f > T.creak ? 1.5 : 0, "h4");
    return (
      <AbsoluteFill style={{ background: C.night }}>
        <Stage>
          <g transform={cam(560, 900, lerp(f, [578, 652], [1, 1.12]), j.x, j.y)}>
            <rect width={1080} height={1920} fill={C.slate2} />
            <rect x={80} y={180} width={760} height={600} fill="none" stroke="#1d192b" strokeWidth={22} />
            <rect x={80} y={1080} width={760} height={600} fill="none" stroke="#1d192b" strokeWidth={22} />
            <rect x={930} y={0} width={150} height={1920} fill="#120f1c" />
            {/* poignée */}
            <g transform={`translate(700 900) rotate(${-ang})`}>
              <rect x={-330} y={-34} width={330} height={68} rx={34} fill="#b4afc2" />
              <rect x={-330} y={-34} width={330} height={20} rx={10} fill="#d4d0de" />
            </g>
            <circle cx={700} cy={900} r={78} fill="#8b8698" />
            <circle cx={700} cy={900} r={52} fill="#a8a3b5" />
            {/* verrou NON tourné */}
            <circle cx={700} cy={1110} r={46} fill="#8b8698" />
            <rect x={690} y={1074} width={20} height={72} rx={8} fill="#5b566a" />
            <g transform="translate(790 1090)" stroke={C.danger} strokeWidth={10} fill="none" opacity={lerp(f, [610, 620], [0, 1])}>
              <rect x={0} y={20} width={60} height={46} rx={8} fill={C.danger} />
              <path d="M 12 20 L 12 2 Q 12 -18 32 -18 Q 52 -18 52 0" />
            </g>
          </g>
        </Stage>
        <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 47%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.8) 90%)" }} />
      </AbsoluteFill>
    );
  }
  const tr = shake(f, 4, "t4");
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Stage>
        <g transform={cam(400, 1000, lerp(f, [652, 720], [1.05, 1.15]))}>
          <Bedroom
            door={lerp(f, [T.crackOpen, T.crackOpen + 50], [0, 0.2], Easing.out(Easing.quad))}
            handle={-36}
            figure={lerp(f, [672, 700], [0, 1])}
            tremble={tr}
            face={{ pupil: 0.35, brows: "fear", mouth: "tight", phoneLight: 0.7, eyeJitter: { x: -26 + tr.x, y: tr.y }, sweat: lerp(f, [660, 720], [0, 1]) }}
          />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

const BlurredRoom: React.FC<{ door: number }> = ({ door }) => (
  <div style={{ position: "absolute", inset: 0, filter: "blur(22px) brightness(0.45)" }}>
    <Stage>
      <Bedroom door={door} figure={1} handle={-36} face={{ pupil: 0.35, brows: "fear", mouth: "tight", phoneLight: 0.6 }} />
    </Stage>
  </div>
);

/** Scène 5 — choix sous pression (3 s). */
export const Scene5: React.FC<P> = ({ f }) => {
  const pulse = 0.25 + 0.2 * Math.max(0, Math.sin(((f - T.countdown) / 30) * Math.PI * 2));
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <BlurredRoom door={0.22} />
      <AbsoluteFill style={{ boxShadow: `inset 0 0 220px rgba(239,68,68,${f >= T.countdown && f < T.countdown + 92 ? pulse : 0.15})` }} />
      <Choice f={f} from={722} countdownFrom={T.countdown} selected="orange" selectAt={T.choiceOrange} checked />
    </AbsoluteFill>
  );
};

/** Scène 6 — sous le lit. Les pieds… silence… la tête à l'envers. */
export const Scene6: React.FC<P> = ({ f }) => {
  const scare = f >= T.jumpscare;
  const walkX = lerp(f, [T.feetIn, T.feetStop], [-320, 540], Easing.out(Easing.quad));
  const step = (f - T.feetIn) / 22;
  const push = lerp(f, [T.feetStop, T.jumpscare], [1, 1.14], Easing.in(Easing.quad));
  const hit = scare ? Math.exp(-(f - T.jumpscare) / 6) : 0;
  const zoom = scare ? 1.14 + lerp(f, [T.jumpscare, T.jumpscare + 5], [0, 0.42], Easing.out(Easing.cubic)) : push;
  const j = shake(f, 34 * hit + (scare ? 3 : 0), "j6");
  const headY = lerp(f, [T.jumpscare, T.jumpscare + 4], [-500, 1020], Easing.out(Easing.back(1.6)));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage>
        <g transform={cam(540, 1080, zoom, j.x, j.y)}>
          {/* la chambre, vue depuis sous le lit */}
          <rect y={760} width={1080} height={640} fill="#14111f" />
          <rect x={60} y={780} width={200} height={500} fill="#cbd5e1" opacity={0.18} />
          <path d="M 60 1280 L 260 1280 L 520 1400 L -60 1400 Z" fill="#cbd5e1" opacity={0.08} />
          <rect y={1250} width={1080} height={150} fill="#0f0c18" />
          {f >= T.feetIn && (
            <g transform={`translate(${walkX} 1370) scale(1.45)`}>
              <Feet walking={f < T.feetStop} step={step} />
            </g>
          )}
          {/* dessous du sommier */}
          <rect width={1080} height={790} fill="#07060c" />
          {[120, 300, 480, 660].map((y) => <rect key={y} x={0} y={y} width={1080} height={50} fill="#110e1a" />)}
          <rect y={740} width={1080} height={50} fill="#1a1626" />
          {/* sol au premier plan + pieds du lit */}
          <path d="M 0 1400 L 1080 1400 L 1080 1920 L 0 1920 Z" fill="#06050a" />
          <rect x={0} y={700} width={90} height={1220} fill="#030205" />
          <rect x={990} y={700} width={90} height={1220} fill="#030205" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={200 + i * 140} cy={1500 + ((i * 53) % 90)} r={3} fill="#64748b" opacity={0.25 + 0.15 * Math.sin(f / 9 + i)} />
          ))}
          {scare && (
            <g transform={`translate(540 ${headY}) scale(1.1)`}>
              <UpsideDownHead sway={Math.sin(f / 4) * 0.4} />
            </g>
          )}
        </g>
      </Stage>
      {scare && <AbsoluteFill style={{ background: C.danger, mixBlendMode: "multiply", opacity: 0.35 + 0.6 * hit }} />}
      {scare && f < T.jumpscare + 2 && <AbsoluteFill style={{ background: "#fff" }} />}
      {!scare && <Banner f={f} from={902} text="SI TU AS CHOISI : SOUS LE LIT" color={C.orange} />}
      {f >= T.badge && <Banner f={f} from={T.badge} text="RÈGLE N°1 : NE TE CACHE JAMAIS EN BAS" />}
    </AbsoluteFill>
  );
};

/** Effet VHS : bandes décalées, lignes de balayage, texte de rembobinage. */
const VHS: React.FC<P & { children: React.ReactNode }> = ({ f, children }) => {
  const bands = [0, 1, 2, 3].map((i) => ({ y: ((f * 37 + i * 480) % 1920), h: 40 + ((f + i * 7) % 5) * 30, x: (((f * 13 + i * 31) % 9) - 4) * 14 }));
  return (
    <AbsoluteFill style={{ background: "#000", overflow: "hidden" }}>
      <AbsoluteFill style={{ filter: "saturate(0.5) contrast(1.25)", transform: `translateX(${((f % 3) - 1) * 6}px)` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0px, rgba(0,0,0,0.35) 3px, transparent 3px, transparent 7px)" }} />
      {bands.map((b, i) => (
        <div key={i} style={{ position: "absolute", left: 0, right: 0, top: b.y, height: b.h, background: "rgba(226,232,240,0.12)", transform: `translateX(${b.x}px)`, backdropFilter: "blur(2px)" }} />
      ))}
      <div style={{ position: "absolute", left: 60, top: 380, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: 84, color: "white", textShadow: "4px 0 0 #ef4444, -4px 0 0 #38bdf8", opacity: Math.floor(f / 8) % 2 ? 1 : 0.55 }}>
        &lt;&lt; REMBOBINAGE
      </div>
    </AbsoluteFill>
  );
};

/** Scène 7 — rembobinage, il fait semblant de dormir, elle s'approche… et repart. */
export const Scene7: React.FC<P> = ({ f }) => {
  if (f < T.rewindEnd) {
    const back = lerp(f, [T.rewind, T.rewindEnd], [1165, 905], Easing.in(Easing.quad));
    return (
      <VHS f={f}>
        {back > 900 ? <Scene6 f={Math.round(back)} /> : <Scene5 f={880} />}
      </VHS>
    );
  }
  if (f < T.closeEyes) {
    return (
      <AbsoluteFill style={{ background: C.night }}>
        <BlurredRoom door={0.22} />
        <Choice f={f} from={T.blueChecked - 30} selected="blue" selectAt={T.blueChecked + 6} checked />
      </AbsoluteFill>
    );
  }
  if (f < T.doorClose) {
    const near = lerp(f, [T.approach, T.closest], [0, 1], Easing.inOut(Easing.sin)) - lerp(f, [T.recede, T.doorClose - 4], [0, 1], Easing.inOut(Easing.sin));
    const tr = shake(f, 2 + 4 * near, "t7");
    const hj = shake(f, 3 + 5 * near, "h7");
    const blanket = lerp(f, [T.closeEyes, T.closeEyes + 12], [1500, 1030], Easing.out(Easing.cubic));
    const ex = 300 + 120 * near, ey = 260 + 260 * near, es = 0.55 + 1.35 * near;
    return (
      <AbsoluteFill style={{ background: C.night }}>
        <Stage>
          <g transform={cam(540, 900, 1.05 + 0.05 * near, tr.x, tr.y)}>
            <Face squeeze brows="squeeze" mouth="neutral" blanket={blanket} handJitter={hj} phoneLight={0.25} sweat={lerp(f, [1320, 1440], [0, 1])} id="s7" />
          </g>
          <rect width={1080} height={1920} fill="#000" opacity={0.55 * near} />
          <g opacity={Math.min(1, near * 3)}>
            <path d={`M -200 -300 Q ${ex - 300} ${ey - 400} ${ex} ${ey}`} stroke={C.black} strokeWidth={180 * es} fill="none" strokeLinecap="round" />
            <g transform={`translate(${ex} ${ey}) scale(${es}) rotate(${-14 + 8 * near})`}>
              <EntityFace pupil={0.8} smile={1.1} />
            </g>
          </g>
        </Stage>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Stage>
        <g transform={cam(300, 1000, 1.12)}>
          <Bedroom door={lerp(f, [T.doorClose, T.doorShut], [0.28, 0], Easing.in(Easing.quad))} figure={1} phone={0.4} face={{ squeeze: true, brows: "squeeze", mouth: "tight" }} closetEyes={0.35} />
        </g>
      </Stage>
    </AbsoluteFill>
  );
};

/** Scène 8 — soulagement… AirDrop… la photo prise depuis le placard. */
export const Scene8: React.FC<P> = ({ f }) => {
  if (f < T.vibrate2) {
    const open = f >= T.relief;
    return (
      <AbsoluteFill style={{ background: C.night }}>
        <Stage>
          <g transform={cam(540, 900, lerp(f, [1500, 1588], [1.06, 1.0]))}>
            <Face
              squeeze={!open} brows={open ? "relaxed" : "squeeze"} mouth={f > 1540 ? "smile" : "neutral"}
              lid={lerp(f, [T.relief, T.relief + 18], [0.7, 0.2])} blanket={lerp(f, [1504, 1530], [1030, 1300], ease)}
              breath={f > 1516 ? breathPhase(f - 1516, 60) : undefined} phoneLight={0.6} id="s8"
            />
          </g>
        </Stage>
      </AbsoluteFill>
    );
  }
  if (f < T.closetBurst) {
    const j = shake(f, f < T.vibrate2 + 36 ? 7 : 0, "ph8");
    const photo = f >= T.photo;
    return (
      <AbsoluteFill style={{ background: "#05040a" }}>
        <div style={{ position: "absolute", inset: 0, transform: `translate(${j.x}px, ${j.y}px) scale(${lerp(f, [T.vibrate2, T.closetBurst], [1, 1.16])})` }}>
          <Phone mode={photo ? "photo" : "airdrop"} from={photo ? T.photo : T.airdrop} textAt={T.photoText} />
        </div>
      </AbsoluteFill>
    );
  }
  const o = lerp(f, [T.closetBurst, T.closetBurst + 3], [0, 1], Easing.out(Easing.cubic));
  const j = shake(f, 40, "cb");
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Stage>
        <g transform={cam(540, 960, 1 + 0.25 * o, j.x, j.y)}>
          <rect width={1080} height={1920} fill="#020103" />
          <g transform="translate(540 900) scale(1.6)"><EntityFace pupil={0.6} smile={1.15} /></g>
          <rect x={0} y={0} width={540 * (1 - o) + 20} height={1920} fill={C.slate2} />
          <rect x={540 + 540 * o - 20} y={0} width={540} height={1920} fill={C.slate2} />
        </g>
      </Stage>
      <AbsoluteFill style={{ background: C.danger, mixBlendMode: "multiply", opacity: 0.5 }} />
    </AbsoluteFill>
  );
};

import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Bedroom, FaceCloseup } from "./components/Bedroom";
import { Choice } from "./components/Choice";
import { Cam, Flash, Slam, Subtitles, VHS } from "./components/Core";
import { AirDropAlert, ClosetPhoto, LockScreen, PhoneFrame } from "./components/Phone";
import { DoorBottom, DoorView, HandleCloseup, UnderBed } from "./components/Room";
import { C, FONT, SceneKey, VOICE_START, clamp, seg, segs } from "./theme";

/** Voix off + sous-titres d'une scène, calés au frame près sur voiceTimings.json. */
const Voice: React.FC<{ k: SceneKey }> = ({ k }) => (
  <>
    <Sequence from={VOICE_START[k]} layout="none" name="Voix off">
      <Audio src={staticFile(`audio/${k}.mp3`)} volume={1} />
    </Sequence>
    <Subtitles cues={segs(k)} />
  </>
);

/** Bruitage ponctuel. */
const Sfx: React.FC<{ at: number; src: string; volume?: number; rate?: number; trim?: number }> = ({ at, src, volume = 1, rate = 1, trim }) => (
  <Sequence from={at} layout="none" name={src}>
    <Audio src={staticFile(`audio/${src}`)} volume={volume} playbackRate={rate} trimAfter={trim} />
  </Sequence>
);

/** Plan = séquence avec coupe franche. */
const Shot: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={from} durationInFrames={to - from} name={name}>{children}</Sequence>
);

const flick = (f: number, seed: string, p = 0.12) => (random(`${seed}${Math.floor(f / 2)}`) < p ? 0.35 : 1);

/* ───────────── Scène 1 : le hook (TOC TOC TOC) ───────────── */
const S1_KNOCKS = [0, 11, 22];
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const k2 = seg("scene1", 1).start;
  const knocks = [...S1_KNOCKS, k2, k2 + 11, k2 + 22, 118, 129, 140];
  const waves = knocks.filter((k) => f >= k && f < k + 26).map((k) => f - k);
  const kick = knocks.reduce((a, k) => a + (f >= k && f < k + 5 ? 1 - (f - k) / 5 : 0), 0);
  const bubbleAt = seg("scene1", 2).start;
  const bubble = spring({ frame: f - bubbleAt, fps, config: { damping: 9, stiffness: 220 } });
  const bj = (random(`bj${f}`) - 0.5) * 10;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Cam dur={150} from={1.02} to={1.16} origin="50% 44%" kicks={knocks} kickAmt={14}>
        <DoorView waves={waves} knockKick={kick} light={flick(f, "s1")} />
      </Cam>
      {f >= bubbleAt && (
        <div style={{ position: "absolute", left: 200, top: 540, transform: `scale(${bubble}) translate(${bj}px, ${-bj * 0.6}px) rotate(${bj * 0.3}deg)`, transformOrigin: "10% 100%", zIndex: 30 }}>
          <div style={{ background: C.white, color: C.black, fontFamily: FONT, fontSize: 56, padding: "30px 40px", borderRadius: 50, boxShadow: "0 10px 40px rgba(0,0,0,0.6)", whiteSpace: "nowrap" }}>
            « Ouvre, c'est maman... »
          </div>
          <svg width={80} height={60} style={{ position: "absolute", left: 40, bottom: -50 }}><path d="M0 0 L80 0 L10 60 Z" fill={C.white} /></svg>
        </div>
      )}
      {knocks.map((k, i) => <Sfx key={i} at={k} src="knock.wav" volume={0.9} />)}
      <Voice k="scene1" />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 2 : le twist (SMS de MAMAN) ───────────── */
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const punch = seg("scene2", 2).start;
  const glow = interpolate(f, [0, 3, 20], [0, 1.6, 1], clamp);
  return (
    <AbsoluteFill style={{ background: "#1b172b" }}>
      <Cam dur={150} from={1.04} to={1.2} origin="50% 42%" kicks={[4, punch]} kickAmt={16} shake={2}>
        {/* couette du lit */}
        <svg viewBox="0 0 1080 1920" width={1080} height={1920} style={{ position: "absolute" }}>
          <rect width={1080} height={1920} fill="#2a2446" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M -50 ${200 + i * 420} Q 540 ${80 + i * 420} 1130 ${260 + i * 420}`} stroke="#211c39" strokeWidth={70} fill="none" />)}
          <circle cx={540} cy={1050} r={700} fill={C.screen} opacity={0.12 * glow} />
        </svg>
        <PhoneFrame glow={glow} tilt={-4}>
          <LockScreen notifAt={4} highlight={punch} />
        </PhoneFrame>
      </Cam>
      <Flash at={0} color={C.screen} len={8} max={0.85} />
      <Flash at={punch} color={C.danger} len={8} max={0.25} />
      <Sfx at={4} src="notif.wav" volume={0.9} />
      <Voice k="scene2" />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 3 : escalade (poignée + ombre) ───────────── */
export const Scene3: React.FC = () => {
  const cutB = seg("scene3", 1).start;
  const cutC = 140;
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Shot from={0} to={cutB} name="Poignée qui tourne">
        <HandleShot dur={cutB} slow />
      </Shot>
      <Shot from={cutB} to={cutC} name="Ombre sous la porte">
        <ShadowShot dur={cutC - cutB} />
      </Shot>
      <Shot from={cutC} to={180} name="Poignée qui s'affole">
        <HandleShot dur={180 - cutC} slow={false} />
      </Shot>
      <Sfx at={2} src="creak.wav" volume={0.7} />
      <Sfx at={cutC} src="creak.wav" volume={0.8} rate={1.6} />
      <Voice k="scene3" />
    </AbsoluteFill>
  );
};
const HandleShot: React.FC<{ dur: number; slow: boolean }> = ({ dur, slow }) => {
  const f = useCurrentFrame();
  const angle = slow
    ? interpolate(f, [0, dur], [0, 40], { ...clamp, easing: Easing.inOut(Easing.quad) })
    : 20 + 22 * Math.sin(f * 1.3);
  return (
    <Cam dur={dur} from={slow ? 1 : 1.1} to={slow ? 1.18 : 1.25} origin="70% 50%" shake={slow ? 2.5 : 9}>
      <HandleCloseup angle={angle} f={f} />
    </Cam>
  );
};
const ShadowShot: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 34], [-1.5, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <Cam dur={dur} from={1} to={1.14} origin="50% 58%" kicks={[34]} kickAmt={10}>
      <DoorBottom shadowX={x + Math.sin(f / 10) * 0.02} f={f} />
    </Cam>
  );
};

/* ───────────── Scène 4 : choix sous pression ───────────── */
export const S4 = { timerFrom: seg("scene4", 0).end, select: seg("scene4", 0).end + 90 };
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const rattle = 0.5 + 0.5 * Math.sin(f * 0.9);
  const ticks = Array.from({ length: 3 }, (_, i) => S4.timerFrom + i * 30);
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Cam dur={210} from={1.1} to={1.22} shake={f > S4.timerFrom && f < S4.select ? 3 + (f - S4.timerFrom) / 12 : 2} kicks={[...ticks, S4.select]} kickAmt={8}>
        <AbsoluteFill style={{ filter: "blur(18px) brightness(0.55)" }}>
          <DoorView handle={rattle * 0.6} shadowX={0} light={flick(f, "s4", 0.2)} />
        </AbsoluteFill>
      </Cam>
      <AbsoluteFill style={{ background: "rgba(7,6,11,0.35)" }} />
      <Cam dur={210} from={1} to={1.04} shake={1}>
        <Choice selected="orange" selectAt={S4.select} timerFrom={S4.timerFrom} pulseOrange={seg("scene4", 1).start} pulseBlue={seg("scene4", 2).start} />
      </Cam>
      <Flash at={S4.select} color={C.orange} len={8} max={0.45} />
      {ticks.map((t, i) => <Sfx key={i} at={t} src="heartbeat.wav" volume={0.7} rate={1.4} />)}
      <Sfx at={S4.select} src="notif.wav" volume={0.6} rate={0.7} />
      <Voice k="scene4" />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 5 : mauvais choix & jumpscare ───────────── */
export const S5 = (() => {
  const enter = seg("scene5", 0).start;
  return { enter, stop: seg("scene5", 1).start, jump: seg("scene5", 2).start + 20, rule: seg("scene5", 3).start };
})();
/** État de la vue sous le lit à une frame donnée (réutilisé, à l'envers, pour le rembobinage). */
export const underBedState = (f: number) => ({
  open: interpolate(f, [S5.enter, S5.enter + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) }),
  walk: interpolate(f, [S5.enter + 10, S5.stop], [0, 1], clamp),
  head: interpolate(f, [S5.jump, S5.jump + 6], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) }),
});
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const st = underBedState(f);
  const after = f >= S5.jump;
  const zoom = after ? interpolate(f, [S5.jump, S5.jump + 6, S5.jump + 30], [1, 1.65, 1.35], clamp) : 1;
  const steps = Array.from({ length: 6 }, (_, i) => Math.round(S5.enter + 10 + ((S5.stop - S5.enter - 10) / 6) * (i + 0.5)));
  const redPulse = after ? 0.18 + 0.12 * Math.sin(f / 2) : 0;
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Cam dur={300} from={1} to={1.12} origin="50% 60%" shake={after ? 6 : 1.5} kicks={after ? [S5.jump, S5.rule] : []} kickAmt={55}>
        <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "50% 45%" }}>
          <UnderBed {...st} f={f} />
        </AbsoluteFill>
      </Cam>
      {after && <AbsoluteFill style={{ background: C.danger, opacity: redPulse, mixBlendMode: "multiply" }} />}
      <Flash at={S5.jump} color={C.danger} len={14} max={0.95} />
      <Flash at={S5.jump + 1} color="#fff" len={4} max={0.6} />
      {f < S5.rule && <Slam at={0} top={330} bg={C.orange} size={52} rotate={0}>SI TU AS CHOISI : SOUS LE LIT</Slam>}
      <Slam at={S5.rule} top={320} bg={C.danger} size={64}>RÈGLE N°1 :<br />NE REGARDE JAMAIS EN BAS</Slam>
      <Sfx at={S5.enter} src="creak.wav" volume={0.8} rate={0.8} />
      {steps.map((s, i) => <Sfx key={i} at={s} src="knock.wav" volume={0.28} rate={0.6} />)}
      <Sfx at={S5.jump} src="jumpscare.wav" volume={1} />
      <Sfx at={S5.rule} src="slam.wav" volume={0.5} />
      <Voice k="scene5" />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 6 : rembobinage éclair ───────────── */
export const S6 = { choiceAt: 40, select: seg("scene6", 1).start + 6 };
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  // la scène 5 rejouée à l'envers, en accéléré
  const rf = Math.max(0, 150 - f * 3.8);
  const vhs = interpolate(f, [S6.choiceAt, S6.choiceAt + 30], [1, 0.25], clamp);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Shot from={0} to={S6.choiceAt} name="Sous le lit à l'envers">
        <Cam dur={S6.choiceAt} from={1.3} to={1.05} shake={10}>
          <UnderBed {...underBedState(rf)} f={rf} />
        </Cam>
      </Shot>
      <Shot from={S6.choiceAt} to={120} name="Choix : dormir">
        <Cam dur={80} from={1.1} to={1.22} shake={2}>
          <AbsoluteFill style={{ filter: "blur(18px) brightness(0.5)" }}>
            <DoorView shadowX={0} />
          </AbsoluteFill>
        </Cam>
        <AbsoluteFill style={{ background: "rgba(7,6,11,0.35)" }} />
        <Choice selected="blue" selectAt={S6.select - S6.choiceAt} />
      </Shot>
      <VHS strength={vhs} label={f < S6.choiceAt + 20} />
      <Flash at={S6.select} color={C.blue} len={8} max={0.4} />
      <Sfx at={0} src="rewind.wav" volume={0.75} trim={45} />
      <Sfx at={S6.select} src="notif.wav" volume={0.6} rate={0.7} />
      <Voice k="scene6" />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 7 : tension maximale ───────────── */
export const S7 = (() => {
  const s = segs("scene7");
  return { close: s[1].start, count: [s[2].start, s[3].start, s[4].start], leave: s[5].start };
})();
export const Scene7: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Shot from={0} to={S7.close} name="Elle se penche">
        <LeanWide dur={S7.close} />
      </Shot>
      <Shot from={S7.close} to={S7.leave} name="À 2 cm du visage">
        <CloseShot dur={S7.leave - S7.close} />
      </Shot>
      <Shot from={S7.leave} to={330} name="Elle repart">
        <LeaveWide dur={330 - S7.leave} />
      </Shot>
      <BreathBar from={S7.close} to={S7.leave} counts={S7.count} />
      {S7.count.map((c, i) => <Flash key={i} at={c} color={C.green} len={6} max={0.18} />)}
      <Sfx at={S7.leave + 74} src="slam.wav" volume={0.55} />
      <Sfx at={S7.leave + 24} src="creak.wav" volume={0.45} rate={0.7} />
      <Voice k="scene7" />
      
    </AbsoluteFill>
  );
};
const LeanWide: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const lean = interpolate(f, [0, dur], [-0.15, -1.5], { ...clamp, easing: Easing.inOut(Easing.quad) });
  return (
    <Cam dur={dur} from={1.05} to={1.25} origin="35% 62%" shake={2}>
      <Bedroom eyes="shut" door={1} entityX={820} lean={lean} f={f} tremble={Math.sin(f * 2.1) * 3} />
    </Cam>
  );
};
const CloseShot: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const near = interpolate(f, [0, dur * 0.6], [0.45, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const open = interpolate(f, [dur * 0.5, dur], [0, 0.6], clamp);
  return (
    <Cam dur={dur} from={1} to={1.15} origin="45% 60%" shake={3} kicks={S7.count.map((c) => c - S7.close)} kickAmt={9}>
      <FaceCloseup near={near} f={f} tremble={Math.sin(f * 2.7) * 8} smileOpen={open} />
    </Cam>
  );
};
const LeaveWide: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const lean = interpolate(f, [0, 22], [-1.5, 0], { ...clamp, easing: Easing.out(Easing.quad) });
  const x = interpolate(f, [22, 70], [820, 200], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const door = interpolate(f, [66, 74], [1, 0], clamp);
  return (
    <Cam dur={dur} from={1.2} to={1.05} origin="40% 60%" shake={1.5} kicks={[74]} kickAmt={12}>
      <Bedroom eyes="shut" door={door} entityX={f < 72 ? x : null} lean={lean} f={f} tremble={Math.sin(f * 2) * 2} />
    </Cam>
  );
};
/** Barre verte « NE RESPIRE PAS... 3... 2... 1... ». */
const BreathBar: React.FC<{ from: number; to: number; counts: number[] }> = ({ from, to, counts }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (f < from || f >= to) return null;
  const s = spring({ frame: f - from, fps, config: { damping: 12, stiffness: 220 } });
  const n = counts.filter((c) => f >= c).length;
  const fill = interpolate(f, [from, to], [1, 0], clamp);
  const label = "NE RESPIRE PAS..." + ["", " 3...", " 3... 2...", " 3... 2... 1..."][n];
  return (
    <div style={{ position: "absolute", left: 60, right: 60, top: 330, zIndex: 55, transform: `scale(${s}) translateX(${(random(`bb${f}`) - 0.5) * 6}px)` }}>
      <div style={{ fontFamily: FONT, fontSize: 60, color: C.white, textAlign: "center", marginBottom: 14, background: "rgba(7,6,11,0.85)", borderRadius: 20, padding: "10px 20px" }}>{label}</div>
      <div style={{ height: 44, borderRadius: 22, background: C.black, border: `4px solid ${C.green}`, overflow: "hidden" }}>
        <div style={{ width: `${fill * 100}%`, height: "100%", background: C.green, boxShadow: `0 0 30px ${C.green}` }} />
      </div>
    </div>
  );
};

/* ───────────── Scène 8 : faux soulagement & twist final ───────────── */
export const S8 = (() => {
  const s = segs("scene8");
  return { airdrop: s[1].start, photo: s[2].start, text: s[3].start, room: s[3].start + 52, burst: 332 };
})();
export const Scene8: React.FC = () => (
  <AbsoluteFill style={{ background: C.night }}>
    <Shot from={0} to={S8.airdrop} name="Soulagement">
      <ReliefShot dur={S8.airdrop} />
    </Shot>
    <Shot from={S8.airdrop} to={S8.photo} name="AirDrop reçu">
      <AirDropShot dur={S8.photo - S8.airdrop} />
    </Shot>
    <Shot from={S8.photo} to={S8.room} name="La photo">
      <PhotoShot dur={S8.room - S8.photo} textAt={S8.text - S8.photo} />
    </Shot>
    <Shot from={S8.room} to={360} name="Le placard">
      <ClosetShot dur={360 - S8.room} burst={S8.burst - S8.room} />
    </Shot>
    <Sfx at={S8.airdrop} src="notif.wav" volume={1} />
    <Sfx at={S8.photo} src="slam.wav" volume={0.35} rate={1.5} />
    <Sfx at={S8.text} src="jumpscare.wav" volume={0.3} trim={30} />
    <Sfx at={S8.burst} src="slam.wav" volume={1} />
    <Sfx at={S8.burst} src="jumpscare.wav" volume={1} />
    <Voice k="scene8" />
  </AbsoluteFill>
);
const ReliefShot: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  return (
    <Cam dur={dur} from={1.15} to={1.3} origin="30% 65%" shake={1}>
      <Bedroom eyes={f < 8 ? "shut" : "open"} phone={interpolate(f, [10, 20], [0, 1], clamp)} f={f} />
    </Cam>
  );
};
const AirDropShot: React.FC<{ dur: number }> = ({ dur }) => {
  return (
    <AbsoluteFill style={{ background: "#1b172b" }}>
      <Cam dur={dur} from={1} to={1.12} origin="50% 40%" kicks={[0]} kickAmt={14} shake={2}>
        <PhoneFrame glow={1.2} tilt={3}>
          <AbsoluteFill style={{ filter: "blur(6px)", opacity: 0.5 }}>
            <LockScreen notifAt={-100} highlight={-100} />
          </AbsoluteFill>
          <AirDropAlert at={0} acceptAt={dur - 10} />
        </PhoneFrame>
      </Cam>
      <Flash at={0} color={C.screen} len={8} max={0.7} />
      
    </AbsoluteFill>
  );
};
const PhotoShot: React.FC<{ dur: number; textAt: number }> = ({ dur, textAt }) => {
  const f = useCurrentFrame();
  const chars = "Je sais que tu ne dors pas.";
  const shown = Math.max(0, Math.min(chars.length, Math.floor((f - textAt) * 1.4)));
  const edge = 0.5 + 0.5 * Math.sin(f / 3);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Cam dur={dur} from={1} to={1.28} origin="50% 52%" shake={f >= textAt ? 5 : 1.5} kicks={[0, textAt]} kickAmt={12}>
        <div style={{ position: "absolute", left: 50, top: 360, width: 980, height: 1360, borderRadius: 24, overflow: "hidden", border: `8px solid ${C.white}`, boxShadow: "0 30px 80px rgba(0,0,0,0.8)" }}>
          <ClosetPhoto f={f} gap={0.62} />
          {/* bords du placard soulignés en rouge */}
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 490 - 186 - 10, width: 10, background: C.danger, opacity: edge * 0.8 }} />
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 490 + 186, width: 10, background: C.danger, opacity: edge * 0.8 }} />
        </div>
      </Cam>
      {f >= textAt && (
        <div style={{ position: "absolute", left: 60, right: 60, top: 700, textAlign: "center", fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive", fontWeight: 900, fontSize: 108, color: C.danger, transform: `rotate(-6deg) translate(${(random(`ph${f}`) - 0.5) * 8}px, 0)`, textShadow: "0 0 30px rgba(239,68,68,0.6), 0 6px 0 #000", zIndex: 30 }}>
          {chars.slice(0, shown)}
        </div>
      )}
      <Flash at={0} color="#fff" len={6} max={0.8} />
    </AbsoluteFill>
  );
};
const ClosetShot: React.FC<{ dur: number; burst: number }> = ({ burst }) => {
  const f = useCurrentFrame();
  const closet = interpolate(f, [burst, burst + 5], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const eyes = interpolate(f, [burst - 50, burst - 40], [0, 1], clamp);
  const zoomAfter = f >= burst ? interpolate(f, [burst, burst + 5], [1, 1.4], clamp) : 1;
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Cam dur={burst} from={1.1} to={1.6} origin="72% 44%" shake={f >= burst ? 40 : 2} kicks={[burst]} kickAmt={40}>
        <AbsoluteFill style={{ transform: `scale(${zoomAfter})`, transformOrigin: "75% 45%" }}>
          <Bedroom eyes="wide" phone={1} closet={closet} closetEyes={eyes} f={f} sweat />
        </AbsoluteFill>
      </Cam>
      <Flash at={burst} color={C.danger} len={10} max={0.9} />
      
    </AbsoluteFill>
  );
};

import { Audio } from "@remotion/media";
import { AbsoluteFill, Easing, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { ChoiceOverlay } from "./components/ChoiceOverlay";
import { ElevatorScene } from "./components/ElevatorScene";
import { Entity } from "./components/Entity";
import { PhoneScreen } from "./components/PhoneScreen";
import { RewindEffect } from "./components/RewindEffect";
import { Cue, Subtitles } from "./components/Subtitles";
import { flicker, shake } from "./fx";
import { C, FONT, SceneKey, VOICE_START, voiceFrames } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** Voix off + sous-titres d'une scène, calés sur la durée réelle du fichier audio. */
const Voice: React.FC<{ k: SceneKey; cues: Cue[] }> = ({ k, cues }) => (
  <>
    <Sequence from={VOICE_START[k]} layout="none">
      <Audio src={staticFile(`audio/${k.replace("s", "scene")}.mp3`)} volume={1} />
    </Sequence>
    <Subtitles cues={cues} voiceStart={VOICE_START[k]} voiceFrames={voiceFrames(k)} />
  </>
);

/** Conteneur caméra : zoom + tremblement. */
const Camera: React.FC<{ zoom?: number; shakeAmt?: number; origin?: string; children: React.ReactNode }> = ({ zoom = 1, shakeAmt = 0, origin = "50% 50%", children }) => {
  const frame = useCurrentFrame();
  const s = shake(frame, shakeAmt);
  return (
    <AbsoluteFill style={{ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg) scale(${zoom})`, transformOrigin: origin }}>
      {children}
    </AbsoluteFill>
  );
};

/* ───────────── Scène 1 : accroche ───────────── */
export const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const display = f < 25 ? "3" : f < 50 ? "2" : f < 75 ? "1" : f < 95 ? "0" : "-4";
  const visible = f < 95 || Math.floor(f / 5) % 2 === 0;
  return (
    <AbsoluteFill>
      <Camera zoom={interpolate(f, [0, 180], [1, 1.06], clamp)} shakeAmt={f > 95 ? 4 : 0.8}>
        <ElevatorScene display={display} displayVisible={visible} doorOpen={0} light={flicker(f, f > 95 ? 1.6 : 0.8)} pose="back" />
      </Camera>
      <Voice k="s1" cues={[
        { text: "À **3H12**...", at: 0 },
        { text: "L'ASCENSEUR", at: 0.3 },
        { text: "S'ARRÊTE À UN **ÉTAGE**", at: 0.42 },
        { text: "QUI N'EXISTE **PAS**.", at: 0.72 },
      ]} />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 2 : téléphone ───────────── */
export const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, config: { damping: 15, stiffness: 90 } });
  const vib = f < 48 || (f >= 118 && f < 150) ? 1 : 0;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${C.slate}, ${C.black} 75%)` }}>
      <Camera zoom={1 + f * 0.0002}>
        <div style={{ position: "absolute", left: 160, top: 250 + (1 - enter) * 500 + Math.sin(f / 18) * 6 }}>
          <PhoneScreen
            vibrate={vib}
            messages={[
              { from: "GARDIEN", text: "Surtout ne sors pas si les portes s'ouvrent au -4.", at: 70 },
              { from: "GARDIEN", text: "Et ne la regarde jamais.", at: 135 },
            ]}
          />
        </div>
      </Camera>
      <Sequence  layout="none"><Audio src={staticFile("audio/vibrate.wav")} volume={0.8} /></Sequence>
      <Sequence from={118} layout="none"><Audio src={staticFile("audio/vibrate.wav")} volume={0.8} trimAfter={40} /></Sequence>
      <Voice k="s2" cues={[
        { text: "TON TÉLÉPHONE", at: 0 },
        { text: "VIBRE.", at: 0.12 },
        { text: "UN **MESSAGE**", at: 0.23 },
        { text: "DU **GARDIEN**.", at: 0.32, end: 0.5 },
      ]} />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 3 : ouverture des portes ───────────── */
export const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const open = interpolate(f, [20, 110], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const reveal = f >= 110 ? spring({ frame: f - 110, fps, config: { damping: 20, stiffness: 400 } }) : 0;
  const amt = f >= 20 && f < 110 ? 9 : f >= 110 && f < 125 ? 16 : 1.2;
  return (
    <AbsoluteFill>
      <Camera zoom={interpolate(f, [0, 330], [1, 1.22], clamp)} shakeAmt={amt} origin="50% 48%">
        <ElevatorScene display="-4" doorOpen={open} light={flicker(f, 1.4, "s3") * (f > 110 ? 0.6 : 1)} lightColor={C.paleYellow} entity={reveal} entitySway={Math.sin(f / 25) * 0.8} />
      </Camera>
      <Sequence from={20} layout="none"><Audio src={staticFile("audio/jumpscare.wav")} volume={0.25} trimAfter={50} /></Sequence>
      <Voice k="s3" cues={[
        { text: "LES PORTES", at: 0.09 },
        { text: "S'OUVRENT.", at: 0.17 },
        { text: "QUELQUE CHOSE", at: 0.3 },
        { text: "T'**ATTEND**", at: 0.5 },
        { text: "DANS LE **NOIR**.", at: 0.68, end: 1 },
      ]} />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 4 : le choix ───────────── */
export const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Camera zoom={1.2 + f * 0.0003} shakeAmt={0.8} origin="50% 48%">
        <ElevatorScene display="-4" doorOpen={1} light={flicker(f, 1, "s4") * 0.7} lightColor={C.paleYellow} entity={1} entitySway={Math.sin(f / 25) * 0.8} />
      </Camera>
      <ChoiceOverlay selectAt={130} selected="orange" countdownFrom={40} />
      <Voice k="s4" cues={[
        { text: "TU N'AS QUE", at: 0 },
        { text: "**3 SECONDES**...", at: 0.17, end: 0.5 },
      ]} />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 5 : mauvais choix & jumpscare ───────────── */
const FACE_AT = 80;
export const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reach = interpolate(f, [0, 40], [0, 1], clamp);
  const doors = f < 40 ? 1 : interpolate(f, [40, 72], [1, 0.45], { ...clamp, easing: Easing.in(Easing.quad) });
  const hands = f >= 72 ? spring({ frame: f - 72, fps, config: { damping: 18, stiffness: 500 } }) : 0;
  const face = f >= FACE_AT;
  const faceScale = face ? 0.5 + 1.6 * spring({ frame: f - FACE_AT, fps, config: { damping: 16, stiffness: 600 } }) + (f - FACE_AT) * 0.004 : 0;
  const flash = interpolate(f, [FACE_AT, FACE_AT + 3, FACE_AT + 22], [0, 0.9, 0], clamp);
  const badge = f >= 125 ? spring({ frame: f - 125, fps, config: { damping: 10, stiffness: 300, mass: 0.7 } }) : 0;
  const fadeOut = interpolate(f, [335, 360], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Camera shakeAmt={f > 60 && f < FACE_AT ? 14 : face ? 22 : 1}>
        <ElevatorScene display="-4" doorOpen={doors} light={flicker(f, 1.2, "s5")} pose="reach" reach={reach} entity={f < 72 ? 1 : 0.0} entitySway={0.5} hands={hands} />
        {face && (
          <AbsoluteFill style={{ background: "rgba(0,0,0,0.78)", alignItems: "center", justifyContent: "center" }}>
            <Entity variant="face" style={{ width: 1000, height: 1000, transform: `scale(${faceScale}) translateY(-40px)`, filter: "drop-shadow(0 0 60px rgba(239,68,68,0.6))" }} />
          </AbsoluteFill>
        )}
      </Camera>
      <AbsoluteFill style={{ background: C.danger, opacity: flash, zIndex: 30 }} />
      <div style={{ position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontSize: 40, letterSpacing: 4, color: "white", background: "rgba(11,9,16,0.85)", border: `4px solid ${C.orange}`, borderRadius: 18, padding: "18px 10px", zIndex: 45 }}>
        SI TU AS CHOISI : <span style={{ color: C.orange }}>APPUYER SUR FERMER</span>
      </div>
      {badge > 0 && (
        <div style={{ position: "absolute", top: 760, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 46 }}>
          <div style={{ transform: `scale(${3 - 2 * badge}) rotate(${-5 * badge}deg)`, background: C.danger, color: "white", fontFamily: FONT, fontSize: 64, padding: "26px 40px", borderRadius: 18, border: "8px solid white", textAlign: "center", boxShadow: "0 0 60px rgba(239,68,68,0.8)" }}>
            RÈGLE N°1 :<br />NE BOUGE PAS
          </div>
        </div>
      )}
      <Sequence from={72} layout="none"><Audio src={staticFile("audio/jumpscare.wav")} volume={1} /></Sequence>
      <Voice k="s5" cues={[
        { text: "TU APPUIES", at: 0 },
        { text: "SUR LE BOUTON.", at: 0.1 },
        { text: "MAIS ELLE", at: 0.25 },
        { text: "**BLOQUE**", at: 0.36 },
        { text: "LES PORTES.", at: 0.45 },
        { text: "C'EST **FINI**.", at: 0.6, end: 0.8 },
      ]} />
      <AbsoluteFill style={{ background: C.black, opacity: fadeOut, zIndex: 35 }} />
    </AbsoluteFill>
  );
};

/* ───────────── Scène 6 : rembobinage & cliffhanger ───────────── */
export const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rewindFrames = 75;
  // phase 1 : retour arrière sur le visage ; 2 : écran de choix ; 3 : tête baissée
  const faceScale = interpolate(f, [0, 35], [2.2, 0.5], clamp);
  const feet = f < 85 ? -1 : interpolate(f, [85, 135], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const doors = f < 135 ? 1 : interpolate(f, [135, 175], [1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const display = f < 180 ? "-4" : f < 205 ? "-3" : f < 235 ? "-2" : f < 265 ? "-1" : "0";
  const phoneIn = spring({ frame: f - 185, fps, config: { damping: 16, stiffness: 80 } });
  const dimmed = interpolate(f, [175, 300], [0.8, 0.45], clamp);
  return (
    <AbsoluteFill>
      {f < 35 ? (
        <AbsoluteFill style={{ background: C.black, alignItems: "center", justifyContent: "center" }}>
          <Entity variant="face" style={{ width: 1000, height: 1000, transform: `scale(${faceScale})`, filter: "drop-shadow(0 0 60px rgba(239,68,68,0.6))" }} />
        </AbsoluteFill>
      ) : (
        <Camera zoom={f >= 95 ? 1 + (f - 95) * 0.0003 : 1.2} shakeAmt={f < 95 ? 1 : 0.6}>
          <ElevatorScene display={display} doorOpen={f < 95 ? 1 : doors} light={flicker(f, 0.9, "s6") * (f >= 95 ? dimmed + 0.2 : 0.7)} lightColor={f >= 95 ? C.cold : C.paleYellow} pose={f >= 95 ? "down" : "back"} entity={f < 95 ? 1 : 0} feet={feet} />
        </Camera>
      )}
      {f >= 35 && f < 95 && <Sequence from={35} layout="none"><ChoiceOverlay selectAt={30} selected="blue" showCountdown={false} /></Sequence>}
      {f < rewindFrames && <RewindEffect duration={rewindFrames} />}
      {f >= 185 && (
        <div style={{ position: "absolute", left: 540 - 380 * 0.62, top: 760 + (1 - phoneIn) * 900, zIndex: 25 }}>
          <PhoneScreen scale={0.62} time="03:12" vibrate={f < 215 ? 1 : 0} messages={[{ from: "GARDIEN", text: "Tu as survécu... mais elle est toujours dans l'ascenseur avec toi.", at: 205 }]} />
        </div>
      )}
      <Sequence  layout="none"><Audio src={staticFile("audio/rewind.wav")} volume={0.7} trimAfter={80} /></Sequence>
      <Sequence from={185} layout="none"><Audio src={staticFile("audio/vibrate.wav")} volume={0.8} /></Sequence>
      <Voice k="s6" cues={[
        { text: "ON **REMBOBINE**.", at: 0 },
        { text: "TU BAISSES", at: 0.1 },
        { text: "LES **YEUX**.", at: 0.17 },
        { text: "ELLE ENTRE", at: 0.25 },
        { text: "SANS UN **BRUIT**...", at: 0.33 },
        { text: "REGARDE **DERRIÈRE TOI**.", at: 0.72 },
      ]} />
    </AbsoluteFill>
  );
};

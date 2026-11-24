import { Audio } from "@remotion/media";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/900.css";
import { useEffect, useState } from "react";
import { AbsoluteFill, Composition, Sequence, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { BEATS, bpmAt } from "./bpm";
import { Atmosphere, HUD } from "./components/Core";
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8 } from "./scenes";
import { C, FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./theme";

/** Cut brutal au noir sur les dernières frames. */
const CUT_TO_BLACK = TOTAL_FRAMES - 10;

/** Battements de cœur audibles quand le BPM s'emballe (calés sur le pouls du HUD). */
const LOUD_BEATS = BEATS.filter((b) => bpmAt(b) >= 118 && b < CUT_TO_BLACK);

export const HorreurPorte: React.FC = () => {
  const frame = useCurrentFrame();
  // Attend le chargement de la police (Montserrat 900, embarquée via @fontsource) avant le rendu
  const [handle] = useState(() => delayRender("Police Montserrat"));
  useEffect(() => {
    Promise.all([document.fonts.load("900 100px Montserrat"), document.fonts.load("700 50px Montserrat")]).then(() => continueRender(handle));
  }, [handle]);
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Sequence durationInFrames={CUT_TO_BLACK} layout="none" name="Ambiance">
        <Audio src={staticFile("audio/drone.wav")} loop volume={0.35} />
      </Sequence>
      <Sequence from={SCENES.scene1.from} durationInFrames={SCENES.scene1.duration} name="1 · Hook : on frappe"><Scene1 /></Sequence>
      <Sequence from={SCENES.scene2.from} durationInFrames={SCENES.scene2.duration} name="2 · Twist : SMS de maman"><Scene2 /></Sequence>
      <Sequence from={SCENES.scene3.from} durationInFrames={SCENES.scene3.duration} name="3 · Poignée + ombre"><Scene3 /></Sequence>
      <Sequence from={SCENES.scene4.from} durationInFrames={SCENES.scene4.duration} name="4 · Choix"><Scene4 /></Sequence>
      <Sequence from={SCENES.scene5.from} durationInFrames={SCENES.scene5.duration} name="5 · Sous le lit (jumpscare)"><Scene5 /></Sequence>
      <Sequence from={SCENES.scene6.from} durationInFrames={SCENES.scene6.duration} name="6 · Rembobinage"><Scene6 /></Sequence>
      <Sequence from={SCENES.scene7.from} durationInFrames={SCENES.scene7.duration} name="7 · Faire semblant de dormir"><Scene7 /></Sequence>
      <Sequence from={SCENES.scene8.from} durationInFrames={SCENES.scene8.duration} name="8 · AirDrop (twist final)"><Scene8 /></Sequence>
      {LOUD_BEATS.map((b) => (
        <Sequence key={b} from={b} durationInFrames={15} layout="none" name="♥">
          <Audio src={staticFile("audio/heartbeat.wav")} volume={Math.min(0.8, (bpmAt(b) - 100) / 80)} />
        </Sequence>
      ))}
      <Atmosphere />
      <HUD />
      {frame >= CUT_TO_BLACK && <AbsoluteFill style={{ background: "#000", zIndex: 100 }} />}
    </AbsoluteFill>
  );
};

export const HorreurPorteComposition = () => (
  <Composition id="HorreurPorte" component={HorreurPorte} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);

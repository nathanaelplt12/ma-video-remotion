import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Camera } from "./camera";
import { Grain } from "./fx";
import { HUD, Subtitles } from "./Overlay";
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8 } from "./scenes";
import { FPS, HEIGHT, SC, T, TOTAL, VOICE, WIDTH } from "./theme";

const SCENES = [
  { from: SC.s1, to: SC.s2, C: Scene1 },
  { from: SC.s2, to: SC.s3, C: Scene2 },
  { from: SC.s3, to: SC.s4, C: Scene3 },
  { from: SC.s4, to: SC.s5, C: Scene4 },
  { from: SC.s5, to: SC.s6, C: Scene5 },
  { from: SC.s6, to: SC.s7, C: Scene6 },
  { from: SC.s7, to: SC.s8, C: Scene7 },
  { from: SC.s8, to: SC.end, C: Scene8 },
];

const SFX: { at: number; src: string; volume: number; dur: number }[] = [
  // impact dès la frame 0 : démarrage choc ET raccord de la boucle (le riser final s'y coupe net)
  { at: 0, src: "impact.wav", volume: 0.75, dur: 45 },
  { at: T.knocks, src: "knock.wav", volume: 1, dur: 54 },
  { at: T.vibrate1, src: "vibrate.wav", volume: 0.75, dur: 38 },
  { at: T.creak, src: "creak.wav", volume: 0.85, dur: 84 },
  { at: T.jumpscare, src: "impact.wav", volume: 1, dur: 48 },
  { at: T.rewind, src: "rewind.wav", volume: 0.7, dur: 57 },
  { at: T.recede + 35, src: "creak.wav", volume: 0.3, dur: 60 },
  { at: T.doorShut, src: "close.wav", volume: 0.8, dur: 21 },
  { at: T.vibrate2, src: "vibrate.wav", volume: 0.75, dur: 38 },
  { at: T.closetBurst, src: "slam.wav", volume: 1, dur: 27 },
  { at: TOTAL - 27, src: "riser.wav", volume: 0.9, dur: 27 },
];

export const HorreurV2: React.FC = () => {
  const f = useCurrentFrame();
  const scene = SCENES.find((s) => f >= s.from && f < s.to) ?? SCENES[SCENES.length - 1];
  const S = scene.C;
  const black = f >= T.black;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* souffle d'air nocturne, coupé net pour la seconde de silence total */}
      <Sequence durationInFrames={T.silence} name="Ambiance" layout="none">
        <Audio src={staticFile("audio/ambient.wav")} loop volume={0.6} />
      </Sequence>
      {/* T.silence → T.jumpscare : silence total (1 s) */}
      <Sequence from={T.jumpscare} durationInFrames={T.black - T.jumpscare} name="Ambiance (après)" layout="none">
        <Audio src={staticFile("audio/ambient.wav")} loop volume={0.6} />
      </Sequence>
      {SFX.map((s, i) => (
        <Sequence key={i} from={s.at} durationInFrames={s.dur} name={s.src} layout="none">
          <Audio src={staticFile(`audio/${s.src}`)} volume={s.volume} />
        </Sequence>
      ))}
      {Object.entries(VOICE).map(([id, v]) => (
        <Sequence key={id} from={v.start} durationInFrames={v.frames} name={`Voix ${id}`} layout="none">
          <Audio src={staticFile(`audio/v2/vo_${id}.mp3`)} volume={v.voice === "mimic" ? 0.8 : 1} />
        </Sequence>
      ))}

      {!black && (
        <>
          <Camera f={f}>
            <S f={f} />
          </Camera>
          <Grain />
          <HUD />
          <Subtitles />
        </>
      )}
    </AbsoluteFill>
  );
};

export const HorreurV2Composition = () => (
  <Composition id="HorreurV2" component={HorreurV2} durationInFrames={TOTAL} fps={FPS} width={WIDTH} height={HEIGHT} />
);

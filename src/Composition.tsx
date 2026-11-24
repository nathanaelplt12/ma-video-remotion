import { Audio } from "@remotion/media";
import { AbsoluteFill, Composition, Sequence, staticFile, useCurrentFrame } from "remotion";
import { HUD } from "./components/HUD";
import { Scene1, Scene2, Scene3, Scene4, Scene5, Scene6 } from "./scenes";
import { C, FPS, HEIGHT, SCENES, TOTAL_FRAMES, WIDTH } from "./theme";

const CUT_TO_BLACK = TOTAL_FRAMES - 15;

export const MaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6];
  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Sequence durationInFrames={CUT_TO_BLACK} layout="none">
        <Audio src={staticFile("audio/hum.wav")} loop volume={0.22} />
      </Sequence>
      {Object.values(SCENES).map((s, i) => {
        const Scene = scenes[i];
        return (
          <Sequence key={i} from={s.from} durationInFrames={s.duration} name={`Scène ${i + 1}`}>
            <Scene />
          </Sequence>
        );
      })}
      <HUD />
      {frame >= CUT_TO_BLACK && <AbsoluteFill style={{ background: "#000", zIndex: 100 }} />}
    </AbsoluteFill>
  );
};

export const MyComposition = () => (
  <Composition id="MaVideo" component={MaVideo} durationInFrames={TOTAL_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT} />
);

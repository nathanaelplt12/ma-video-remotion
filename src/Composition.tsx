import {
  AbsoluteFill,
  Composition,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const FPS = 30;
export const DURATION_IN_SECONDS = 60;
export const DURATION_IN_FRAMES = FPS * DURATION_IN_SECONDS; // 1800

export const MyComposition = () => {
  return (
    <Composition
      id="MaVideo"
      component={MaVideo}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};

// Placeholder : un titre en fondu + un compteur de secondes, à remplacer.
export const MaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const opacity = interpolate(
    frame,
    [0, fps, durationInFrames - fps, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0f172a",
        color: "white",
        fontFamily: "sans-serif",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ fontSize: 120, fontWeight: 700 }}>Ma vidéo</div>
      <div style={{ fontSize: 48, marginTop: 24, opacity: 0.7 }}>
        {Math.floor(frame / fps)} s / {durationInFrames / fps} s
      </div>
    </AbsoluteFill>
  );
};

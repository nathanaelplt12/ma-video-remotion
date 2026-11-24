import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

export type Cue = {
  /** Texte ; les mots entourés de ** s'affichent en rouge. */
  text: string;
  /** Début, en fraction (0–1) de la durée de la voix. */
  at: number;
  /** Fin optionnelle (fraction) ; par défaut = début du cue suivant. */
  end?: number;
};

type Props = {
  cues: Cue[];
  /** Frame (de la séquence) où démarre la voix. */
  voiceStart: number;
  /** Durée réelle de la voix en frames. */
  voiceFrames: number;
};

const renderText = (text: string) =>
  text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith("**") ? (
      <span key={i} style={{ color: C.danger }}>{part.slice(2, -2)}</span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );

export const Subtitles: React.FC<Props> = ({ cues, voiceStart, voiceFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const timed = cues.map((c, i) => {
    const start = voiceStart + Math.round(c.at * voiceFrames);
    const next = cues[i + 1];
    const endFrac = c.end ?? (next ? next.at : 1);
    return { ...c, start, end: voiceStart + Math.round(endFrac * voiceFrames) + (next || c.end ? 0 : 12) };
  });
  const active = timed.find((c) => frame >= c.start && frame < c.end);
  if (!active) return null;

  const pop = spring({ frame: frame - active.start, fps, config: { damping: 9, stiffness: 220, mass: 0.6 } });
  const scale = 0.7 + 0.3 * pop;

  return (
    <div
      style={{
        position: "absolute", left: 40, right: 40, top: 1380, height: 260,
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`, textAlign: "center", color: "white",
          fontFamily: FONT, fontWeight: 900, fontSize: 112, lineHeight: 1.05,
          textTransform: "uppercase", letterSpacing: 2,
          WebkitTextStroke: "10px #0b0910", paintOrder: "stroke fill",
          textShadow: "0 8px 24px rgba(0,0,0,0.7)",
        }}
      >
        {renderText(active.text)}
      </div>
    </div>
  );
};

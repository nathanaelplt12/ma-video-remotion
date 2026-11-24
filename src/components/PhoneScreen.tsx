import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

export type Msg = { from: string; text: string; at: number };

type Props = { time?: string; messages: Msg[]; scale?: number; vibrate?: number };

const Finger: React.FC<{ x: number; y: number; w: number; h: number; r?: number }> = ({ x, y, w, h, r = 0 }) => (
  <rect x={x} y={y} width={w} height={h} rx={w / 2} fill={C.skin} stroke={C.skinDark} strokeWidth={4} transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`} />
);

export const PhoneScreen: React.FC<Props> = ({ time = "03:12", messages, scale = 1, vibrate = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const jitter = vibrate > 0 ? (Math.sin(frame * 3.1) * 6 * vibrate) : 0;
  return (
    <div style={{ width: 760, height: 1380, position: "relative", transform: `translateX(${jitter}px) scale(${scale})`, transformOrigin: "center top" }}>
      <svg width={760} height={1380} style={{ position: "absolute", inset: 0 }}>
        {/* doigts de la main stylisée */}
        <Finger x={0} y={420} w={70} h={300} r={-4} />
        <Finger x={690} y={360} w={70} h={150} />
        <Finger x={696} y={540} w={64} h={150} />
        <Finger x={690} y={720} w={62} h={150} />
        <Finger x={680} y={890} w={56} h={140} />
        <rect x={50} y={0} width={660} height={1380} rx={80} fill="#050407" stroke="#3b3652" strokeWidth={8} />
        <rect x={74} y={24} width={612} height={1332} rx={58} fill={C.black} />
        <rect x={300} y={46} width={160} height={34} rx={17} fill="#050407" />
      </svg>
      <div style={{ position: "absolute", left: 74, top: 24, width: 612, height: 1332, borderRadius: 58, overflow: "hidden", fontFamily: FONT, color: "white" }}>
        <div style={{ textAlign: "center", marginTop: 130, fontSize: 170, fontWeight: 900, letterSpacing: 4 }}>{time}</div>
        <div style={{ textAlign: "center", fontSize: 30, opacity: 0.5, letterSpacing: 6 }}>MERCREDI</div>
        <div style={{ padding: "60px 28px", display: "flex", flexDirection: "column", gap: 24 }}>
          {messages.map((m, i) => {
            const p = spring({ frame: frame - m.at, fps, config: { damping: 14, stiffness: 140 } });
            if (frame < m.at) return null;
            return (
              <div key={i} style={{ transform: `translateY(${(1 - p) * -120}px) scale(${0.9 + 0.1 * p})`, opacity: p, background: "#242033", borderRadius: 34, padding: "26px 30px", borderLeft: `10px solid ${C.danger}` }}>
                <div style={{ fontSize: 26, letterSpacing: 4, color: C.danger, marginBottom: 10 }}>● {m.from} · SMS</div>
                <div style={{ fontSize: 40, lineHeight: 1.2, fontWeight: 700, textTransform: "none" }}>{m.text}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

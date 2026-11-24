import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, formatClock, clockSeconds, lerp } from "./theme";
import { Face } from "./Character";

const Card: React.FC<{ appear: number; children: React.ReactNode; accent?: string }> = ({ appear, children, accent = C.phone }) => (
  <div
    style={{
      margin: "0 40px", borderRadius: 44, padding: "34px 38px", background: "rgba(30,41,59,0.78)",
      border: `2px solid ${accent}55`, boxShadow: `0 0 60px ${accent}40`,
      transform: `translateY(${(1 - appear) * -80}px) scale(${0.9 + 0.1 * appear})`, opacity: Math.min(1, appear * 1.5),
    }}
  >
    {children}
  </div>
);

/** Photo prise depuis l'intérieur du placard entrouvert. */
const ClosetPhoto: React.FC = () => (
  <svg viewBox="0 0 640 820" width="100%" height="100%" style={{ display: "block" }}>
    <rect width={640} height={820} fill="#141122" />
    <rect y={560} width={640} height={260} fill="#0c0a15" />
    {/* lit vu depuis le placard */}
    <rect x={100} y={520} width={540} height={200} rx={14} fill="#1b1830" />
    <rect x={100} y={490} width={540} height={60} rx={22} fill="#3a3456" />
    <ellipse cx={290} cy={470} rx={120} ry={40} fill="#cbd5e1" opacity={0.85} />
    <g transform={`translate(${290 - 540 * 0.3} ${400 - 900 * 0.3}) scale(0.3)`}>
      <Face squeeze brows="squeeze" mouth="tight" blanket={1010} phoneLight={0.3} id="ph" />
    </g>
    <path d="M 120 520 Q 200 440 330 470 Q 480 430 640 470 L 640 580 L 110 580 Z" fill="#363052" />
    <circle cx={300} cy={420} r={220} fill="#38bdf8" opacity={0.07} />
    {/* bords des portes du placard + vêtements pendus */}
    <rect x={0} y={0} width={110} height={820} fill="#030205" />
    <rect x={540} y={0} width={100} height={820} fill="#030205" />
    <rect x={110} y={0} width={14} height={820} fill="#0f0d18" />
    <rect x={526} y={0} width={14} height={820} fill="#0f0d18" />
    <path d="M 0 0 L 110 0 L 110 260 Q 90 300 40 240 Q 10 280 0 250 Z" fill="#0a0810" />
    <path d="M 640 0 L 540 0 L 540 300 Q 560 340 600 280 Q 625 320 640 300 Z" fill="#0a0810" />
    <rect width={640} height={820} fill="none" stroke="#000" strokeWidth={30} opacity={0.6} />
  </svg>
);

type Mode = "sms" | "airdrop" | "photo";

export const Phone: React.FC<{ mode: Mode; from: number; textAt?: number }> = ({ mode, from, textAt = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - from, fps, config: { damping: 13, stiffness: 170 } });
  const clock = formatClock(clockSeconds(frame)).slice(0, 5);
  const txt = spring({ frame: frame - textAt, fps, config: { damping: 10, stiffness: 200 } });
  return (
    <div
      style={{
        position: "absolute", left: 120, top: 250, width: 760, height: 1340, borderRadius: 96,
        background: "#07060c", border: "6px solid #2a2540",
        boxShadow: `0 0 180px ${C.phone}55, 0 0 30px ${C.phone}66`, overflow: "hidden", fontFamily: FONT,
      }}
    >
      <div style={{ position: "absolute", inset: 18, borderRadius: 80, overflow: "hidden", background: "radial-gradient(ellipse at 50% 20%, #0e3a56 0%, #0b1424 45%, #07060c 100%)" }}>
        <div style={{ position: "absolute", top: 22, left: "50%", marginLeft: -90, width: 180, height: 46, borderRadius: 23, background: "#000" }} />
        {mode !== "photo" && (
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", color: "#e0f2fe" }}>
            <div style={{ fontSize: 34, fontWeight: 600, opacity: 0.8 }}>mardi 25 novembre</div>
            <div style={{ fontSize: 190, fontWeight: 800, letterSpacing: -6, lineHeight: 1.05 }}>{clock}</div>
          </div>
        )}
        {mode === "sms" && (
          <div style={{ position: "absolute", top: 520, width: "100%" }}>
            <Card appear={pop}>
              <div style={{ display: "flex", alignItems: "center", gap: 18, color: "#cbd5e1", fontSize: 30, fontWeight: 700 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: "#22c55e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>✉</div>
                MESSAGES <span style={{ marginLeft: "auto", fontWeight: 500 }}>maintenant</span>
              </div>
              <div style={{ color: "white", fontSize: 52, fontWeight: 900, marginTop: 18 }}>MAMAN</div>
              <div style={{ color: "#e2e8f0", fontSize: 46, fontWeight: 600, marginTop: 8, lineHeight: 1.25 }}>
                Je rentre demain matin.<br />
                <span style={{ color: txt > 0.01 ? C.danger : "#e2e8f0", fontWeight: 800 }}>Ferme bien ta porte à clé.</span>
              </div>
            </Card>
          </div>
        )}
        {mode === "airdrop" && (
          <div style={{ position: "absolute", top: 520, width: "100%" }}>
            <Card appear={pop}>
              <div style={{ textAlign: "center", color: "white" }}>
                <div style={{ width: 120, height: 120, margin: "0 auto", borderRadius: 60, border: `8px solid ${C.phone}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60, color: C.phone }}>◉</div>
                <div style={{ fontSize: 58, fontWeight: 900, marginTop: 24 }}>AIRDROP REÇU</div>
                <div style={{ fontSize: 38, color: "#cbd5e1", marginTop: 14, lineHeight: 1.3 }}>« Appareil inconnu » partage<br />une photo avec vous.</div>
                <div style={{ display: "flex", gap: 24, marginTop: 34 }}>
                  <div style={{ flex: 1, padding: 26, borderRadius: 26, background: "#334155", fontSize: 38, fontWeight: 700 }}>Refuser</div>
                  <div style={{ flex: 1, padding: 26, borderRadius: 26, background: C.phone, color: "#04263a", fontSize: 38, fontWeight: 800, transform: `scale(${lerp(frame, [from + 34, from + 40, from + 46], [1, 0.9, 1])})` }}>Accepter</div>
                </div>
              </div>
            </Card>
          </div>
        )}
        {mode === "photo" && (
          <div style={{ position: "absolute", inset: 0, background: "#000" }}>
            <div style={{ position: "absolute", top: 90, left: 0, right: 0, textAlign: "center", color: "#94a3b8", fontSize: 32, fontWeight: 700 }}>IMG_0247.HEIC • 02:47</div>
            <div style={{ position: "absolute", top: 160, left: 30, right: 30, height: 900, transform: `scale(${lerp(frame, [from, from + 130], [1, 1.12])})`, opacity: pop }}>
              <ClosetPhoto />
            </div>
            <div
              style={{
                position: "absolute", top: 820, left: 40, right: 40, textAlign: "center",
                color: C.danger, fontSize: 64, fontWeight: 900, fontStyle: "italic", lineHeight: 1.1,
                textShadow: "0 0 24px rgba(239,68,68,0.6), 0 4px 0 #000", opacity: txt,
                transform: `scale(${0.8 + 0.2 * txt}) rotate(-3deg)`,
              }}
            >
              Tu joues très bien la comédie.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

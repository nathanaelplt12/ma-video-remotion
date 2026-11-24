import { interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT, clamp } from "../theme";
import { HeroHead } from "./Characters";

const UI = "'Montserrat', 'Helvetica Neue', Arial, sans-serif";

/** Téléphone en gros plan (cadre 760x1500 centré). children = contenu de l'écran. */
export const PhoneFrame: React.FC<{ glow?: number; children: React.ReactNode; tilt?: number }> = ({ glow = 1, children, tilt = 0 }) => (
  <div style={{ position: "absolute", left: 160, top: 300, width: 760, height: 1500, borderRadius: 90, background: C.black, padding: 26, boxShadow: `0 0 ${160 * glow}px rgba(56,189,248,${0.45 * glow}), 0 40px 80px rgba(0,0,0,0.7)`, transform: `rotate(${tilt}deg)`, border: "6px solid #2a2440" }}>
    <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 66, overflow: "hidden", background: `linear-gradient(170deg, #0c4a6e 0%, #0f0d1a 70%)` }}>
      <div style={{ position: "absolute", top: 20, left: "50%", width: 180, height: 46, marginLeft: -90, borderRadius: 23, background: C.black, zIndex: 5 }} />
      {children}
    </div>
  </div>
);

/** Écran verrouillé : heure + notification SMS de MAMAN qui tombe. */
export const LockScreen: React.FC<{ notifAt: number; highlight: number }> = ({ notifAt, highlight }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const drop = spring({ frame: f - notifAt, fps, config: { damping: 11, stiffness: 170 } });
  const hl = interpolate(f, [highlight, highlight + 6], [0, 1], clamp);
  return (
    <>
      <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", color: C.white, fontFamily: UI }}>
        <div style={{ fontSize: 40, opacity: 0.8 }}>mardi 24 novembre</div>
        <div style={{ fontSize: 210, fontWeight: 700, lineHeight: 1 }}>03:00</div>
      </div>
      <div style={{ position: "absolute", left: 30, right: 30, top: 520, transform: `translateY(${(1 - drop) * -700}px) scale(${0.9 + 0.1 * drop})`, opacity: f >= notifAt ? 1 : 0 }}>
        <div style={{ background: "rgba(248,250,252,0.94)", borderRadius: 44, padding: "34px 38px", fontFamily: UI, color: "#0f172a", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
            <div style={{ width: 70, height: 70, borderRadius: 18, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width={44} height={40} viewBox="0 0 44 40"><path d="M22 2 C 10 2 2 9 2 18 C 2 23 5 28 10 31 L 8 38 L 16 34 C 18 34.6 20 35 22 35 C 34 35 42 27 42 18 C 42 9 34 2 22 2 Z" fill="#fff" /></svg>
            </div>
            <div style={{ fontSize: 34, color: "#475569", fontWeight: 700, letterSpacing: 2 }}>MESSAGES</div>
            <div style={{ marginLeft: "auto", fontSize: 30, color: "#64748b" }}>maintenant</div>
          </div>
          <div style={{ fontSize: 62, fontWeight: 900, fontFamily: FONT, letterSpacing: 1 }}>MAMAN ❤️</div>
          <div style={{ fontSize: 48, lineHeight: 1.25, marginTop: 8 }}>
            Je suis bloquée au travail.{" "}
            <span style={{ background: `rgba(239,68,68,${0.18 * hl})`, color: hl > 0.5 ? C.danger : "#0f172a", fontWeight: 800, borderRadius: 8, padding: "0 6px" }}>N'ouvre à personne.</span>
          </div>
        </div>
      </div>
    </>
  );
};

/** Alerte AirDrop + photo prise depuis le placard. */
export const AirDropAlert: React.FC<{ at: number; acceptAt: number }> = ({ at, acceptAt }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - at, fps, config: { damping: 9, stiffness: 240 } });
  const press = f >= acceptAt ? spring({ frame: f - acceptAt, fps, config: { damping: 12 } }) : 0;
  if (f < at) return null;
  return (
    <div style={{ position: "absolute", left: 40, right: 40, top: 150, transform: `scale(${0.4 + 0.6 * pop})`, opacity: Math.min(1, pop * 2), fontFamily: UI }}>
      <div style={{ background: "rgba(30,27,46,0.96)", borderRadius: 50, padding: 40, color: C.white, textAlign: "center", border: `4px solid ${C.screen}`, boxShadow: `0 0 60px rgba(56,189,248,0.6)` }}>
        <svg width={150} height={150} viewBox="0 0 150 150">
          {[0, 1, 2].map((i) => <circle key={i} cx={75} cy={75} r={22 + i * 22 + ((f * 1.5) % 22)} fill="none" stroke={C.screen} strokeWidth={8} opacity={0.9 - i * 0.28} />)}
          <circle cx={75} cy={75} r={16} fill={C.screen} />
        </svg>
        <div style={{ fontFamily: FONT, fontSize: 70, marginTop: 10 }}>AIRDROP REÇU</div>
        <div style={{ fontSize: 42, opacity: 0.85, marginTop: 14, lineHeight: 1.3 }}>« <b>Inconnu</b> » souhaite partager<br />une photo.</div>
        <div style={{ marginTop: 26, height: 200, borderRadius: 24, overflow: "hidden", filter: "blur(10px)", opacity: 0.8 }}>
          <ClosetPhoto f={f} small />
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 30 }}>
          <div style={{ flex: 1, padding: 30, borderRadius: 26, background: "#3b3358", fontSize: 44, fontWeight: 700 }}>Refuser</div>
          <div style={{ flex: 1, padding: 30, borderRadius: 26, background: C.screen, color: C.black, fontSize: 44, fontWeight: 800, transform: `scale(${1 - 0.1 * Math.sin(Math.min(1, press) * Math.PI)})` }}>Accepter</div>
        </div>
      </div>
    </div>
  );
};

/** Photo stylisée : le protagoniste dans son lit, vu par l'entrebâillement du placard. */
export const ClosetPhoto: React.FC<{ f: number; small?: boolean; gap?: number }> = ({ f, small = false, gap = 1 }) => {
  const g = 300 * gap;
  return (
    <svg viewBox="0 0 1080 1500" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
      <rect width={1080} height={1500} fill="#1b172b" />
      {/* lit vu de face, légèrement en plongée */}
      <rect x={120} y={760} width={840} height={520} rx={30} fill="#241e38" />
      <rect x={260} y={700} width={560} height={150} rx={60} fill="#cbd5e1" opacity={0.75} />
      <g transform="translate(540 760) scale(1.3)">
        <rect x={-110} y={60} width={220} height={120} rx={40} fill={C.mustard} />
        <HeroHead eyes="shut" />
      </g>
      <path d="M 130 900 Q 540 830 950 900 L 960 1280 L 120 1280 Z" fill="#3a3466" />
      {/* bords du placard (premier plan, flous) */}
      <rect x={0} y={0} width={540 - g} height={1500} fill={C.black} />
      <rect x={540 + g} y={0} width={540 - g} height={1500} fill={C.black} />
      <rect x={540 - g - 20} y={0} width={20} height={1500} fill="#2e2747" />
      <rect x={540 + g} y={0} width={20} height={1500} fill="#2e2747" />
      {/* vêtements suspendus au premier plan */}
      <path d={`M ${540 - g - 40} 0 L ${540 - g + 30} 0 L ${540 - g + 10} 420 L ${540 - g - 60} 400 Z`} fill="#0b0912" />
      {!small && (
        <>
          {/* grain photo */}
          {Array.from({ length: 60 }, (_, i) => (
            <rect key={i} x={random(`p${i}${f}`) * 1080} y={random(`q${i}${f}`) * 1500} width={4} height={4} fill="#fff" opacity={0.15} />
          ))}
          <text x={60} y={1440} fill="#fbbf24" fontFamily="'Courier New', monospace" fontSize={44} fontWeight={700}>03:00:41  •  IMG_0300.JPG</text>
        </>
      )}
    </svg>
  );
};

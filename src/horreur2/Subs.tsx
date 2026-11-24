import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import voice from "./voice.json";
import { FONT, H, PAL, W } from "./look";

type Seg = { at: number; dur: number; words: { w: string; t: number; d: number }[] };
const V = voice as Record<string, Seg>;

/** Sous-titre : 1–2 mots, **mot** = rouge ; calé sur le mot `on` de la réplique `seg`. */
type CueDef = { text: string; seg: string; on: string };

export const CUES: CueDef[] = [
  { text: "J'AI OUBLIÉ", seg: "1a", on: "j'ai" },
  { text: "DE **FERMER**.", seg: "1a", on: "de" },
  { text: "QUELQU'UN", seg: "1a", on: "quelqu" },
  { text: "L'A **FAIT**.", seg: "1a", on: "l'a" },
  { text: "**02H47**.", seg: "2a", on: "deux" },
  { text: "BIEN **BOURRÉ**.", seg: "2a", on: "bien" },
  { text: "MES **CLÉS**", seg: "2b", on: "mes" },
  { text: "LE **CANAPÉ**.", seg: "2b", on: "canapé" },
  { text: "NUMÉRO **INCONNU**", seg: "2d", on: "numéro" },
  { text: "« TA **VESTE**", seg: "2d", on: "ta" },
  { text: "CHEZ LÉA »", seg: "2d", on: "chez" },
  { text: "**JE M'ENDORS**.", seg: "2e", on: "m'end" },
  { text: "**04H00**.", seg: "3a", on: "quatre" },
  { text: "J'ÉTEINS **TOUT**.", seg: "3a", on: "j'éteins" },
  { text: "UN TRUC", seg: "3b", on: "un" },
  { text: "**CLOCHE**.", seg: "3b", on: "cloche" },
  { text: "MON **DOUBLE**", seg: "3b", on: "mon" },
  { text: "A **DISPARU**.", seg: "3b", on: "n'est" },
  { text: "TROP **BU**.", seg: "3c", on: "trop" },
  { text: "**RIEN D'AUTRE**.", seg: "3d", on: "rien" },
  { text: "SANS **FERMER**", seg: "3e", on: "sans" },
  { text: "MA **CHAMBRE**.", seg: "3e", on: "ma" },
  { text: "**04H12**.", seg: "4a", on: "quatre" },
  { text: "IMPOSSIBLE", seg: "4a", on: "impossible" },
  { text: "DE **DORMIR**.", seg: "4a", on: "de" },
  { text: "UN BRUIT **SEC**.", seg: "4b", on: "un" },
  { text: "LE **PARQUET**.", seg: "4c", on: "le" },
  { text: "QUELQU'UN **MARCHE**.", seg: "4d", on: "quelqu" },
  { text: "**CHEZ MOI**.", seg: "4d", on: "chez" },
  { text: "LE **MÊME**", seg: "4e", on: "le" },
  { text: "NUMÉRO :", seg: "4e", on: "numéro" },
  { text: "« TU DORS", seg: "4e", on: "tu" },
  { text: "**PAS** ? »", seg: "4e", on: "pas" },
  { text: "LA **CAMÉRA**.", seg: "5a", on: "caméra" },
  { text: "UNE **ALERTE**", seg: "5a2", on: "une" },
  { text: "**03H02**.", seg: "5a2", on: "trois" },
  { text: "PENDANT QUE", seg: "5a2", on: "pendant" },
  { text: "JE **DORMAIS**.", seg: "5a2", on: "je" },
  { text: "**JUSTE LÀ**.", seg: "5a2", on: "juste" },
  { text: "MA **VESTE**", seg: "5a3", on: "ma" },
  { text: "LE **CANAPÉ**.", seg: "5a3", on: "le" },
  { text: "UN **HOMME**", seg: "5b", on: "un" },
  { text: "AVEC MON", seg: "5b", on: "avec" },
  { text: "**DOUBLE**.", seg: "5b", on: "double" },
  { text: "IL **REGARDE**", seg: "5c", on: "regarde" },
  { text: "LA **CAMÉRA**.", seg: "5c", on: "caméra" },
  { text: "IL NE", seg: "6a", on: "il" },
  { text: "**S'ENFUIT PAS**.", seg: "6a", on: "s'enfuit" },
  { text: "VERS MA", seg: "6a", on: "vers" },
  { text: "**CHAMBRE**.", seg: "6a", on: "chambre" },
  { text: "LES PAS", seg: "6b", on: "les" },
  { text: "**S'ARRÊTENT**.", seg: "6b", on: "s'arrêtent" },
  { text: "LA CLÉ", seg: "6c", on: "la" },
  { text: "**TOURNE**...", seg: "6c", on: "tourner" },
  { text: "IL N'ESSAYAIT", seg: "6d", on: "il" },
  { text: "PAS D'**ENTRER**.", seg: "6d", on: "pas" },
  { text: "IL **M'ENFERMAIT**.", seg: "6d", on: "m'enf" },
];

const norm = (s: string) => s.toLowerCase().normalize("NFC").replace(/[.,!?…:«»]/g, "").replace(/’/g, "'");

/** Résout chaque sous-titre en [début, fin] en frames absolues. */
export const timedCues = (fps: number) => {
  const out = CUES.map((c) => {
    const s = V[c.seg];
    const w = s.words.find((x) => norm(x.w).startsWith(norm(c.on)));
    if (!w) throw new Error(`Mot introuvable: ${c.on} dans ${c.seg}`);
    return { ...c, start: s.at + Math.round(w.t * fps) - 2, wordEnd: s.at + Math.round((w.t + w.d) * fps) };
  });
  return out.map((c, i) => {
    const next = out[i + 1];
    const natural = Math.max(c.wordEnd + 14, c.start + 20);
    const end = next && next.start - c.start < 50 ? next.start : Math.min(natural, c.start + 45);
    return { ...c, end };
  });
};

const render = (t: string) =>
  t.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((p, i) =>
    p.startsWith("**") ? <span key={i} style={{ color: PAL.red }}>{p.slice(2, -2)}</span> : <span key={i}>{p}</span>,
  );

/**
 * Safe zone TikTok : bloc ancré au-dessus des 22 % inférieurs (bas <= 78 % de la hauteur),
 * 15 % de marge à droite.
 */
export const Subs: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cues = React.useMemo(() => timedCues(fps), [fps]);
  const c = cues.find((x) => f >= x.start && f < x.end);
  if (!c) return null;
  const pop = spring({ frame: f - c.start, fps, config: { damping: 10, stiffness: 320, mass: 0.5 } });
  const bottomLimit = H * 0.78;
  return (
    <div
      style={{
        position: "absolute", left: W * 0.06, right: W * 0.15, top: bottomLimit - 300, height: 260,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        style={{
          transform: `scale(${0.55 + 0.45 * pop}) translateY(${(1 - pop) * 30}px)`,
          textAlign: "center", color: "#fff", fontFamily: FONT, fontWeight: 900, fontSize: 104,
          lineHeight: 1.02, letterSpacing: 1, textTransform: "uppercase",
          WebkitTextStroke: "9px #000", paintOrder: "stroke fill",
          textShadow: "0 6px 0 #000, 0 10px 30px rgba(0,0,0,0.9)",
        }}
      >
        {render(c.text)}
      </div>
    </div>
  );
};

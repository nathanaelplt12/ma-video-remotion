import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import voice from "./voice.json";
import { FONT, H, PAL, W } from "./look";

type Seg = { at: number; dur: number; words: { w: string; t: number; d: number }[] };
const V = voice as Record<string, Seg>;

/** Sous-titre : 1–2 mots, **mot** = rouge ; calé sur le mot `on` de la réplique `seg`. */
type CueDef = { text: string; seg: string; on: string };

export const CUES: CueDef[] = [
  { text: "VÉRIFIE **TOUJOURS**", seg: "1a", on: "vérifie" },
  { text: "TES **VERROUS**.", seg: "1a", on: "mes" },
  { text: "MOI, **HUGO**.", seg: "2a", on: "hugo" },
  { text: "**21H15**.", seg: "2a", on: "vingt" },
  { text: "À CÔTÉ", seg: "2b", on: "côté" },
  { text: "DU **DOUBLE**.", seg: "2b", on: "double" },
  { text: "L'ANCIEN", seg: "2c", on: "l'anc" },
  { text: "**LOCATAIRE**", seg: "2c", on: "locataire" },
  { text: "JAMAIS **RENDU**", seg: "2c", on: "jamais" },
  { text: "SES **CLÉS**.", seg: "2c", on: "ses" },
  { text: "UNE SOIRÉE", seg: "2d", on: "une" },
  { text: "**NORMALE**.", seg: "2d", on: "normale" },
  { text: "MON DOUBLE", seg: "3b", on: "mon" },
  { text: "DE **CLÉS**", seg: "3b", on: "de" },
  { text: "A **DISPARU**.", seg: "3b", on: "n" },
  { text: "JE N'Y FAIS", seg: "3c", on: "je" },
  { text: "**PAS ATTENTION**.", seg: "3c", on: "rang" },
  { text: "**GROSSE ERREUR**.", seg: "3d", on: "grosse" },
  { text: "**00H42**.", seg: "4a", on: "minuit" },
  { text: "LE PARQUET", seg: "4c", on: "parquet" },
  { text: "**GRINCE**.", seg: "4c", on: "grince" },
  { text: "QUELQU'UN EST", seg: "4d", on: "quelqu" },
  { text: "**CHEZ MOI**.", seg: "4d", on: "chez" },
  { text: "SMS **INCONNU**", seg: "4e", on: "sms" },
  { text: "« POURQUOI TU", seg: "4e", on: "pourquoi" },
  { text: "**NE DORS PAS**,", seg: "4e", on: "ne" },
  { text: "**HUGO** ? »", seg: "4e", on: "hugo" },
  { text: "LA **CAMÉRA**", seg: "5a", on: "caméra" },
  { text: "1RE ALERTE :", seg: "5a2", on: "première" },
  { text: "**21H16**.", seg: "5a2", on: "vingt" },
  { text: "IL ÉTAIT **LÀ**", seg: "5a2", on: "il" },
  { text: "**DEPUIS LE DÉBUT**.", seg: "5a2", on: "depuis" },
  { text: "UN **INCONNU**", seg: "5b", on: "homme" },
  { text: "IL TIENT", seg: "5b", on: "salle" },
  { text: "**MES CLÉS**.", seg: "5b", on: "mes" },
  { text: "IL FIXE", seg: "5c", on: "fixe" },
  { text: "LA **CAMÉRA**.", seg: "5c", on: "caméra" },
  { text: "IL NE", seg: "6a", on: "il" },
  { text: "**FUIT PAS**.", seg: "6a", on: "fuit" },
  { text: "IL EST", seg: "6b", on: "les" },
  { text: "**DEVANT**", seg: "6b", on: "devant" },
  { text: "**LA PORTE**.", seg: "6b", on: "porte" },
  { text: "LA CLÉ", seg: "6c", on: "clé" },
  { text: "**TOURNE**...", seg: "6c", on: "tourner" },
  { text: "CE **DOUBLE**...", seg: "6d", on: "ce" },
  { text: "LA CLÉ DE", seg: "6d", on: "la" },
  { text: "**MA CHAMBRE**.", seg: "6d", on: "chambre" },
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

#!/usr/bin/env python3
"""Voix off horreur-v2 : TTS neuronal edge-tts (fr-FR-HenriNeural), post-traité
(grave, compressé, petite réverb). Écrit public/audio/v2/vo_<id>.mp3 et
src/v2/voiceData.json (durées + timing des sous-titres calés sur les mots)."""
import asyncio, json, os, subprocess, sys, tempfile
import edge_tts

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "audio", "v2")
os.makedirs(OUT, exist_ok=True)
FPS = 30
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

VOICES = {
    # voix narrateur : grave, lente, posée
    "narrator": dict(voice="fr-FR-HenriNeural", rate="+8%", pitch="-4Hz", slow=0.94, keep_tempo=True,
                     fx="equalizer=f=110:t=q:w=1:g=4,equalizer=f=3500:t=q:w=1.2:g=4,"
                        "acompressor=threshold=-22dB:ratio=4:attack=3:release=50:makeup=2,"
                        "aecho=0.8:0.35:40|80:0.12|0.05,volume=1.4"),
    # l'entité qui imite une voix : chuchotée, distante, malsaine
    "mimic": dict(voice="fr-FR-DeniseNeural", rate="-8%", pitch="-10Hz", slow=0.9,
                  fx="highpass=f=250,lowpass=f=4200,aecho=0.8:0.7:90|180:0.35|0.2,"
                     "tremolo=f=6:d=0.25,volume=1.2"),
}

lines = json.load(open(os.path.join(ROOT, "scripts", "v2", "voiceover.json"), encoding="utf-8"))["lines"]


async def tts(text, cfg, dst):
    words = []
    comm = edge_tts.Communicate(text, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"],
                                boundary="WordBoundary", proxy=PROXY)
    with open(dst, "wb") as f:
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                words.append((chunk["offset"] / 1e7, (chunk["offset"] + chunk["duration"]) / 1e7, chunk["text"]))
    return words


def duration(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                          "-of", "csv=p=0", p]))


data = {}
for ln in lines:
    cfg = VOICES[ln["voice"]]
    dst = os.path.join(OUT, f"vo_{ln['id']}.mp3")
    with tempfile.TemporaryDirectory() as d:
        raw = os.path.join(d, "raw.mp3")
        text = ln["text"]
        if ln["voice"] == "narrator":  # moins de pauses traînantes : « ... » → virgule
            text = text.replace("... ", ", ").replace("...", ".")
        words = asyncio.run(tts(text, cfg, raw))
        s = cfg["slow"]
        # keep_tempo : voix plus grave (asetrate) sans ralentir le débit (atempo compense)
        tempo = f"atempo={1 / s:.4f}," if cfg.get("keep_tempo") else ""
        filt = f"asetrate=24000*{s},aresample=44100,{tempo}{cfg['fx']},apad=pad_dur=0.6"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", filt,
                        "-ac", "1", "-b:a", "160k", dst], check=True)
    k = 1 if cfg.get("keep_tempo") else 1 / cfg["slow"]  # asetrate ralentit le signal
    words = [(a * k, b * k, t) for a, b, t in words]
    dur = duration(dst) - 0.45  # sans la queue de réverb
    cues, i = [], 0
    for text, n in ln["cues"]:
        seg = words[i:i + n]
        if len(seg) < n:
            sys.exit(f"{ln['id']}: {len(words)} mots détectés, cues attendent plus : {[w[2] for w in words]}")
        cues.append({"text": text, "from": ln["start"] + round(seg[0][0] * FPS)})
        i += n
    if i and i != len(words):
        sys.exit(f"{ln['id']}: {len(words)} mots détectés vs {i} dans les cues : {[w[2] for w in words]}")
    end = ln["start"] + round((words[-1][1] if words else dur) * FPS) + 8
    data[ln["id"]] = {"start": ln["start"], "voice": ln["voice"], "frames": round(duration(dst) * FPS),
                      "speechEnd": end, "cues": cues}
    print(f"{ln['id']:4s} {ln['start']:5d} → {end:5d}  {ln['text']}")

# Vérifie les chevauchements de la voix narrateur
nar = sorted([v for v in data.values() if v["voice"] == "narrator"], key=lambda v: v["start"])
for a, b in zip(nar, nar[1:]):
    if a["speechEnd"] > b["start"]:
        print(f"  ⚠ chevauchement : fin {a['speechEnd']} > début {b['start']}", file=sys.stderr)

json.dump(data, open(os.path.join(ROOT, "src", "v2", "voiceData.json"), "w", encoding="utf-8"), indent=1, ensure_ascii=False)

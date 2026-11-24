#!/usr/bin/env python3
"""Voix off « Le double des clés » : edge-tts fr-FR-HenriNeural (voix neuronale grave),
un fichier par réplique + horodatage de chaque mot (WordBoundary) pour caler les sous-titres.
Sortie : public/audio/h2/v_<id>.mp3 et src/horreur2/voice.json"""
import asyncio, json, os, ssl, subprocess, tempfile
import edge_tts, edge_tts.communicate as comm

# Derrière un proxy TLS, edge-tts doit faire confiance au bundle CA du système/proxy.
CA = os.environ.get("SSL_CERT_FILE") or ("/root/.ccr/ca-bundle.crt" if os.path.exists("/root/.ccr/ca-bundle.crt") else None)
if CA:
    comm._SSL_CTX = ssl.create_default_context(cafile=CA)
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "audio", "h2")
os.makedirs(OUT, exist_ok=True)
LINES = json.load(open(os.path.join(os.path.dirname(__file__), "lines.json"), encoding="utf-8"))
VOICE = "fr-FR-HenriNeural"
# Grave, chaud, proche du micro : léger boost bas-médium, de-harsh, petite pièce.
FILTER = ("equalizer=f=110:t=q:w=1.2:g=3,equalizer=f=3500:t=q:w=1.5:g=-2,"
          "highpass=f=60,aecho=0.8:0.4:35|70:0.10|0.05,volume=1.25")


async def synth(line):
    c = edge_tts.Communicate(line["text"], VOICE, rate=line.get("rate", "-6%"),
                             pitch=line.get("pitch", "-7Hz"), boundary="WordBoundary", proxy=PROXY)
    words, audio = [], bytearray()
    async for ch in c.stream():
        if ch["type"] == "audio":
            audio += ch["data"]
        elif ch["type"] == "WordBoundary":
            words.append({"w": ch["text"], "t": round(ch["offset"] / 1e7, 3),
                          "d": round(ch["duration"] / 1e7, 3)})
    return bytes(audio), words


res = {}
for line in LINES:
    audio, words = asyncio.run(synth(line))
    dst = os.path.join(OUT, f"v_{line['id']}.mp3")
    with tempfile.NamedTemporaryFile(suffix=".mp3") as f:
        f.write(audio); f.flush()
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f.name, "-af", FILTER,
                        "-ar", "44100", "-ac", "1", "-b:a", "160k", dst], check=True)
    dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                         "-of", "csv=p=0", dst]))
    res[line["id"]] = {"at": line["at"], "dur": round(dur, 3), "words": words}
    print(f"{line['id']:>4}  at={line['at']:>5}  {dur:5.2f}s  {line['text'][:60]}")

json.dump(res, open(os.path.join(ROOT, "src", "horreur2", "voice.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)

#!/usr/bin/env python3
"""Génère public/audio/scene1..6.mp3 : edge-tts (fr-FR-HenriNeural) en priorité,
sinon repli automatique sur le TTS local (say / PowerShell System.Speech / espeak-ng)."""
import asyncio, json, os, platform, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "audio")
os.makedirs(OUT, exist_ok=True)
texts = json.load(open(os.path.join(ROOT, "scripts", "voices.json"), encoding="utf-8"))


def to_mp3(src, dst, filt="anull"):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", filt,
                    "-ar", "44100", "-ac", "1", "-b:a", "128k", dst], check=True)


def edge(i, text):
    import edge_tts
    dst = os.path.join(OUT, f"scene{i}.mp3")
    asyncio.run(edge_tts.Communicate(text, "fr-FR-HenriNeural", rate="-8%").save(dst))
    if os.path.getsize(dst) < 1000:
        raise RuntimeError("empty file")


def native(i, text):
    dst = os.path.join(OUT, f"scene{i}.mp3")
    with tempfile.TemporaryDirectory() as d:
        sysname = platform.system()
        if sysname == "Darwin" and shutil.which("say"):
            src = os.path.join(d, "v.aiff")
            subprocess.run(["say", "-v", "Thomas", "-o", src, text], check=True)
            to_mp3(src, dst)
        elif sysname == "Windows":
            src = os.path.join(d, "v.wav")
            ps = ("Add-Type -AssemblyName System.Speech;"
                  "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;"
                  "try{$s.SelectVoice('Microsoft Hortense Desktop')}catch{};"
                  f"$s.SetOutputToWaveFile('{src}');$s.Speak([Console]::In.ReadToEnd());$s.Dispose()")
            subprocess.run(["powershell", "-NoProfile", "-Command", ps], input=text.encode("utf-8"), check=True)
            to_mp3(src, dst)
        elif shutil.which("espeak-ng"):
            src = os.path.join(d, "v.wav")
            subprocess.run(["espeak-ng", "-v", "fr+m3", "-s", "135", "-p", "30", "-w", src, text], check=True)
            # voix plus grave + légère réverb pour l'ambiance horreur
            to_mp3(src, dst, "asetrate=44100*0.92,aresample=44100,lowpass=f=5000,aecho=0.8:0.6:60:0.25,volume=1.6")
        else:
            raise RuntimeError("aucun moteur TTS disponible")


for i, t in enumerate(texts, 1):
    try:
        edge(i, t); mode = "edge-tts"
    except Exception as e:
        print(f"  edge-tts indisponible ({type(e).__name__}), repli TTS système", file=sys.stderr)
        native(i, t); mode = "système"
    print(f"scene{i}.mp3 [{mode}]")

# Durées réelles (secondes) -> src/voiceDurations.json, lu par la composition pour caler scènes et sous-titres
durs = {}
for i in range(1, len(texts) + 1):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", os.path.join(OUT, f"scene{i}.mp3")])
    durs[f"scene{i}"] = round(float(out), 3)
json.dump(durs, open(os.path.join(ROOT, "src", "voiceDurations.json"), "w"), indent=1)
print("durées:", durs)

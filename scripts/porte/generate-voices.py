#!/usr/bin/env python3
"""Voix off de « horreur-porte » : public/audio/scene1..8.mp3 + src/porte/voiceTimings.json.

Moteur : edge-tts (fr-FR-HenriNeural, --rate=+5% --pitch=-4Hz) en priorité, sinon
solution de secours locale (say / PowerShell System.Speech / espeak-ng + MBROLA fr1 / espeak-ng).

Chaque scène est synthétisée segment par segment (un segment = un sous-titre), les
silences de début/fin sont coupés puis les segments recollés avec une courte pause.
On connaît ainsi le temps exact de chaque sous-titre : la composition lit
voiceTimings.json pour caler sous-titres et événements visuels au frame près.
Si une scène dépasse sa durée max, elle est accélérée (atempo) pour tenir.

Usage : python3 scripts/porte/generate-voices.py [--engine edge|local]
"""
import asyncio, json, os, platform, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public", "audio")
TIMINGS = os.path.join(ROOT, "src", "porte", "voiceTimings.json")
SR = 44100
VOICE, RATE, PITCH = "fr-FR-HenriNeural", "+5%", "-4Hz"
# Prononciation pour les moteurs locaux
LOCAL_FIX = {"AirDrop": "èr drop"}

os.makedirs(OUT, exist_ok=True)
os.makedirs(os.path.dirname(TIMINGS), exist_ok=True)
data = json.load(open(os.path.join(ROOT, "scripts", "porte", "voices.json"), encoding="utf-8"))
scenes = {k: v for k, v in data.items() if k.startswith("scene")}
force = sys.argv[sys.argv.index("--engine") + 1] if "--engine" in sys.argv else None

TRIM = ("aresample=44100,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02,areverse,"
        "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse")


def to_pcm(src, filt):
    """Décode n'importe quel fichier audio en PCM s16 mono 44.1 kHz (bytes)."""
    return subprocess.run(["ffmpeg", "-loglevel", "error", "-i", src, "-af", filt, "-ac", "1", "-ar", str(SR),
                           "-f", "s16le", "-"], check=True, capture_output=True).stdout


def synth_edge(text, d):
    import edge_tts
    dst = os.path.join(d, "e.mp3")
    asyncio.run(edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(dst))
    if os.path.getsize(dst) < 500:
        raise RuntimeError("fichier vide")
    return to_pcm(dst, TRIM)


def synth_local(text, d):
    for a, b in LOCAL_FIX.items():
        text = text.replace(a, b)
    sysname = platform.system()
    if sysname == "Darwin" and shutil.which("say"):
        src = os.path.join(d, "v.aiff")
        subprocess.run(["say", "-v", "Thomas", "-r", "205", "-o", src, text], check=True)
        return to_pcm(src, TRIM + ",asetrate=44100*0.95,aresample=44100,atempo=1.0526")
    if sysname == "Windows":
        src = os.path.join(d, "v.wav")
        ps = ("Add-Type -AssemblyName System.Speech;$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;"
              "try{$s.SelectVoice('Microsoft Paul Desktop')}catch{};$s.Rate=1;"
              f"$s.SetOutputToWaveFile('{src}');$s.Speak([Console]::In.ReadToEnd());$s.Dispose()")
        subprocess.run(["powershell", "-NoProfile", "-Command", ps], input=text.encode("utf-8"), check=True)
        return to_pcm(src, TRIM)
    if shutil.which("espeak-ng"):
        src = os.path.join(d, "v.wav")
        mbrola = shutil.which("mbrola") and os.path.isdir("/usr/share/mbrola/fr1")
        voice = ["-v", "mb-fr1", "-s", "158"] if mbrola else ["-v", "fr+m3", "-s", "175", "-p", "30"]
        subprocess.run(["espeak-ng", *voice, "-w", src, text], check=True, capture_output=True)
        # Un peu plus grave (sans ralentir) + légère réverb : ambiance horreur
        return to_pcm(src, TRIM + ",asetrate=44100*0.93,aresample=44100,atempo=1.0753,"
                      "lowpass=f=6500,aecho=0.8:0.5:45:0.2,volume=1.8")
    raise RuntimeError("aucun moteur TTS local (installe espeak-ng, idéalement + mbrola-fr1)")


def write_mp3(pcm, dst, tempo):
    filt = f"atempo={tempo:.4f}" if tempo != 1 else "anull"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-",
                    "-af", filt + ",alimiter=limit=0.95", "-ar", str(SR), "-ac", "1", "-b:a", "160k", dst],
                   input=pcm, check=True)


engine = force or "edge"
timings = {}
with tempfile.TemporaryDirectory() as d:
    for name, sc in scenes.items():
        pcm, segs, t = b"", [], 0.0
        for seg in sc["segments"]:
            text = seg["say"]
            if engine == "edge":
                try:
                    chunk = synth_edge(text, d)
                except Exception as e:  # réseau coupé, module absent…
                    print(f"  edge-tts indisponible ({type(e).__name__}) → solution de secours locale", file=sys.stderr)
                    engine = "local"
            if engine == "local":
                chunk = synth_local(text, d)
            dur = len(chunk) / 2 / SR
            segs.append({"start": t, "end": t + dur, "sub": seg["sub"]})
            pause = seg.get("pause", 0)
            pcm += chunk + b"\x00\x00" * int(pause * SR)
            t += dur + pause
        total = t - sc["segments"][-1].get("pause", 0)
        tempo = max(1.0, total / sc["max"])
        if tempo > 1:
            print(f"  {name}: {total:.2f}s > {sc['max']}s → accéléré x{tempo:.3f}", file=sys.stderr)
        dst = os.path.join(OUT, f"{name}.mp3")
        write_mp3(pcm, dst, tempo)
        real = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                              "-of", "csv=p=0", dst]))
        timings[name] = {
            "engine": engine,
            "duration": round(real, 3),
            "segments": [{"start": round(s["start"] / tempo, 3), "end": round(s["end"] / tempo, 3), "sub": s["sub"]}
                         for s in segs],
        }
        print(f"{name}.mp3 [{engine}] {real:.2f}s")

json.dump(timings, open(TIMINGS, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("→", os.path.relpath(TIMINGS, ROOT))

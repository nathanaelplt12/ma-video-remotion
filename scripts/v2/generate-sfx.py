#!/usr/bin/env python3
"""Bruitages synthétisés (aucun battement de cœur) → public/audio/*.wav :
ambient, knock, vibrate, creak, impact, rewind, close."""
import os, wave
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "public", "audio")
rng = np.random.default_rng(7)
t_ = lambda d: np.arange(int(d * SR)) / SR


def save(name, x, peak=0.9):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f"{len(x) / SR:.2f}s")


def onepole(x, fc):  # passe-bas 1 pôle (fc scalaire ou tableau)
    fc = np.broadcast_to(fc, x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s = (1 - a[i]) * x[i] + a[i] * s; y[i] = s
    return y


def biquad_bp(x, f0, q):
    w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b0, b2, a0, a1, a2 = al, -al, 1 + al, -2 * np.cos(w), 1 - al
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        v = (b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x[i], y1, v; y[i] = v
    return y


def fade(x, a=0.01, b=0.05):
    n = len(x); e = np.ones(n)
    na, nb = int(a * SR), int(b * SR)
    e[:na] = np.linspace(0, 1, na); e[n - nb:] = np.linspace(1, 0, nb)
    return x * e


# 1. Souffle d'air nocturne : bruit brun filtré, respiration lente, bouclable (12 s)
d = 12; t = t_(d)
brown = np.cumsum(rng.normal(0, 1, len(t))); brown -= onepole(brown, 0.5)
air = onepole(brown, 380 + 160 * np.sin(2 * np.pi * t / 6))
swell = 0.6 + 0.4 * np.sin(2 * np.pi * t / 6) ** 2
amb = air * swell
x = np.concatenate([amb, amb]); n = len(amb); cf = int(1.5 * SR)  # fondu de bouclage
amb[:cf] = amb[:cf] * np.linspace(0, 1, cf) + amb[-cf:] * np.linspace(1, 0, cf)
save("ambient.wav", amb[: n - cf], 0.5)

# 2. Trois coups sourds sur du bois (lents)
def knock():
    t = t_(0.5)
    body = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in
               [(92, 1.0, 18), (148, 0.7, 26), (310, 0.35, 40), (640, 0.15, 60)])
    click = onepole(rng.normal(0, 1, len(t)), 1800) * np.exp(-t * 140) * 1.4
    return body + click
gap = int(0.62 * SR); k = knock(); x = np.zeros(gap * 2 + len(k))
for i, g in enumerate([1.0, 0.92, 1.05]):
    x[i * gap: i * gap + len(k)] += k * g
save("knock.wav", fade(x, 0.001, 0.1))

# 3. Vibration de téléphone posé sur bois : 2 salves
t = t_(1.25)
buzz = np.sign(np.sin(2 * np.pi * 172 * t)) * 0.5 + np.sin(2 * np.pi * 344 * t) * 0.3
buzz = onepole(buzz + rng.normal(0, 0.15, len(t)), 1400)
gate = ((t % 0.62) < 0.42).astype(float); gate = onepole(gate, 60)
save("vibrate.wav", fade(buzz * gate * (1 + 0.2 * np.sin(2 * np.pi * 23 * t)), 0.005, 0.05), 0.7)

# 4. Grincement de porte : stick-slip (train d'impulsions de fréquence variable) dans des résonances
d = 2.8; t = t_(d)
rate = 38 + 70 * (0.5 + 0.5 * np.sin(2 * np.pi * t * 0.55 + 1)) + 20 * rng.random() * np.sin(2 * np.pi * t * 3.1)
ph = np.cumsum(rate / SR); imp = np.diff(np.floor(ph), prepend=0) * (0.6 + 0.4 * rng.random(len(t)))
src = imp + rng.normal(0, 0.02, len(t))
cr = biquad_bp(src, 820, 9) + 0.7 * biquad_bp(src, 1450, 12) + 0.4 * biquad_bp(src, 2600, 14) + 0.5 * biquad_bp(src, 420, 6)
env = np.clip(t / 0.3, 0, 1) * np.clip((d - t) / 0.5, 0, 1)
save("creak.wav", cr * env, 0.75)

# 5. Impact sec (jumpscare)
t = t_(1.6)
sub = np.sin(2 * np.pi * (70 * np.exp(-t * 3) + 32) * t) * np.exp(-t * 3.2)
crack = rng.normal(0, 1, len(t)) * np.exp(-t * 28)
mid = onepole(rng.normal(0, 1, len(t)), 2500) * np.exp(-t * 7)
hit = np.tanh(2.6 * (sub * 1.2 + crack * 0.9 + mid * 0.6))
save("impact.wav", fade(hit, 0.0005, 0.3), 0.98)

# 6. Rembobinage VHS : sifflement de bande qui accélère + chuintement + clacs
d = 1.9; t = t_(d)
f = 900 + 3200 * (t / d) ** 1.6
whir = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + np.sin(2 * np.pi * np.cumsum(f * 2.01) / SR) * 0.1
wow = 1 + 0.3 * np.sin(2 * np.pi * 13 * t)
hiss = (rng.normal(0, 1, len(t)) - onepole(rng.normal(0, 1, len(t)), 3000)) * 0.35
mot = np.sin(2 * np.pi * 60 * t) * 0.2 * (np.sin(2 * np.pi * 7 * t) > 0)
rw = (whir * wow + hiss + mot)
for c in (0.0, d - 0.08):
    i = int(c * SR); rw[i:i + 1500] += rng.normal(0, 1, 1500) * np.exp(-np.arange(1500) / 200) * 2
save("rewind.wav", fade(rw, 0.002, 0.05), 0.6)

# 7. Porte qui se referme doucement (clic de pêne)
t = t_(0.7)
thud = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(75, 1, 12), (130, 0.5, 22)])
latch = onepole(rng.normal(0, 1, len(t)), 5000) * (np.exp(-np.maximum(t - 0.09, 0) * 220) * (t > 0.09)) * 0.8
save("close.wav", fade(thud + latch, 0.001, 0.2), 0.6)

# 8. Claquement de la porte du placard (bois lourd + vibration)
t = t_(0.9)
slam = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for f, a, k in [(62, 1, 9), (118, 0.7, 16), (240, 0.4, 30)])
slam += onepole(rng.normal(0, 1, len(t)), 3000) * np.exp(-t * 45) * 1.2
save("slam.wav", fade(np.tanh(1.8 * slam), 0.0005, 0.2), 0.9)

# 9. Riser de bouclage : souffle qui monte et se coupe net (raccord sur l'impact de la frame 0)
d = 0.9; t = t_(d); env = (t / d) ** 2.2
nz = rng.normal(0, 1, len(t))
riser = onepole(nz, 300 + 5000 * (t / d) ** 2) * env
riser += np.sin(2 * np.pi * np.cumsum(120 + 500 * (t / d) ** 2) / SR) * env * 0.35
rev = np.flip(np.tanh(2 * rng.normal(0, 1, len(t)) * np.exp(-t * 6)))  # traîne inversée
riser += onepole(rev, 2500) * 0.5
save("riser.wav", fade(riser, 0.05, 0.004), 0.8)

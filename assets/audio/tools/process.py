# Wakha recordings: split each batch into clips, clean them, and (female takes) make them sound more feminine.
# Timing is never changed: no speed-up, no slow-down. The female shift keeps duration exactly.
import soundfile as sf, numpy as np, json, os, re, csv, subprocess, sys
import noisereduce as nr, pyloudnorm as pyln
exec(open('seg.py').read().split("out={}")[0])
rep = json.load(open('segreport.json'))
OUT = "clips"; os.makedirs(OUT, exist_ok=True); os.makedirs("clean", exist_ok=True)
SR = 48000
def expand(segs, db, thr_lo):
    """grow each clip outward until the energy drops below a low threshold, never past halfway to its neighbour"""
    out = []
    for i, (s, e) in enumerate(segs):
        lo = (segs[i - 1][1] + s) // 2 if i else 0
        hi = (e + segs[i + 1][0]) // 2 if i + 1 < len(segs) else len(db)
        while s > lo and db[s - 1] > thr_lo: s -= 1
        while e < hi and db[e] > thr_lo: e += 1
        out.append([s, e])
    return out
meter = pyln.Meter(SR)
manifest = []
only = sys.argv[1:]
ALIGN = json.load(open("alignment.json")); UNSURE = {"M067", "M068"}
for f, r in sorted(rep.items()):
    if only and f not in only: continue
    x, sr = sf.read(f"wav/{f}.wav"); assert sr == SR
    exp = {e['no']: e for e in expected(f)}
    db = envelope(x, sr); fl = np.percentile(db, 10); pk = np.percentile(db, 99); lo = fl + 0.10 * (pk - fl)
    items = [(no, s_, t_) for no, s_, t_, d in ALIGN[f] if s_ is not None and no not in UNSURE]
    # grow each clip to its quiet edges, never past halfway to the neighbouring clip
    segs = []
    for i, (no, s_, t_) in enumerate(items):
        s0, e0 = int(s_ * 100), int(t_ * 100)
        lo_b = (int(items[i - 1][2] * 100) + s0) // 2 if i else 0
        hi_b = (e0 + int(items[i + 1][1] * 100)) // 2 if i + 1 < len(items) else len(db)
        while s0 > lo_b and db[s0 - 1] > lo: s0 -= 1
        while e0 < hi_b and db[e0] > lo: e0 += 1
        segs.append((s0, e0, no))
    hop = int(sr * 0.01); mask = np.ones(len(x), bool)
    for s0, e0, _ in segs: mask[max(0, s0 * hop - 2400):e0 * hop + 2400] = False
    noise = x[mask] if mask.sum() > sr * 0.5 else x[:int(sr * 0.3)]
    xc = nr.reduce_noise(y=x, sr=sr, y_noise=noise, stationary=True, prop_decrease=0.85, n_fft=2048)
    xc = xc / max(np.max(np.abs(xc)), 1e-9) * 0.7
    female = f.startswith("F")
    for s, e, no in segs:
        row = exp[no]
        a = max(0, s * hop - int(0.06 * sr)); b = min(len(xc), e * hop + int(0.12 * sr))
        clip = xc[a:b].copy()
        raw = f"clean/{row['no']}_raw.wav"; sf.write(raw, clip, sr)
        chain = ["highpass=f=80:poles=2", "agate=threshold=0.02:ratio=6:range=0.03:attack=6:release=160:knee=4"]
        if female:
            # raise formants ~13% (resample up, then restore the original duration), then lift the pitch a further
            # ~3 semitones keeping formants, for a lighter, more feminine voice at the same speed
            chain += ["asetrate=%d" % int(SR * 1.13), "aresample=%d" % SR, "atempo=%.6f" % (1 / 1.13),
                      "rubberband=pitch=%.5f:formant=preserved:pitchq=quality" % (2 ** (3 / 12))]
        chain += ["equalizer=f=220:t=q:w=1.0:g=-2.5",           # less boxy room mud
                  "equalizer=f=3400:t=q:w=1.2:g=%s" % ("2.5" if not female else "3"),   # clarity
                  "highshelf=f=9000:g=0.8",                      # a little air
                  "deesser=i=0.45",
                  "acompressor=threshold=-22dB:ratio=3:attack=6:release=90:makeup=2",
                  "afade=t=in:d=0.012", "areverse", "afade=t=in:d=0.05", "areverse"]
        tmp = f"clean/{row['no']}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", raw, "-af", ",".join(chain), "-ar", str(SR), tmp], check=True)
        y, _ = sf.read(tmp)
        L = meter.integrated_loudness(y) if len(y) > SR * 0.4 else meter.integrated_loudness(np.tile(y, int(np.ceil(SR * 0.5 / len(y)))))
        y = pyln.normalize.loudness(y, L, -17.0)
        pkv = np.max(np.abs(y)); y = y * min(1, 0.89 / max(pkv, 1e-9))   # keep peaks under -1 dBFS
        sf.write(tmp, y, SR)
        slug = re.sub(r"[^a-z0-9]+", "-", row['darija'].lower().replace("ar:", "letter-")).strip("-")[:40] or "x"
        voice = {"M": "male", "N": "neutral", "F": "female"}[row['no'][0]]
        os.makedirs(f"{OUT}/{voice}", exist_ok=True)
        mp3 = f"{OUT}/{voice}/{row['no']}_{slug}.mp3"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-ac", "1", "-ar", "32000", "-b:a", "64k", mp3], check=True)
        manifest.append({"no": row['no'], "key": row['app_key'], "voice": voice, "file": mp3, "dur": round(len(y) / SR, 2), "darija": row['darija']})
    print(f, len(exp), "clips")
json.dump(manifest, open("manifest.json" if not only else "manifest_part.json", "w"), ensure_ascii=False, indent=0)

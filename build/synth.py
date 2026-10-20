# Speak every item with the Miro voice, give the vendor and dialog partner their own pitch,
# trim, level and encode to small MP3s, then write audio.json {key: base64}.
import json, os, sys, subprocess, base64, tempfile, time
import numpy as np, soundfile as sf, sherpa_onnx
sys.path.insert(0, os.path.dirname(__file__))
from translit import translit
B = "/tmp/tts/"; D = "vits-piper-ar_JO-SA_miro_V2-high"
HERE = os.path.dirname(os.path.abspath(__file__))
items = json.load(open(os.path.join(HERE, "items.json")))
cache_dir = os.path.join(HERE, "cache"); os.makedirs(cache_dir, exist_ok=True)
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{B}{D}/ar_JO-SA_miro_V2-high.onnx", tokens=f"{B}{D}/tokens.txt", data_dir=f"{B}{D}/espeak-ng-data"), num_threads=2)))
# voice: n = narrator, a = dialog partner (lower), v = souk vendor (lower, a bit quicker)
PITCH = {"n": 1.0, "a": 0.88, "v": 0.82}
SPEED = {"n": 0.88, "a": 0.92, "v": 0.95}
out, t0 = {}, time.time()
import hashlib
for k, it in enumerate(items):
    ar = translit(it["text"])
    h = hashlib.sha1(("b32|" + it["voice"] + "|" + ar).encode()).hexdigest()[:16]
    mp3 = os.path.join(cache_dir, h + ".mp3")
    if not os.path.exists(mp3):
        a = tts.generate(ar, sid=0, speed=SPEED[it["voice"]])
        x = np.array(a.samples, dtype=np.float32); sr = a.sample_rate
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f: wav = f.name
        sf.write(wav, x, sr)
        p = PITCH[it["voice"]]
        af = []
        if p != 1.0: af.append(f"asetrate={int(sr*p)},aresample={sr},atempo={1/p:.4f}")
        af.append("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03")
        af.append("areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse")
        af.append("highpass=f=70,loudnorm=I=-17:TP=-1.5:LRA=7")
        af.append("apad=pad_dur=0.06")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", wav, "-af", ",".join(af), "-ac", "1", "-ar", "22050", "-c:a", "libmp3lame", "-b:a", "32k", mp3], check=True)
        os.unlink(wav)
    out[it["key"]] = base64.b64encode(open(mp3, "rb").read()).decode()
    if k % 40 == 0: print(f"{k}/{len(items)}  {time.time()-t0:.0f}s  {it['text']} -> {ar}", flush=True)
json.dump(out, open(os.path.join(HERE, "audio.json"), "w"), separators=(",", ":"))
tot = sum(len(v) for v in out.values())
print(f"done {len(out)} clips, {tot/1e6:.2f} MB base64, {time.time()-t0:.0f}s")

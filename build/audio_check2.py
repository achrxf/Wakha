import json, base64, subprocess, tempfile, os, random, re, unicodedata, difflib, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
from translit import translit
H = os.path.dirname(os.path.abspath(__file__))
aud = json.load(open(os.path.join(H, "audio.json")))
items = {i["key"]: i for i in json.load(open(os.path.join(H, "items.json")))}
durs = {}
for k, b in aud.items():
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as f: f.write(base64.b64decode(b)); fn = f.name
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", fn], capture_output=True, text=True).stdout or 0)
    durs[k] = (d, fn)
ds = np.array([d for d, _ in durs.values()])
print(f"clips {len(ds)}  min {ds.min():.2f}s  median {np.median(ds):.2f}s  max {ds.max():.2f}s  total {ds.sum()/60:.1f} min")
short = [(k, round(d, 2)) for k, (d, _) in durs.items() if d < 0.35]
print("suspiciously short:", short[:20])
missing = [k for k in items if k not in aud]
print("items without audio:", missing[:10])
import sherpa_onnx
B = "/tmp/tts/"
asr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=B+"sherpa-onnx-whisper-small/small-encoder.int8.onnx", decoder=B+"sherpa-onnx-whisper-small/small-decoder.int8.onnx", tokens=B+"sherpa-onnx-whisper-small/small-tokens.txt", language="ar", task="transcribe", num_threads=2)
strip = lambda s: re.sub(r"[ً-ْٰ؟?،.!:\s\d]", "", unicodedata.normalize("NFKC", s)).replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ى","ي").replace("ة","ه")
random.seed(7)
FOOT = os.environ.get("ONLY")
keys = [k for k in aud if items.get(k, {}).get("voice") in ("n", "a", "v") and (len(items[k]["text"]) > 3 if FOOT else len(items[k]["text"]) > 8)]
if FOOT: keys = [k for k in keys if re.search(FOOT, items[k]["text"], re.I)]
sample = keys if FOOT else random.sample(keys, 40)
errs = []
for k in sample:
    d, fn = durs[k]
    wav = fn + ".wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fn, "-ar", "16000", "-ac", "1", wav], check=True)
    import soundfile as sf
    x, sr = sf.read(wav, dtype="float32")
    x = np.concatenate([np.zeros(4000, np.float32), x, np.zeros(4000, np.float32)])
    s = asr.create_stream(); s.accept_waveform(16000, x); asr.decode_stream(s)
    heard = s.result.text.strip(); target = translit(items[k]["text"])
    e = 1 - difflib.SequenceMatcher(None, strip(target), strip(heard)).ratio(); errs.append(e)
    print(f"{e:.2f}  {items[k]['voice']}  {items[k]['text'][:38]:38s} | heard: {heard[:40]}")
print(f"\nmean character error on phrases: {np.mean(errs):.2f}   share under 0.35: {np.mean(np.array(errs) < 0.35):.0%}")

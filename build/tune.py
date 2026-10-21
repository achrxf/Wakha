# Try alternative Arabic spellings for weak clips and keep the one Whisper understands best.
import os, re, unicodedata, difflib, tempfile, subprocess, sys
import numpy as np, soundfile as sf, sherpa_onnx
B = "/tmp/tts/"; D = "vits-piper-ar_JO-SA_miro_V2-high"
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{B}{D}/ar_JO-SA_miro_V2-high.onnx", tokens=f"{B}{D}/tokens.txt", data_dir=f"{B}{D}/espeak-ng-data"), num_threads=2)))
asr = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=B+"sherpa-onnx-whisper-small/small-encoder.int8.onnx", decoder=B+"sherpa-onnx-whisper-small/small-decoder.int8.onnx", tokens=B+"sherpa-onnx-whisper-small/small-tokens.txt", language="ar", task="transcribe", num_threads=2)
strip = lambda s: re.sub(r"[ً-ْٰ؟?،.!:\s\d]", "", unicodedata.normalize("NFKC", s)).replace("أ","ا").replace("إ","ا").replace("آ","ا").replace("ى","ي").replace("ة","ه")
def hear(ar):
    a = tts.generate(ar, sid=0, speed=0.88); x = np.array(a.samples, dtype=np.float32)
    import scipy.signal as ss
    x16 = ss.resample_poly(x, 16000, a.sample_rate).astype(np.float32)
    x16 = np.concatenate([np.zeros(4000, np.float32), x16, np.zeros(4000, np.float32)])
    s = asr.create_stream(); s.accept_waveform(16000, x16); asr.decode_stream(s); return s.result.text.strip()
C = {
 "lmatch": ["الْمَاتْش", "الماتش", "لْمَاتْشْ", "الْمَاتْشْ", "ماتْش"],
 "marka": ["مَارْكَا", "مَرْكَا", "مارْكى", "مَارْكَى", "ماركا"],
 "tiran": ["تِيرَان", "تيرانْ", "تِيرَانْ", "التِّيرَان", "تيران"],
 "lkoura": ["الْكُورَة", "الكورة", "لْكُورَة", "الْكُورَا", "الكُورة"],
 "ljmhour": ["الْجِمْهُور", "الْجُمْهُور", "الجمهور", "الْجُمْهُورْ"],
 "kanbghi": ["كَانْبْغِي", "كَنْبْغِي", "كنبغي", "كَنْبْغِيّ"],
 "sir3": ["سِير! سِير! سِير!", "سِيرْ، سِيرْ، سِيرْ!", "سير. سير. سير!", "سِيرْ سِيرْ سِيرْ"],
 "sir": ["سِير!", "سِيرْ!", "سير"],
 "dirniya": ["دِير النِّيَّة", "دِيرْ النِّيَّة", "دير النية", "دِيرِ النِّيَّة"],
}
for k, cands in C.items():
    res = []
    for ar in cands:
        h = hear(ar); e = 1 - difflib.SequenceMatcher(None, strip(ar), strip(h)).ratio(); res.append((e, ar, h))
    res.sort()
    print(k, " | ".join(f"{e:.2f} {ar}→{h}" for e, ar, h in res))

# Wakha audio

Achraf's own recordings of every word, sentence and story line in the app.

- `raw/`: the original batch recordings, untouched (M = male, N = neutral, F = female; the numbers are the lines from the recording script, `build/recording_map.csv`).
- `male/`, `neutral/`, `female/`: one cleaned MP3 per line (mono, 32 kHz, 64 kbps), named `<line>_<words>.mp3`. These are what the app plays.
- `index.csv`: which file is which line, with its app key and length.
- `tools/`: the scripts that made them.

## What was done to each clip

1. **Split**: each batch was cut at the pauses, listening only to the speech band so lip and mic clicks never start a clip, then matched to the script lines by length (a line can span a pause inside the phrase).
2. **Cleaned**: background hiss removed using the room noise from that batch's own pauses, a gate keeps the gaps silent, low rumble cut, a little boxiness taken out, clarity and air lifted, sharp S sounds softened, gentle compression, every clip levelled to the same loudness (-17 LUFS) with peaks under -1 dB.
3. **Female voice**: formants raised about 13% and pitch about 3 semitones more (median 170 Hz -> 225 Hz). **Speed is never changed**: the shift keeps each clip's exact length.

Not used: M067 and M068. That part of the batch holds two short phrases where the script expects two long sentences, so the app keeps its old voice for those two lines until they are re-recorded.

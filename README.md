# Wakha — learn Moroccan Darija

**Wakha** (واخا, "okay / deal" in Darija) is a small, fun app for learning Moroccan Arabic, the Darija people actually speak in Casablanca, Fes and Marrakech, not textbook Arabic.

It is one HTML file that works offline. Open `dist/wakha.html` in any modern browser, on a phone or a computer. There is nothing to install and no account, and progress is saved in the browser.

Every Darija word, phrase, dialog line and story in the app has its own recorded audio clip. The clips are built into the file.

---

## What's inside

| Tab | What it does |
|---|---|
| **Today** | Your daily home screen: your tea tray, the next lesson, the **word of the day** (a 30-second mini lesson), the **daily sprint** (a timed run against your own best score) and the reviews that are due. |
| **Journey** | The main path, a trip through **20 Moroccan cities**, from Tangier to Dakhla, with **110 stops** (71 lessons, 19 stories, 19 reviews and a souk boss in Marrakech). Each city has its own colours, opening scene and a badge of Mchicha in a keyhole arch with something from that city. |
| **Feed** | A vertical swipe feed of short cards: reels with real facts about Morocco, proverbs, situations ("what do you say when…"), sentence builders, mini quizzes. It is a side dish to the Journey. Each card rests for a while after you see it (up to three days), so the feed doesn't repeat. |
| **Guide** | The reference corner you can always come back to: the sounds Darija writes with numbers (**3, 7, 9, 2, gh, kh**…) with audio, plus 13 short grammar and usage rules. |
| **Me / Kenz** | Your collection ("kenz" = treasure): every word you've learned, rare words you unlocked, stats, settings, dark mode and language. |

### Lessons and exercises
- **Listen and pick**, **meaning match**, **build the sentence**, **fill the gap** and **"what would you say?"** situations.
- **Tap the words you hear:** build a sentence from audio only.
- **Say it out loud:** hear the clip, record yourself, play both back and rate yourself. Recordings never leave the phone; without a microphone it falls back to "I said it".
- **Stories:** short dialogs (19 of them, with a different voice for each speaker), followed by comprehension questions.
- **Souk haggle:** bargain with a vendor in Darija. Push too hard and he walks away; play it well and you get the deal.
- **Spaced review:** words you get wrong come back sooner; words you know come back later.

### Personality
- **Mchicha**, the app's cat mascot (*mchicha* means "kitty" in Darija), is a sand-coloured tabby in a white **tagiya**. She reacts to right and wrong answers, blinks and wags her tail.
- **The tea tray** instead of a streak: seven small tea glasses for the last seven days, today's filling as you earn XP, and the number of days of atay in a row.
- A faint **zellige** (khatam star) pattern on the city cards.
- Motion throughout: page transitions, glazing animations, celebrations on milestones, and haptics where the phone supports it.
- **Dark mode**: follows the system setting, or can be set by hand.

### Six interface languages
**English, Français, Español, Deutsch, Nederlands, Italiano.** The language is picked automatically from the browser and can be changed in settings. The Darija itself stays Darija; only the explanations and translations change.

### ⚽ Football stop
Rabat and Agadir include **"Dima Maghrib"**, a football unit made for Moroccans abroad (UK, France, NL, Spain…) and for football fans:
- 15 match words (*gool!*, *bennalti*, *l7akam* the referee, *tiran* the pitch, *rbe7na!* we won…)
- a dialog story set at a match
- stadium situations and sentence builders
- reels about the Atlas Lions (2022 World Cup semi-final, AFCON 2025 in Morocco, the 2030 World Cup)

### Content in numbers
236 words · 20 cities · 110 path stops · 19 stories · 40 situations · 33 sentence builders · 18 reels · 14 proverbs · 10 sounds · 13 rules · 5 haggles · 774 audio clips.

---

## Repository layout

```
src/            the app source
  template.html   page shell
  styles.css      all styling (light and dark)
  content_v1.js   words, sounds, rules, proverbs
  content_v2.js   units, Journey path, stories, situations, reels, haggles
  medallion.js    the zellige medallion (SVG and 3D)
  app1.js         core: state, storage, voice/audio, i18n, helpers
  app2.js         Journey, lessons and exercises
  app3.js         Today, Feed, Guide, Kenz, Mchicha, motion
build/          build and audio scripts, translations
  build.js        bundles everything into dist/wakha.html and dist/preview.html
  load.js         loads the content files for the scripts
  extract.js      lists every Darija line that needs audio  → items.json
  translit.py     Darija (Latin "3/7/9" spelling) → Arabic script for the voice model
  synth.py        speaks items.json with a VITS/Piper voice (sherpa-onnx) → audio.json
  audio_check*.py transcribes the clips back with Whisper to catch bad ones
  extract_i18n.js / compile_tr.js / tr/*.tsv / i18n_*.json   the translation pipeline
dist/           ready-to-open builds (wakha.html, preview.html)
tests/          Playwright tests
media/          demo video, 3D clip, screenshots of all six languages
```

## Building

You need Node 18 or later.

```bash
node build/build.js          # → dist/wakha.html (the app) and dist/preview.html
```

### Regenerating the audio (optional)
`build/audio.json` is already in the repo, so this is only needed after you change Darija text.

```bash
node build/extract.js        # writes build/items.json
pip install sherpa-onnx soundfile numpy
# download the voice "vits-piper-ar_JO-SA_miro_V2-high" from the sherpa-onnx TTS models release into /tmp/tts/
python build/synth.py        # writes build/audio.json (uses ffmpeg; clips are cached in build/cache/)
python build/audio_check.py  # optional: checks the clips with Whisper
node build/build.js
```

Each clip is a small MP3 stored as base64 inside the HTML. There are three voices: the narrator, a dialog partner and the souk vendor (pitched lower).

### How translations work
1. All interface text is written in English (with a French version) inside `X("English", "Français")` calls.
2. `node build/extract_i18n.js` collects every string into `i18n_src.json`; numbers become `{n}`.
3. Spanish, German, Dutch and Italian live in `build/tr/*.tsv`, one row per string.
4. `node build/compile_tr.js` turns them into `i18n_store.json`, which `build.js` puts into the app.
5. `node build/test_static.js` checks that every string has all six languages.

## Tests

```bash
npm install                  # playwright, fonts and three.js used by the tests
npx playwright install chromium
node tests/func.js           # 22 end-to-end checks: onboarding, lessons, stories, haggle, review, streak…
node tests/func4.js          # Today, word of the day, sprint, Journey pages
node tests/func_i18n.js      # every screen in all six languages: no missing or overflowing text
node tests/audio2.js         # audio plays, including when data: audio is blocked
node tests/layout.js         # small and large phones, no overflow
```

To test another build, set `APP=/path/to/wakha.html`. Set `WITH3D=1` to include the 3D medallion, which is slow in headless browsers.

## Version history

The commits follow how the app grew. Each one is tagged and includes its own built `dist/wakha.html`, so you can open any version.

| Tag | What changed |
|---|---|
| **v1** | First version: a German-style feed app made for Darija. Full-screen swipe feed of zellige-tiled cards, glass header, four tabs, browser text-to-speech. |
| **v2** | More premium look, a **levels path** next to the feed (the feed becomes secondary), **real recorded audio** for every Darija word, phrase and story, the **Guide** for sounds like 7 and 9, and a less repetitive feed. |
| **v3** | Learn tab redesigned so it doesn't look like Duolingo: a **Journey through Moroccan cities**, each a zellige medallion that is glazed ring by ring. New typography (Amiri, Bodoni Moda, Reem Kufi). *This is a reconstructed snapshot of that stage.* |
| **v4** | Built for daily use: a **Today** home, word of the day, daily sprint, streak shields, a cleaner and less crowded layout, and more content per city. |
| **v5** | Motion and **3D** (three.js medallion), **Mchicha** the cat with a tagiya, and full **dark mode**. |
| **v6** | **Six languages** (EN/FR/ES/DE/NL/IT), the **⚽ Dima Maghrib football stop**, large automated test suites, and an **audio fix**: if a browser or embedded preview blocks `data:` audio, the app now plays the clips through Web Audio instead of staying silent. |
| **v7** | **New design system** (light and dark), board layouts for Today, Journey and lessons, premium motion, **Mchicha redrawn** with **20 city badges**, **10 new cities** with stories (100+ stops), **Say it out loud** and **Tap the words you hear** exercises, a feed that rests cards so it doesn't repeat, and the **tea tray** in place of a streak. |

## Known limitations
- The voice is a computer voice (an Arabic TTS model reading Darija through transliteration). It sounds clear but not native. Recordings by a real Moroccan speaker would be the biggest upgrade.
- The ES, DE, NL and IT translations have not yet been reviewed by native speakers.
- **iPhone:** if the ringer/silent switch is on silent, Safari mutes web audio. Turn silent mode off to hear the clips.
- Progress is stored in the browser (localStorage), so clearing site data resets it.

---

Made with ❤️ for everyone learning Darija: Moroccans abroad, their friends, and anyone heading to the souk.

// For the recording script: every clip with its English meaning, where it is used, and who says it.
const C = require("./load.js")();
const items = require("./items.json");
const meta = new Map();
const put = (text, voice, info) => { const k = (voice === "n" ? "" : voice + "|") + C.audioKey(String(text).trim()); if (!meta.has(k)) meta.set(k, info); };
const GENDER = { Waiter:"m", Driver:"m", Yasmine:"f", Adam:"m", Mom:"f", Shopkeeper:"m", "Passer-by":"m", Guest:"m", Host:"m", Friend:"m", Karim:"m", Salma:"f", Fisherman:"m", Grandma:"f", Guide:"m", Vendor:"m", You:"m" };
for (const id of Object.keys(C.W)) { const w = C.W[id]; put(w.d, "n", { kind:"word", en:w.en, ar:w.ar, order:1 }); if (w.ex) put(w.ex[0], "n", { kind:"example", en:w.ex[1], order:2 }); }
for (const d of C.DIALOGS) d.lines.forEach((l, i) => { const who = d.who[l[0] === "A" ? 0 : 1][0]; put(l[1], l[0] === "A" ? "a" : "n", { kind:"story", story:d.t[0], who, g:GENDER[who] || "m", en:l[2], order:3, line:i }); });
for (const s of C.SITS) s[4].forEach((o) => put(o[0], "n", { kind:"situation", en:o[1], order:4 }));
for (const b of C.BUILDS) put(C.buildSay(b[3]), "n", { kind:"sentence", en:b[1], order:4 });
for (const p of C.PROVERBS) put(p[1], "n", { kind:"proverb", en:p[2], order:5 });
for (const u of C.UNITS) put(u.d, "n", { kind:"title", en:u.en, order:5 });
for (const t of [...C.PRAISE, ...C.PRAISE2, ...C.COMFORT]) put(t[0], "n", { kind:"mchicha", en:t[1], order:6 });
for (const s of C.SOUNDS) { put(s.say, "n", { kind:"guide", en:"", order:6 }); s.ex.forEach((e) => put(e, "n", { kind:"guide", en:"", order:6 })); }
for (const r of C.RULES) r.ex.forEach((e) => put(e[0], "n", { kind:"guide", en:e[1] || "", order:6 }));
for (const r of C.REELS) r[3].forEach((sl) => sl[1] && put(sl[1], "n", { kind:"reel", en:sl[2] || "", order:6 }));
const out = items.map((it) => Object.assign({ key:it.key, text:it.text, voice:it.voice }, meta.get(it.key) || { kind:it.voice === "v" ? "souk" : "other", en:"", order:it.voice === "v" ? 3 : 7 }));
process.stdout.write(JSON.stringify(out));

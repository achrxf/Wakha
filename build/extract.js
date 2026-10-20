// Collect every Darija string the app can show, with the voice that should say it.
const fs = require("fs");
const C = require("./load.js")();
const items = new Map();
const add = (text, voice = "n") => {
  if (!text) return;
  text = String(text).trim(); if (!text) return;
  const key = (voice === "n" ? "" : voice + "|") + C.audioKey(text);
  if (!items.has(key)) items.set(key, { key, text, voice });
};
for (const id of Object.keys(C.W)) { const w = C.W[id]; add(w.d); if (w.ex) add(w.ex[0]); }
for (const s of C.SITS) s[4].forEach((o) => add(o[0]));
for (const b of C.BUILDS) add(C.buildSay(b[3]));
for (const r of C.REELS) r[3].forEach((sl) => { if (sl[1] && !C.NO_SAY.has(sl[1])) add(sl[1]); });
for (const d of C.DIALOGS) d.lines.forEach((l) => add(l[1], l[0] === "A" ? "a" : "n"));
for (const p of C.PROVERBS) add(p[1]);
for (const s of C.SOUNDS) { add(s.say); s.ex.forEach((e) => add(e)); }
for (const r of C.RULES) r.ex.forEach((e) => add(e[0]));
for (const u of C.UNITS) add(u.d);
for (const t of [...C.PRAISE, ...C.PRAISE2, ...C.COMFORT]) add(t[0]);
for (const l of C.LEVELS) if (["Kanfhem chwiya", "Mn l7ouma", "9afez"].includes(l[1])) add(l[1]);
add(C.HAGGLE_OPEN[0], "v"); add("Salam!"); add("Sandou9!"); add("Atay wajed!");
// every price the vendor can reach
for (const it of C.HAGGLE) {
  const { offer, rounds } = C.haggleRounds(it);
  const walk = (round, price) => {
    if (round >= rounds.length) return;
    add(rounds[round].v(price)[0], "v");
    for (const o of rounds[round].o) {
      add(o.d[0]);
      const np = C.hagglePrice(price, offer, o);
      add(o.r(np)[0], "v");
      if (!(o.accept || o.counter || o.final || round >= 2)) walk(round + 1, np);
    }
  };
  walk(0, it.start);
}
const arr = [...items.values()];
fs.writeFileSync(__dirname + "/items.json", JSON.stringify(arr, null, 0));
const by = arr.reduce((m, x) => ((m[x.voice] = (m[x.voice] || 0) + 1), m), {});
console.log(arr.length, "clips", JSON.stringify(by));

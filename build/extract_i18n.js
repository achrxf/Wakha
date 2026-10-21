// Every English string the app can show, with its French twin, so the other languages can be written and checked.
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = ["content_v1.js", "content_v2.js"].map((f) => fs.readFileSync(path.join(__dirname, "../src", f), "utf8")).join("\n");
const ctx = { module:{ exports:{} }, console };
vm.createContext(ctx);
vm.runInContext(src.replace('if (typeof module !== "undefined") module.exports', "module.exports") + "\nObject.assign(module.exports,{UI,CAT,RAR,LEVEL_SUB,PRAISE,COMFORT,BUILDS_MORE});", ctx);
const C = ctx.module.exports;
const out = new Map();
const add = (en, fr, ctxt) => {
  if (typeof en !== "string" || !en.trim()) return;
  if (fr !== undefined && en === fr) return;            // Darija or a name: same in every language
  if (!/[A-Za-z]/.test(en)) return;
  if (!out.has(en)) out.set(en, { fr, c:ctxt });
};
const NUM = 777;   // number sentinel for templated strings
const tpl = (s) => s.replace(new RegExp(String(NUM), "g"), "{n}");
for (const [k, v] of Object.entries(C.UI.en)) {
  if (Array.isArray(v)) v.forEach((x, i) => add(x, C.UI.fr[k] && C.UI.fr[k][i], "ui"));
  else add(v, C.UI.fr[k], "ui");
}
for (const v of Object.values(C.CAT)) add(v[0], v[1], "category");
for (const v of Object.values(C.RAR)) add(v[0], v[1], "rarity");
for (const wd of Object.values(C.W)) {
  add(wd.en, wd.fr, "word meaning: " + wd.d);
  if (wd.ex) add(wd.ex[1], wd.ex[2], "example: " + wd.ex[0]);
  if (wd.note) add(wd.note[0], wd.note[1], "note on " + wd.d);
  if (wd.lit) add(wd.lit[0], wd.lit[1], "literal meaning of " + wd.d);
}
for (const s of C.SITS) { add(s[2][0], s[2][1], "situation"); s[4].forEach((o) => add(o[1], o[2], "answer: " + o[0])); }
for (const b of C.BUILDS) add(b[1], b[2], "sentence to build");
const NO_SAY = C.NO_SAY || new Set();
for (const r of C.REELS) { add(r[2][0], r[2][1], "reel title"); r[3].forEach((s) => { add(s[2], s[3], "reel text"); if (s[1] && NO_SAY.has(s[1])) add(s[1], undefined, "reel big text"); }); }
for (const d of C.DIALOGS) { add(d.t[0], d.t[1], "conversation title"); d.who.forEach((w) => add(w[0], w[1], "speaker")); d.lines.forEach((l) => add(l[2], l[3], "line: " + l[1])); }
for (const p of C.PROVERBS) { add(p[2], p[3], "proverb, literally: " + p[1]); add(p[4], p[5], "proverb meaning"); }
for (const s of C.SOUNDS) { add(s.t[0], s.t[1], "sound name"); add(s.how[0], s.how[1], "how to say the sound"); add(s.like[0], s.like[1], "sound comparison (adapt to the learner’s language)"); }
for (const r of C.RULES) { add(r.t[0], r.t[1], "grammar rule title"); add(r.body[0], r.body[1], "grammar rule"); r.ex.forEach((x) => add(x[1], x[2], "example: " + x[0])); }
for (const it of C.HAGGLE) {
  add(it.en, it.fr, "souk item");
  const R = C.haggleRounds(it);
  for (const rd of R.rounds) {
    const v = rd.v(NUM); add(tpl(v[1]), tpl(v[2]), "vendor line");
    for (const o of rd.o) { add(tpl(o.d[1].replace(String(R.offer), String(NUM))), tpl(o.d[2].replace(String(R.offer), String(NUM))), "your reply: " + o.d[0]); const r = o.r(NUM); add(tpl(r[1]), tpl(r[2]), "vendor reply"); }
  }
}
add(C.HAGGLE_OPEN[1], C.HAGGLE_OPEN[2], "vendor opener");
for (const p of C.PRAISE.concat(C.PRAISE2 || [], C.COMFORT)) add(p[1], p[2], "feedback after an answer: " + p[0]);
for (const l of C.LEVELS) add(l[1], l[2], "level title");
for (const v of Object.values(C.LEVEL_SUB)) add(v[0], v[1], "level subtitle");
for (const c of C.CITIES) { add(c.en, c.fr, "city"); add(c.scene[0], c.scene[1], "city intro"); }
for (const [id, v] of Object.entries(C.LESSON_SCENES)) add(v[0], v[1], "lesson scene " + id);
for (const u of C.UNITS) add(u.en, u.fr, "unit topic: " + u.d);
// strings that live in the app code
add("Darija, one lesson at a time", "La darija, une leçon à la fois", "share image tagline");
const list = [...out.entries()].map(([en, v]) => ({ en, fr:v.fr, c:v.c }));
fs.writeFileSync(path.join(__dirname, "i18n_src.json"), JSON.stringify(list, null, 1));
console.log(list.length, "strings", list.reduce((a, b) => a + b.en.length, 0), "chars");

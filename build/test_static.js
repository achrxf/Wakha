// Static checks on translations and Darija content. Prints FAIL lines and a summary.
const fs = require("fs"), path = require("path"), vm = require("vm");
const src = ["content_v1.js", "content_v2.js"].map((f) => fs.readFileSync(path.join(__dirname, "../src", f), "utf8")).join("\n");
const ctx = { module:{ exports:{} }, console };
vm.createContext(ctx);
vm.runInContext(src.replace('if (typeof module !== "undefined") module.exports', "module.exports") + "\nObject.assign(module.exports,{UI,CAT,RAR,LEVEL_SUB,PRAISE,COMFORT});", ctx);
const C = ctx.module.exports;
const ST = require("./i18n_store.json"), SRC = require("./i18n_src.json");
const LANGS = ["es", "de", "nl", "it"];
const fails = [], warns = [];
const fail = (m) => fails.push(m), warn = (m) => warns.push(m);
const tr = (l, en, fr) => (l === "en" ? en : l === "fr" ? fr : ST[l][en] ?? null);
// 1 completeness + 2 placeholders + 3 Spanish question marks + 4 length
const ph = (s) => (s.match(/\{[a-z]+\}/g) || []).sort().join(",");
for (const l of LANGS) {
  let same = 0, long = 0;
  for (const { en } of SRC) {
    const v = ST[l][en];
    if (v == null || !String(v).trim()) { fail(`[${l}] missing: ${en}`); continue; }
    if (ph(v) !== ph(en)) fail(`[${l}] placeholders differ: "${en}" -> "${v}"`);
    if (v === en && en.length > 6 && /[a-z]{4}/.test(en)) same++;
    if (v.length > en.length * 1.9 && en.length > 12) { long++; warn(`[${l}] long (${v.length} vs ${en.length}): ${v}`); }
    if (l === "es" && /\?/.test(v) && !/¿/.test(v) && /^[A-ZÁÉÍÓÚ¿a-z]/.test(v) && !/[A-Z]?[a-z]*[0-9]/.test(v.split("?")[0].split(" ").pop() || "") ) warn(`[es] question without ¿: ${v}`);
    if (/[.!?…]$/.test(en) !== /[.!?…»“”"]$/.test(v.trim())) warn(`[${l}] end punctuation differs: "${en}" -> "${v}"`);
  }
  console.log(`${l}: ${SRC.length} strings, ${same} left in English, ${long} much longer`);
}
// 5 quiz distractors: two different words must not translate to the same meaning (unless they are listed as synonyms)
for (const l of ["en", "fr"].concat(LANGS)) {
  const seen = new Map();
  for (const id of C.CORE) {
    const wd = C.W[id], m = String(tr(l, wd.en, wd.fr) || "").toLowerCase().replace(/[!?¿¡.…]/g, "").trim();
    if (!m) continue;
    if (seen.has(m)) { const o = C.W[seen.get(m)]; if (!(o.grp && o.grp === wd.grp)) fail(`[${l}] two words share the meaning "${m}": ${o.d} / ${wd.d}`); }
    else seen.set(m, id);
  }
  // situations: the four answers must read differently
  for (const s of C.SITS) { const ms = s[4].map((o) => String(tr(l, o[1], o[2])).toLowerCase()); if (new Set(ms).size !== ms.length) fail(`[${l}] situation ${s[0]} has duplicate answers: ${ms.join(" | ")}`); }
  // stories: every line must translate differently (they are the answer options)
  for (const d of C.DIALOGS) { const ms = d.lines.map((x) => String(tr(l, x[2], x[3])).toLowerCase()); if (new Set(ms).size !== ms.length) fail(`[${l}] story ${d.id} has duplicate line meanings`); }
}
// 6 Darija data: Arabic field in Arabic script, Latin field free of Arabic, unique Latin spellings
const AR = /^[؀-ۿ\s؟!،.…]+$/;
const dupD = new Map();
for (const wd of Object.values(C.W)) {
  if (!wd.ar || !AR.test(wd.ar)) fail(`Arabic spelling missing or not Arabic for ${wd.d}: ${wd.ar}`);
  if (/[؀-ۿ]/.test(wd.d)) fail(`Latin Darija contains Arabic: ${wd.d}`);
  const k = wd.d.toLowerCase().replace(/[!?….]/g, "");
  if (dupD.has(k)) fail(`duplicate Darija word: ${wd.d} (${dupD.get(k)} / ${wd.id})`); else dupD.set(k, wd.id);
  if (wd.ex && !/[A-Za-z0-9]/.test(wd.ex[0])) fail(`example for ${wd.d} has no Latin Darija`);
}
// 7 every unit word exists, every lesson has a scene line
for (const u of C.UNITS) for (const id of u.words) if (!C.W[id]) fail(`unit ${u.id} uses missing word ${id}`);
for (const n of C.PATH) if (n.kind !== "review" && n.kind !== "boss" && !C.LESSON_SCENES[n.id]) warn(`no scene line for ${n.id}`);
if (C.CITIES.length !== C.UNITS.length) fail(`cities (${C.CITIES.length}) and units (${C.UNITS.length}) differ`);
console.log(`\n${fails.length} failures, ${warns.length} warnings`);
fails.forEach((f) => console.log("FAIL " + f));
if (process.argv.includes("-w")) warns.forEach((w) => console.log("WARN " + w));

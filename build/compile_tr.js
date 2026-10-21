// Fold translated chunk files (id<TAB>es<TAB>de<TAB>nl<TAB>it) into an English-keyed store.
const fs = require("fs"), path = require("path");
const src = require("./i18n_src.json");
const storeP = path.join(__dirname, "i18n_store.json");
const store = fs.existsSync(storeP) ? JSON.parse(fs.readFileSync(storeP, "utf8")) : { es:{}, de:{}, nl:{}, it:{} };
const files = process.argv.slice(2);
let n = 0;
for (const f of files) {
  for (const line of fs.readFileSync(f, "utf8").split("\n")) {
    if (!line.trim()) continue;
    const parts = line.split("\t");
    if (parts.length !== 5) { console.error("bad line", f, line.slice(0, 80)); process.exitCode = 1; continue; }
    const id = +parts[0], s = src[id];
    if (!s) { console.error("no source for id", id); process.exitCode = 1; continue; }
    ["es", "de", "nl", "it"].forEach((l, i) => (store[l][s.en] = parts[i + 1].trim()));
    n++;
  }
}
fs.writeFileSync(storeP, JSON.stringify(store, null, 1));
console.log("compiled", n, "lines; store has", Object.keys(store.es).length, "of", src.length);

// Assemble dist/wakha.html (artifact body) and dist/preview.html (standalone page).
const fs = require("fs"), path = require("path");
const R = (f) => fs.readFileSync(path.join(__dirname, "..", f), "utf8");
const audio = fs.existsSync(path.join(__dirname, "audio.json")) ? fs.readFileSync(path.join(__dirname, "audio.json"), "utf8") : "{}";
const content = R("src/content_v1.js") + "\n" + R("src/content_v2.js").replace(/if \(typeof module !== "undefined"\)[^\n]*\n?/, "");
let html = R("src/template.html");
const put = (marker, value) => { const i = html.indexOf(marker); if (i < 0) throw new Error("missing " + marker); html = html.slice(0, i) + value + html.slice(i + marker.length); };
put("/*CSS*/", R("src/styles.css"));
put("/*AUDIO*/", audio.replace(/</g, "\\u003c"));
put("/*CONTENT*/", content);
const exAr = fs.existsSync(path.join(__dirname, "ex_ar.json")) ? R("build/ex_ar.json") : "{}";
put("/*APP*/", "const EXAR = " + JSON.stringify(JSON.parse(exAr)) + ";\nconst I18N = " + JSON.stringify(Object.assign(JSON.parse(R("build/i18n_store.json")), { fr:{ "AFCON 2025":"CAN 2025", "…or 5 hours":"…ou 5 heures" } })) + ";\n" + R("src/medallion.js") + "\n" + R("src/app1.js") + "\n" + R("src/app2.js") + "\n" + R("src/app3.js") + "\n" + R("src/plan.js"));
fs.mkdirSync(path.join(__dirname, "../dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "../dist/wakha.html"), html);
const RESET = ":root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}";
fs.writeFileSync(path.join(__dirname, "../dist/preview.html"), `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${html}</body></html>`);
// syntax check the inline script
const js = html.slice(html.indexOf('"use strict";'), html.lastIndexOf("})();"));
fs.writeFileSync("/tmp/wakha_check.js", "(() => {" + js + "})();");
console.log("built", (Buffer.byteLength(html) / 1e6).toFixed(2), "MB");

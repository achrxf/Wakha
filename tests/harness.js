// Test harness: wraps the artifact in the publish skeleton, serves local copies of the
// Google Fonts it requests, and opens it in a phone-sized Chromium page.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const FV = path.join(ROOT, "node_modules", "@fontsource-variable");
const APP = process.env.APP || path.join(ROOT, "dist", "wakha.html");
const FONTS = path.join(ROOT, "node_modules", "@fontsource");
const RESET = ":root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}";

function skeleton() {
  const body = fs.readFileSync(APP, "utf8");
  return `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${body}</body></html>`;
}
function fontCSS() {
  let css = "";
  for (const w of [400, 500, 600, 700]) css += fs.readFileSync(path.join(FONTS, "readex-pro", `${w}.css`), "utf8").replace(/url\(\.\/files\//g, "url(https://fonts.gstatic.com/__local/readex-pro/");
  for (const w of [400, 700]) css += fs.readFileSync(path.join(FONTS, "amiri", `${w}.css`), "utf8").replace(/url\(\.\/files\//g, "url(https://fonts.gstatic.com/__local/amiri/");
  for (const f of ["opsz.css", "opsz-italic.css"]) css += fs.readFileSync(path.join(FV, "bodoni-moda", f), "utf8").replace(/Bodoni Moda Variable/g, "Bodoni Moda").replace(/url\(\.\/files\//g, "url(https://fonts.gstatic.com/__localv/bodoni-moda/");
  for (const w of [500, 600, 700]) css += fs.readFileSync(path.join(FONTS, "reem-kufi", `${w}.css`), "utf8").replace(/url\(\.\/files\//g, "url(https://fonts.gstatic.com/__local/reem-kufi/");
  return css;
}
async function openApp(opts = {}) {
  const {
    width = 390, height = 844, scheme = "dark", dpr = 2, browser: existing, storage = null,
    locale = "en-US", csp = null, initScript = null, video = null, mobile = true, reducedMotion = "no-preference", time = null,
  } = opts;
  const browser = existing || (await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] }));
  const ctxOpts = {
    viewport: { width, height }, deviceScaleFactor: dpr, colorScheme: scheme, locale,
    isMobile: mobile, hasTouch: mobile, reducedMotion,
  };
  if (video) ctxOpts.recordVideo = { dir: video, size: { width: width * dpr, height: height * dpr } };
  const context = await browser.newContext(ctxOpts);
  const html = skeleton();
  const css = fontCSS();
  await context.route("https://artifact.test/**", (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html, headers: csp ? { "content-security-policy": csp } : {} }));
  await context.route("https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js", (route) => route.fulfill({ status: 200, contentType: "application/javascript", body: fs.readFileSync(path.join(ROOT, "node_modules/three/build/three.min.js")), headers: { "access-control-allow-origin": "*" } }));
  await context.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: css }));
  await context.route("https://fonts.gstatic.com/__localv/**", (route) => {
    const rel = route.request().url().split("/__localv/")[1];
    const [pkg, file] = rel.split("/");
    const fp = path.join(FV, pkg, "files", file);
    if (!fs.existsSync(fp)) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, contentType: "font/woff2", body: fs.readFileSync(fp), headers: { "access-control-allow-origin": "*" } });
  });
  await context.route("https://fonts.gstatic.com/__local/**", (route) => {
    const rel = route.request().url().split("/__local/")[1];
    const [pkg, file] = rel.split("/");
    const fp = path.join(FONTS, pkg, "files", file);
    if (!fs.existsSync(fp)) return route.fulfill({ status: 404, body: "" });
    route.fulfill({ status: 200, contentType: file.endsWith("woff2") ? "font/woff2" : "font/woff", body: fs.readFileSync(fp), headers: { "access-control-allow-origin": "*" } });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });
  if (time) { try { await page.clock.setSystemTime(new Date(time)); } catch (e) { await page.clock.setFixedTime(new Date(time)); } }
  if (storage) await page.addInitScript((s) => { try { localStorage.setItem("wakha.v2", s); } catch (e) {} }, storage);
  if (!process.env.WITH3D) await page.addInitScript("window.__no3d = 1");
  if (initScript) await page.addInitScript(initScript);
  await page.goto("https://artifact.test/");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { browser, context, page, errors };
}

// helpers usable from tests
async function active(page) {
  return page.evaluate(() => { const F = window.__wakha.Feed; const c = F.cards[F.active]; return c ? { i: F.active, t: c.spec.t, w: c.spec.w || null, id: c.spec.id || null } : null; });
}
async function lessonCard(page) {
  return page.evaluate(() => { const L = window.__wakha.Lesson; if (!L.active) return null; const sp = L.specs[L.i]; return { i: L.i, n: L.specs.length, t: sp ? sp.t : "end", w: sp && sp.w, words: sp && sp.words, id: sp && (sp.id || sp.item), sub: sp && sp.sub, k: sp && sp.k }; });
}
async function next(page) {
  const before = await active(page);
  await page.evaluate(() => window.__wakha.Feed.next());
  for (let k = 0; k < 40; k++) { await page.waitForTimeout(60); const a = await active(page); if (a && a.i !== before.i) break; }
  await page.waitForTimeout(450);
  return active(page);
}
async function shot(page, name) {
  const dir = path.join(__dirname, "shots");
  await page.screenshot({ path: path.join(dir, name + ".png") });
  return path.join(dir, name + ".png");
}
module.exports = { openApp, active, next, shot, chromium, skeleton, lessonCard };

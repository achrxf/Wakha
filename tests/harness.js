// Test harness: wraps the artifact in the publish skeleton, serves local copies of the
// Google Fonts it requests, and opens it in a phone-sized Chromium page.
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const APP = path.join(ROOT, "wakha", "wakha.html");
const FONTS = path.join(ROOT, "fontpkg", "node_modules", "@fontsource");
const RESET = ":root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}";

function skeleton() {
  const body = fs.readFileSync(APP, "utf8");
  return `<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>${RESET}</style></head><body>${body}</body></html>`;
}
function fontCSS() {
  const sets = [["baloo-bhaijaan-2", [600, 700, 800]], ["readex-pro", [400, 500, 600, 700]]];
  let css = "";
  for (const [pkg, ws] of sets) for (const w of ws) {
    const f = path.join(FONTS, pkg, `${w}.css`);
    css += fs.readFileSync(f, "utf8").replace(/url\(\.\/files\//g, `url(https://fonts.gstatic.com/__local/${pkg}/`);
  }
  return css;
}

async function openApp(opts = {}) {
  const {
    width = 390, height = 844, scheme = "dark", dpr = 2, browser: existing, storage = null,
    locale = "en-US", initScript = null, video = null, mobile = true, reducedMotion = "no-preference", time = null,
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
  await context.route("https://artifact.test/**", (route) => route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: html }));
  await context.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ status: 200, contentType: "text/css", body: css }));
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
  if (storage) await page.addInitScript((s) => { try { localStorage.setItem("wakha.v1", s); } catch (e) {} }, storage);
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
module.exports = { openApp, active, next, shot, chromium, skeleton };

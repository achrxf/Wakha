// ~70s first-session demo; logs each voice clip so the audio can be mixed into the video.
const fs = require("fs"), path = require("path");
const { chromium } = require("playwright");
const H = require("./harness");
const { solveStep, clickCont } = require("./play");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const vdir = path.join(__dirname, "video"); fs.rmSync(vdir, { recursive: true, force: true });
  const plays = []; let t0 = 0;
  const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
  const origNew = browser.newContext.bind(browser);
  browser.newContext = async (o) => { const c = await origNew(o); const on = c.newPage.bind(c); c.newPage = async () => { const p = await on(); t0 = Date.now(); await p.exposeFunction("__logPlay", (k, rate) => plays.push({ k, rate, t: Date.now() - t0 })); return p; }; return c; };
  const { context, page } = await H.openApp({ browser, width: 390, height: 844, dpr: 2, video: vdir, time: "2026-10-21T19:00:00", scheme: "light",
    initScript: `addEventListener("DOMContentLoaded",()=>{const iv=setInterval(()=>{const V=window.__wakha&&window.__wakha.Voice;if(!V)return;clearInterval(iv);const o=V.play.bind(V);V.play=(text,opts={})=>{const k=(opts.voice&&opts.voice!=="n"&&window.__wakha.AUD[opts.voice+"|"+window.__wakha.audioKey(text)])?opts.voice+"|"+window.__wakha.audioKey(text):window.__wakha.audioKey(text);window.__logPlay(k,opts.rate||1);return o(text,opts);};},50);});` });
  await sleep(1800);
  await page.click("#welcome .say", { force: true }); await sleep(1600);
  await page.click("#welcome [data-w=next]", { force: true }); await sleep(1400);
  await page.click('#welcome .goal-pick[data-goal="100"]', { force: true }); await sleep(2400);
  // lesson 1 at human pace
  for (let k = 0; k < 16; k++) {
    const lc = await H.lessonCard(page); if (!lc || (await page.locator("#lesson .l-end").count())) break;
    if (lc.t === "scene") { await sleep(1500); await page.click("#lesson .sc-quote .say", { force: true }); await sleep(2200); }
    await sleep(lc.t === "learn" ? 1700 : 1300);
    if (lc.t === "listen" && k === 4) { await page.click("#lesson .play-slow", { force: true }); await sleep(1500); }
    await solveStep(page, !(k === 6));
    await sleep(350);
  }
  await sleep(4200);
  await page.click("#lesson .l-foot .cta", { force: true }); await sleep(1000);
  for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await sleep(1600); await page.click("#overlay [data-ov=close]", { force: true }); await sleep(700); }
  await sleep(1500);
  // play with the 3D plate and the cat
  { const b = await page.locator(".td-med").boundingBox(); const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 110, cy + 50, { steps: 18 }); await sleep(500); await page.mouse.move(cx - 90, cy - 40, { steps: 22 }); await sleep(300); await page.mouse.up(); await sleep(1800); }
  await page.evaluate(() => document.querySelector("#v-today .td-cat").click()); await sleep(2300); await page.evaluate(() => document.querySelector("#v-today .td-cat").click()); await sleep(2300);
  await page.evaluate(() => document.querySelector("#v-today").scrollTo({ top: 420, behavior: "smooth" })); await sleep(2200);
  await page.evaluate(() => document.querySelector("#v-today").scrollTo({ top: 0, behavior: "smooth" })); await sleep(1200);
  // journey: swipe through cities
  await page.click("#tab-journey", { force: true }); await sleep(1500);
  for (const c of [1, 2, 4, 0]) { await page.click(`.jr-chip[data-city="${c}"]`, { force: true }); await sleep(1500); }
  await page.evaluate(() => document.querySelector(".jr-page.cv0").scrollTo({ top: 520, behavior: "smooth" })); await sleep(1800);
  // a story
  await page.evaluate(() => { const S = window.__wakha.S; ["u1l2","u1l3","u1l4"].forEach((id) => S.lessons[id] = { stars: 3 }); });
  await page.click("#tab-today", { force: true }); await sleep(1200);
  await page.click(".td-go", { force: true }); await sleep(2500);
  await solveStep(page); await sleep(9000);
  await solveStep(page); await sleep(1200);
  await solveStep(page); await sleep(1200);
  await page.click("#lesson [data-act=quit]", { force: true }); await sleep(900); await page.click("#lesson [data-act=leave]", { force: true }); await sleep(1200);
  for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await sleep(1800); await page.click("#overlay [data-ov=close]", { force: true }); await sleep(700); }
  // guide
  await page.click("#tab-guide", { force: true }); await sleep(1200);
  await page.click('[data-snd="3"]', { force: true }); await sleep(1500);
  await page.click('[data-snd="7"]', { force: true }); await sleep(1700);
  // feed
  await page.click("#tab-feed", { force: true }); await sleep(1200);
  await page.evaluate(() => window.__wakha.inject({ t: "dialog", id: "cafe" })); await page.evaluate(() => window.__wakha.Feed.next()); await sleep(8000);
  await page.click("#tab-me", { force: true }); await sleep(1200);
  await page.click('[data-theme-set="dark"]', { force: true }); await sleep(1500);
  await page.click("#tab-today", { force: true }); await sleep(3500);
  await page.click("#tab-journey", { force: true }); await sleep(2000);
  await page.click("#tab-today", { force: true }); await sleep(1500);
  await page.close(); const vid = await page.video().path(); await context.close(); await browser.close();
  fs.writeFileSync(path.join(__dirname, "video", "plays.json"), JSON.stringify(plays));
  console.log(vid, plays.length, "clips");
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

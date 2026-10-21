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
  const { context, page } = await H.openApp({ browser, width: 390, height: 844, dpr: 2, video: vdir, time: "2026-10-21T19:00:00",
    initScript: `addEventListener("DOMContentLoaded",()=>{const iv=setInterval(()=>{const V=window.__wakha&&window.__wakha.Voice;if(!V)return;clearInterval(iv);const o=V.play.bind(V);V.play=(text,opts={})=>{const k=(opts.voice&&opts.voice!=="n"&&window.__wakha.AUD[opts.voice+"|"+window.__wakha.audioKey(text)])?opts.voice+"|"+window.__wakha.audioKey(text):window.__wakha.audioKey(text);window.__logPlay(k,opts.rate||1);return o(text,opts);};},50);});` });
  await sleep(1500);
  await page.click("#welcome .say"); await sleep(1600);
  await page.click("#welcome [data-w=next]"); await sleep(1500);
  await page.click('#welcome .goal-pick[data-goal="100"]'); await sleep(2200);
  // lesson 1 at human pace
  for (let k = 0; k < 15; k++) {
    const lc = await H.lessonCard(page); if (!lc || (await page.locator("#lesson .l-end").count())) break;
    if (lc.t === "scene") { await sleep(1600); await page.click("#lesson .sc-quote .say"); await sleep(2200); }
    await sleep(lc.t === "learn" ? 1900 : 1500);
    if (lc.t === "listen") { await page.click("#lesson .play-slow"); await sleep(1500); }
    await solveStep(page, !(k === 4));
    await sleep(500);
  }
  await sleep(3500);
  await page.click("#lesson .l-foot .cta"); await sleep(1200);
  for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await sleep(1500); await page.click("#overlay [data-ov=close]"); await sleep(600); }
  await sleep(1200);
  await page.evaluate(() => document.querySelector("#v-learn").scrollTo({ top: 430, behavior: "smooth" })); await sleep(2400);
  await page.evaluate(() => document.querySelector("#v-learn").scrollTo({ top: 1500, behavior: "smooth" })); await sleep(2000);
  await page.evaluate(() => document.querySelector("#v-learn").scrollTo({ top: 0, behavior: "smooth" })); await sleep(1000);
  // guide
  await page.click("#tab-guide"); await sleep(1200);
  await page.click('[data-snd="3"]'); await sleep(1400);
  await page.click(".gpanel .exrow .say >> nth=0"); await sleep(1300);
  await page.click('[data-snd="7"]'); await sleep(1600);
  await page.click('[data-gt="rules"]'); await sleep(900);
  await page.click(".rule .exrow .say >> nth=1"); await sleep(1600);
  // feed: conversation + souk
  await page.click("#tab-feed"); await sleep(900);
  await page.evaluate(() => window.__wakha.inject({ t: "dialog", id: "cafe" })); await page.evaluate(() => window.__wakha.Feed.next()); await sleep(9500);
  await page.evaluate(() => window.__wakha.inject({ t: "haggle", item: "berrad" })); await page.evaluate(() => window.__wakha.Feed.next()); await sleep(1500);
  const a = await H.active(page); const s = `.feed .card[data-i="${a.i}"]`;
  await page.click(`${s} [data-act=begin]`);
  const wants = ["Nqss chwiya", "bslama", "Ghanakh"];
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector(`${s} .h-opts:not([hidden]) .opt`, { timeout: 12000 }); await sleep(900);
    const opts = page.locator(`${s} .h-opts .opt`); const n = await opts.count();
    for (let k = 0; k < n; k++) if ((await opts.nth(k).innerText()).includes(wants[r])) { await opts.nth(k).click(); break; }
    await sleep(1200);
  }
  await sleep(5200);
  for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await sleep(1500); await page.click("#overlay [data-ov=close]"); await sleep(500); }
  await sleep(1000);
  await page.close(); const vid = await page.video().path(); await context.close(); await browser.close();
  fs.writeFileSync(path.join(__dirname, "video", "plays.json"), JSON.stringify(plays));
  console.log(vid, plays.length, "clips");
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

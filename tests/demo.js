// Records a ~45s demo of a first session at human pace.
const fs = require("fs");
const path = require("path");
const { openApp, active, next } = require("./harness");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const vdir = path.join(__dirname, "video");
  fs.rmSync(vdir, { recursive: true, force: true });
  const { browser, context, page } = await openApp({ width: 390, height: 844, dpr: 2, video: vdir, time: "2026-10-20T19:00:00" });
  const sel = async () => `.card[data-i="${(await active(page)).i}"]`;
  const swipe = async () => {
    // a real touch-like drag so the snap animation shows
    const b = await page.locator("#feed").boundingBox();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height * 0.75);
    await page.evaluate(() => window.__wakha.Feed.next());
    await sleep(900);
  };
  const closeOv = async (hold = 1600) => { if (await page.locator("#overlay:not([hidden])").count()) { await sleep(hold); await page.click("#overlay [data-ov=close]"); await sleep(500); } };
  await sleep(1400);
  // welcome
  let s = await sel();
  await page.click(`${s} .vibe[data-v="travel"]`); await sleep(2100);
  // quiz salam
  let a = await active(page); s = await sel();
  await sleep(900); await page.click(`${s} .opt[data-id="${a.w}"]`); await sleep(1900);
  // learn labas: double tap
  s = await sel(); await sleep(1300);
  let bb = await page.locator(`${s} .card-in`).boundingBox();
  await page.mouse.dblclick(bb.x + bb.width * 0.35, bb.y + bb.height * 0.42); await sleep(1300);
  await swipe();
  // learn wakha
  await sleep(1200); await swipe();
  // quiz labas
  a = await active(page); s = await sel(); await sleep(900);
  await page.click(`${s} .opt[data-id="${a.w}"]`); await sleep(1900);
  // goal pick
  s = await sel(); await sleep(900); await page.click(`${s} .pick[data-n="150"]`); await sleep(1600);
  // reel
  s = await sel(); await sleep(1600);
  for (let k = 0; k < 2; k++) { const b = await page.locator(s).boundingBox(); await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.5); await sleep(1300); }
  await swipe();
  // learn bzzaf -> swipe
  await sleep(1100); await swipe();
  // quiz wakha
  a = await active(page); s = await sel(); await sleep(800);
  await page.click(`${s} .opt[data-id="${a.w}"]`); await sleep(1700);
  await closeOv();
  // mystery box
  s = await sel(); await sleep(1300); await page.click(`${s} [data-act=open]`); await sleep(2900);
  await swipe();
  // jump straight to a souk battle to show it
  await page.evaluate(() => window.__wakha.inject({ t: "haggle", item: "belgha" }));
  await swipe();
  s = await sel(); await sleep(1200);
  await page.click(`${s} [data-act=begin]`);
  const wants = ["Nqss chwiya", "bslama", "Ghanakhodha"];
  for (let r = 0; r < 3; r++) {
    await page.waitForSelector(`${s} .h-opts:not([hidden]) .opt`, { timeout: 8000 });
    await sleep(1100);
    const opts = page.locator(`${s} .h-opts .opt`); const n = await opts.count();
    for (let k = 0; k < n; k++) if ((await opts.nth(k).innerText()).includes(wants[r])) { await opts.nth(k).click(); break; }
    await sleep(1500);
  }
  await sleep(2600);
  await closeOv(1900);
  await closeOv(1500);
  await sleep(800);
  await page.close();
  const vid = await page.video().path();
  await context.close(); await browser.close();
  console.log(vid);
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

const fs = require("fs");
const { openApp, next } = require("./harness");
(async () => {
  const mock = () => {
    window.__imgs = [];
    const downloads = Object.freeze({ save: async (o) => { const fr = new FileReader(); await new Promise((r) => { fr.onload = r; fr.readAsDataURL(o.data); }); window.__imgs.push({ name: o.filename, url: fr.result }); return { status: "saved" }; } });
    window.claude = { use: (n) => Promise.resolve(n === "downloads" ? downloads : null) };
  };
  const { browser, page } = await openApp({ time: "2026-10-20T12:00:00", initScript: `(${mock.toString()})();`, storage: JSON.stringify({ v: 1, onboarded: true, goalChosen: true, lastOpen: "2026-10-20", xp: 10 }) });
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__wakha.inject({ t: "learn", w: "tbarkellah" }));
  let a = await next(page);
  await page.click(`.card[data-i="${a.i}"] [data-act=share]`);
  await page.waitForTimeout(2500);
  // haggle share
  await page.evaluate(() => window.__wakha.inject({ t: "haggle", item: "tajine" }));
  a = await next(page);
  const sel = `.card[data-i="${a.i}"]`;
  await page.click(`${sel} [data-act=begin]`);
  for (let r = 0; r < 3; r++) { await page.waitForSelector(`${sel} .h-opts:not([hidden]) .opt`); await page.click(`${sel} .h-opts .opt >> nth=0`); await page.waitForTimeout(2600); if (await page.locator(`${sel} .result:not([hidden])`).count()) break; }
  await page.waitForTimeout(1200);
  if (await page.locator("#overlay:not([hidden])").count()) { await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(400); }
  await page.click(`${sel} [data-act=share]`);
  await page.waitForTimeout(2500);
  const imgs = await page.evaluate(() => window.__imgs);
  imgs.forEach((im, k) => fs.writeFileSync(`shots/story-${k}.png`, Buffer.from(im.url.split(",")[1], "base64")));
  console.log(imgs.map((x) => x.name).join(", "));
  await browser.close();
})();

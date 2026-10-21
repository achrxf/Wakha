const { openApp, shot, lessonCard, next, active } = require("./harness");
const { playLesson, clickCont } = require("./play");
(async () => {
  const scheme = process.argv[2] || "dark";
  const { browser, page, errors } = await openApp({ scheme, time: "2026-10-21T19:00:00" });
  await page.waitForTimeout(600);
  await shot(page, "01-welcome");
  await page.click("#welcome [data-w=next]"); await page.waitForTimeout(500);
  await shot(page, "02-goal");
  await page.click('#welcome .goal-pick[data-goal="100"]'); await page.waitForTimeout(1200);
  let n = 0;
  const log = await playLesson(page, { wrongAt: [3], shotFn: async (lc, ph) => { n++; if (n <= 40) await shot(page, `03-l1-${String(n).padStart(2, "0")}-${lc.t}-${ph}`); } });
  await page.waitForTimeout(800);
  await shot(page, "04-lesson-end");
  await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(1200);
  for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await shot(page, "05-overlay-" + k); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(600); }
  await page.evaluate(() => document.querySelector("#v-learn").scrollTo(0, 0)); await page.waitForTimeout(300);
  await shot(page, "06-path");
  await page.click('.node[data-node="1"]'); await page.waitForTimeout(500); await shot(page, "07-node-sheet");
  await page.click("#sheet-scrim", { position: { x: 20, y: 120 } }); await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector("#v-learn").scrollTo(0, 700)); await page.waitForTimeout(300); await shot(page, "08-path-scrolled");
  await page.click("#tab-feed"); await page.waitForTimeout(1200); await shot(page, "09-feed-0");
  for (let k = 1; k <= 5; k++) { const a = await next(page); await page.waitForTimeout(700); await shot(page, `09-feed-${k}-${a.t}`); }
  await page.click("#tab-guide"); await page.waitForTimeout(700); await shot(page, "10-guide-sounds");
  await page.click('[data-snd="9"]'); await page.waitForTimeout(600); await shot(page, "10-guide-sound9");
  await page.click('[data-gt="rules"]'); await page.waitForTimeout(500); await shot(page, "11-guide-rules");
  await page.click('[data-gt="phrasebook"]'); await page.waitForTimeout(500); await shot(page, "12-guide-phrasebook");
  await page.click("#tab-kenz"); await page.waitForTimeout(500); await shot(page, "13-kenz");
  await page.click("#tab-me"); await page.waitForTimeout(500); await shot(page, "14-me");
  const st = await page.evaluate(() => ({ xp: window.__wakha.S.xp, lessons: window.__wakha.S.lessons, words: Object.keys(window.__wakha.S.words).length, audio: Object.keys(window.__wakha.AUD).length }));
  console.log("lesson:", log.join(" "));
  console.log("STATE", JSON.stringify(st));
  console.log("ERRORS", errors.length ? errors.join("\n") : "none");
  await browser.close();
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

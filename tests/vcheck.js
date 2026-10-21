// Open a built version, play the first lesson, report script errors.
const { openApp, shot } = require("./harness");
const { playLesson } = require("./play");
(async () => {
  const { browser, page, errors } = await openApp({ time: "2026-10-21T12:00:00", scheme: "light" });
  await page.waitForTimeout(1200);
  await shot(page, "vcheck-" + (process.env.TAG || "x") + "-1");
  if (await page.locator("#welcome [data-w=next]").count()) { await page.click("#welcome [data-w=next]"); await page.waitForTimeout(400); }
  if (await page.locator('#welcome .goal-pick[data-goal="100"]').count()) { await page.click('#welcome .goal-pick[data-goal="100"]'); await page.waitForTimeout(1200); }
  let log = []; try { log = await playLesson(page); } catch (e) { log = ["play failed: " + e.message.split("\n")[0]]; }
  await page.waitForTimeout(800); await shot(page, "vcheck-" + (process.env.TAG || "x") + "-2");
  console.log(process.env.TAG, "steps:", log.length, log.slice(0, 3).join(","), "errors:", errors.length ? errors.join(" | ") : "none");
  await browser.close();
})();

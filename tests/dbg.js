const { openApp, active, next, shot } = require("./harness");
(async () => {
  const { browser, page, errors } = await openApp({ width: 360, height: 640, storage: JSON.stringify({ v: 1, onboarded: true, goalChosen: true, lastOpen: "2026-10-20", xp: 400, words: { salam: { b: 1, due: "2026-10-25", s: 1, c: 1, w: 0, intro: "2026-10-19" } } }), time: "2026-10-20T10:00:00" });
  for (const sp of [{ t: "haggle", item: "zrbiya" }, { t: "goal" }, { t: "comeback" }, { t: "drop", w: "tbarkellah" }]) {
    await page.evaluate((sp) => window.__wakha.inject(sp), sp);
    const a = await next(page);
    console.log("now", JSON.stringify(a));
    await page.waitForTimeout(600);
    await shot(page, `dbg-${a.t}`);
  }
  console.log(errors.join("\n") || "no errors");
  await browser.close();
})();

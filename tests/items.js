const { openApp, next, shot } = require("./harness");
(async () => {
  const { browser, page, errors } = await openApp({ time: "2026-10-20T12:00:00", storage: JSON.stringify({ v: 1, onboarded: true, goalChosen: true, lastOpen: "2026-10-20", xp: 10 }) });
  for (const item of ["berrad", "tajine", "fanar"]) {
    await page.evaluate((item) => window.__wakha.inject({ t: "haggle", item }), item);
    const a = await next(page); await page.waitForTimeout(500);
    await shot(page, "item-" + item);
  }
  console.log(errors.join("\n") || "no errors");
  await browser.close();
})();

const { openApp, shot } = require("./harness");
const W = (ids, b, due, intro) => Object.fromEntries(ids.map((x, i) => [x, { b: typeof b === "function" ? b(i) : b, due, s: 1, c: 1, w: 0, intro, fav: false, last: 1000 + i }]));
(async () => {
  const st = { v: 1, onboarded: true, goalChosen: true, goal: 100, xp: 1240, streak: 6, best: 9, lastGoalDay: "2026-10-20", lastOpen: "2026-10-20", shields: 1,
    words: Object.assign(W(["salam","labas","wakha","bzzaf","choukran","chwiya","atay","chhal","ghali","daba","mzyan","zwin","bslama","fin"], (i) => (i % 6), "2026-10-23", "2026-10-15"), W(["khobz","lma","3afak"], 1, "2026-10-20", "2026-10-18")),
    kenz: { bssa7a: "2026-10-15", tbarkellah: "2026-10-17", wa3er: "2026-10-18", hchouma: "2026-10-19", zaama: "2026-10-20" },
    days: { "2026-10-14": { xp: 40 }, "2026-10-15": { xp: 130, goalMet: true }, "2026-10-16": { xp: 110, goalMet: true }, "2026-10-17": { xp: 60 }, "2026-10-18": { xp: 210, goalMet: true }, "2026-10-19": { xp: 100, goalMet: true }, "2026-10-20": { xp: 75 } },
    stats: { cards: 400, correct: 260, wrong: 41, reels: 9, haggles: 4, bestDeal: { ratio: 0.43, item: "belgha", price: 130, start: 300 }, boxes: 6, builds: 9, lightning: 3, bestCombo: 14, drops: 2 } };
  for (const scheme of ["dark", "light"]) {
    const { browser, page, errors } = await openApp({ scheme, time: "2026-10-20T20:00:00", storage: JSON.stringify(st) });
    for (const tab of ["words", "kenz", "me"]) { await page.click(`#tab-${tab}`); await page.waitForTimeout(500); await shot(page, `sheet-${scheme}-${tab}`); }
    await page.click("#tab-me"); await page.waitForTimeout(300);
    console.log(scheme, errors.join(" / ") || "no errors");
    await browser.close();
  }
})();

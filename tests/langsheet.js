// One screenshot per language of the same screens, for a side-by-side sheet.
const { openApp, shot } = require("./harness");
(async () => {
  for (const lang of ["en", "fr", "es", "de", "nl", "it"]) {
    const W = (ids) => Object.fromEntries(ids.map((x) => [x, { b: 1, due: "2026-10-20", s: 1, c: 1, w: 0, intro: "2026-10-18" }]));
    const lessons = {}; for (const id of ["u1l1","u1l2","u1l3","u1l4","u1s","u1r","u2l1","u2l2","u2l3","u2l4","u2s","u2r"]) lessons[id] = { stars: 3 };
    const st = { v:2, lang, onboarded:true, goalChosen:true, lastOpen:"2026-10-21", xp:420, dayCount:4, stats:{ lessons:12, cards:0, correct:0, wrong:0, reels:0, haggles:0, bestDeal:null, boxes:0, builds:0, lightning:0, bestCombo:0, drops:0, dialogs:0 }, words: W(["salam","labas","lkoura","gool"]), lessons };
    const { browser, page } = await openApp({ width: 390, height: 844, storage: JSON.stringify(st), time: "2026-10-21T19:00:00", scheme: "light" });
    await page.waitForTimeout(1000); await shot(page, `L-${lang}-1today`);
    await page.click(".hero [data-start]"); await page.waitForTimeout(900); await shot(page, `L-${lang}-2scene`);
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(900); await shot(page, `L-${lang}-3learn`);
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(900);
    await page.click("#lesson .l-body .card:not(.leaving) .opt >> nth=0"); await page.waitForTimeout(900); await shot(page, `L-${lang}-4answer`);
    await browser.close();
  }
})();

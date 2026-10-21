// Shared bot actions for lessons.
const { lessonCard } = require("./harness");
async function clickCont(page) {
  const b = page.locator("#lesson .banner .cta, #lesson .l-foot:not([hidden]) .cta").first();
  await b.waitFor({ timeout: 6000 }); await b.click();
}
async function solveStep(page, correct = true, shotFn) {
  const lc = await lessonCard(page);
  if (!lc) return null;
  const sel = "#lesson .l-body .card:not(.leaving)";
  if (shotFn) await shotFn(lc, "before");
  switch (lc.t) {
    case "learn": break;
    case "pick": case "rev": case "listen":
      if (correct) await page.click(`${sel} .opt[data-id="${lc.w}"]`); else await page.click(`${sel} .opt:not([data-id="${lc.w}"]) >> nth=0`);
      break;
    case "match":
      for (const id of lc.words.slice(0, 5)) {
        if (!(await page.locator(`${sel} .mt[data-side=l][data-id="${id}"]`).count())) continue;
        await page.click(`${sel} .mt[data-side=l][data-id="${id}"]`);
        await page.click(`${sel} .mt[data-side=r][data-id="${id}"]`);
        await page.waitForTimeout(80);
      }
      break;
    case "build": {
      const toks = await page.evaluate((id) => window.__wakha.BUILDS.find((b) => b[0] === id)[3], lc.id);
      const order = correct ? toks : toks.slice().reverse();
      for (let attempt = 0; attempt < (correct ? 1 : 2); attempt++) {
        for (const tk of order) {
          const btns = page.locator(`${sel} .pool .tok:not(.ghost-t)`); const n = await btns.count();
          for (let k = 0; k < n; k++) if ((await btns.nth(k).innerText()) === tk) { await btns.nth(k).click(); break; }
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(900);
      }
      break;
    }
    case "sq":
      if (correct) await page.click(`${sel} .opt[data-k="${lc.k}"]`); else await page.click(`${sel} .opt:not([data-k="${lc.k}"]) >> nth=0`); break;
    case "sit":
      await page.click(`${sel} .opt[data-k="${correct ? 0 : 1}"]`); break;
    case "haggle": {
      await page.click(`${sel} [data-act=begin]`);
      const wants = ["Nqss chwiya", "bslama", "Ghanakh"];
      for (let r = 0; r < 3; r++) {
        try { await page.waitForSelector(`${sel} .h-opts:not([hidden]) .opt`, { timeout: 9000 }); } catch (e) { break; }
        const opts = page.locator(`${sel} .h-opts .opt`); const n = await opts.count(); let idx = 0;
        for (let k = 0; k < n; k++) if ((await opts.nth(k).innerText()).includes(wants[r])) idx = k;
        await opts.nth(idx).click(); await page.waitForTimeout(3500);
        if (await page.locator(`${sel} .result:not([hidden])`).count()) break;
      }
      await page.waitForTimeout(2600);
      return lc;
    }
  }
  await page.waitForTimeout(450);
  if (shotFn) await shotFn(lc, "after");
  await clickCont(page);
  await page.waitForTimeout(350);
  return lc;
}
async function playLesson(page, opts = {}) {
  const log = [];
  for (let k = 0; k < 40; k++) {
    const lc = await lessonCard(page);
    if (!lc) break;
    if (lc.t === "end") break;
    const wrong = opts.wrongAt && opts.wrongAt.includes(k) && ["pick", "rev", "listen", "sit"].includes(lc.t);
    await solveStep(page, !wrong, opts.shotFn);
    log.push(lc.t + (wrong ? "(x)" : ""));
    if (await page.locator("#lesson .l-end").count()) break;
  }
  return log;
}
module.exports = { solveStep, playLesson, clickCont };

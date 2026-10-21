const { openApp } = require("./harness");
(async () => {
  const st = { v: 2, onboarded: true, goalChosen: true, lastOpen: "2026-10-21", xp: 10, words: { salam: { b: 1, due: "2026-10-25", s: 1, c: 1, w: 0, intro: "2026-10-20" } } };
  const { browser, page, errors } = await openApp({ time: "2026-10-21T12:00:00", storage: JSON.stringify(st) });
  const r = await page.evaluate(async () => {
    const A = window.__wakha, V = A.Voice;
    const miss = [];
    const chk = (s, v) => { if (s && !V.has(s, v)) miss.push(s); };
    for (const id of Object.keys(A.W)) { chk(A.W[id].d); if (A.W[id].ex) chk(A.W[id].ex[0]); }
    A.SITS.forEach((s) => s[4].forEach((o) => chk(o[0])));
    // play three clips end to end
    const res = [];
    for (const s of ["Salam", "Bghit wa7ed atay, 3afak.", "Llah yr7am lwalidin"]) {
      const t0 = performance.now(); const ok = await Promise.race([V.play(s), new Promise((r) => setTimeout(() => r("timeout"), 8000))]);
      res.push({ s, ok, ms: Math.round(performance.now() - t0), dur: +V.el.duration.toFixed(2) });
    }
    return { miss: miss.slice(0, 20), nMiss: miss.length, res, keys: Object.keys(A.AUD).length };
  });
  console.log(JSON.stringify(r, null, 1));
  // tap a speaker in the UI and watch the playing state
  await page.click("#tab-guide"); await page.waitForTimeout(400);
  await page.click(".gpanel .exrow .say >> nth=0");
  const playing = await page.evaluate(() => document.querySelector(".gpanel .exrow .say").classList.contains("playing"));
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => document.querySelector(".gpanel .exrow .say").classList.contains("playing"));
  console.log("speaker shows playing:", playing, "then clears:", !after);
  console.log("ERRORS", errors.join(" | ") || "none");
  await browser.close();
})();

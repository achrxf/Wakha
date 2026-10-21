const { openApp, next, active } = require("./harness");
const WORDS = ["salam","labas","hamdoulillah","bikhir","kidayr","sba7","merhba","bslama","tsb7","choukran","blamzyya","3afak","smeh","ma3lich","wakha","iyeh","la","safi","achnou","fin","kifach","3lach","imta","chkoun","wach","smiti","achsmitek"];
(async () => {
  const st = { v: 2, onboarded: true, goalChosen: true, lastOpen: "2026-10-21", xp: 700, dayCount: 4,
    lessons: Object.fromEntries(["u1l1","u1l2","u1l3","u1r","u2l1","u2l2","u2l3","u2r","u3l1","u3l2","u3l3","u3r"].map((k) => [k, { stars: 3 }])),
    words: Object.fromEntries(WORDS.map((x, i) => [x, { b: 1 + (i % 4), due: i % 3 ? "2026-10-25" : "2026-10-21", s: 2, c: 2, w: 0, intro: "2026-10-15" }])) };
  const { browser, page, errors } = await openApp({ time: "2026-10-21T12:00:00", storage: JSON.stringify(st), reducedMotion: "reduce" });
  await page.click("#tab-feed"); await page.waitForTimeout(500);
  const seq = [], ids = [], wordsSeen = [];
  for (let k = 0; k < 120; k++) {
    for (let j = 0; j < 3; j++) if (await page.locator("#overlay:not([hidden])").count()) { await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(150); }
    const a = await active(page);
    seq.push(a.t); ids.push(a.t + ":" + (a.id || a.w || "")); if (a.w) wordsSeen.push(a.w);
    const s = `.feed .card[data-i="${a.i}"]`;
    try {
      if (["pick", "rev", "listen"].includes(a.t)) await page.click(`${s} .opt[data-id="${a.w}"]`, { timeout: 2000 });
      if (a.t === "sit") await page.click(`${s} .opt[data-k="0"]`, { timeout: 2000 });
      if (a.t === "mystery") await page.click(`${s} [data-act=open]`, { timeout: 2000 });
      if (a.t === "drop") await page.click(`${s} [data-act=flip]`, { timeout: 2000 });
    } catch (e) {}
    await page.waitForTimeout(250);
    await next(page);
  }
  const PRACTICE = new Set(["pick", "rev", "listen", "spot", "match", "build", "lightning"]);
  let maxRun = 1, run = 1; for (let i = 1; i < seq.length; i++) { run = seq[i] === seq[i - 1] ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  let maxP = 0, p = 0; for (const t of seq) { p = PRACTICE.has(t) ? p + 1 : 0; maxP = Math.max(maxP, p); }
  const win = []; for (let i = 0; i + 10 <= seq.length; i += 10) win.push(new Set(seq.slice(i, i + 10)).size);
  const counts = seq.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
  const contentIds = ids.filter((x) => /^(reel|sit|dialog|proverb|build):/.test(x));
  const dupContent = contentIds.length - new Set(contentIds).size;
  // same word repeated within 6 cards
  let wordRepeats = 0; for (let i = 0; i < ids.length; i++) { const w = ids[i].split(":")[1]; if (!w || !WORDS.includes(w)) continue; if (ids.slice(Math.max(0, i - 6), i).some((x) => x.split(":")[1] === w)) wordRepeats++; }
  const surprise = []; let last = -1; seq.forEach((t, i) => { if (["mystery", "drop", "haggle"].includes(t)) { surprise.push(i - last); last = i; } });
  console.log(JSON.stringify({ cards: seq.length, maxSameTypeRun: maxRun, maxPracticeRun: maxP, distinctTypesPer10: win, minDistinct: Math.min(...win),
    practiceShare: +(seq.filter((t) => PRACTICE.has(t)).length / seq.length).toFixed(2), typeCounts: counts, repeatedCultureCards: dupContent, wordRepeatsWithin6: wordRepeats, maxGapBetweenSurprises: Math.max(...surprise, seq.length - last), errors: errors.length }, null, 1));
  console.log(seq.join(" "));
  await browser.close();
})();

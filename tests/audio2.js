// Does a tap actually produce Darija audio? Normal page, a page that blocks data: media, and with no audio element at all.
const { openApp } = require("./harness");
(async () => {
  const cases = [["normal page", null], ["page that blocks data: media (like a strict preview sandbox)", "default-src 'self' 'unsafe-inline' https: data:; media-src 'none'"]];
  for (const [name, csp] of cases) {
    const st = { v:2, onboarded:true, goalChosen:true, lastOpen:"2026-10-21", lang:"en" };
    const { browser, page, errors } = await openApp({ storage: JSON.stringify(st), time: "2026-10-21T12:00:00", csp });
    await page.waitForTimeout(800);
    // a real tap on the cat's greeting / a say button
    await page.click("#tab-guide"); await page.waitForTimeout(400);
    const r = await page.evaluate(async () => {
      const V = window.__wakha.Voice; const out = [];
      document.querySelector(".gpanel .say").dispatchEvent(new PointerEvent("pointerdown", { bubbles:true }));
      for (const s of ["Salam", "Bghit wa7ed atay, 3afak.", "Dima Maghrib!", "Goool! Dima Maghrib!"]) {
        const t0 = performance.now();
        const ok = await Promise.race([V.play(s), new Promise((r) => setTimeout(() => r("timeout"), 9000))]);
        out.push({ s, ok, ms: Math.round(performance.now() - t0), mode: V.mode });
      }
      return out;
    });
    console.log(name); r.forEach((x) => console.log("  ", JSON.stringify(x)));
    console.log("   errors:", errors.filter((e) => !/Content Security Policy|media-src/i.test(e)).join(" | ") || "none");
    await browser.close();
  }
})();

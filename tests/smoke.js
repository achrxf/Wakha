// Walk the first-session opener, act on each card, screenshot everything, collect errors.
const { openApp, active, next, shot } = require("./harness");

(async () => {
  const scheme = process.argv[2] || "dark";
  const { browser, page, errors } = await openApp({ scheme });
  const log = [];
  await shot(page, `${scheme}-00-welcome`);
  for (let step = 0; step < 18; step++) {
    for (let k = 0; k < 3; k++) { if (await page.locator("#overlay:not([hidden])").count()) { await shot(page, `${scheme}-o${step}-${k}-overlay`); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(500); } }
    const a = await active(page);
    log.push(`${step}: ${a.t} ${a.w || a.id || ""}`);
    const sel = `.card[data-i="${a.i}"]`;
    if (a.t === "welcome") {
      await page.click(`${sel} .vibe[data-v="travel"]`);
      await page.waitForTimeout(500);
      await shot(page, `${scheme}-01-welcome-picked`);
      await page.waitForTimeout(1300);
    } else if (a.t === "quiz" || a.t === "rev") {
      await shot(page, `${scheme}-q${step}-${a.t}-before`);
      await page.click(`${sel} .opt[data-id="${a.w}"]`);
      await page.waitForTimeout(450);
      await shot(page, `${scheme}-q${step}-${a.t}-after`);
      await page.waitForTimeout(1200);
    } else if (a.t === "learn") {
      await page.waitForTimeout(700);
      await shot(page, `${scheme}-l${step}-learn`);
      const box = await page.locator(`${sel} .card-in`).boundingBox();
      await page.mouse.dblclick(box.x + box.width * 0.4, box.y + box.height * 0.45);
      await page.waitForTimeout(350);
      await shot(page, `${scheme}-l${step}-learn-saved`);
      await page.waitForTimeout(600);
    } else if (a.t === "goal") {
      await shot(page, `${scheme}-g${step}-goal`);
      await page.click(`${sel} .pick[data-n="150"]`);
      await page.waitForTimeout(1200);
    } else if (a.t === "reel") {
      await page.waitForTimeout(800);
      await shot(page, `${scheme}-r${step}-reel`);
      for (let k = 0; k < 8; k++) {
        const done = await page.locator(`${sel} .slide.on [data-act=done]`).count();
        if (done) break;
        const box = await page.locator(`${sel}`).boundingBox();
        await page.mouse.click(box.x + box.width * 0.8, box.y + box.height * 0.5);
        await page.waitForTimeout(450);
      }
      await shot(page, `${scheme}-r${step}-reel-last`);
      await page.click(`${sel} .slide.on [data-act=done]`);
      await page.waitForTimeout(1500);
    } else if (a.t === "mystery") {
      await page.waitForTimeout(600);
      await shot(page, `${scheme}-m${step}-mystery`);
      await page.click(`${sel} [data-act=open]`);
      await page.waitForTimeout(1400);
      await shot(page, `${scheme}-m${step}-mystery-open`);
    } else if (a.t === "sit") {
      await shot(page, `${scheme}-s${step}-sit`);
      await page.click(`${sel} .opt[data-k="0"]`);
      await page.waitForTimeout(800);
      await shot(page, `${scheme}-s${step}-sit-after`);
    } else if (a.t === "haggle") {
      await page.waitForTimeout(600);
      await shot(page, `${scheme}-h${step}-haggle`);
      await page.click(`${sel} [data-act=begin]`);
      await page.waitForTimeout(1300);
      await shot(page, `${scheme}-h${step}-haggle-r1`);
      // best path: lower it, walk away, counter-offer
      const wants = ["Ghali bzzaf! Nqss chwiya.", "Safi, bslama!", "Ghanakhodha"];
      for (let r = 0; r < 3; r++) {
        await page.waitForSelector(`${sel} .h-opts:not([hidden]) .opt`, { timeout: 6000 });
        const opts = page.locator(`${sel} .h-opts .opt`);
        const n = await opts.count();
        let clicked = false;
        for (let k = 0; k < n; k++) { const tx = await opts.nth(k).innerText(); if (tx.includes(wants[r])) { await opts.nth(k).click(); clicked = true; break; } }
        if (!clicked) await opts.first().click();
        await page.waitForTimeout(r === 1 ? 900 : 300);
        if (r === 1) await shot(page, `${scheme}-h${step}-haggle-r2`);
        await page.waitForTimeout(1500);
      }
      await page.waitForTimeout(1200);
      await shot(page, `${scheme}-h${step}-haggle-result`);
    } else if (a.t === "build") {
      await shot(page, `${scheme}-b${step}-build`);
    } else {
      await shot(page, `${scheme}-x${step}-${a.t}`);
    }
    // close any overlay
    if (await page.locator("#overlay:not([hidden])").count()) {
      await shot(page, `${scheme}-o${step}-overlay`);
      await page.click("#overlay [data-ov=close]");
      await page.waitForTimeout(400);
    }
    const now = await active(page);
    if (now.i === a.i) await next(page);
  }
  const st = await page.evaluate(() => { const S = window.__wakha.S; return { xp: S.xp, lvl: window.__wakha.levelInfo(S.xp).n, words: Object.keys(S.words).length, kenz: Object.keys(S.kenz), streak: S.streak, goal: S.goal, vibe: S.vibe, combo: document.querySelector("#combo").innerText }; });
  console.log(log.join("\n"));
  console.log("STATE", JSON.stringify(st));
  console.log("ERRORS", errors.length ? errors.join("\n") : "none");
  await browser.close();
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

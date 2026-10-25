// Free tier and Wakha Plus: trial, cups of tea, ads, city gates, feed limit, placement test, paywall, dev switch.
const { openApp, lessonCard } = require("./harness");
const { solveStep } = require("./play");
const res = []; const ok = (n, c, d = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  (" + d + ")" : ""}`);
const base = (x) => JSON.stringify(Object.assign({ v:2, onboarded:true, goalChosen:true, goal:100, lastOpen:"2026-10-24" }, x));
const FREE = { installedAt:Date.now() - 5 * 864e5, sub:null, dev:"auto", shortAds:true };
const closeAd = async (page) => { await page.waitForSelector("#adlayer:not([hidden])", { timeout:4000 }); await page.waitForTimeout(2300); await page.click("#adlayer [data-ad=close]"); await page.waitForTimeout(500); };
const allErr = [];
(async () => {
  // 1 a new install is on the Plus trial
  { const { browser, page, errors } = await openApp({ storage:base({}), time:"2026-10-24T10:00:00" });
    const s = await page.evaluate(() => ({ plus:window.__wakha.isPlus(), inf:document.querySelector("#hud-cups .inf") != null, tiles:document.querySelectorAll(".td-tile").length, trial:!!document.querySelector(".trial-pill") }));
    ok("a new install gets the 3-day Plus trial (unlimited cups, full Today, trial banner)", s.plus && s.inf && s.tiles === 4 && s.trial, JSON.stringify(s));
    await page.click("#tab-journey"); await page.waitForTimeout(400); await page.locator(".crow").nth(10).click(); await page.waitForTimeout(400);
    const j = await page.evaluate(() => ({ open:document.querySelector(".copen .crow") && +document.querySelector(".copen .crow").dataset.city, cur:document.querySelectorAll(".copen .jr-row.current").length }));
    ok("Plus: any city can be opened and started", j.open === 10 && j.cur === 1, JSON.stringify(j));
    await page.locator(".copen .jr-row.current").click(); await page.waitForTimeout(700);
    const lu = await page.evaluate(() => window.__wakha.Lesson.active && window.__wakha.Lesson.node.unit);
    await page.click("#lesson [data-act=quit]"); await page.click("#lesson [data-act=leave]"); await page.waitForTimeout(500);
    const focus = await page.evaluate(() => ({ f:window.__wakha.S.focusUnit, today:document.querySelector(".td-lead .where span").textContent }));
    ok("Plus: starting a city's lesson makes Today follow that city", lu === 10 && focus.f === 10, JSON.stringify(focus));
    // placement test
    await page.click("#tab-journey"); await page.waitForTimeout(300); await page.click(".pl-card"); await page.waitForTimeout(300);
    await page.click('[data-topic="foot"]'); await page.click("[data-pl=next]");
    for (let i = 0; i < 10; i++) { await page.locator("#placement [data-ans='?']").click(); await page.waitForTimeout(80); }
    const recs = await page.locator(".pl-rec").count(); await page.locator(".pl-rec").nth(1).click(); await page.waitForTimeout(500);
    const pt = await page.evaluate(() => ({ f:window.__wakha.S.focusUnit, p:window.__wakha.S.placement && window.__wakha.S.placement.recs }));
    ok("Plus: the placement test recommends cities (level + chosen topic) and sets the start city", recs >= 2 && pt.p && pt.f === pt.p[1], JSON.stringify(pt));
    allErr.push(...errors); await browser.close(); }
  // 2 free tier: minimal Today, gates, cups, ads
  { const { browser, page, errors } = await openApp({ storage:base({ plan:FREE }), time:"2026-10-24T10:00:00" });
    const s = await page.evaluate(() => ({ plus:window.__wakha.isPlus(), cups:document.querySelectorAll("#hud-cups .cup.cup-f").length, tiles:document.querySelectorAll(".td-tile").length, card:!!document.querySelector(".plus-card"), plate:!!document.querySelector(".plate") }));
    ok("free tier: 3 cups of tea, a minimal Today with the Plus card", !s.plus && s.cups === 3 && s.tiles === 0 && s.card && !s.plate, JSON.stringify(s));
    await page.click("#tab-journey"); await page.waitForTimeout(300);
    const g = await page.evaluate(() => [...document.querySelectorAll(".crow")].map((c) => c.dataset.gate));
    ok("free tier: cities 2–7 open with an ad, cities 8–20 are Plus", g[0] === "" && g.slice(1, 7).every((x) => x === "ad") && g.slice(7).every((x) => x === "plus"), g.join(","));
    await page.locator(".crow").nth(12).click(); await page.waitForTimeout(400);
    ok("free tier: tapping a Plus city explains it and offers the plans", await page.locator("#nsheet:not([hidden]) [data-act=plus]").count() === 1);
    await page.click("#nsheet [data-act=sheet-close]"); await page.waitForTimeout(400);
    // lesson with mistakes
    await page.click("#tab-today"); await page.waitForTimeout(300); await page.click(".td-go"); await page.waitForTimeout(600);
    let wrongs = 0, sheet = false, refilled = false;
    for (let k = 0; k < 45; k++) {
      if (await page.locator("#nsheet:not([hidden]) [data-act=cup-ad]").count()) { sheet = true; await page.click("#nsheet [data-act=cup-ad]"); await closeAd(page); refilled = await page.evaluate(() => window.__wakha.S.cups === 1 && window.__wakha.Lesson.active); continue; }
      const lc = await lessonCard(page); if (!lc || lc.t === "end") break;
      const wrong = ["pick", "rev", "listen"].includes(lc.t) && wrongs < 3; if (wrong) wrongs++;
      await solveStep(page, !wrong).catch(() => {});
      if (await page.locator("#lesson .l-end").count()) break;
    }
    ok("free tier: 3 mistakes empty the cups and stop the lesson until an ad pours one", wrongs === 3 && sheet && refilled, `wrongs ${wrongs}, sheet ${sheet}, refilled ${refilled}`);
    await page.waitForTimeout(400); await page.click('#lesson [data-act="finish"]');
    let adAfter = true; try { await closeAd(page); } catch (e) { adAfter = false; }
    ok("free tier: an ad plays after each finished lesson", adAfter && await page.evaluate(() => !window.__wakha.Lesson.active));
    for (let i = 0; i < 3 && await page.locator("#overlay:not([hidden]) .cta").count(); i++) { await page.click("#overlay .cta"); await page.waitForTimeout(400); }
    // finish Tangier, then Asilah opens with an ad
    await page.evaluate(() => { const A = window.__wakha; A.PATH.filter((p) => p.unit === 0).forEach((p) => (A.S.lessons[p.id] = { stars:2 })); A.setView("journey"); A.setView("today"); });
    await page.waitForTimeout(1300);
    for (let i = 0; i < 3 && await page.locator("#overlay:not([hidden]) .cta").count(); i++) { await page.click("#overlay .cta"); await page.waitForTimeout(500); }
    const btn = await page.locator(".td-go[data-act=adopen]").count();
    await page.click(".td-go"); await closeAd(page); await page.waitForTimeout(300);
    const op = await page.evaluate(() => ({ open:!!window.__wakha.S.adOpen && window.__wakha.S.adOpen.u11, gate:window.__wakha.cityGate(1) }));
    ok("free tier: Today offers to open the next city with an ad, and watching it opens the city", btn === 1 && op.open && op.gate === null, JSON.stringify(op));
    // feed: ad card and the 5-minute limit
    await page.click("#tab-feed"); await page.waitForTimeout(600);
    const types = await page.evaluate(() => { const F = window.__wakha.Feed; while (F.cards.length < 8) F.push(); return F.cards.map((c) => c.spec.t); });
    ok("free tier: the feed has ad cards baked in", types[6] === "ad", types.join(","));
    await page.evaluate(() => { window.__wakha.S.feedSec = { d:window.__wakha.today(), s:299 }; }); await page.waitForTimeout(1600);
    ok("free tier: the feed stops after 5 minutes a day", await page.locator("#feedlock:not([hidden])").count() === 1);
    // guide banner, dev switch
    await page.click("#tab-guide"); await page.waitForTimeout(300);
    ok("free tier: the Guide shows a small ad banner", await page.locator("#v-guide .ad-banner").count() === 1);
    await page.click("#tab-me"); await page.waitForTimeout(300); await page.click('[data-dev-tier="plus"]'); await page.waitForTimeout(300);
    const dv = await page.evaluate(() => ({ plus:window.__wakha.isPlus(), inf:!!document.querySelector("#hud-cups .inf") }));
    await page.click('[data-dev-tier="free"]'); await page.waitForTimeout(300);
    const dv2 = await page.evaluate(() => window.__wakha.isPlus());
    ok("developer switch in Me flips between Plus and Free", dv.plus && dv.inf && !dv2, JSON.stringify(dv));
    // paywall subscribe
    await page.click('[data-dev-tier="auto"]'); await page.waitForTimeout(200);
    await page.evaluate(() => window.__wakha.openPaywall("test")); await page.waitForTimeout(300); await page.click('[data-plan="monthly"]'); await page.click("[data-pw=buy]"); await page.waitForTimeout(400);
    const sub = await page.evaluate(() => ({ sub:window.__wakha.S.plan.sub, plus:window.__wakha.isPlus() }));
    ok("paywall: choosing a plan turns Plus on after the trial (simulated payment)", sub.sub === "monthly" && sub.plus, JSON.stringify(sub));
    allErr.push(...errors); await browser.close(); }
  // 3 cups refill the next morning
  { const { browser, page, errors } = await openApp({ storage:base({ plan:FREE, cups:0, cupsDay:"2026-10-23" }), time:"2026-10-24T10:00:00" });
    ok("free tier: cups fill up again every morning", await page.evaluate(() => window.__wakha.cupsLeft()) === 3);
    allErr.push(...errors); await browser.close(); }
  ok("no script errors", allErr.length === 0, allErr.join(" | ").slice(0, 300));
  console.log(res.join("\n")); console.log(`${res.filter((r) => r.startsWith("PASS")).length}/${res.length} passed`);
})();

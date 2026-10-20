// Functional checks: persistence, day rollover, streak rules, SRS scheduling, language switch,
// review injection, reset, and the db/downloads capability paths with a mocked platform.
const { openApp, active, next } = require("./harness");
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"}  ${name}${info ? "  (" + info + ")" : ""}`);

const W = (ids, b, due, intro) => Object.fromEntries(ids.map((x) => [x, { b, due, s: 1, c: b, w: 0, intro, fav: false }]));

(async () => {
  // 1. persistence across reload
  {
    const { browser, page, context } = await openApp({ time: "2026-10-20T09:00:00" });
    await page.click('.card[data-i="0"] .vibe[data-v="family"]');
    await page.waitForTimeout(1800);
    const a = await active(page);
    if (a.t === "quiz") await page.click(`.card[data-i="${a.i}"] .opt[data-id="${a.w}"]`);
    await page.waitForTimeout(1500);
    const before = await page.evaluate(() => ({ xp: window.__wakha.S.xp, vibe: window.__wakha.S.vibe, words: Object.keys(window.__wakha.S.words) }));
    await page.reload(); await page.waitForTimeout(900);
    const after = await page.evaluate(() => ({ xp: window.__wakha.S.xp, vibe: window.__wakha.S.vibe, words: Object.keys(window.__wakha.S.words), first: window.__wakha.Feed.cards[0].spec.t }));
    ok("progress survives a reload", after.xp === before.xp && after.xp > 0 && after.vibe === "family", `xp ${before.xp} -> ${after.xp}`);
    ok("same-day reopen skips onboarding", after.first !== "welcome", "first card: " + after.first);
    await browser.close();
  }
  // 2. day 2 comeback + streak continues + due reviews first
  {
    const st = { v: 1, onboarded: true, goalChosen: true, goal: 100, xp: 300, streak: 3, best: 3, lastGoalDay: "2026-10-20", lastOpen: "2026-10-20", dayCount: 3,
      words: Object.assign(W(["salam", "labas", "wakha", "bzzaf"], 1, "2026-10-21", "2026-10-19"), W(["atay", "daba"], 2, "2026-10-24", "2026-10-18")),
      days: { "2026-10-20": { xp: 120, n: 30, c: 10, w: 2, goalMet: true } } };
    const { browser, page } = await openApp({ time: "2026-10-21T08:00:00", storage: JSON.stringify(st) });
    const a0 = await active(page);
    const hud = await page.locator("#hud-streak b").innerText();
    ok("new day opens with the comeback card", a0.t === "comeback", a0.t);
    ok("streak shows 3 the next morning", hud === "3", "HUD " + hud);
    const badge = await page.locator("#tab-words .badge").innerText();
    ok("Words tab badge counts due words", badge === "4", "badge " + badge);
    const a1 = await next(page); const a2 = await next(page);
    ok("due words are reviewed first", ["quiz", "rev"].includes(a1.t) && ["salam", "labas", "wakha", "bzzaf"].includes(a1.w) && ["quiz", "rev"].includes(a2.t), `${a1.t}:${a1.w}, ${a2.t}:${a2.w}`);
    // answer correctly -> box 2, due in 3 days
    await page.click(`.card[data-i="${a2.i}"] .opt[data-id="${a2.w}"]`);
    await page.waitForTimeout(400);
    const srs = await page.evaluate((w) => window.__wakha.S.words[w], a2.w);
    ok("correct review moves word to box 2, due in 3 days", srs.b === 2 && srs.due === "2026-10-24", JSON.stringify({ b: srs.b, due: srs.due }));
    // reach the goal today -> streak 4
    await page.evaluate(() => { const S = window.__wakha.S; S.days["2026-10-21"] = S.days["2026-10-21"] || { xp: 0, n: 0, c: 0, w: 0, goalMet: false }; S.days["2026-10-21"].xp = 95; });
    await page.evaluate(() => window.__wakha.inject({ t: "quiz", w: "atay" }));
    const a3 = await next(page);
    await page.click(`.card[data-i="${a3.i}"] .opt[data-id="atay"]`);
    await page.waitForTimeout(1500);
    const seen = [];
    for (let k = 0; k < 3; k++) {
      const o = await page.evaluate(() => (document.querySelector("#overlay").hidden ? "" : document.querySelector("#overlay .ov-t").innerText));
      if (!o) break; seen.push(o); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(800);
    }
    const s2 = await page.evaluate(() => ({ streak: window.__wakha.S.streak }));
    ok("hitting the goal on day 2 grows the streak to 4 and celebrates (queued after any level-up)", s2.streak === 4 && seen.some((x) => /Atay wajed/.test(x)), `streak ${s2.streak}, overlays: ${seen.join(" then ")}`);
    await browser.close();
  }
  // 3. missed a day: no shield -> streak broken; with shield -> saved
  for (const shields of [0, 1]) {
    const st = { v: 1, onboarded: true, goalChosen: true, goal: 50, xp: 300, streak: 5, best: 5, lastGoalDay: "2026-10-20", lastOpen: "2026-10-20", shields, words: W(["salam", "labas", "wakha"], 1, "2026-10-30", "2026-10-19"), days: {} };
    const { browser, page } = await openApp({ time: "2026-10-22T08:00:00", storage: JSON.stringify(st) });
    const hud = await page.locator("#hud-streak b").innerText();
    await page.evaluate(() => { const S = window.__wakha.S; S.days["2026-10-22"] = { xp: 45, n: 0, c: 0, w: 0, goalMet: false }; });
    await next(page);
    let a = await active(page);
    for (let k = 0; k < 6 && !["quiz", "rev"].includes(a.t); k++) a = await next(page);
    await page.click(`.card[data-i="${a.i}"] .opt[data-id="${a.w}"]`);
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => ({ streak: window.__wakha.S.streak, shields: window.__wakha.S.shields, txt: document.querySelector("#overlay").innerText }));
    if (shields === 0) ok("missed day without shield: streak shows 0, restarts at 1", hud === "0" && s.streak === 1, `HUD ${hud}, after goal ${s.streak}`);
    else ok("missed day with a shield: streak kept (5 -> 6) and shield used", hud === "5" && s.streak === 6 && s.shields === 0 && /shield/i.test(s.txt), `HUD ${hud}, after ${s.streak}, shields ${s.shields}`);
    await browser.close();
  }
  // 4. wrong answer re-queues the word within a few cards
  {
    const st = { v: 1, onboarded: true, goalChosen: true, xp: 200, lastOpen: "2026-10-20", words: W(["salam", "labas", "wakha", "bzzaf", "atay", "daba", "ghali", "chhal"], 1, "2026-10-30", "2026-10-19") };
    const { browser, page } = await openApp({ time: "2026-10-20T12:00:00", storage: JSON.stringify(st) });
    await page.evaluate(() => window.__wakha.inject({ t: "quiz", w: "atay" }));
    const a = await next(page);
    await page.click(`.card[data-i="${a.i}"] .opt:not([data-id="atay"]) >> nth=0`);
    await page.waitForTimeout(400);
    const srs = await page.evaluate(() => window.__wakha.S.words.atay);
    let found = -1;
    for (let k = 1; k <= 8; k++) { const c = await next(page); if (c.w === "atay" && ["quiz", "rev"].includes(c.t)) { found = k; break; } }
    ok("wrong answer drops the word to box 0 and it comes back within 8 cards", srs.b === 0 && found > 0, `box ${srs.b}, back after ${found} cards`);
    await browser.close();
  }
  // 5. French: UI and new cards switch
  {
    const { browser, page } = await openApp({ locale: "fr-FR", time: "2026-10-20T12:00:00" });
    const t1 = await page.locator('.card[data-i="0"]').innerText();
    ok("French device gets the French UI", /Bienvenue sur Wakha/.test(t1) && /Pourquoi la darija/.test(t1));
    await page.evaluate(() => window.__wakha.setTab("me"));
    await page.click('[data-lang="en"]');
    await page.evaluate(() => window.__wakha.setTab("feed"));
    const a = await next(page);
    const txt = await page.locator(`.card[data-i="${a.i}"]`).innerText();
    ok("switching to English re-renders upcoming cards", /What does this mean|New word|How do you say/.test(txt), a.t);
    await browser.close();
  }
  // 6. reset progress needs a confirm step
  {
    const st = { v: 1, onboarded: true, goalChosen: true, xp: 700, lastOpen: "2026-10-20", words: W(["salam", "labas"], 2, "2026-10-30", "2026-10-19") };
    const { browser, page } = await openApp({ time: "2026-10-20T12:00:00", storage: JSON.stringify(st) });
    await page.evaluate(() => window.__wakha.setTab("me"));
    await page.click("[data-act=reset]");
    const vis = await page.locator(".confirm:not([hidden])").count();
    await page.click("[data-act=cancel]");
    const xpAfterCancel = await page.evaluate(() => window.__wakha.S.xp);
    await page.click("[data-act=reset]"); await page.click("[data-act=erase]"); await page.waitForTimeout(500);
    const s = await page.evaluate(() => ({ xp: window.__wakha.S.xp, first: window.__wakha.Feed.cards[0].spec.t, saved: localStorage.getItem("wakha.v1") }));
    ok("reset asks first, cancel keeps progress, erase restarts onboarding", vis === 1 && xpAfterCancel === 700 && s.xp === 0 && s.first === "welcome" && JSON.parse(s.saved).xp === 0);
    await browser.close();
  }
  // 7. Words sheet review button injects due reviews into the feed
  {
    const st = { v: 1, onboarded: true, goalChosen: true, xp: 300, lastOpen: "2026-10-21", words: Object.assign(W(["zwin", "khobz", "lma"], 1, "2026-10-21", "2026-10-19"), W(["salam"], 3, "2026-10-28", "2026-10-15")) };
    const { browser, page } = await openApp({ time: "2026-10-21T12:00:00", storage: JSON.stringify(st) });
    await page.evaluate(() => window.__wakha.setTab("words"));
    const btn = await page.locator("[data-act=review]").innerText();
    await page.click("[data-act=review]");
    await page.waitForTimeout(1200);
    const a = await active(page);
    ok("Review button jumps to a due-word quiz", /Review 3/.test(btn) && ["quiz", "rev"].includes(a.t) && ["zwin", "khobz", "lma"].includes(a.w), `${btn} -> ${a.t}:${a.w}`);
    await browser.close();
  }
  // 8. mocked platform: db save/load per viewer + downloads for story images
  {
    const mock = () => {
      const store = (window.__store = window.__store || {});
      const saves = (window.__saves = []);
      const doc = (path) => ({ path, async get() { const d = store[path]; return { exists: !!d, data: () => d, id: path.split("/").pop(), metadata: {} }; }, async set(v) { store[path] = JSON.parse(JSON.stringify(v)); }, async update(v) { Object.assign(store[path], v); }, async delete() { delete store[path]; } });
      const db = Object.freeze({ doc, collection: () => ({}) });
      const user = Object.freeze({ id: async () => "u_test1", isOwner: async () => true, canEdit: async () => true, can: async () => true });
      const downloads = Object.freeze({ save: async (o) => { saves.push({ filename: o.filename, size: o.data && o.data.size, type: o.data && o.data.type }); return { status: "saved" }; } });
      const map = { db, user, downloads };
      window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(map[n] || null), 50)) };
    };
    const remote = { v: 1, onboarded: true, goalChosen: true, xp: 999, streak: 9, best: 9, lastGoalDay: "2026-10-19", lastOpen: "2026-10-19", updatedAt: 1, words: W(["salam", "labas", "wakha", "bzzaf", "atay"], 3, "2026-10-25", "2026-10-10") };
    const seed = (r) => { window.__store = { "data/users/u_test1/progress": r }; };
    const { browser, page } = await openApp({ time: "2026-10-20T12:00:00", initScript: `(${seed.toString()})(${JSON.stringify(remote)}); (${mock.toString()})();` });
    await page.waitForTimeout(1500);
    const s = await page.evaluate(() => ({ xp: window.__wakha.S.xp, first: window.__wakha.Feed.cards[0].spec.t }));
    ok("signed-in viewer on a new device gets their saved progress", s.xp === 999 && s.first === "comeback", `xp ${s.xp}, first ${s.first}`);
    await page.evaluate(() => window.__wakha.inject({ t: "quiz", w: "atay" }));
    const a = await next(page);
    await page.click(`.card[data-i="${a.i}"] .opt[data-id="atay"]`);
    await page.waitForTimeout(5200);
    const stored = await page.evaluate(() => window.__store["data/users/u_test1/progress"].xp);
    ok("progress is written back to the private per-viewer doc", stored > 999, "stored xp " + stored);
    await page.evaluate(() => window.__wakha.inject({ t: "learn", w: "zwin" }));
    const b = await next(page);
    await page.click(`.card[data-i="${b.i}"] [data-act=share]`);
    await page.waitForTimeout(2500);
    const saves = await page.evaluate(() => window.__saves);
    ok("Share hands a PNG story image to the downloads capability", saves.length === 1 && saves[0].filename.endsWith(".png") && saves[0].type === "image/png" && saves[0].size > 20000, JSON.stringify(saves[0] || {}));
    await browser.close();
  }
  // 9. no platform: share falls back to copying text
  {
    const { browser, page, context } = await openApp({ time: "2026-10-20T12:00:00", storage: JSON.stringify({ v: 1, onboarded: true, goalChosen: true, lastOpen: "2026-10-20", xp: 10 }) });
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "https://artifact.test" });
    await page.evaluate(() => window.__wakha.inject({ t: "learn", w: "bzzaf" }));
    const b = await next(page);
    await page.click(`.card[data-i="${b.i}"] [data-act=share]`);
    await page.waitForTimeout(400);
    const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => "ERR " + e.message));
    const toast = await page.locator("#toast").innerText();
    ok("without the platform, Share copies a text card", /Bzzaf/.test(clip) && /Copied/.test(toast), clip.slice(0, 60));
    await browser.close();
  }
  console.log(results.join("\n"));
})().catch((e) => { console.error("FAILED", e); console.log(results.join("\n")); process.exit(1); });

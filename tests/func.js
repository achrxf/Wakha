const { openApp, lessonCard, next, active } = require("./harness");
const { playLesson, solveStep, clickCont } = require("./play");
const results = [];
const ok = (name, cond, info = "") => results.push(`${cond ? "PASS" : "FAIL"}  ${name}${info ? "  (" + info + ")" : ""}`);
const W = (ids, b, due, intro) => Object.fromEntries(ids.map((x) => [x, { b, due, s: 1, c: b, w: 0, intro, fav: false }]));
const base = (extra) => JSON.stringify(Object.assign({ v: 2, onboarded: true, goalChosen: true, goal: 100, lastOpen: "2026-10-21", dayCount: 2 }, extra));
(async () => {
  // 1 onboarding -> lesson 1 -> path advances -> reload keeps it
  {
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00" });
    const w1 = await page.locator("#welcome:not([hidden])").count();
    await page.click("#welcome [data-w=next]"); await page.click('#welcome .goal-pick[data-goal="50"]'); await page.waitForTimeout(900);
    const lc = await lessonCard(page);
    ok("first open shows welcome, then goal, then starts lesson 1", w1 === 1 && lc && lc.t === "scene", JSON.stringify(lc));
    await playLesson(page); await page.waitForTimeout(500);
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(900);
    for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(400); }
    const s = await page.evaluate(() => ({ l: window.__wakha.S.lessons, cur: window.__wakha.currentNode(), goal: window.__wakha.S.goal, cls: document.querySelector('.jr-row[data-node="1"]').className }));
    ok("finishing lesson 1 saves stars and makes lesson 2 current", s.l.u1l1 && s.l.u1l1.stars >= 1 && s.cur === 1 && /current/.test(s.cls), JSON.stringify(s.l));
    await page.reload(); await page.waitForTimeout(900);
    const r = await page.evaluate(() => ({ l: Object.keys(window.__wakha.S.lessons), welcome: !document.querySelector("#welcome").hidden, goal: window.__wakha.S.goal }));
    ok("reload keeps lesson progress and skips welcome", r.l.includes("u1l1") && !r.welcome && r.goal === 50, JSON.stringify(r));
    await browser.close();
  }
  // 2 locked node, quit lesson, wrong answer retried
  {
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base({ lessons: { u1l1: { stars: 3, done: "2026-10-20", n: 1 } }, words: W(["salam", "labas", "hamdoulillah"], 1, "2026-10-25", "2026-10-20") }) });
    await page.click("#tab-journey"); await page.waitForTimeout(500);
    await page.evaluate(() => { const t = document.querySelector(".jr-track"); t.scrollLeft = t.clientWidth; }); await page.waitForTimeout(400);
    await page.click('.jr-row[data-node="7"]'); await page.waitForTimeout(400);
    const locked = await page.evaluate(() => ({ txt: document.querySelector("#nsheet").innerText, btn: !!document.querySelector("#nsheet [data-start]") }));
    ok("tapping a locked lesson explains how to unlock it, with no start button", /Finish the lesson/.test(locked.txt) && !locked.btn);
    await page.click("#sheet-scrim", { position: { x: 10, y: 100 } });
    await page.click("#tab-today"); await page.waitForTimeout(400);
    await page.click(".hero [data-start]"); await page.waitForTimeout(500);
    const n0 = (await lessonCard(page)).n;
    // play until first quiz, answer wrong
    let wrongDone = false;
    for (let k = 0; k < 8 && !wrongDone; k++) { const lc = await lessonCard(page); if (["pick", "listen", "rev"].includes(lc.t)) { await solveStep(page, false); wrongDone = true; } else await solveStep(page, true); }
    const n1 = (await lessonCard(page)).n;
    ok("a wrong answer adds that question again at the end", n1 === n0 + 1, `${n0} -> ${n1}`);
    await page.click("#lesson [data-act=quit]"); await page.waitForTimeout(200);
    const conf = await page.locator(".l-confirm:not([hidden])").count();
    await page.click("#lesson [data-act=leave]"); await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ open: !document.querySelector("#lesson").hidden, l2: !!window.__wakha.S.lessons.u1l2 }));
    ok("quitting asks first and does not mark the lesson done", conf === 1 && !after.open && !after.l2);
    await browser.close();
  }
  // 3 unit review completes unit -> unit overlay; boss works
  {
    const st = { lessons: { u1l1: { stars: 3 }, u1l2: { stars: 3 }, u1l3: { stars: 2 }, u1l4: { stars: 2 }, u1s: { stars: 3 } }, words: W(["salam", "labas", "hamdoulillah", "bikhir", "kidayr", "sba7", "merhba", "bslama", "tsb7", "msalkhir", "mtcharfin", "kolchi"], 1, "2026-10-25", "2026-10-19") };
    const { browser, page, errors } = await openApp({ time: "2026-10-21T09:00:00", storage: base(st) });
    await page.click(".hero [data-start]"); await page.waitForTimeout(500);
    const kind = await page.evaluate(() => window.__wakha.Lesson.node.kind);
    const log = await playLesson(page); await page.waitForTimeout(400);
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(1200);
    const ov = []; for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { ov.push(await page.locator("#overlay .ov-box").innerText()); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(1000); }
    ok("finishing a unit review unlocks the next unit with a celebration", kind === "review" && ov.some((x) => /Next stop: Chefchaouen/.test(x)), `${log.length} steps, overlays: ${ov.join(" / ")}`);
    // boss
    await page.evaluate(() => { const S = window.__wakha.S; for (const n of window.__wakha.PATH) { if (n.id === "u5r") break; S.lessons[n.id] = { stars: 2 }; } window.__wakha.setView("learn"); });
    await page.waitForTimeout(300);
    await page.click(".hero [data-start]"); await page.waitForTimeout(600);
    const bk = await page.evaluate(() => window.__wakha.Lesson.node.kind);
    await solveStep(page); await page.waitForTimeout(500); await solveStep(page); await page.waitForTimeout(1500);
    const end = await page.locator("#lesson .l-end").count();
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(600);
    const b = await page.evaluate(() => window.__wakha.S.lessons.u5r);
    ok("the souk boss lesson plays the haggle and records stars", bk === "boss" && end === 1 && b && b.stars >= 1, JSON.stringify(b));
    ok("no script errors in unit and boss flows", errors.length === 0, errors.join(" | "));
    await browser.close();
  }
  // 4 practice due words updates spaced repetition
  {
    const st = { lessons: { u1l1: { stars: 3 } }, words: Object.assign(W(["salam", "labas", "hamdoulillah"], 1, "2026-10-21", "2026-10-19"), W(["bikhir"], 2, "2026-10-30", "2026-10-19")) };
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base(st) });
    const badge = await page.locator("#tab-today .badge").innerText();
    const pr = await page.locator(".td-card[data-act=practice]").innerText();
    await page.click(".td-card[data-act=practice]"); await page.waitForTimeout(500);
    await playLesson(page); await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(500);
    const s = await page.evaluate(() => ["salam", "labas", "hamdoulillah"].map((id) => window.__wakha.S.words[id]));
    ok("practice button shows due count and reviewing pushes words to later dates", badge === "3" && /3 words are ready/.test(pr) && s.every((x) => x.b >= 2 && x.due > "2026-10-21"), s.map((x) => x.b + "@" + x.due).join(", "));
    await browser.close();
  }
  // 5 streak across days with goal
  {
    const st = { goal: 50, xp: 200, streak: 3, best: 3, lastGoalDay: "2026-10-20", lastOpen: "2026-10-20", lessons: { u1l1: { stars: 3 } }, words: W(["salam", "labas", "hamdoulillah"], 1, "2026-10-30", "2026-10-19") };
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base(st) });
    
    await page.click(".hero [data-start]"); await page.waitForTimeout(400);
    await playLesson(page); await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(1200);
    const ovs = []; for (let k = 0; k < 4; k++) { if (await page.locator("#overlay:not([hidden])").count()) { ovs.push(await page.locator("#overlay .ov-t").innerText()); await page.click("#overlay [data-ov=close]"); } await page.waitForTimeout(1200); }
    const s = await page.evaluate(() => window.__wakha.S.streak);
    ok("next-day lesson that fills the goal grows the streak 3 -> 4, celebrated after the lesson", s === 4 && ovs.some((x) => /days in a row/.test(x)) && ovs.some((x) => /Atay wajed/.test(x)), `overlays: ${ovs.join(" / ")}`);
    await browser.close();
  }
  // 6 feed: nudge for new users, comeback on a new day
  {
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base({}) });
    await page.click("#tab-feed"); await page.waitForTimeout(600);
    const a = await active(page);
    ok("feed for a brand-new learner opens with a nudge to start lesson 1", a.t === "nudge", a.t);
    await page.click(`.feed .card[data-i="${a.i}"] [data-act=go]`); await page.waitForTimeout(600);
    const lc = await lessonCard(page);
    ok("the nudge button starts lesson 1", lc && lc.t === "scene" && await page.evaluate(() => window.__wakha.Lesson.node.id) === "u1l1");
    await browser.close();
  }
  {
    const st = { lastOpen: "2026-10-20", lessons: { u1l1: { stars: 3 } }, words: W(["salam", "labas", "hamdoulillah", "bikhir"], 1, "2026-10-21", "2026-10-19") };
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base(st) });
    await page.click("#tab-feed"); await page.waitForTimeout(600);
    const a = await active(page); const b = await next(page);
    ok("on a new day the feed opens with a welcome-back card, then due reviews", a.t === "comeback" && ["pick", "rev", "listen"].includes(b.t), `${a.t} -> ${b.t}:${b.w}`);
    await browser.close();
  }
  // 7 guide
  {
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base({ words: W(["salam", "labas"], 1, "2026-10-25", "2026-10-19") }) });
    await page.click("#tab-guide"); await page.waitForTimeout(300);
    await page.click('[data-snd="gh"]'); await page.waitForTimeout(500);
    const g = await page.locator(".gpanel h3").innerText();
    await page.click('[data-gt="phrasebook"]'); await page.fill("#pb-q", "tea"); await page.waitForTimeout(300);
    const rows = await page.locator(".pbrow .d").allInnerTexts();
    await page.fill("#pb-q", ""); await page.click('[data-pbf="learned"]'); await page.waitForTimeout(200);
    const learned = await page.locator(".pbrow").count();
    ok("Guide sound tiles switch the detail panel", g === "gh");
    ok("Phrasebook search finds words by meaning", rows.includes("Atay"), rows.join(","));
    ok("Phrasebook Learned filter shows only learned words", learned === 2, String(learned));
    await browser.close();
  }
  // 8 French + reset
  {
    const { browser, page } = await openApp({ locale: "fr-FR", time: "2026-10-21T09:00:00" });
    const t1 = await page.locator("#welcome").innerText();
    ok("French device gets French onboarding", /Apprends la darija/.test(t1));
    await browser.close();
  }
  {
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", storage: base({ xp: 900, lessons: { u1l1: { stars: 3 } } }) });
    await page.click("#tab-me"); await page.click("[data-act=reset]"); const vis = await page.locator(".confirm:not([hidden])").count();
    await page.click("[data-act=erase]"); await page.waitForTimeout(500);
    const s = await page.evaluate(() => ({ xp: window.__wakha.S.xp, w: !document.querySelector("#welcome").hidden }));
    ok("reset asks first, then wipes progress and shows welcome", vis === 1 && s.xp === 0 && s.w);
    await browser.close();
  }
  // 9 mocked platform: cloud save per viewer + story image
  {
    const mock = () => {
      const store = (window.__store = window.__store || {}); window.__saves = [];
      const doc = (path) => ({ path, async get() { const d = store[path]; return { exists: !!d, data: () => d }; }, async set(v) { store[path] = JSON.parse(JSON.stringify(v)); } });
      const map = { db: Object.freeze({ doc }), user: Object.freeze({ id: async () => "u_t" }), downloads: Object.freeze({ save: async (o) => { window.__saves.push({ name: o.filename, size: o.data.size, type: o.data.type }); return { status: "saved" }; } }) };
      window.claude = { use: (n) => new Promise((r) => setTimeout(() => r(map[n] || null), 40)) };
    };
    const remote = { v: 2, onboarded: true, goalChosen: true, xp: 777, updatedAt: 1, lessons: { u1l1: { stars: 3 }, u1l2: { stars: 2 } }, words: W(["salam", "labas", "hamdoulillah", "bikhir"], 2, "2026-10-28", "2026-10-15") };
    const seed = (r) => { window.__store = { "data/users/u_t/progress": r }; };
    const { browser, page } = await openApp({ time: "2026-10-21T09:00:00", initScript: `(${seed.toString()})(${JSON.stringify(remote)});(${mock.toString()})();` });
    await page.waitForTimeout(1200);
    const s = await page.evaluate(() => ({ xp: window.__wakha.S.xp, cur: window.__wakha.currentNode(), welcome: !document.querySelector("#welcome").hidden }));
    ok("signed-in learner on a new device gets their saved path", s.xp === 777 && s.cur === 2 && !s.welcome, JSON.stringify(s));
    await page.click(".hero [data-start]"); await page.waitForTimeout(300); for (let k = 0; k < 4; k++) { await solveStep(page); await page.waitForTimeout(300); } await page.waitForTimeout(4600);
    const stored = await page.evaluate(() => window.__store["data/users/u_t/progress"].xp);
    ok("progress is written back to the private per-learner record", stored > 777, String(stored));
    await page.click("#lesson [data-act=quit]"); await page.click("#lesson [data-act=leave]");
    await page.click("#tab-feed"); await page.evaluate(() => window.__wakha.inject({ t: "spot", w: "labas" })); const c = await next(page);
    await page.click(`.feed .card[data-i="${c.i}"] [data-act=share]`); await page.waitForTimeout(2500);
    const sv = await page.evaluate(() => window.__saves);
    ok("Share saves a story image through the platform", sv.length === 1 && sv[0].type === "image/png" && sv[0].size > 20000, JSON.stringify(sv[0] || {}));
    await browser.close();
  }
  console.log(results.join("\n"));
})().catch((e) => { console.error("FAILED", e); console.log(results.join("\n")); process.exit(1); });

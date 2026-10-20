// Engagement audit: a bot plays multi-day sessions through the real UI.
// Each action is charged a human-like duration, so metrics are in "player seconds".
const { openApp, active, next } = require("./harness");
const rnd = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

async function closeOverlays(page, ev, clock) {
  for (let k = 0; k < 3; k++) {
    const o = await page.locator("#overlay:not([hidden])").count();
    if (!o) return;
    const txt = await page.locator("#overlay .ov-k").innerText().catch(() => "");
    ev.push({ t: clock.t, kind: txt.includes("Level") ? "LEVEL" : "GOAL" });
    clock.t += 3;
    await page.click("#overlay [data-ov=close]");
    await page.waitForTimeout(250);
  }
}
async function snap(page) {
  return page.evaluate(() => { const S = window.__wakha.S; return { xp: S.xp, kenz: Object.keys(S.kenz).length, words: Object.keys(S.words).length, lvl: window.__wakha.levelInfo(S.xp).n, streak: S.streak, goalMet: !!(S.days[window.__wakha.today()] || {}).goalMet }; });
}
async function playCard(page0, a, clock) {
  const sel = `.card[data-i="${a.i}"]`;
  const clearOv = async () => { for (let k = 0; k < 3; k++) { if (!(await page0.locator("#overlay:not([hidden])").count())) return; clock.ov = (clock.ov || 0) + 1; await page0.click("#overlay [data-ov=close]").catch(() => {}); await page0.waitForTimeout(300); } };
  const page = new Proxy(page0, { get(tg, k) {
    if (k === "click") return async (sl, o) => { await clearOv(); try { return await tg.click(sl, Object.assign({ timeout: 5000 }, o || {})); } catch (e) { await clearOv(); return tg.click(sl, Object.assign({ timeout: 5000 }, o || {})); } };
    const v = tg[k]; return typeof v === "function" ? v.bind(tg) : v; } });
  const has = async (s) => (await page.locator(`${sel} ${s}`).count()) > 0;
  switch (a.t) {
    case "welcome": clock.t += rnd(3, 6); await page.click(`${sel} .vibe >> nth=${Math.floor(Math.random() * 4)}`); await page.waitForTimeout(300); return "acted";
    case "goal": clock.t += rnd(3, 5); await page.click(`${sel} .pick[data-n="150"]`); await page.waitForTimeout(300); return "acted";
    case "learn": {
      clock.t += rnd(3, 6);
      if (chance(0.5)) { const b = await page.locator(`${sel} .card-in`).boundingBox(); await page.mouse.dblclick(b.x + b.width * 0.4, b.y + b.height * 0.5); clock.t += 0.6; await page.waitForTimeout(150); }
      return "acted";
    }
    case "quiz": case "rev": {
      clock.t += rnd(2.5, 5);
      const box = await page.evaluate((w) => (window.__wakha.S.words[w] || {}).b || 0, a.w);
      const ok = chance(box >= 1 ? 0.86 : 0.74);
      if (ok) await page.click(`${sel} .opt[data-id="${a.w}"]`); else await page.click(`${sel} .opt:not([data-id="${a.w}"]) >> nth=0`);
      await page.waitForTimeout(300); clock.t += 1.2; return ok ? "right" : "wrong";
    }
    case "sit": { clock.t += rnd(4, 7); const ok = chance(0.68); await page.click(`${sel} .opt[data-k="${ok ? 0 : 1 + Math.floor(Math.random() * 3)}"]`); await page.waitForTimeout(300); clock.t += 2; return ok ? "right" : "wrong"; }
    case "build": {
      const spec = await page.evaluate((i) => window.__wakha.Feed.cards[i].spec.id, a.i);
      for (let attempt = 0; attempt < 2; attempt++) {
        clock.t += rnd(5, 9);
        const ok = chance(attempt === 0 ? 0.6 : 0.75);
        const toks = await page.evaluate((id) => { const B = { tea:["bghit","atay","b","na3na3"], wc:["fin","kayn","bit","lma"], much:["b","chhal","hada"], didnt:["ma","fhemt","ch"], slow:["hder","bchwiya","3afak"], pretty:["hada","zwin","bzzaf"], home:["ana","ghadi","l","ddar"], dontwant:["ma","bghit","ch"], tomorrow:["nchoufek","ghedda"], water:["3tini","lma","3afak"], wifi:["makaynch","lwifi"], welcome:["mer7ba","bik","f","lmghrib"], allgood:["kolchi","mzyan","l7amdoulillah"] }; return B[id]; }, spec);
        const order = ok ? toks : toks.slice().reverse();
        for (const tk of order) {
          const btns = page.locator(`${sel} .pool .tok:not(.ghost)`);
          const n = await btns.count(); let done = false;
          for (let k = 0; k < n; k++) { if ((await btns.nth(k).innerText()) === tk) { await btns.nth(k).click(); done = true; break; } }
          if (!done && n) await btns.first().click();
          await page.waitForTimeout(60);
        }
        await page.waitForTimeout(700);
        if (await has(".slots.ok")) return attempt === 0 && ok ? "right" : ok ? "right2" : "wrong";
        await page.waitForTimeout(400);
      }
      return "wrong";
    }
    case "reel": {
      const n = await page.locator(`${sel} .slide`).count();
      for (let k = 0; k < n - 1; k++) { clock.t += rnd(2.5, 4); const b = await page.locator(sel).boundingBox(); await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.45); await page.waitForTimeout(150); }
      clock.t += 2; await page.click(`${sel} .slide.on [data-act=done]`); await page.waitForTimeout(400); return "acted";
    }
    case "mystery": clock.t += rnd(1.5, 3); await page.click(`${sel} [data-act=open]`); await page.waitForTimeout(1000); clock.t += 3; return "box";
    case "drop": clock.t += rnd(1.5, 3); await page.click(`${sel} [data-act=flip]`); await page.waitForTimeout(900); clock.t += 3; return "box";
    case "lightning": {
      clock.t += 2; await page.click(`${sel} [data-act=go]`); await page.waitForTimeout(200);
      for (let k = 0; k < 10; k++) {
        if (!(await has(".l-game:not([hidden])"))) break;
        clock.t += rnd(1.2, 2.2);
        const truth = await page.evaluate((i) => { const c = window.__wakha.Feed.cards[i]; return null; }, a.i);
        void truth;
        await page.click(`${sel} .tf ${chance(0.5) ? ".yes" : ".no"}`); await page.waitForTimeout(60);
      }
      await page.waitForTimeout(300); clock.t += 2; return "acted";
    }
    case "haggle": {
      clock.t += 3; await page.click(`${sel} [data-act=begin]`);
      const good = ["Nqss chwiya", "bslama", "Ghanakh"];
      for (let r = 0; r < 3; r++) {
        try { await page.waitForSelector(`${sel} .h-opts:not([hidden]) .opt`, { timeout: 5000 }); } catch (e) { break; }
        clock.t += rnd(3, 6);
        const opts = page.locator(`${sel} .h-opts .opt`); const n = await opts.count(); let idx = Math.floor(Math.random() * n);
        if (chance(0.6)) for (let k = 0; k < n; k++) if ((await opts.nth(k).innerText()).includes(good[r])) idx = k;
        await opts.nth(idx).click(); await page.waitForTimeout(1300);
        if (await has(".result:not([hidden])")) break;
      }
      await page.waitForTimeout(900); clock.t += 4;
      return "deal";
    }
    case "comeback": clock.t += 2.5; return "acted";
  }
  clock.t += 2; return "unknown";
}

async function session(page, minutes, label, report) {
  const clock = { t: 0 };
  const ev = [];
  const types = [];
  const seenIds = {};
  let last = await snap(page), firstReward = null, stuck = 0, cards = 0;
  const start = { ...last };
  while (clock.t < minutes * 60 && cards < 160) {
    await closeOverlays(page, ev, clock);
    const a = await active(page);
    types.push(a.t);
    if (a.id || ["reel","sit","build"].includes(a.t)) { const key = a.t + ":" + (a.id || ""); seenIds[key] = (seenIds[key] || 0) + 1; }
    const res = await playCard(page, a, clock);
    await page.waitForTimeout(250);
    await closeOverlays(page, ev, clock);
    const now = await snap(page);
    if (now.xp > last.xp) { if (firstReward === null) firstReward = clock.t; ev.push({ t: clock.t, kind: "xp", n: now.xp - last.xp, card: a.t }); }
    if (now.kenz > last.kenz) ev.push({ t: clock.t, kind: "KENZ" });
    if (res === "box") ev.push({ t: clock.t, kind: "BOX" });
    if (res === "deal") ev.push({ t: clock.t, kind: "DEAL" });
    last = now; cards++;
    const before = a.i;
    const after = await next(page);
    clock.t += 0.8;
    if (!after || after.i === before) { stuck++; await page.evaluate(() => window.__wakha.Feed.next()); await page.waitForTimeout(500); }
  }
  const big = ev.filter((e) => ["LEVEL", "GOAL", "BOX", "KENZ", "DEAL"].includes(e.kind)).map((e) => e.t);
  const gaps = big.slice(1).map((t, i) => t - big[i]);
  let maxRun = 1, run = 1; for (let i = 1; i < types.length; i++) { run = types[i] === types[i - 1] ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  const windows = []; for (let i = 0; i + 10 <= types.length; i += 10) windows.push(new Set(types.slice(i, i + 10)).size);
  const tcount = types.reduce((m, x) => ((m[x] = (m[x] || 0) + 1), m), {});
  const xpEv = ev.filter((e) => e.kind === "xp");
  const xpGaps = xpEv.slice(1).map((e, i) => e.t - xpEv[i].t);
  const goalAt = ev.find((e) => e.kind === "GOAL");
  const repeats = Object.entries(seenIds).filter(([, n]) => n > 1).map(([k, n]) => `${k}×${n}`);
  report.push({
    label, minutes, cards, stuck,
    firstRewardSec: firstReward && +firstReward.toFixed(1),
    xpGain: last.xp - start.xp, levelFrom: start.lvl, levelTo: last.lvl, wordsNew: last.words - start.words, kenzNew: last.kenz - start.kenz,
    rewardEventsPerMin: +(xpEv.length / (clock.t / 60)).toFixed(1), medianSecBetweenXP: xpGaps.length ? +xpGaps.sort((a, b) => a - b)[Math.floor(xpGaps.length / 2)].toFixed(1) : null,
    bigMoments: big.length, maxSecWithoutBigMoment: gaps.length ? Math.round(Math.max(...gaps, big[0])) : null,
    goalReachedAtSec: goalAt ? Math.round(goalAt.t) : null, streak: last.streak,
    maxSameTypeRun: maxRun, distinctTypesPer10: windows, typeCounts: tcount, repeatsInSession: repeats,
    sequence: types.join(" "),
  });
}

(async () => {
  const report = [];
  const day = (d) => `2026-10-${String(20 + d).padStart(2, "0")}T19:00:00`;
  let saved = null;
  for (let d = 0; d < 3; d++) {
    const { browser, page, errors } = await openApp({ reducedMotion: "reduce", time: day(d), storage: saved });
    await session(page, d === 0 ? 12 : 7, `day${d + 1}`, report);
    saved = await page.evaluate(() => JSON.stringify(window.__wakha.S));
    report[report.length - 1].errors = errors.length ? errors : "none";
    report[report.length - 1].dueAtStart = null;
    await browser.close();
  }
  for (const r of report) console.log(JSON.stringify(r, null, 1));
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

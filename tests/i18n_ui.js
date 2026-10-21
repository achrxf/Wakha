// Walks every screen and exercise in each UI language. Flags English left on screen, strings the
// translator never saw, and anything that spills off the screen. Run: node i18n_ui.js [w h]
const { openApp, next, shot } = require("./harness");
const SRC = require("../build/i18n_src.json"), ST = require("../build/i18n_store.json");
const [W0, H0] = [+(process.argv[2] || 360), +(process.argv[3] || 640)];
const LANGS = (process.env.LANGS || "en,fr,es,de,nl,it").split(",");
const WORDS = ["salam","labas","hamdoulillah","bikhir","kidayr","sba7","merhba","bslama","tsb7","choukran","blamzyya","3afak","smeh","ma3lich","wakha","iyeh","la","safi","lkoura","lmatch","gool","rbe7na"];
const LESSON = [
  { t:"scene" }, { t:"learn", w:"hamdoulillah" }, { t:"learn", w:"dimamaghrib" }, { t:"pick", w:"hamdoulillah" }, { t:"rev", w:"tsb7" }, { t:"listen", w:"smeh" },
  { t:"listen", w:"labas", sub:"mean" }, { t:"match", words:["salam","labas","hamdoulillah","bikhir","choukran"] }, { t:"build", id:"wewon" }, { t:"sit", id:"goal" },
  { t:"story", id:"match" }, { t:"sq", id:"match", k:1 }, { t:"sq", id:"match", k:3, rev:true }, { t:"haggle", item:"zrbiya" },
];
const FEED = [
  { t:"spot", w:"lkoura" }, { t:"pick", w:"kifach" }, { t:"rev", w:"blamzyya" }, { t:"listen", w:"3afak" }, { t:"match", words:["salam","labas","fin","safi"] },
  { t:"sit", id:"ref" }, { t:"sit", id:"faith" }, { t:"build", id:"dima" }, { t:"reel", id:"dimamaghrib" }, { t:"reel", id:"hosts" }, { t:"reel", id:"daba" }, { t:"reel", id:"ryal" },
  { t:"dialog", id:"match" }, { t:"proverb", id:"proverb-eat" }, { t:"mystery" }, { t:"drop", w:"lwalidin" }, { t:"lightning" }, { t:"haggle", item:"belgha" }, { t:"comeback" },
];
const report = {};
async function scan(page, lang, label) {
  const r = await page.evaluate(([lang, enList, trs]) => {
    const en = new Set(enList), out = { leak:[], spill:[] };
    const stage = document.querySelector("#stage").getBoundingClientRect();
    const els = [...document.querySelectorAll("#stage *")].filter((el) => {
      if (el.closest("[hidden]") || el.closest(".slide:not(.on)") || el.closest(".leaving") || el.closest("svg") || el.closest("script,style,option")) return false;
      const cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none" || +cs.opacity === 0) return false;
      const b = el.getBoundingClientRect(); return b.width > 0 && b.height > 0;
    });
    for (const el of els) {
      const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
      if (own && lang !== "en" && en.has(own) && trs[own] !== own) out.leak.push(own);
      if (own && el.closest(".view:not([hidden]),.lesson:not([hidden]),.welcome:not([hidden]),.overlay:not([hidden])")) {
        const b = el.getBoundingClientRect();
        const scroller = el.closest(".view, .jr-page, .td-row, .dlg, .chat");
        if (!scroller && (b.right > stage.right + 1 || b.left < stage.left - 1)) out.spill.push(own.slice(0, 30));
      }
    }
    if (document.documentElement.scrollWidth > innerWidth + 1) out.spill.push("page scrolls sideways");
    return out;
  }, [lang, SRC.map((x) => x.en).concat(lang === "fr" ? [] : []), lang === "fr" ? Object.fromEntries(SRC.map((x) => [x.en, x.fr])) : ST[lang] || {}]);
  const R = report[lang];
  r.leak.forEach((x) => R.leak.add(`${x}   [${label}]`));
  r.spill.forEach((x) => R.spill.add(`${x}   [${label}]`));
}
async function overflow(page, lang, root, label, topSel, botSel) {
  const r = await page.evaluate(([root, topSel, botSel]) => {
    const card = document.querySelector(root); if (!card) return ["no card"];
    const cr = card.getBoundingClientRect(), top = document.querySelector(topSel).getBoundingClientRect();
    const botEl = botSel ? document.querySelector(botSel) : null;
    const bot = botEl && botEl.getBoundingClientRect().height ? botEl.getBoundingClientRect().top : cr.bottom;
    const out = [];
    for (const el of card.querySelectorAll(".card-in *")) {
      if (el.closest("[hidden]") || el.closest(".slide:not(.on)") || el.closest(".shimmer") || el.closest(".dlg") || el.closest(".chat")) continue;
      const st = getComputedStyle(el); if (st.visibility === "hidden" || st.display === "none" || +st.opacity === 0) continue;
      if (el.children.length && !["BUTTON", "P", "H2", "SPAN"].includes(el.tagName)) continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      const txt = (el.innerText || el.className || el.tagName).toString().slice(0, 26).replace(/\n/g, " ");
      if (b.bottom > bot + 1) out.push(`below ${Math.round(b.bottom - bot)}px: ${txt}`);
      if (b.right > cr.right + 1) out.push(`off right ${Math.round(b.right - cr.right)}px: ${txt}`);
      if (b.top < top.bottom - 1) out.push(`under top ${Math.round(top.bottom - b.top)}px: ${txt}`);
    }
    for (const w of card.querySelectorAll(".word")) { const lh = parseFloat(getComputedStyle(w).lineHeight) || 60; if (w.getBoundingClientRect().height > lh * 1.6 && !w.textContent.includes(" ")) out.push("word wraps: " + w.textContent); }
    return [...new Set(out)].slice(0, 4);
  }, [root, topSel, botSel]);
  r.forEach((x) => report[lang].layout.add(`${label}: ${x}`));
}
async function act(page, root, sp) {
  try {
    if (["pick", "rev", "listen"].includes(sp.t)) await page.click(`${root} .opt:not([data-id="${sp.w}"]) >> nth=0`, { timeout: 3000 });
    if (sp.t === "sit") await page.click(`${root} .opt[data-k="1"]`, { timeout: 3000 });
    if (sp.t === "sq") await page.click(`${root} .opt >> nth=0`, { timeout: 3000 });
    if (sp.t === "match") for (const id of sp.words.slice(0, 2)) { await page.click(`${root} .mt[data-side=l][data-id="${id}"]`); await page.click(`${root} .mt[data-side=r][data-id="${id}"]`); }
    if (sp.t === "build") for (let k = 0; k < 2; k++) { await page.click(`${root} .pool .tok:not(.ghost-t) >> nth=0`); await page.waitForTimeout(100); }
    if (sp.t === "mystery") await page.click(`${root} [data-act=open]`);
    if (sp.t === "drop") await page.click(`${root} [data-act=flip]`);
    if (sp.t === "lightning") { await page.click(`${root} [data-act=go]`); await page.waitForTimeout(300); }
    if (sp.t === "haggle") { await page.click(`${root} [data-act=begin]`); for (let r = 0; r < 3; r++) { if (!(await page.locator(root + " .h-opts").count())) break; await page.waitForSelector(`${root} .h-opts:not([hidden]) .opt`, { timeout: 9000 }); await page.waitForTimeout(400); await page.click(`${root} .h-opts .opt >> nth=0`); await page.waitForTimeout(2600); if (await page.locator(`${root} .result:not([hidden])`).count()) break; } }
  } catch (e) { report.__errors.push(`${sp.t}: ${e.message.split("\n")[0]}`); try { await shot(page, "err-" + sp.t + "-" + Date.now()); } catch (e2) {} }
  await page.waitForTimeout(sp.t === "mystery" || sp.t === "drop" ? 1500 : 700);
}
(async () => {
  report.__errors = [];
  for (const lang of LANGS) {
    report[lang] = { leak:new Set(), spill:new Set(), layout:new Set() };
    // welcome flow, fresh learner
    {
      const { browser, page, errors } = await openApp({ width: W0, height: H0, storage: JSON.stringify({ v:2, lang, onboarded:false }), time: "2026-10-21T12:00:00" });
      await page.waitForTimeout(900); await scan(page, lang, "welcome");
      await page.click("#welcome [data-w=next]"); await page.waitForTimeout(500); await scan(page, lang, "goal");
      if (process.env.SHOTS) await shot(page, `i18n-${lang}-goal`);
      errors.forEach((e) => report.__errors.push(lang + " welcome: " + e));
      await browser.close();
    }
    const st = { v:2, lang, onboarded:true, goalChosen:true, lastOpen:"2026-10-21", xp:300, dayCount:3,
      words:Object.fromEntries(WORDS.map((x) => [x, { b:1, due:"2026-10-20", s:1, c:1, w:0, intro:"2026-10-18" }])), lessons:{ u1l1:{ stars:3, done:"2026-10-18", n:1 } } };
    const { browser, page, errors } = await openApp({ width: W0, height: H0, storage: JSON.stringify(st), time: "2026-10-21T12:00:00" });
    await page.waitForTimeout(900);
    await scan(page, lang, "today"); if (process.env.SHOTS) await shot(page, `i18n-${lang}-today`);
    await page.evaluate(() => document.querySelector("#v-today").scrollTo(0, 2000)); await page.waitForTimeout(300); await scan(page, lang, "today bottom");
    await page.click("#tab-journey"); await page.waitForTimeout(600);
    for (let c = 0; c < 10; c++) { await page.evaluate((c) => { const t = document.querySelector(".jr-track"); t.scrollLeft = c * t.clientWidth; document.querySelectorAll(".jr-page")[c].scrollTop = 600; }, c); await page.waitForTimeout(250); await scan(page, lang, "journey " + c); }
    await page.click('.jr-row[data-node="9"]'); await page.waitForTimeout(400); await scan(page, lang, "locked sheet"); await page.click("#sheet-scrim", { position:{ x:10, y:100 } });
    await page.click("#tab-guide"); await page.waitForTimeout(400); await scan(page, lang, "guide sounds");
    for (const snd of ["7", "9", "gh", "kh"]) { const b = page.locator(`[data-snd="${snd}"]`); if (await b.count()) { await b.click(); await page.waitForTimeout(250); await scan(page, lang, "sound " + snd); } }
    await page.click('[data-gt="rules"]'); await page.waitForTimeout(300);
    const nr = await page.locator(".rule > button").count(); for (let k = 0; k < nr; k++) await page.locator(".rule > button").nth(k).click();
    await page.waitForTimeout(300); await scan(page, lang, "rules");
    await page.click('[data-gt="phrasebook"]'); await page.waitForTimeout(400); await scan(page, lang, "phrasebook");
    await page.click("#tab-me"); await page.waitForTimeout(400); await scan(page, lang, "me"); if (process.env.SHOTS) await shot(page, `i18n-${lang}-me`);
    // lesson exercises
    await page.click("#tab-today"); await page.waitForTimeout(300);
    await page.evaluate(() => window.__wakha.Lesson.open(window.__wakha.PATH.find((n) => n.id === "u10l1")));
    await page.waitForTimeout(500);
    for (const sp of LESSON) {
      await page.evaluate((sp) => { const L = window.__wakha.Lesson; L.specs = [sp, { t:"learn", w:"salam" }]; L.i = 0; L.show(); }, sp);
      await page.waitForTimeout(700);
      const root = "#lesson .l-body .card:not(.leaving)";
      await scan(page, lang, "lesson " + sp.t); await overflow(page, lang, root, `lesson ${sp.t}`, "#lesson .l-top", "#lesson .l-foot:not([hidden])");
      await act(page, root, sp);
      await scan(page, lang, "lesson " + sp.t + " answered"); await overflow(page, lang, root, `lesson ${sp.t} answered`, "#lesson .l-top", "#lesson .banner");
      if (process.env.SHOTS && ["scene", "sit", "sq", "haggle"].includes(sp.t)) await shot(page, `i18n-${lang}-L-${sp.t}`);
      await page.evaluate(() => { const b = document.querySelector("#lesson .banner"); b && b.remove(); window.__wakha.Lesson.banner = null; });
    }
    // lesson end screen
    await page.evaluate(() => { const L = window.__wakha.Lesson; L.specs = [{ t:"learn", w:"salam" }]; L.i = 0; L.show(); }); await page.waitForTimeout(400);
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(2600); await scan(page, lang, "lesson end");
    await page.click("#lesson .l-foot .cta"); await page.waitForTimeout(1200);
    for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await scan(page, lang, "overlay"); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(500); }
    // feed
    await page.click("#tab-feed"); await page.waitForTimeout(800);
    for (const sp of FEED) {
      await page.evaluate((sp) => window.__wakha.inject(sp), sp);
      const a = await next(page); await page.waitForTimeout(600);
      const root = `.feed .card[data-i="${a.i}"]`;
      await scan(page, lang, "feed " + a.t); await overflow(page, lang, root, `feed ${a.t}`, ".hud-in", ".dock");
      if (sp.t === "reel") for (let s = 0; s < 3; s++) { await page.evaluate((r) => { const z = document.querySelector(r + " .tapzone.r"); z && z.click(); }, root); await page.waitForTimeout(450); await scan(page, lang, "reel " + sp.id); }
      await act(page, root, sp);
      const still = await page.evaluate((i) => window.__wakha.Feed.active === i, a.i);
      if (still && sp.t !== "reel") { await scan(page, lang, "feed " + a.t + " after"); await overflow(page, lang, root, `feed ${a.t} after`, ".hud-in", ".dock"); }
      for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await scan(page, lang, "overlay"); await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(300); }
    }
    const miss = await page.evaluate(() => [...window.__wakha.Xmiss]);
    const OK = new Set(["Kenz", "XP", "Mchicha", "3mmi Hmad", "Auto", "gh", "kh", "ch", "j", "Rihla", "Yasmine", "Adam", "Mn l7ouma", "Kanfhem chwiya", "9afez", "Kelaat M’Gouna", "Merzouga", "Meknes", "Rabat", "Casablanca", "Essaouira", "Chefchaouen", "Marrakech"]);
    miss.filter((m) => !OK.has(m) && !/^\+?\{?n?\}?\s?XP$/.test(m)).forEach((m) => report[lang].leak.add("not translated: " + m));
    errors.forEach((e) => report.__errors.push(lang + ": " + e));
    await browser.close();
    const R = report[lang];
    if (process.env.FULL) { for (const k of ["leak", "spill", "layout"]) [...R[k]].forEach((x) => console.log(`  ${lang} ${k}: ${x}`)); }
    console.log(`${lang} ${W0}x${H0}: ${R.leak.size} English leaks, ${R.spill.size} off-screen, ${R.layout.size} layout problems`);
  }
  for (const lang of LANGS) { const R = report[lang]; for (const k of ["leak", "spill", "layout"]) [...R[k]].slice(0, 40).forEach((x) => console.log(`  ${lang} ${k}: ${x}`)); }
  console.log("script errors:", report.__errors.length ? report.__errors.join("\n  ") : "none");
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

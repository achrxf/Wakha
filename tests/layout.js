// Every exercise and card type, in lessons and in the feed, at six screen sizes:
// report anything that spills under the HUD/top bar, past the dock/footer, or off the sides.
const { openApp, next, shot } = require("./harness");
const SIZES = (process.env.SIZES ? JSON.parse(process.env.SIZES) : [[360, 640], [375, 667], [390, 760], [390, 844], [430, 932], [1280, 800]]);
const WORDS = ["salam","labas","hamdoulillah","bikhir","kidayr","sba7","merhba","bslama","tsb7","choukran","blamzyya","3afak","smeh","ma3lich","wakha","iyeh","la","safi","achnou","fin","kifach","3lach"];
const LESSON = [
  { t:"learn", w:"hamdoulillah" }, { t:"learn", w:"akhirtaman" }, { t:"pick", w:"hamdoulillah" }, { t:"rev", w:"tsb7" }, { t:"listen", w:"smeh" },
  { t:"listen", w:"labas", sub:"mean" }, { t:"match", words:["salam","labas","hamdoulillah","bikhir","choukran"] }, { t:"build", id:"allgood" }, { t:"sit", id:"eye" }, { t:"haggle", item:"zrbiya" },
];
const FEED = [
  { t:"spot", w:"hamdoulillah" }, { t:"pick", w:"kifach" }, { t:"rev", w:"blamzyya" }, { t:"listen", w:"3afak" }, { t:"match", words:["salam","labas","fin","safi"] },
  { t:"sit", id:"wedding" }, { t:"build", id:"welcome" }, { t:"reel", id:"walidin" }, { t:"dialog", id:"lost" }, { t:"proverb", id:"proverb-eat" },
  { t:"mystery" }, { t:"drop", w:"lwalidin" }, { t:"lightning" }, { t:"haggle", item:"belgha" }, { t:"comeback" }, { t:"nudge" },
];
const problems = [];
async function check(page, root, label, topSel, botSel) {
  const r = await page.evaluate(([root, topSel, botSel]) => {
    const card = document.querySelector(root);
    if (!card) return ["no card"];
    const cr = card.getBoundingClientRect();
    const top = document.querySelector(topSel).getBoundingClientRect();
    const botEl = botSel ? document.querySelector(botSel) : null;
    const bot = botEl && botEl.getBoundingClientRect().height ? botEl.getBoundingClientRect().top : cr.bottom;
    const out = [];
    for (const el of card.querySelectorAll(".card-in *, .rail *")) {
      if (el.closest("[hidden]") || el.closest(".slide:not(.on)") || el.closest(".arch")) continue;
      const st = getComputedStyle(el); if (st.visibility === "hidden" || st.display === "none" || +st.opacity === 0) continue;
      if (el.children.length && !["BUTTON", "P", "H2", "SPAN"].includes(el.tagName)) continue;
      const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
      const txt = (el.innerText || el.getAttribute("class") || el.tagName).slice(0, 26).replace(/\n/g, " ");
      if (b.bottom > bot + 1) out.push(`below footer ${Math.round(b.bottom - bot)}px: ${txt}`);
      if (b.right > cr.right + 1) out.push(`off right ${Math.round(b.right - cr.right)}px: ${txt}`);
      if (b.left < cr.left - 1) out.push(`off left: ${txt}`);
      if (b.top < top.bottom - 1) out.push(`under top bar ${Math.round(top.bottom - b.top)}px: ${txt}`);
    }
    // a word broken across lines
    for (const w of card.querySelectorAll(".word")) { const lh = parseFloat(getComputedStyle(w).lineHeight) || 60; if (w.getBoundingClientRect().height > lh * 1.6 && !w.textContent.includes(" ")) out.push("word wraps: " + w.textContent); }
    if (document.documentElement.scrollWidth > innerWidth) out.push("page scrolls sideways");
    return [...new Set(out)].slice(0, 6);
  }, [root, topSel, botSel]);
  if (r.length) problems.push(`${label}: ` + r.join(" | "));
}
async function act(page, root, sp) {
  const s = root;
  try {
    if (["pick", "rev", "listen"].includes(sp.t)) await page.click(`${s} .opt:not([data-id="${sp.w}"]) >> nth=0`, { timeout: 3000 });
    if (sp.t === "sit") await page.click(`${s} .opt[data-k="1"]`, { timeout: 3000 });
    if (sp.t === "match") for (const id of sp.words.slice(0, 2)) { await page.click(`${s} .mt[data-side=l][data-id="${id}"]`); await page.click(`${s} .mt[data-side=r][data-id="${id}"]`); }
    if (sp.t === "build") for (let k = 0; k < 2; k++) { await page.click(`${s} .pool .tok:not(.ghost-t) >> nth=0`); await page.waitForTimeout(100); }
    if (sp.t === "mystery") await page.click(`${s} [data-act=open]`);
    if (sp.t === "drop") await page.click(`${s} [data-act=flip]`);
    if (sp.t === "lightning") await page.click(`${s} [data-act=go]`);
    if (sp.t === "haggle") { await page.click(`${s} [data-act=begin]`); await page.waitForSelector(`${s} .h-opts:not([hidden]) .opt`, { timeout: 8000 }); await page.click(`${s} .h-opts .opt >> nth=0`); await page.waitForTimeout(2600); }
  } catch (e) { problems.push(`${sp.t}: could not act (${e.message.split("\n")[0]})`); }
  await page.waitForTimeout(sp.t === "mystery" || sp.t === "drop" ? 1500 : 700);
}
(async () => {
  for (const [w, h] of SIZES) {
    const before = problems.length;
    const st = { v: 2, onboarded: true, goalChosen: true, lastOpen: "2026-10-21", xp: 300, dayCount: 3,
      words: Object.fromEntries(WORDS.map((x) => [x, { b: 1, due: "2026-10-28", s: 1, c: 1, w: 0, intro: "2026-10-18" }])), lessons: { u1l1: { stars: 3, done: "2026-10-18", n: 1 } } };
    const { browser, page, errors } = await openApp({ width: w, height: h, mobile: w < 800, storage: JSON.stringify(st), time: "2026-10-21T12:00:00" });
    // lesson exercises
    await page.evaluate(() => window.__wakha.Lesson.open(window.__wakha.PATH[1]));
    for (const sp of LESSON) {
      await page.evaluate((sp) => { const L = window.__wakha.Lesson; L.specs = [sp, { t:"learn", w:"salam" }]; L.i = 0; L.show(); }, sp);
      await page.waitForTimeout(500);
      const root = "#lesson .l-body .card:not(.leaving)";
      await check(page, root, `lesson ${sp.t}${sp.sub ? "/" + sp.sub : ""} ${w}x${h} rest`, "#lesson .l-top", "#lesson .l-foot:not([hidden])");
      await act(page, root, sp);
      await check(page, root, `lesson ${sp.t} ${w}x${h} answered`, "#lesson .l-top", "#lesson .banner");
      if (w === 360 || w === 1280) await shot(page, `L-${w}-${sp.t}${sp.sub ? "-" + sp.sub : ""}`);
      await page.evaluate(() => { const b = document.querySelector("#lesson .banner"); b && b.remove(); window.__wakha.Lesson.banner = null; });
    }
    await page.evaluate(() => window.__wakha.Lesson.close(false));
    // feed cards
    await page.click("#tab-feed"); await page.waitForTimeout(600);
    for (const sp of FEED) {
      await page.evaluate((sp) => window.__wakha.inject(sp), sp);
      const a = await next(page);
      await page.waitForTimeout(600);
      const root = `.feed .card[data-i="${a.i}"]`;
      await check(page, root, `feed ${a.t} ${w}x${h} rest`, ".hud-in", ".dock");
      await act(page, root, sp);
      await check(page, root, `feed ${a.t} ${w}x${h} after`, ".hud-in", ".dock");
      if (w === 360 || w === 1280) await shot(page, `F-${w}-${a.t}`);
      for (let k = 0; k < 3; k++) if (await page.locator("#overlay:not([hidden])").count()) { await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(300); }
    }
    // other views
    for (const v of ["today", "journey", "guide", "me"]) {
      await page.click(`#tab-${v}`); await page.waitForTimeout(500);
      const bad = await page.evaluate(() => { const out = []; if (document.documentElement.scrollWidth > innerWidth) out.push("sideways scroll"); const v = [...document.querySelectorAll(".view")].find((x) => !x.hidden); for (const el of v.querySelectorAll("*")) { const b = el.getBoundingClientRect(); if (b.width && b.right > v.getBoundingClientRect().right + 1) { out.push("off right: " + (el.className || el.tagName)); break; } } return out; });
      if (bad.length) problems.push(`${v} ${w}x${h}: ${bad.join(", ")}`);
      if (w === 360) await shot(page, `V-${w}-${v}`);
    }
    console.log(`${w}x${h}: ${problems.length - before} problems; errors: ${errors.length ? errors.join(" / ") : "none"}`);
    await browser.close();
  }
  console.log(problems.join("\n"));
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

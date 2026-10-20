// Render every card type at several viewport sizes, act on it, and report anything that
// spills past the dock, off the right edge, or out of the card.
const { openApp, active, next, shot } = require("./harness");
const SIZES = [[360, 640], [375, 667], [390, 760], [390, 844], [430, 932], [1280, 800]];
const SPECS = [
  { t: "welcome" }, { t: "learn", w: "lwalidin" }, { t: "learn", w: "hamdoulillah" }, { t: "quiz", w: "wach" }, { t: "rev", w: "inchallah" },
  { t: "sit", id: "eye" }, { t: "build", id: "allgood" }, { t: "reel", id: "walidin" }, { t: "mystery" }, { t: "lightning" },
  { t: "haggle", item: "zrbiya" }, { t: "goal" }, { t: "comeback" }, { t: "drop", w: "tbarkellah" },
];
async function act(page, a) {
  const sel = `.card[data-i="${a.i}"]`;
  if (a.t === "quiz" || a.t === "rev") { await page.click(`${sel} .opt:not([data-id="${a.w}"])`); await page.waitForTimeout(500); }
  if (a.t === "sit") { await page.click(`${sel} .opt[data-k="1"]`); await page.waitForTimeout(500); }
  if (a.t === "mystery") { await page.click(`${sel} [data-act=open]`); await page.waitForTimeout(1500); }
  if (a.t === "drop") { await page.click(`${sel} [data-act=flip]`); await page.waitForTimeout(1300); }
  if (a.t === "lightning") { await page.click(`${sel} [data-act=go]`); await page.waitForTimeout(400); }
  if (a.t === "haggle") {
    await page.click(`${sel} [data-act=begin]`);
    for (let r = 0; r < 3; r++) {
      await page.waitForSelector(`${sel} .h-opts:not([hidden]) .opt`, { timeout: 6000 });
      if (r === 1) { await page.waitForTimeout(300); await check(page, a, "mid"); }
      await page.click(`${sel} .h-opts .opt >> nth=0`);
      await page.waitForTimeout(2400);
      if (await page.locator(`${sel} .result:not([hidden])`).count()) break;
    }
    await page.waitForTimeout(800);
  }
  if (a.t === "build") {
    const toks = await page.locator(`${sel} .pool .tok`).count();
    for (let k = 0; k < Math.min(3, toks); k++) { await page.click(`${sel} .pool .tok:not(.ghost) >> nth=0`); await page.waitForTimeout(120); }
    await page.waitForTimeout(900);
  }
  if (a.t === "reel") { for (let k = 0; k < 2; k++) { const b = await page.locator(`${sel}`).boundingBox(); await page.mouse.click(b.x + b.width * 0.8, b.y + b.height * 0.5); await page.waitForTimeout(400); } }
}
const problems = [];
async function check(page, a, phase) {
  const r = await page.evaluate((i) => {
    const card = document.querySelector(`.card[data-i="${i}"]`);
    const cr = card.getBoundingClientRect();
    const dock = document.querySelector(".dock").getBoundingClientRect();
    const hud = document.querySelector(".hud-in").getBoundingClientRect();
    const out = [];
    for (const el of card.querySelectorAll(".card-in *, .rail *")) {
      if (el.closest("[hidden]") || el.closest(".slide:not(.on)")) continue;
      const st = getComputedStyle(el); if (st.visibility === "hidden" || st.display === "none" || +st.opacity === 0) continue;
      if (!el.children.length || ["BUTTON", "P", "H2"].includes(el.tagName)) {
        const b = el.getBoundingClientRect(); if (!b.width || !b.height) continue;
        const txt = (el.innerText || el.getAttribute("class") || el.tagName).slice(0, 28).replace(/\n/g, " ");
        if (b.bottom > dock.top + 1) out.push(`below dock by ${Math.round(b.bottom - dock.top)}px: ${txt}`);
        if (b.right > cr.right + 1) out.push(`past right edge by ${Math.round(b.right - cr.right)}px: ${txt}`);
        if (b.left < cr.left - 1) out.push(`past left edge: ${txt}`);
        if (b.top < hud.bottom - 1 && !el.closest(".bars") && !el.closest(".tapzone")) out.push(`under HUD by ${Math.round(hud.bottom - b.top)}px: ${txt}`);
      }
    }
    const docW = document.documentElement.scrollWidth, vw = innerWidth;
    if (docW > vw) out.push(`page scrolls sideways (${docW} > ${vw})`);
    return [...new Set(out)].slice(0, 6);
  }, a.i);
  if (r.length) problems.push(`${a.t}${a.w ? ":" + a.w : a.id ? ":" + a.id : ""} @${phase}: ` + r.join(" | "));
}
(async () => {
  for (const [w, h] of SIZES) {
    const { browser, page, errors } = await openApp({ width: w, height: h, mobile: w < 800, storage: JSON.stringify({ v: 1, onboarded: true, goalChosen: true, lastOpen: "2026-10-20", xp: 400, words: Object.fromEntries(["salam","labas","wakha","bzzaf","choukran","chhal","ghali","daba","atay","bghit","mzyan","zwin"].map((x) => [x, { b: 1, due: "2026-10-25", s: 1, c: 1, w: 0, intro: "2026-10-19" }])) }), time: "2026-10-20T10:00:00" });
    const before = problems.length;
    for (const sp of SPECS) {
      await page.evaluate((sp) => window.__wakha.inject(sp), sp);
      const a = await next(page);
      await page.waitForTimeout(700);
      await check(page, a, `rest ${w}x${h}`);
      await act(page, a);
      await check(page, a, `after ${w}x${h}`);
      if (w === 360 || w === 1280) await shot(page, `size-${w}x${h}-${a.t}`);
      if (await page.locator("#overlay:not([hidden])").count()) { await page.click("#overlay [data-ov=close]"); await page.waitForTimeout(300); }
    }
    console.log(`${w}x${h}: ${problems.length - before} problems, errors: ${errors.length ? errors.join(" / ") : "none"}`);
    await browser.close();
  }
  console.log(problems.join("\n"));
})().catch((e) => { console.error("FAILED", e); process.exit(1); });

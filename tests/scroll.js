// Touch scrolling: drags a finger on every tab like a phone would and checks the screen really moves.
// (v1.12: the Journey list had a leftover overflow:hidden and could not be scrolled on phones.)
const path = require("path");
process.env.APP = process.env.APP || path.resolve(__dirname, "../dist/wakha.html");
const { openApp } = require("./harness.js");
async function drag(cdp, page, x, y0, dy, steps = 12) {
  await cdp.send("Input.dispatchTouchEvent", { type:"touchStart", touchPoints:[{ x, y:y0 }] });
  for (let i = 1; i <= steps; i++) { await cdp.send("Input.dispatchTouchEvent", { type:"touchMove", touchPoints:[{ x, y:y0 + dy * i / steps }] }); await page.waitForTimeout(16); }
  await cdp.send("Input.dispatchTouchEvent", { type:"touchEnd", touchPoints:[] });
}
(async () => {
  const { browser, page, context, errors } = await openApp({ scheme:"light" });
  await page.evaluate(() => { document.querySelector("#welcome").hidden = true; });
  const cdp = await context.newCDPSession(page); let fails = 0;
  for (const t of ["today", "journey", "guide", "me", "feed"]) {
    await page.evaluate((t) => document.querySelector(`.tab[data-tab="${t}"]`).click(), t); await page.waitForTimeout(700);
    await drag(cdp, page, 195, 700, t === "feed" ? -560 : -400, t === "feed" ? 10 : 12); await page.waitForTimeout(900);
    const top = await page.evaluate((t) => document.querySelector(t === "feed" ? ".feed" : "#v-" + t).scrollTop, t);
    const ok = top > 100; if (!ok) fails++;
    console.log((ok ? "PASS" : "FAIL") + "  " + t + " scrolls with a finger  (" + top + "px)");
  }
  // city fold: tapping a city opens it in place, and the old one closes
  await page.evaluate(() => document.querySelector('.tab[data-tab="journey"]').click()); await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector(".crow.open").click()); await page.waitForTimeout(600);
  const shut = await page.evaluate(() => document.querySelectorAll(".copen").length);
  await page.evaluate(() => document.querySelector('.city[data-ui="0"] .crow').click()); await page.waitForTimeout(600);
  const h = await page.evaluate(() => document.querySelector('.city[data-ui="0"] .cbody').getBoundingClientRect().height);
  const ok2 = shut === 0 && h > 150; if (!ok2) fails++;
  console.log((ok2 ? "PASS" : "FAIL") + "  a city folds shut and opens again  (" + shut + ", " + Math.round(h) + "px)");
  const ok3 = !errors.length; if (!ok3) fails++;
  console.log((ok3 ? "PASS" : "FAIL") + "  no script errors" + (errors.length ? "  " + errors.join(" | ") : ""));
  await browser.close(); process.exit(fails ? 1 : 0);
})();

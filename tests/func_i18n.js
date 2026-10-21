// End-to-end in every language: detection from the phone's language, switching, a full lesson, reload.
const { openApp, lessonCard } = require("./harness");
const { playLesson, solveStep } = require("./play");
const ST = require("../build/i18n_store.json");
const res = []; const ok = (n, c, d = "") => res.push(`${c ? "PASS" : "FAIL"}  ${n}${d ? "  (" + d + ")" : ""}`);
const T = (l, en) => (l === "en" ? en : ST[l][en]);
const FR = { "Start the journey":"Commencer le voyage", "Tile glazed":"Tuile émaillée", "Perfect glaze":"Émail parfait", "Today":"Aujourd’hui", "Next stop":"Prochaine étape" };
const TT = (l, en) => (l === "fr" ? FR[en] : T(l, en));
const closeOv = async (page) => { for (let k = 0; k < 4; k++) { await page.waitForTimeout(450); if (await page.locator("#overlay:not([hidden])").count()) await page.click("#overlay [data-ov=close]"); } };
(async () => {
  for (const [loc, want] of [["de-DE", "de"], ["es-MX", "es"], ["nl-BE", "nl"], ["it-IT", "it"], ["fr-CA", "fr"], ["en-GB", "en"], ["pt-PT", "en"]]) {
    const { browser, page } = await openApp({ locale: loc, time: "2026-10-21T09:00:00" });
    const got = await page.evaluate(() => window.__wakha.S.lang);
    ok(`phone language ${loc} opens the app in ${want}`, got === want, got);
    await browser.close();
  }
  for (const lang of ["fr", "es", "de", "nl", "it"]) {
    const { browser, page, errors } = await openApp({ locale: "en-GB", time: "2026-10-21T09:00:00" });
    await page.selectOption("#welcome select.lang-select", lang); await page.waitForTimeout(400);
    const btn = (await page.locator("#welcome [data-w=next]").innerText()).trim();
    ok(`[${lang}] picking the language on the welcome screen switches it`, btn === TT(lang, "Start the journey"), btn);
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    ok(`[${lang}] page language tag is set`, htmlLang === lang, htmlLang);
    await page.click("#welcome [data-w=next]"); await page.waitForTimeout(400);
    await page.click('#welcome .goal-pick[data-goal="100"]'); await page.waitForTimeout(1200);
    const log = await playLesson(page); await page.waitForTimeout(1600);
    const head = (await page.locator("#lesson .l-end h2").innerText()).trim();
    ok(`[${lang}] lesson 1 plays through and the end screen is translated`, [TT(lang, "Tile glazed"), TT(lang, "Perfect glaze")].includes(head), `${head}; ${log.length} steps`);
    await page.click("#lesson .l-foot .cta"); await closeOv(page);
    const sec = (await page.locator(".td-sec h2").first().innerText()).trim();
    ok(`[${lang}] Today screen is translated`, sec === TT(lang, "Today"), sec);
    await page.reload(); await page.waitForTimeout(1000);
    const after = await page.evaluate(() => ({ lang: window.__wakha.S.lang, l: Object.keys(window.__wakha.S.lessons) }));
    ok(`[${lang}] language and progress survive a reload`, after.lang === lang && after.l.includes("u1l1"), JSON.stringify(after));
    // football stop: open Rabat lesson 1 directly and play it
    await page.evaluate(() => { const S = window.__wakha.S; for (const n of window.__wakha.PATH) { if (n.id === "u10l1") break; S.lessons[n.id] = { stars: 2 }; } window.__wakha.setView("today"); });
    await page.waitForTimeout(400); await page.click(".hero [data-start]"); await page.waitForTimeout(900);
    const city = (await page.locator("#lesson .sc-city").innerText()).trim();
    const log2 = await playLesson(page); await page.waitForTimeout(1500);
    const done = await page.evaluate(() => !!window.__wakha.S.lessons.u10l1);
    ok(`[${lang}] the Rabat football lesson plays through`, city === "Rabat" && done, `${city}; ${log2.join(",")}`);
    await page.click("#lesson .l-foot .cta"); await closeOv(page);
    // switch language from Me
    await page.click("#tab-me"); await page.waitForTimeout(400);
    await page.selectOption("#me-lang", "en"); await page.waitForTimeout(400);
    const meH = await page.evaluate(() => document.querySelector("#tab-today span").textContent);
    ok(`[${lang}] switching back to English from Me updates the app`, meH === "Today", meH);
    ok(`[${lang}] no script errors`, errors.length === 0, errors.join(" | "));
    await browser.close();
  }
  console.log(res.join("\n"));
  console.log(res.filter((r) => r.startsWith("PASS")).length + "/" + res.length + " passed");
})().catch((e) => { console.error("FAILED", e); console.log(res.join("\n")); process.exit(1); });

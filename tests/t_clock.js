const { openApp } = require("./harness");
(async () => { const { browser, page } = await openApp({ time: "2026-10-22T19:00:00" }); const a = await page.evaluate(() => [new Date().toString(), Date.now()]); await page.waitForTimeout(1200); const b = await page.evaluate(() => Date.now()); console.log(a[0], b - a[1]); await browser.close(); })();

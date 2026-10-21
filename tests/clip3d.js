// Close-up clip of the Today hero with the 3D plate, frames rendered by the app's own three.js scene.
const { openApp } = require("./harness");
const fs = require("fs"), path = require("path");
(async () => {
  const st = { v:2, onboarded:true, goalChosen:true, lastOpen:"2026-10-21", xp: 220, dayCount: 3, lessons: { u1l1: { stars: 3 }, u1l2: { stars: 3 }, u1l3: { stars: 2 } } };
  const { browser, page } = await openApp({ storage: JSON.stringify(st), time: "2026-10-21T18:30:00", dpr: 2, scheme: "light" });
  await page.waitForTimeout(4000);
  const info = await page.evaluate(() => { const M = window.__wakha.Med3D; M.host = null; const z = document.querySelector(".td-med .zwrap"); const r = z.getBoundingClientRect(); z.style.visibility = "hidden"; const cv = M.r.domElement; cv.remove(); return { x: r.x, y: r.y, w: r.width, ok: M.ok }; });
  await page.waitForTimeout(400);
  const dir = path.join(__dirname, "clip"); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir);
  await page.screenshot({ path: path.join(dir, "bg.png") });
  const N = 150;
  for (let i = 0; i < N; i++) {
    const url = await page.evaluate(([i, N]) => {
      const M = window.__wakha.Med3D, t = i / 30;
      // entrance spin, idle sway, then a drag to the right and a spring back
      const spin = -Math.PI * 1.2 * Math.pow(0.94, i * 2);
      let rx = Math.cos(t * 0.6) * 0.2, ry = Math.sin(t * 0.45) * 0.38;
      const d = i > 70 && i < 120 ? Math.sin((i - 70) / 50 * Math.PI) : 0; ry += d * 0.9; rx += d * 0.35;
      M.grp.rotation.set(rx, ry + spin, 0); M.grp.position.y = Math.sin(t * 1.1) * 0.03;
      M.keyL.position.set(Math.cos(t * 0.5) * 3, 2.5 + Math.sin(t * 0.7), 4);
      M.r.render(M.scene, M.cam); return M.r.domElement.toDataURL("image/png");
    }, [i, N]);
    fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, "0")}.png`), Buffer.from(url.split(",")[1], "base64"));
  }
  fs.writeFileSync(path.join(dir, "pos.json"), JSON.stringify(info));
  console.log(info);
  await browser.close();
})();

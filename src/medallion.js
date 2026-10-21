/* =========================================================
   ZELLIGE MEDALLION: an 8-fold rosette, ring by ring.
   Each ring is one lesson. Unglazed rings are bisque clay; glazed rings carry the city's glazes,
   with hand-made tone variation per piece, even ivory grout, and a soft sheen.
   ========================================================= */
const Zel = (() => {
  const P = (r, deg) => { const a = (deg - 90) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; };
  const poly = (pts) => "M" + pts.map((p) => p[0].toFixed(2) + " " + p[1].toFixed(2)).join("L") + "Z";
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hexToHsl(hex) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
    if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
    return [h, s * 100, l * 100];
  }
  const vary = (hex, rnd, amt = 5) => { const [h, s, l] = hexToHsl(hex); return `hsl(${(h + (rnd() - 0.5) * 6).toFixed(1)} ${Math.max(0, Math.min(100, s + (rnd() - 0.5) * amt)).toFixed(1)}% ${Math.max(4, Math.min(96, l + (rnd() - 0.5) * amt * 1.4)).toFixed(1)}%)`; };

  // geometry of the five rings; each piece is {d, role}
  function rings() {
    const R = [];
    // ring 0: heart star + center octagon
    const star = []; for (let k = 0; k < 16; k++) star.push(P(k % 2 ? 19.5 : 27, k * 22.5));
    const oct = []; for (let k = 0; k < 8; k++) oct.push(P(8.5, k * 45 + 22.5));
    R.push([{ d: poly(star), role: 0 }, { d: poly(oct), role: "brass" }]);
    // ring 1: kites between star tips + diamonds on the tips
    const r1 = [];
    for (let k = 0; k < 8; k++) {
      const a = k * 45 + 22.5;
      r1.push({ d: poly([P(21, a), P(35, a - 17.5), P(48, a), P(35, a + 17.5)]), role: 1 });
      const b = k * 45;
      r1.push({ d: poly([P(29.5, b), P(38.5, b - 8.5), P(48, b), P(38.5, b + 8.5)]), role: "ivory" });
    }
    R.push(r1);
    // ring 2: sixteen keystones
    const r2 = [];
    for (let k = 0; k < 16; k++) {
      const a0 = k * 22.5 + 0.9, a1 = (k + 1) * 22.5 - 0.9, pts = [];
      for (let s = 0; s <= 4; s++) pts.push(P(50.5, a0 + (a1 - a0) * s / 4));
      for (let s = 4; s >= 0; s--) pts.push(P(65, a0 + (a1 - a0) * s / 4));
      r2.push({ d: poly(pts), role: k % 2 ? 2 : 0 });
    }
    R.push(r2);
    // ring 3: sixteen pointed petals with diamonds between them
    const r3 = [];
    for (let k = 0; k < 16; k++) {
      const a = k * 22.5, [x0, y0] = P(67.5, a - 9.6), [x1, y1] = P(67.5, a + 9.6), [tx, ty] = P(86, a), [c0x, c0y] = P(81, a - 7.5), [c1x, c1y] = P(81, a + 7.5);
      r3.push({ d: `M${x0.toFixed(2)} ${y0.toFixed(2)}Q${c0x.toFixed(2)} ${c0y.toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)}Q${c1x.toFixed(2)} ${c1y.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}Z`, role: k % 2 ? 1 : 2 });
      const b = a + 11.25;
      r3.push({ d: poly([P(69.5, b), P(77.5, b - 5.6), P(86, b), P(77.5, b + 5.6)]), role: "ivory" });
    }
    R.push(r3);
    // ring 4: border band of small square tiles
    const r4 = [];
    for (let k = 0; k < 32; k++) {
      const a = k * 11.25, c = P(94, a), h = 5.6, ang = (a) * Math.PI / 180;
      const ux = Math.cos(ang), uy = Math.sin(ang);
      const pts = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([x, y]) => [c[0] + x * ux - y * uy, c[1] + x * uy + y * ux]);
      r4.push({ d: poly(pts), role: k % 4 === 0 ? 0 : k % 2 ? "ivory" : 1 });
    }
    R.push(r4);
    return R;
  }
  const RINGS = rings();
  // every piece in setting order: centre outwards, round each ring. Lesson k of n lays the k-th share of the pieces,
  // so each finished lesson visibly sets the next run of tiles, like a craftsman working outwards.
  const PIECES = [];
  RINGS.forEach((pieces, ri) => pieces.forEach((p) => { if (p.role !== "brass") PIECES.push(Object.assign({ ri }, p)); }));
  const BRASS = RINGS[0].find((p) => p.role === "brass");
  let uid = 0;
  // states: one per lesson, "done" | "current" | "locked"; glazes: [main, second, accent]
  function svg(glazes, states, opts = {}) {
    const id = "z" + (++uid), seed = opts.seed || 7, n = Math.max(1, states.length), N = PIECES.length;
    const roleColor = (role) => role === "ivory" ? "#F1EADB" : glazes[role % glazes.length];
    const anyDone = states.some((x) => x === "done") || /\bany\b/.test(opts.cls || "");
    const rnd = rng(seed * 97 + 13);
    let out = `<svg xmlns="http://www.w3.org/2000/svg" class="zel ${opts.cls || ""}" viewBox="-104 -104 208 208" aria-hidden="true"><defs>
      <linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>
      <radialGradient id="${id}l" cx=".32" cy=".26" r=".9"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <filter id="${id}c" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="${seed}"/><feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.25  0 0 0 0 0.18  0 0 0 .22 0"/><feComposite in2="SourceGraphic" operator="in"/><feBlend in2="SourceGraphic" mode="multiply"/></filter>
    </defs>
    <circle class="field" r="101.5" fill="${anyDone ? opts.field || "#17151F" : "#B07A60"}" style="--g:${opts.field || "#17151F"};--k:#B07A60"/>`;
    for (let k = 0; k < n; k++) {
      const a = Math.floor(k * N / n), b = Math.floor((k + 1) * N / n), st = states[k] || "locked";
      out += `<g class="seg l${k} ${st}" data-l="${k}" style="--l:${k}"${st !== "done" && !opts.mode ? ` filter="url(#${id}c)"` : ""}>`;
      const ds = [];
      for (let j = a; j < b; j++) {
        const p = PIECES[j];
        const glazeC = vary(roleColor(p.role), rnd, p.role === "ivory" ? 3 : 6);
        const clayC = vary(p.role === "ivory" ? "#E2C3AC" : "#CF9C80", rnd, 5);
        const mf = opts.mode === "gloss" ? (st === "done" ? "#FFFFFF" : "#000000") : opts.mode === "rough" ? (st === "done" ? "#262626" : "#E6E6E6") : opts.mode === "bump" ? (st === "done" ? "#FFFFFF" : "#E8E8E8") : null;
        const ms = opts.mode === "gloss" ? "#000000" : opts.mode === "rough" ? "#F2F2F2" : opts.mode === "bump" ? "#000000" : "#E9E0CF";
        out += `<path class="pc" d="${p.d}" fill="${mf || (st === "done" ? glazeC : clayC)}" stroke="${ms}" stroke-width="${opts.mode === "bump" ? 1.8 : 1.15}" style="--g:${glazeC};--k:${clayC};--i:${j - a}"/>`;
        ds.push(p.d);
      }
      out += opts.mode ? `</g>` : `<path class="sheen" d="${ds.join("")}" fill="url(#${id}s)"/></g>`;
    }
    out += `<path d="${BRASS.d}" fill="${opts.mode === "gloss" ? "#000" : opts.mode === "rough" ? "#555" : opts.mode === "bump" ? "#fff" : "#C8A04E"}" stroke="${opts.mode === "bump" ? "#000" : "#E9E0CF"}" stroke-width="1.15"/>`;
    if (opts.mode) return out.replace(/<circle class="field"[^>]*>/, `<circle class="field" r="101.5" fill="${opts.mode === "gloss" ? (anyDone ? "#9A9A9A" : "#000") : opts.mode === "rough" ? (anyDone ? "#303030" : "#CCCCCC") : "#9A9A9A"}"/>`).replace(/<rect[^>]*>/g, "") + `<circle r="102.2" fill="none" stroke="${opts.mode === "rough" ? "#444" : "#fff"}" stroke-width="2.2"/></svg>`;
    out += `<circle r="101.5" fill="url(#${id}l)" style="mix-blend-mode:soft-light" pointer-events="none"/><circle r="102.2" fill="none" stroke="#C9A24F" stroke-width="2.2"/><circle r="99.6" fill="none" stroke="#EDE5D6" stroke-width=".9" opacity=".7"/></svg>`;
    return out;
  }
  return { svg, count:PIECES.length };
})();

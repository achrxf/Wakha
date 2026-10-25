/* =========================================================
   CORE: utils, state, storage, audio, art, effects, progress
   ========================================================= */
const LS_KEY = "wakha.v2";
const INTERVALS = [0, 1, 3, 7, 14, 30];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)", EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)", EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// UI languages. English and French are written into the content; the others come from I18N, keyed by the English text.
const LANGS = [["en", "English"], ["fr", "Français"], ["es", "Español"], ["de", "Deutsch"], ["nl", "Nederlands"], ["it", "Italiano"]];
const LOCALES = { en:"en-GB", fr:"fr-FR", es:"es-ES", de:"de-DE", nl:"nl-NL", it:"it-IT" };
function detectLang() {
  const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]).map((x) => String(x).toLowerCase().slice(0, 2));
  return prefs.find((p) => LANGS.some(([k]) => k === p)) || "en";
}
const defaultState = () => ({
  v:2, createdAt:Date.now(), updatedAt:0,
  lang:detectLang(),
  sound:true, voiceAuto:true, goal:100, goalChosen:false,
  xp:0, streak:0, best:0, lastGoalDay:null, shields:0, boost:0,
  words:{}, kenz:{}, days:{}, shown:{}, lessons:{},
  stats:{ cards:0, correct:0, wrong:0, reels:0, haggles:0, bestDeal:null, boxes:0, builds:0, lightning:0, bestCombo:0, drops:0, lessons:0, dialogs:0 },
  onboarded:false, lastOpen:null, dayCount:0
});
let S = defaultState();
let combo = 0;
const Session = { interacted:false, gesture:false, overlayQ:[], overlayOpen:false, ovTimer:0 };

// X(en, fr): the string in the learner's language. Numbers inside a sentence (souk prices) are matched as {n}.
const Xmiss = new Set();
function X(en, fr) {
  if (en == null) return en;
  if (S.lang === "en") return en;
  if (S.lang === "fr" && fr != null) return fr;
  const D = I18N[S.lang] || {};
  if (D[en] != null) return D[en];
  if (/\d/.test(en)) {
    const nums = en.match(/\d+/g), key = en.replace(/\d+/g, "{n}");
    if (D[key] != null) { let k = 0; return D[key].replace(/\{n\}/g, () => nums[k++]); }
  }
  if (S.lang !== "fr" && /[A-Za-z]/.test(en)) Xmiss.add(en);
  return fr != null && S.lang === "fr" ? fr : en;
}
const L = (pair) => (Array.isArray(pair) ? X(pair[0], pair[1]) : pair);
const t = (k, vars) => {
  let s = S.lang === "en" || S.lang === "fr" ? ((UI[S.lang] && UI[S.lang][k]) ?? UI.en[k] ?? k) : UI.en[k] == null ? k : Array.isArray(UI.en[k]) ? UI.en[k].map((x) => X(x)) : X(UI.en[k]);
  if (vars && typeof s === "string") for (const [a, b] of Object.entries(vars)) s = s.split("{" + a + "}").join(b);
  return s;
};
// singular forms ("1 day", "1 étape") when the language has them
const tn = (k, vars, n) => (n === 1 || (n === 0 && S.lang === "fr")) && (UI.en[k + "1"] != null) ? t(k + "1", vars) : t(k, vars);
const meaning = (wd) => X(wd.en, wd.fr);
const exTr = (ex) => X(ex[1], ex[2]);
const triTr = (tri) => X(tri[1], tri[2]);
const locale = () => LOCALES[S.lang] || "en-GB";

const dayKey = (d = new Date()) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dayKey(new Date());
const addDays = (key, n) => { const [y, m, d] = key.split("-").map(Number); return dayKey(new Date(y, m - 1, d + n)); };
const diffDays = (a, b) => { const [y1, m1, d1] = a.split("-").map(Number); const [y2, m2, d2] = b.split("-").map(Number); return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 864e5); };
const dayRec = (k = today()) => (S.days[k] ||= { xp:0, n:0, c:0, w:0, goalMet:false });

function levelInfo(xp) {
  let i = 0;
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++;
  let base = LEVELS[i][0], nextAt = i + 1 < LEVELS.length ? LEVELS[i + 1][0] : null;
  let n = i + 1, title = L([LEVELS[i][1], LEVELS[i][2]]);
  if (nextAt === null) {
    const extra = Math.floor((xp - base) / LEVEL_STEP);
    n += extra; base += extra * LEVEL_STEP; nextAt = base + LEVEL_STEP;
    if (extra > 0) title += " " + "★".repeat(Math.min(extra, 5));
  }
  return { n, title, raw:LEVELS[i][1], base, nextAt, pct:Math.min(1, (xp - base) / (nextAt - base)) };
}
function shownStreak() {
  if (!S.lastGoalDay) return 0;
  const d = diffDays(S.lastGoalDay, today());
  if (d <= 1) return S.streak;
  if (d === 2 && S.shields > 0) return S.streak;
  return 0;
}
const learnedIds = () => Object.keys(S.words).filter((id) => W[id]);

/* ---------- storage: browser now, private per-viewer db when the platform answers ---------- */
function migrate(o) {
  if (!o || (o.v !== 1 && o.v !== 2)) return null;
  const s = Object.assign(defaultState(), o);
  s.stats = Object.assign(defaultState().stats, o.stats || {});
  s.lessons = o.lessons || {};
  if (o.v === 1) { s.v = 2; s.onboarded = false; }
  return s;
}
function loadLocal() { try { const raw = localStorage.getItem(LS_KEY) || localStorage.getItem("wakha.v1"); if (raw) return migrate(JSON.parse(raw)); } catch (e) {} return null; }
function saveLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) {} }
const Remote = { ref:null, busy:false, again:false, off:false };
async function remoteSave() {
  if (!Remote.ref || Remote.off) return;
  if (Remote.busy) { Remote.again = true; return; }
  Remote.busy = true;
  try { await Remote.ref.set(JSON.parse(JSON.stringify(S))); }
  catch (e) { if (e && ["invalid_argument", "revoked", "not_granted", "quota_exceeded"].includes(e.code)) Remote.off = true; }
  Remote.busy = false;
  if (Remote.again) { Remote.again = false; remoteSave(); }
}
let saveTimer = null, remoteTimer = null;
function persist() {
  S.updatedAt = Date.now();
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveLocal, 500);
  if (Remote.ref && !remoteTimer) remoteTimer = setTimeout(() => { remoteTimer = null; remoteSave(); }, 4000);
}
function flushSaves() { clearTimeout(saveTimer); saveLocal(); if (remoteTimer) { clearTimeout(remoteTimer); remoteTimer = null; remoteSave(); } }
const Caps = { downloads:null };
async function connectCapabilities(onRemote) {
  if (!window.claude || typeof window.claude.use !== "function") return;
  const safeUse = (n) => window.claude.use(n).catch(() => null);
  safeUse("downloads").then((dl) => { Caps.downloads = dl || null; });
  try {
    const [db, user] = await Promise.all([safeUse("db"), safeUse("user")]);
    if (!db || !user) return;
    const uid = await user.id();
    if (!uid) return;
    const ref = db.doc("data/users/" + uid + "/progress");
    const snap = await ref.get();
    const remote = snap && snap.exists ? migrate(JSON.parse(JSON.stringify(snap.data()))) : null;
    Remote.ref = ref;
    const fresh = !Session.interacted;
    const ahead = remote && ((remote.xp || 0) > (S.xp || 0) || (fresh && (remote.updatedAt || 0) > (S.updatedAt || 0)));
    if (ahead && fresh) { S = remote; saveLocal(); onRemote && onRemote(); }
    else remoteSave();
  } catch (e) {}
}

/* ---------- audio: Darija voice clips + interface sounds ---------- */
let AUD = {};
try { AUD = JSON.parse(document.getElementById("aud").textContent || "{}"); } catch (e) { AUD = {}; }
// Darija voice. Plays through an <audio> element; if that is blocked (strict page sandboxes refuse
// data: media) or never starts, it switches to Web Audio, which decodes the same clips in memory.
const Voice = {
  el:null, marks:[], res:null, token:0, mode:"el", ctx:null, node:null, bufs:new Map(), wd:0,
  init() {
    this.el = new Audio(); this.el.preload = "auto";
    try { this.el.preservesPitch = true; } catch (e) {}
    this.el.addEventListener("ended", () => this.done());
    this.el.addEventListener("error", () => { if (this.res && this.mode === "el") this.fallback(); else this.done(false); });
    this.el.addEventListener("playing", () => clearTimeout(this.wd));
    // unlock both paths on the first touch, while the browser still counts it as a user gesture
    const unlock = () => { this.unlock(); };
    addEventListener("pointerdown", unlock, { capture:true }); addEventListener("keydown", unlock, { capture:true });
  },
  unlock() {
    try {
      if (!this.ctx) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) this.ctx = new AC(); }
      if (this.ctx && this.ctx.state !== "running") this.ctx.resume().catch(() => {});
      if (this.ctx && !this.primed) { const b = this.ctx.createBuffer(1, 1, 22050), s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination); s.start(0); this.primed = true; }
    } catch (e) {}
  },
  b64(text, voice = "n") {
    if (!text) return null;
    const k = audioKey(text);
    return (voice && voice !== "n" && AUD[voice + "|" + k]) || AUD[k] || null;
  },
  src(text, voice = "n") { const b = this.b64(text, voice); return b ? "data:audio/mpeg;base64," + b : null; },
  has(text, voice) { return !!this.b64(text, voice); },
  play(text, opts = {}) {
    const b = this.b64(text, opts.voice || "n");
    if (!b) return Promise.resolve(false);
    this.stop();
    const tok = ++this.token;
    this.cur = { b, rate:opts.rate || 1, tok };
    const marks = [];
    if (opts.btn) marks.push(opts.btn);
    if (opts.mark) marks.push(...opts.mark);
    marks.forEach((m) => m.classList.add("playing"));
    this.marks = marks;
    return new Promise((res) => {
      this.res = res;
      if (this.mode === "wa") { this.playWA(this.cur); return; }
      this.el.src = "data:audio/mpeg;base64," + b;
      this.el.playbackRate = this.cur.rate;
      // watchdog: if nothing is playing shortly after, switch to Web Audio
      clearTimeout(this.wd); this.wd = setTimeout(() => { if (tok === this.token && this.res && (this.el.paused || this.el.currentTime === 0)) this.fallback(); }, 1500);
      const p = this.el.play();
      if (p && p.catch) p.catch((err) => { if (tok !== this.token) return; if (err && err.name === "AbortError") return; this.fallback(); });
    });
  },
  fallback() {
    clearTimeout(this.wd);
    if (!this.cur || !this.res) return;
    try { this.el.pause(); this.el.removeAttribute("src"); } catch (e) {}
    this.mode = "wa";
    this.playWA(this.cur);
  },
  async playWA(cur) {
    try {
      this.unlock();
      if (!this.ctx) { this.done(false); return; }
      let buf = this.bufs.get(cur.b);
      if (!buf) {
        const bin = atob(cur.b), u = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        buf = await new Promise((ok, bad) => { const p = this.ctx.decodeAudioData(u.buffer, ok, bad); if (p && p.then) p.then(ok, bad); });
        if (this.bufs.size > 80) this.bufs.clear();
        this.bufs.set(cur.b, buf);
      }
      if (cur.tok !== this.token) return;
      if (this.ctx.state !== "running") await this.ctx.resume().catch(() => {});
      const s = this.ctx.createBufferSource(); s.buffer = buf; s.playbackRate.value = cur.rate;
      s.connect(this.ctx.destination); s.onended = () => { if (this.node === s) { this.node = null; this.done(true); } };
      this.node = s; s.start(0);
    } catch (e) { this.done(false); }
  },
  stop() {
    clearTimeout(this.wd);
    try { this.el.pause(); } catch (e) {}
    if (this.node) { const n = this.node; this.node = null; try { n.onended = null; n.stop(); } catch (e) {} }
    this.done(false);
  },
  done(ok = true) {
    clearTimeout(this.wd);
    this.marks.forEach((m) => m.classList.remove("playing")); this.marks = [];
    if (this.res) { const r = this.res; this.res = null; r(ok); }
  },
};
function autoSay(text, voice, mark) { if (S.voiceAuto && Session.gesture) return Voice.play(text, { voice, mark }); return Promise.resolve(false); }

const Sound = (() => {
  let ctx = null, master = null;
  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.45; master.connect(ctx.destination); } catch (e) { ctx = null; return null; }
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }
  function note(f, t0, d, type = "sine", g = 0.16, f2) {
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(g, t0 + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(gn); gn.connect(master); o.start(t0); o.stop(t0 + d + 0.03);
  }
  const P = {
    tap:(t0) => note(620, t0, 0.05, "triangle", 0.05),
    good:(t0) => { note(784, t0, 0.13, "sine", 0.15); note(1175, t0 + 0.08, 0.26, "sine", 0.13); },
    bad:(t0) => note(233, t0, 0.24, "triangle", 0.13, 155),
    combo:(t0, n) => { const b = 523 * Math.pow(2, Math.min(n, 9) / 12); [0, 4, 7].forEach((s, i) => note(b * Math.pow(2, s / 12), t0 + i * 0.06, 0.16, "sine", 0.09)); },
    level:(t0) => { [523, 659, 784, 1047, 1319].forEach((f, i) => note(f, t0 + i * 0.1, 0.32, "sine", 0.12)); note(2093, t0 + 0.55, 0.6, "sine", 0.05); },
    coin:(t0) => { note(1568, t0, 0.07, "square", 0.035); note(2093, t0 + 0.06, 0.2, "sine", 0.07); },
    open:(t0) => { note(180, t0, 0.35, "sawtooth", 0.03, 900); [1047, 1319, 1568, 2093].forEach((f, i) => note(f, t0 + 0.3 + i * 0.07, 0.3, "sine", 0.07)); },
    flip:(t0) => note(440, t0, 0.12, "triangle", 0.06, 990),
    tick:(t0) => note(1320, t0, 0.03, "square", 0.022),
    set:(t0, k = 0) => { const sc = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637, 3136]; note(sc[k % sc.length], t0, 0.09, "triangle", 0.06); },
    heart:(t0) => { note(880, t0, 0.08, "sine", 0.07); note(1320, t0 + 0.05, 0.14, "sine", 0.06); },
    whoosh:(t0) => note(260, t0, 0.2, "sine", 0.045, 820),
    match:(t0) => note(988, t0, 0.1, "sine", 0.1),
  };
  return {
    unlock() { ensure(); },
    play(name, arg) { if (!S.sound) return; const c = ensure(); if (!c) return; try { P[name] && P[name](c.currentTime + 0.01, arg); } catch (e) {} },
  };
})();

/* ---------- art ---------- */
function starPts(cx, cy, R, r, n = 8, rot = -Math.PI / 2) {
  const pts = [];
  for (let k = 0; k < 2 * n; k++) { const a = rot + (k * Math.PI) / n, rad = k % 2 ? r : R; pts.push((cx + rad * Math.cos(a)).toFixed(2) + "," + (cy + rad * Math.sin(a)).toFixed(2)); }
  return pts.join(" ");
}
function zelligeTile(stroke, op, size = 88, sw = 1.2) {
  const c = size / 2, R = size * 0.3, r = R * 0.7654, q = size * 0.14;
  const star = (x, y) => `<polygon points='${starPts(x, y, R, r)}'/>`;
  const dia = (x, y) => `<rect x='${(x - q / 2).toFixed(2)}' y='${(y - q / 2).toFixed(2)}' width='${q.toFixed(2)}' height='${q.toFixed(2)}' transform='rotate(45 ${x} ${y})'/>`;
  const inner = (x, y) => `<polygon points='${starPts(x, y, R * 0.42, R * 0.42 * 0.7654, 8, -Math.PI / 2 + Math.PI / 8)}'/>`;
  const body = [star(c, c), star(0, 0), star(size, 0), star(0, size), star(size, size), inner(c, c), dia(c, 0), dia(0, c), dia(size, c), dia(c, size)].join("");
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'><g fill='none' stroke='${stroke}' stroke-opacity='${op}' stroke-width='${sw}' stroke-linejoin='round'>${body}</g></svg>`;
}
const svgURI = (svg) => "data:image/svg+xml," + encodeURIComponent(svg);
function installPatterns() {
  const st = document.documentElement.style;
  st.setProperty("--zl-gold", `url("${svgURI(zelligeTile("#F3D08A", 0.26))}")`);
  st.setProperty("--zl-dark", `url("${svgURI(zelligeTile("#3A2105", 0.14))}")`);
  st.setProperty("--zl-page", `url("${svgURI(zelligeTile("#8C85B8", 0.12, 110))}")`);
  st.setProperty("--noise", `url("${svgURI("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>")}")`);
  st.setProperty("--zl-ivory", `url("${svgURI(zelligeTile("#FFFDF8", 0.2))}")`);
  // one class per city: plaster wall, niche, accent ink, three glazes and the tiled frame band
  const band = (a, b) => `url("${svgURI(`<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22'><rect width='22' height='22' fill='${a}'/><path d='M11 2l2.6 6.4L20 11l-6.4 2.6L11 20l-2.6-6.4L2 11l6.4-2.6z' fill='${b}'/><circle cx='11' cy='11' r='2' fill='#EDE5D6'/></svg>`)}")`;
  // the city's face: its real wall colour as a swatch (--wall-raw) and as a quiet panel tint (--wall).
  // Light: 45% wall over white. Dark: 10% wall over #161615. Every text colour stays above 4.5:1 on both.
  const mix = (a, b, t) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const x = p(a), y = p(b); return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const css = CITIES.map((c, i) => `.cv${i}{--wall:${mix(c.wall, "#FFFFFF", 0.55)};--wall-raw:${c.wall};--niche:${c.niche};--g0:${c.g[0]};--g1:${c.g[1]};--g2:${c.g[2]};--band:${band(c.g[0], c.g[2] === "#F0E9DA" ? c.g[1] : c.g[2])}}`).join("\n");
  const dk = CITIES.map((c, i) => `.cv${i}{--wall:${mix(c.wall, "#161615", 0.9)}}`).join("\n");
  const css2 = css + `\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) ${dk.replace(/\n/g, "\n:root:not([data-theme=\"light\"]) ")}}\n` + dk.split("\n").map((r) => `:root[data-theme="dark"] ${r}`).join("\n");
  const tag = document.createElement("style"); tag.textContent = css2; document.head.appendChild(tag);
}
const cityOf = (ui) => CITIES[Math.max(0, Math.min(CITIES.length - 1, ui))];
const cityName = (c) => X(c.en, c.fr);
// the medallion for one unit, reflecting the real state of each of its lessons
function unitStates(ui) { return PATH.map((n, idx) => ({ n, idx })).filter((x) => x.n.unit === ui).map((x) => nodeState(x.idx)); }
function medallion(ui, states, cls = "") { const c = cityOf(ui); return Zel.svg(c.g, states, { seed:ui * 31 + 5, field:c.field, cls:(states.some((x) => x === "done") ? "any " : "") + cls }); }
function panelHTML(ui, states, attrs = "") { return `<div class="panel cv${ui}" ${attrs}><span class="inner"></span><div class="zwrap">${medallion(ui, states)}</div></div>`; }
// a small eight-point glazed star used where the old emoji medals were
function medalMark() { return `<svg viewBox="-30 -30 60 60" aria-hidden="true"><polygon points="${starPts(0, 0, 27, 20.5, 8)}" style="fill:var(--g0,#13706F)" stroke="#E9E0CF" stroke-width="1.5" stroke-linejoin="round"/><polygon points="${starPts(0, 0, 13, 9.8, 8, -Math.PI / 2 + Math.PI / 8)}" style="fill:var(--g2,#E0A631)" stroke="#E9E0CF" stroke-width="1.2" stroke-linejoin="round"/></svg>`; }
const ARCH = `<svg class="arch" viewBox="0 0 200 320" aria-hidden="true"><path d="M30 320V150A70 70 0 1 1 170 150V320" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M46 320V152A54 54 0 1 1 154 152V320" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M100 54l7 12 14 2-10 10 2 14-13-7-13 7 2-14-10-10 14-2z" fill="currentColor" opacity=".7"/></svg>`;
const INK = "#2A1B3D";
/* =========================================================
   MCHICHA v5: a white Tangier street cat, drawn as real illustrations (green-screen sheets in assets/mchicha,
   cut into WebP sprites by build/cat_sprites.py into src/cat_sprites.js). Two kinds of picture:
     bust  head and shoulders for small spots. Sassy, grumpy, surprised, sad and happy come in every hat.
     full  whole body in a pose for big moments.
   Animation is flipbook frames drawn from the same picture, so outlines never move:
     blink   half-closed then closed eyes (most faces), closed for the sassy hats
     talk    three mouth shapes on the sassy bust (every hat), played while she speaks
     twitch  an ear flick on the sassy no-hat bust
     jump    seven frames for level ups and perfect lessons
   ========================================================= */
const CAT_HATS = { none:1, tarbouche:1, tagiya:1, terrazza:1, cheche:1, beanie:1, bucket:1, rose:1, shades:1 };
const CAT_HAT_MOOD = { sassy:"s", grumpy:"g", wow:"w", sad:"d", happy:"h" };
const CAT_BUST = { playful:"p_playful", annoyed:"p_annoyed", curious:"p_curious", mischievous:"p_mischievous",
  love:"b_love", wink:"b_wink", sleepy:"b_sassy", cheer:"p_playful", jump:"p_playful", wave:"p_playful", proud:"b_happy", shrug:"p_annoyed", facepalm:"p_grumpy" };
const CAT_FULL = { sassy:"f_sassy", happy:"f_happy", playful:"f_playful", pounce:"f_pounce", grumpy:"f_grumpy", sad:"f_sad", wow:"f_wow", annoyed:"f_annoyed",
  unimpressed:"f_unimpressed", curious:"f_curious", mischievous:"f_mischievous", sleepy:"f_sleepy", love:"f_love", wink:"f_wink",
  wave:"a_wave", jump:"a_jump", cheer:"a_cheer", proud:"a_proud", shrug:"a_shrug", facepalm:"a_facepalm" };
// which sprite a cat shows, and the frame sets it can play
function catKey(mood = "sassy", kind = "bust", hat = "none") {
  if (mood === "normal") mood = "sassy";
  if (kind === "full") return CAT_FULL[mood] || "f_sassy";
  const hm = CAT_HAT_MOOD[mood];
  if (hm) return "h" + hm + "_" + (CAT_HATS[hat] ? hat : "none");
  return CAT_BUST[mood] || "p_" + mood;
}
function catFrames(k) {
  const f = (s) => CAT_IMG[k + s] ? k + s : null;
  const blink = f("_h") && f("_c") ? [k + "_h", k + "_c", k + "_c", k + "_h"] : f("_c") ? [k + "_c", k + "_c"] : null;
  const talk = f("_t1") ? [k + "_t1", k + "_t2", k + "_t3"] : null;
  const twitch = f("_e1") ? [k + "_e1", k + "_e2", k + "_e1"] : null;
  return { blink, talk, twitch };
}
function mascot(mood = "sassy", cls = "", hat, kind = "bust") {
  if (hat == null) hat = (typeof S !== "undefined" && S.catHat) || "none";
  if (mood === "normal") mood = "sassy";
  if (kind === "full" && mood === "jumpseq") return catJump(cls);
  const k = catKey(mood, kind, hat);
  return `<span class="cat mc ${kind} ${cls}" data-mood="${mood}" data-kind="${kind}" data-k="${k}" aria-hidden="true"><span class="cat-in"><img class="cat-img" src="${CAT_IMG[k] || CAT_IMG.p_happy}" alt="" draggable="false"><img class="cat-fx" alt="" draggable="false" hidden></span></span>`;
}
// the jump: seven frames that play once, each lifted to its height in the air, ending in a happy sit
const CAT_JUMP_Y = [0, -6, -20, -16, -8, 0, 0];
function catJump(cls = "") {
  const step = 105;
  return `<span class="cat mc full catseq ${cls}" data-mood="jump" data-kind="full" aria-hidden="true">${CAT_JUMP_Y.map((y, i) => `<img src="${CAT_IMG["j_" + i]}" alt="" draggable="false" class="${i === 6 ? "last" : ""}" style="--y:${y}%;animation-delay:${i * step}ms">`).join("")}</span>`;
}
// flipbook player: shows frames over the picture one after another, then hides the overlay
function catPlayFrames(el, keys, ms = 55, done) {
  const fx = el && el.querySelector(".cat-fx"); if (!fx || !keys || reduced) { done && done(); return; }
  clearTimeout(el._fxT); let i = 0;
  const next = () => {
    if (i >= keys.length) { fx.hidden = true; el.classList.remove("fx-on"); done && done(); return; }
    fx.src = CAT_IMG[keys[i++]]; fx.hidden = false; el.classList.add("fx-on");
    el._fxT = setTimeout(next, ms);
  };
  next();
}
function catBlink(el) { if (el && el.dataset.k) catPlayFrames(el, catFrames(el.dataset.k).blink, 45); }
function catTwitch(el) { if (el && el.dataset.k) catPlayFrames(el, catFrames(el.dataset.k).twitch, 75); }
// she talks: mouth shapes in a loose rhythm for as long as the word lasts
function catSpeak(el, ms = 900) {
  if (!el || !el.dataset.k) return false;
  const t = catFrames(el.dataset.k).talk; if (!t) return false;
  const seq = [], n = Math.max(3, Math.round(ms / 110));
  for (let i = 0; i < n; i++) seq.push(t[(i * 2 + (i % 3)) % 3]);
  catPlayFrames(el, seq, 110);
  return true;
}
// decode every frame once in idle time so the first blink or word never flickers
function catPreload() {
  const keys = Object.keys(CAT_IMG); let i = 0;
  const run = (dl) => { while (i < keys.length && (!dl || dl.timeRemaining() > 4)) { const im = new Image(); im.src = CAT_IMG[keys[i++]]; im.decode && im.decode().catch(() => {}); } if (i < keys.length) idle(run); };
  const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f) : setTimeout(() => f(null), 200));
  idle(run);
}
// the head-and-shoulders picture alone (hat picker, badges)
function catHead(mood = "sassy", hat = "none") { return CAT_IMG[catKey(mood, "bust", hat)]; }

// which hat Mchicha wears in each city's badge
const CITY_HAT = { Tangier:"bucket", Asilah:"none", Chefchaouen:"terrazza", Tetouan:"terrazza", Rabat:"beanie", Agadir:"beanie", Fes:"tarbouche", Ifrane:"beanie", Meknes:"tagiya", Azrou:"tagiya",
  Marrakech:"tarbouche", Taroudant:"tarbouche", Casablanca:"shades", "El Jadida":"shades", "Kelaat M’Gouna":"rose", Ouarzazate:"cheche", Merzouga:"cheche", Zagora:"cheche", Essaouira:"bucket", Dakhla:"bucket" };

// A keyhole-arch badge for each city on the Journey: Mchicha's head in front of something from that city.
const BADGE_PROPS = {
  // Tangier: the ferry coming in
  "Tangier":`<path d="M0 36h62v28H0Z" fill="#7FB4C9"/><path d="M0 37q4-2.5 8 0t8 0 8 0 8 0 8 0 8 0 8 0" fill="none" stroke="#FFFFFF" stroke-width="1.4" opacity=".85"/>
   <g transform="translate(26 14)"><path d="M0 18h26l-4.5 7H4Z" fill="#FFFFFF" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 18v-5h14v5" fill="#FFFFFF" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 15.5h2M12 15.5h2" stroke="#1F45B5" stroke-width="1.6"/><path d="M14 13V7h4v6" fill="#1F45B5" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M3 21.5h20" stroke="#1F45B5" stroke-width="1.4"/></g>`,
  // Chefchaouen: a blue door with studs
  "Chefchaouen":`<path d="M27 64V27C27 19 31.5 14 37.5 14S48 19 48 27V64Z" fill="#3B79C6" stroke="#22307A" stroke-width="1.5"/><path d="M31 64V28C31 22 34 18 37.5 18S44 22 44 28V64" fill="none" stroke="#22307A" stroke-width="1.2" opacity=".7"/>
   <g fill="#F0E9DA">${[24, 31, 38].map((y) => [34, 37.5, 41].map((x) => `<circle cx="${x}" cy="${y}" r="1.1"/>`).join("")).join("")}</g><circle cx="42" cy="46" r="1.6" fill="#E0A631"/>`,
  // Rabat: match day bunting and a ball
  "Rabat":`<path d="M0 12Q28 22 56 12" fill="none" stroke="#2B231D" stroke-width="1"/><g stroke="#2B231D" stroke-width=".8" stroke-linejoin="round">${[[6, "#C1272D"], [15, "#006233"], [24, "#C1272D"], [33, "#006233"], [42, "#C1272D"], [51, "#006233"]].map(([x, f]) => { const y = 12 + 10 * (1 - Math.pow((x - 28) / 28, 2)) * .5; return `<path d="M${x - 3.2} ${y}h6.4L${x} ${y + 7}Z" fill="${f}"/>`; }).join("")}</g>
   <circle cx="44" cy="48" r="8" fill="#FFFFFF" stroke="#2B231D" stroke-width="1.5"/><path d="M44 43.6l4 2.9-1.5 4.6h-5l-1.5-4.6Z" fill="#2B231D"/><path d="M44 43.6V40.2M48 46.5l3.2-1M46.5 51.1l2 2.7M41.5 51.1l-2 2.7M40 46.5l-3.2-1" stroke="#2B231D" stroke-width="1"/>`,
  // Fes: a brass lantern throwing patterned light
  "Fes":`<circle cx="41" cy="27" r="15" fill="#FFC53D" opacity=".3"/><path d="M41 0v9" stroke="#7A4E00" stroke-width="1.5"/>
   <g transform="translate(41 9)"><path d="M-6 4L0-1l6 5Z" fill="#E0A631" stroke="#7A4E00" stroke-width="1.4" stroke-linejoin="round"/><path d="M-8 5h16l4 11-4 11H-8l-4-11Z" fill="#FFC53D" stroke="#7A4E00" stroke-width="1.5" stroke-linejoin="round"/>
   <path d="M0 8l2.4 3-2.4 3-2.4-3ZM-5 15l2 2.4-2 2.4-2-2.4ZM5 15l2 2.4-2 2.4-2-2.4ZM0 19l2.4 3-2.4 3-2.4-3Z" fill="#7A4E00"/><path d="M-6 27l1.5 4h9l1.5-4Z" fill="#E0A631" stroke="#7A4E00" stroke-width="1.3" stroke-linejoin="round"/></g>`,
  // Meknes: a glass of mint tea, steaming
  "Meknes":`<path d="M40 30q-2.5-3.5 0-7M45 30q2.5-3.5 0-7" fill="none" stroke="#2B231D" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>
   <path d="M35 33h15l-2.2 21h-10.6Z" fill="#C7843A" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M35.8 38.5h13.4" stroke="#FFFFFF" stroke-width="1.2" opacity=".55"/><path d="M38 41v9" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".4"/>
   <path d="M44 33c2.5-5.5 8.5-5.5 9.5-2.5-2.5 2.6-5.5 3.8-9.5 2.5Z" fill="#2F8A5B" stroke="#1B4F33" stroke-width="1.1"/><path d="M32 57h21" stroke="#2B231D" stroke-width="1.5" stroke-linecap="round" opacity=".5"/>`,
  // Marrakech: a tajine
  "Marrakech":`<ellipse cx="42" cy="56" rx="13" ry="3.4" fill="#B4532A" stroke="#4A1F0D" stroke-width="1.5"/><path d="M42 32L52.5 53H31.5Z" fill="#E07A3F" stroke="#4A1F0D" stroke-width="1.5" stroke-linejoin="round"/>
   <circle cx="42" cy="31.5" r="2.4" fill="#FFC53D" stroke="#4A1F0D" stroke-width="1.2"/><path d="M35.6 45h12.8M33.6 49h16.8" stroke="#FFC53D" stroke-width="1.4"/><path d="M40.2 47l1.8-1.8 1.8 1.8-1.8 1.8Z" fill="#2F3BEB"/>`,
  // Casablanca: a tall minaret over the Atlantic
  "Casablanca":`<path d="M0 40h62v24H0Z" fill="#9FC3CC"/><path d="M0 41q5-2 10 0t10 0 10 0 10 0 10 0 10 0" fill="none" stroke="#FFFFFF" stroke-width="1.2" opacity=".8"/>
   <path d="M36 42V14h10v28Z" fill="#E7DCC6" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M37.5 8.5h7v5.5h-7Z" fill="#E7DCC6" stroke="#2B231D" stroke-width="1.4"/><path d="M41 8.5V3" stroke="#2B231D" stroke-width="1.3"/><circle cx="41" cy="3" r="1.2" fill="#B8913E"/>
   <path d="M36 20h10M36 29h10" stroke="#157A7A" stroke-width="1.5"/><path d="M39.5 22.5h3v4.5h-3ZM39.5 32h3v5h-3Z" fill="#157A7A"/>`,
  // Kelaat M’Gouna: a damask rose
  "Kelaat M’Gouna":`<path d="M42 64V46" stroke="#2F8A5B" stroke-width="1.8"/><path d="M42 56c-4-1-7 1-8 3 4 1 6 0 8-3ZM42 52c4-2 7-1 8 1-3 2-6 2-8-1Z" fill="#2F8A5B" stroke="#1B4F33" stroke-width="1"/>
   <g transform="translate(42 40)"><circle r="8.5" fill="#D9486A" stroke="#7A1E36" stroke-width="1.5"/><path d="M-3.4 0a3.4 3.4 0 1 1 5.2 2.8M-5.8 2a6.2 6.2 0 0 0 11.4 0M-1 -2.6a2 2 0 1 1 2 2" fill="none" stroke="#7A1E36" stroke-width="1.2" stroke-linecap="round"/></g>
   <path d="M10 14q2.5-2.5 5 0-2.5 2.5-5 0ZM44 12q2.5-2.5 5 0-2.5 2.5-5 0ZM26 8q2-2 4 0-2 2-4 0Z" fill="#D9486A" opacity=".75"/>`,
  // Merzouga: dunes, a low sun and a camel
  "Merzouga":`<circle cx="16" cy="18" r="7" fill="#F6B04B"/><path d="M0 40Q18 26 36 37T56 33V64H-2Z" fill="#E3A462"/><path d="M0 52Q22 40 56 50V64H-2Z" fill="#CC8445"/>
   <g transform="translate(33 22)" fill="none" stroke="#2B231D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M0 9c1-4 4-5 6-2 1.5-4 4.5-4 6 0h2c1.5 0 2-2 2.5-4"/><path d="M16.5 3l2 .5"/><path d="M2 9v6M5 9.5v5.5M11 9.5v5.5M14 9v6"/></g>`,
  // Essaouira: gulls over a blue fishing boat
  "Essaouira":`<path d="M0 44h62v20H0Z" fill="#8DB9CF"/><path d="M8 14q3.5-3.5 7 0 3.5-3.5 7 0M36 8q2.5-2.5 5 0 2.5-2.5 5 0" fill="none" stroke="#2B231D" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
   <path d="M31 38h22l-3.5 7h-15Z" fill="#2F6FB5" stroke="#2B231D" stroke-width="1.5" stroke-linejoin="round"/><path d="M32 40.5h20" stroke="#FFFFFF" stroke-width="1.2"/><path d="M42 38V26l7 9h-7" fill="#F4F0E8" stroke="#2B231D" stroke-width="1.3" stroke-linejoin="round"/>
   <path d="M0 50q5-3 9 0t9 0 9 0 9 0 9 0 9 0 9 0" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity=".8"/>`,
  // Asilah: a painted mural on a whitewashed wall
  "Asilah":`<path d="M30 14h22v30H30Z" fill="#FFFFFF" stroke="#2B231D" stroke-width="1.3"/><circle cx="41" cy="25" r="6" fill="#E8B04A"/><path d="M30 34q5.5-5 11 0t11 0V44H30Z" fill="#4FA3B8"/><path d="M30 38q5.5-4 11 0t11 0" fill="none" stroke="#2C5D8A" stroke-width="1.4"/>
   <path d="M0 50h62" stroke="#2C5D8A" stroke-width="3"/>`,
  // Tetouan: the white dove over a green door
  "Tetouan":`<path d="M33 64V36c0-5 3.5-8.5 8-8.5s8 3.5 8 8.5v28Z" fill="#2D6A4F" stroke="#1B4332" stroke-width="1.4"/><circle cx="45" cy="47" r="1.3" fill="#E6C36A"/>
   <g transform="translate(36 10)"><path d="M0 8c4-1 7 0 9 3 2-4 6-7 11-7-3 2-5 5-6 9-4 2-9 2-14-5Z" fill="#FFFFFF" stroke="#2B231D" stroke-width="1.3" stroke-linejoin="round"/><circle cx="2.4" cy="7.6" r=".7" fill="#2B231D"/></g>`,
  // Agadir: floodlights over a stadium by the ocean
  "Agadir":`<path d="M0 40h62v24H0Z" fill="#7FB4C9"/><g transform="translate(-4 6) scale(.9)"><path d="M26 46c0-8 7-12 16-12s16 4 16 12v4H26Z" fill="#F4F0E8" stroke="#2B231D" stroke-width="1.4" stroke-linejoin="round"/><path d="M29 44h26" stroke="#C1272D" stroke-width="1.6"/><path d="M31 40h22" stroke="#2B231D" stroke-width="1" opacity=".4"/>
   <path d="M30 34V14M54 34V14" stroke="#2B231D" stroke-width="1.4"/><path d="M27 10h6v4h-6ZM51 10h6v4h-6Z" fill="#F6D365" stroke="#2B231D" stroke-width="1.2"/></g>`,
  // Ifrane: a snowy chalet roof and falling snow
  "Ifrane":`<path d="M0 50h62v14H0Z" fill="#FFFFFF"/><path d="M32 50V36h18v14Z" fill="#E7DCC6" stroke="#2B231D" stroke-width="1.4"/><path d="M29 37L41 25l12 12Z" fill="#7A2E2A" stroke="#2B231D" stroke-width="1.4" stroke-linejoin="round"/><path d="M31 35.5L41 26l10 9.5" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/><path d="M38 42h5v8h-5Z" fill="#2F5D50"/>
   <g fill="#FFFFFF" stroke="#2B231D" stroke-width=".6">${[[12, 10], [24, 6], [36, 12], [50, 8], [18, 20], [46, 18]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join("")}</g>`,
  // Azrou: a cedar tree
  "Azrou":`<path d="M41 62V44" stroke="#6B4423" stroke-width="3"/><g fill="#3D5A2A" stroke="#22341A" stroke-width="1.3" stroke-linejoin="round"><path d="M28 48h26l-4-6H32Z"/><path d="M31 41h20l-4-6H35Z"/><path d="M34 34h14l-3.5-6h-7Z"/><path d="M37 27h8l-4-6Z"/></g>`,
  // Taroudant: the old ochre ramparts and a palm
  "Taroudant":`<path d="M-2 40h6v-4h5v4h6v-4h5v4h6v-4h5v4h6v-4h5v4h6v-4h5v4h6v24H-2Z" fill="#C98A4B" stroke="#6B3A1E" stroke-width="1.3" stroke-linejoin="round"/>
   <path d="M44 36V14" stroke="#6B4423" stroke-width="2.4" stroke-linecap="round"/><g fill="#2F8A5B" stroke="#1B4F33" stroke-width="1"><path d="M44 14c-4-3-9-2-11 1 4-1 7 0 11-1Z"/><path d="M44 14c4-3 9-2 11 1-4-1-7 0-11-1Z"/><path d="M44 14c-2-4-6-5-9-4 3 1 6 2 9 4Z"/><path d="M44 14c2-4 6-5 9-4-3 1-6 2-9 4Z"/></g>`,
  // El Jadida: the arches of the old Portuguese cistern
  "El Jadida":`<path d="M24 22h38v28H24Z" fill="#E4DED2"/><g fill="#A88F6A" stroke="#5E4B30" stroke-width="1.2">${[26, 37, 48].map((x) => `<path d="M${x} 50V30a5.5 5.5 0 0 1 11 0v20h-2.5V31a3 3 0 0 0-6 0v19Z"/>`).join("")}</g><path d="M24 22h38" stroke="#5E4B30" stroke-width="1.6"/>
   <path d="M0 50h62v14H0Z" fill="#4F9DB8" opacity=".75"/><path d="M27 54h9M38 56h9M49 54h9" stroke="#FFFFFF" stroke-width="1.2" opacity=".7"/>`,
  // Ouarzazate: a kasbah tower
  "Ouarzazate":`<path d="M30 60l3-38h16l3 38Z" fill="#C98A4B" stroke="#6B3A1E" stroke-width="1.4" stroke-linejoin="round"/><path d="M33 22v-4h3v4M39.5 22v-4h3v4M46 22v-4h3v4" fill="#C98A4B" stroke="#6B3A1E" stroke-width="1.2"/>
   <path d="M35 28l2-2 2 2-2 2ZM43 28l2-2 2 2-2 2Z" fill="#6B3A1E"/><path d="M38.5 36h5v6h-5ZM38.5 48h5v12h-5Z" fill="#6B3A1E"/><path d="M0 60h62v4H0Z" fill="#B3713F"/>`,
  // Zagora: a palm grove and the road sign into the sand
  "Zagora":`<path d="M0 46Q20 38 62 46V64H0Z" fill="#E3A462"/><path d="M48 46V28" stroke="#6B4423" stroke-width="1.6"/><path d="M36 22h20l3 3-3 3H36Z" fill="#F4F0E8" stroke="#2B231D" stroke-width="1.3" stroke-linejoin="round"/><path d="M39 25h11" stroke="#2B231D" stroke-width="1.1" stroke-dasharray="2 1.5"/>
   <path d="M33 46V30" stroke="#6B4423" stroke-width="2" stroke-linecap="round"/><g fill="#3F7D4E" stroke="#1B4F33" stroke-width=".9"><path d="M33 30c-3-2.5-7-2-9 .5 3-1 6 0 9-.5Z"/><path d="M33 30c3-2.5 7-2 9 .5-3-1-6 0-9-.5Z"/><path d="M33 30c-1.5-3.5-5-4-7.5-3 2.5 1 5 1.5 7.5 3Z"/></g>`,
  // Dakhla: a kite over the lagoon
  "Dakhla":`<path d="M0 44h62v20H0Z" fill="#5FC1C0"/><path d="M0 48q6-3 12 0t12 0 12 0 12 0 12 0" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity=".8"/>
   <path d="M30 14q12-10 24 0l-4 3q-8-6-16 0Z" fill="#F2C46D" stroke="#2B231D" stroke-width="1.3" stroke-linejoin="round"/><path d="M32 16L46 44M52 16L46 44" stroke="#2B231D" stroke-width=".8" opacity=".6"/><path d="M44 44h5l-1 2h-3Z" fill="#126B73" stroke="#2B231D" stroke-width="1"/>`,
};
const BADGE_ARCH = "M7 64V33C2 25 5 4 28 4S54 25 49 33V64Z";
function cityBadge(ui, mood = "happy") {
  const c = CITIES[ui] || CITIES[0], id = `cb${ui}`;
  return `<svg class="cbadge" viewBox="0 0 56 64" aria-hidden="true"><defs><clipPath id="${id}"><path d="${BADGE_ARCH}"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect width="56" height="64" fill="${c.wall}"/><g transform="translate(-4.5 0)">${BADGE_PROPS[c.en] || ""}</g>
      <image href="${catHead("sassy", CITY_HAT[c.en] || "none")}" x="1" y="18" width="42" height="46" preserveAspectRatio="xMidYMax meet"/></g>
    <path d="${BADGE_ARCH}" fill="none" stroke="#2B231D" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
function vendorFace() {
  return `<svg class="face-v" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" fill="#FFE3C4"/>
    <path d="M14 30c0-12 8-19 18-19s18 7 18 19v6c0 13-8 22-18 22S14 49 14 36Z" fill="#B9784C" stroke="${INK}" stroke-width="2.4"/>
    <path d="M16 38c3 14 9 20 16 20s13-6 16-20c-4 6-9 8-16 8s-12-2-16-8Z" fill="#F4F0E8" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M22 40c4-3 7-3 10 0 3-3 6-3 10 0" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="25" cy="30" r="2.6" fill="${INK}"/><circle cx="39" cy="30" r="2.6" fill="${INK}"/>
    <path d="M21 24l7-1M43 24l-7-1" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M21 15l2-11q9-3 18 0l2 11q-11 3-22 0Z" fill="#C9233C" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
}
const ITEM_ART = {
  belgha:`<svg viewBox="0 0 150 110" aria-hidden="true">${[[-11, 0], [11, 62]].map(([r, dx]) => `<g transform="translate(${dx} 0) rotate(${r} 44 56)"><path d="M44 6C58 20 63 44 61 68C60 88 52 100 43 100C34 100 26 88 25 68C23 44 30 20 44 6Z" fill="#F2C14E" stroke="#5A3A12" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="43" cy="72" rx="11.5" ry="19" fill="#B9822A" stroke="#5A3A12" stroke-width="2.5"/><path d="M44 16C52 28 55 40 54 50M44 16C36 28 33 40 34 50" fill="none" stroke="#C9233C" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="1 5"/><path d="M38 40l6 5 6-5" fill="none" stroke="#2F3BEB" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>`).join("")}</svg>`,
  zrbiya:`<svg viewBox="0 0 160 100" aria-hidden="true"><g stroke="#F4F0E8" stroke-width="2.4" stroke-linecap="round">${Array.from({ length:9 }, (_, i) => `<path d="M22 ${16 + i * 8.5}h-12"/><path d="M138 ${16 + i * 8.5}h12"/>`).join("")}</g><rect x="20" y="10" width="120" height="80" rx="4" fill="#C9233C" stroke="#5A0F1C" stroke-width="3"/><rect x="29" y="19" width="102" height="62" rx="2" fill="none" stroke="#FFC53D" stroke-width="3"/><path d="M80 26L108 50L80 74L52 50Z" fill="#2F3BEB" stroke="#FFC53D" stroke-width="3"/><path d="M80 40L92 50L80 60L68 50Z" fill="#FFC53D"/><path d="M40 30l6 6-6 6-6-6ZM120 30l6 6-6 6-6-6ZM40 58l6 6-6 6-6-6ZM120 58l6 6-6 6-6-6Z" fill="#F4F0E8"/></svg>`,
  fanar:`<svg viewBox="0 0 120 150" aria-hidden="true"><circle cx="60" cy="86" r="52" fill="#FFC53D" opacity=".18"/><path d="M60 4v18" stroke="#7A4E00" stroke-width="3"/><path d="M44 36L60 20L76 36Z" fill="#E9A61B" stroke="#7A4E00" stroke-width="3" stroke-linejoin="round"/><path d="M38 40H82L94 84L82 128H38L26 84Z" fill="#FFC53D" stroke="#7A4E00" stroke-width="3.5" stroke-linejoin="round"/><g fill="#7A4E00">${[56, 72, 88, 104].map((y) => [44, 60, 76].map((x) => `<path d="M${x} ${y - 5}l4 5-4 5-4-5Z"/>`).join("")).join("")}</g><path d="M44 128L48 140H72L76 128Z" fill="#E9A61B" stroke="#7A4E00" stroke-width="3" stroke-linejoin="round"/></svg>`,
  berrad:`<svg viewBox="0 0 150 120" aria-hidden="true"><path d="M30 62C14 58 8 44 12 36" fill="none" stroke="#9AA3AD" stroke-width="7" stroke-linecap="round"/><path d="M116 70C132 60 140 44 146 30" fill="none" stroke="#C7CDD3" stroke-width="8" stroke-linecap="round"/><path d="M40 52C40 36 56 28 75 28S110 36 110 52L114 92C114 104 96 110 75 110S36 104 36 92Z" fill="#D9DEE3" stroke="#59616B" stroke-width="3.5" stroke-linejoin="round"/><path d="M52 28C56 16 64 10 75 10S94 16 98 28Z" fill="#C7CDD3" stroke="#59616B" stroke-width="3.5" stroke-linejoin="round"/><circle cx="75" cy="8" r="5" fill="#FFC53D" stroke="#59616B" stroke-width="2.5"/><path d="M44 64H106M42 84H108" stroke="#FFC53D" stroke-width="4"/><path d="M60 74l5-5 5 5-5 5ZM80 74l5-5 5 5-5 5Z" fill="#2F3BEB"/></svg>`,
  tajine:`<svg viewBox="0 0 150 120" aria-hidden="true"><ellipse cx="75" cy="98" rx="62" ry="12" fill="#B4532A" stroke="#4A1F0D" stroke-width="3.5"/><path d="M75 12L122 90H28Z" fill="#E07A3F" stroke="#4A1F0D" stroke-width="3.5" stroke-linejoin="round"/><circle cx="75" cy="12" r="7" fill="#FFC53D" stroke="#4A1F0D" stroke-width="3"/><path d="M50 62H100M40 78H110" stroke="#FFC53D" stroke-width="4"/><path d="M60 70l5-5 5 5-5 5ZM80 70l5-5 5 5-5 5ZM70 54l5-5 5 5-5 5Z" fill="#2F3BEB"/></svg>`,
};
function chestArt() {
  return `<svg class="chest" viewBox="0 0 180 160" aria-hidden="true">
    <ellipse cx="90" cy="146" rx="62" ry="8" fill="#000" opacity=".3"/>
    <rect x="22" y="68" width="136" height="72" rx="12" fill="#B3203F" stroke="#3E0614" stroke-width="4"/>
    <path d="M22 92H158" stroke="#EBC274" stroke-width="7"/>
    <rect x="44" y="68" width="14" height="72" fill="#EBC274" stroke="#7A5316" stroke-width="2.5"/>
    <rect x="122" y="68" width="14" height="72" fill="#EBC274" stroke="#7A5316" stroke-width="2.5"/>
    <rect x="77" y="84" width="26" height="30" rx="6" fill="#F8DFA4" stroke="#7A5316" stroke-width="3"/>
    <circle cx="90" cy="96" r="4.5" fill="#3E0614"/><path d="M90 98v8" stroke="#3E0614" stroke-width="3.5" stroke-linecap="round"/>
    <g class="lid">
      <path d="M22 70V58C22 36 50 24 90 24S158 36 158 58V70Z" fill="#D0304F" stroke="#3E0614" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 70V32M136 70V32" stroke="#EBC274" stroke-width="12"/>
      <polygon points="${starPts(90, 47, 13, 9.95)}" fill="#F8DFA4" stroke="#7A5316" stroke-width="2"/>
    </g>
  </svg>`;
}
const ICON = {
  learn:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 21V10a7 7 0 0 1 14 0v11"/><path d="M9 21v-8a3 3 0 0 1 6 0v8"/><path d="M3 21h18" stroke-linecap="round"/></svg>`,
  feed:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="m10 9 5 3-5 3Z" fill="currentColor"/></svg>`,
  guide:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5Z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M9 8h6M9 11.5h4" stroke-linecap="round"/></svg>`,
  kenz:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 10a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v1H3Z"/><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M10 11v3h4v-3"/></svg>`,
  me:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8.5" r="4"/><path d="M4.5 20c1.2-3.8 4.1-5.5 7.5-5.5s6.3 1.7 7.5 5.5"/></svg>`,
  heart:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4Z"/></svg>`,
  heartLine:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.8 3.6 4.5 7 4.5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.4 0 5.5 3.3 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4Z"/></svg>`,
  speak:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 19V5L7.5 9.5Z" fill="currentColor"/><path class="w" d="M15.5 9a4 4 0 0 1 0 6"/><path class="w w2" d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>`,
  turtle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15c0-4 3.6-7 8-7s8 3 8 7Z"/><path d="M20 13h1.5a1.5 1.5 0 0 0 0-3H20M6 15l-1 3M18 15l1 3M9.5 15l-.5 3M14.5 15l.5 3"/><path d="M9 9.5l2 3h2l2-3"/></svg>`,
  share:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v6.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V12"/></svg>`,
  up:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 6-6 6 6"/></svg>`,
  down:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 10 6 6 6-6"/></svg>`,
  right:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>`,
  check:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`,
  x:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  bolt:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 2 4 13.5h6.5L9.5 22 20 9.5h-6.6Z"/></svg>`,
  star:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8Z"/></svg>`,
  tap:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-.5a1.5 1.5 0 0 1 3 0v1m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-4.7-2.3L4 15.5a1.5 1.5 0 0 1 2.3-1.9L9 16"/></svg>`,
  sparkle:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c.6 4.8 2.2 6.4 7 7-4.8.6-6.4 2.2-7 7-.6-4.8-2.2-6.4-7-7 4.8-.6 6.4-2.2 7-7Zm7 12c.3 2.3 1.1 3.1 3.4 3.4-2.3.3-3.1 1.1-3.4 3.4-.3-2.3-1.1-3.1-3.4-3.4 2.3-.3 3.1-1.1 3.4-3.4Z"/></svg>`,
  shield:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 20 5.6v6.1c0 4.9-3.4 8.7-8 9.8-4.6-1.1-8-4.9-8-9.8V5.6Z"/></svg>`,
  copy:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
  lock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`,
  loop:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/></svg>`,
  tagI:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.6" fill="currentColor"/></svg>`,
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>`,
  quote:`<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 18v-5.5C4 8.4 6.2 5.6 10 5l.6 1.9C8.4 7.6 7.5 9 7.4 11H10v7Zm10 0v-5.5c0-4.1 2.2-6.9 6-7.5l.6 1.9c-2.2.7-3.1 2.1-3.2 4.1H20v7Z"/></svg>`,
  chat:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4Z"/></svg>`,
  ear:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-5.5 1.6"/><path d="M10 9.5a2 2 0 0 1 4 0c0 1.2-1 1.6-1.5 2.4"/></svg>`,
  info:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>`,
};
function flameSVG(cls = "") { return `<svg class="${cls}" viewBox="0 0 20 24" aria-hidden="true"><path d="M10 1.5c1.2 3.6-.4 5.6-2 7.4C6.4 10.7 5 12.6 5 15.2A5 5 0 0 0 10 22a5 5 0 0 0 5-5.4c0-2.2-1-3.9-2.3-5.2.2 1.7-.5 3-1.8 3.6.7-3.9-.2-7.4-.9-13.5Z" fill="#FF8A1F"/><path d="M10 12.5c.4 1.8-.3 2.8-1 3.6-.6.7-1.1 1.4-1.1 2.4A2.1 2.1 0 0 0 10 20.8a2.2 2.2 0 0 0 2.2-2.3c0-1.5-.9-2.6-2.2-6Z" fill="#FFC53D"/></svg>`; }
let glassUid = 0;
// the tea tray: the last seven days as small glasses, today's filling as you go. Wakha's take on a streak.
function teaTray() {
  const d0 = today(); let out = "";
  for (let k = 6; k >= 0; k--) {
    const key = addDays(d0, -k), rec = S.days[key];
    const pct = rec && (rec.day || rec.goalMet) ? 1 : k === 0 ? Math.min(1, ((rec && rec.xp) || 0) / S.goal) : 0;
    const top = 3 + (1 - pct) * 11, id = "tt" + (++glassUid);
    out += `<svg class="tg${k === 0 ? " now" : ""}${pct >= 1 ? " full" : ""}" viewBox="0 0 10 16" aria-hidden="true"><defs><clipPath id="${id}"><path d="M1 2h8l-1 12.2a1 1 0 0 1-1 .8H3a1 1 0 0 1-1-.8Z"/></clipPath></defs>
      <rect x="0" y="${top.toFixed(2)}" width="10" height="16" fill="#D98A2B" clip-path="url(#${id})"/><path d="M1 2h8l-1 12.2a1 1 0 0 1-1 .8H3a1 1 0 0 1-1-.8Z" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M1.6 5h6.8" stroke="#EBC274" stroke-width=".9"/></svg>`;
  }
  return `<span class="tray">${out}</span>`;
}
function teaGlass(pct, cls = "gl") {
  const id = "tg" + (++glassUid);
  const top = 6 + (1 - Math.max(0, Math.min(1, pct))) * 22;
  return `<svg class="${cls}" viewBox="0 0 24 32" aria-hidden="true"><defs><clipPath id="${id}"><path d="M4 5h16l-2.2 21.5a2.5 2.5 0 0 1-2.5 2.2H8.7a2.5 2.5 0 0 1-2.5-2.2Z"/></clipPath></defs>
    <rect x="0" y="${top.toFixed(1)}" width="24" height="32" fill="#D98A2B" clip-path="url(#${id})"/>
    <path d="M4 5h16l-2.2 21.5a2.5 2.5 0 0 1-2.5 2.2H8.7a2.5 2.5 0 0 1-2.5-2.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M5 9.5h14" stroke="#EBC274" stroke-width="1.6" stroke-dasharray="2 1.6"/>
    ${pct >= 1 ? `<path d="M12 4.5c-1.5-2.8 1.3-4 3.4-3.2-1 .4-1.6 1.6-3.4 3.2Z" fill="#22B573"/>` : ""}</svg>`;
}
// Darija text helpers: a speaker button and tappable text, only when a clip exists
function sayBtn(text, cls = "", voice = "n") {
  if (!Voice.has(text, voice)) return "";
  return `<button class="say ${cls}" data-say="${esc(text)}" data-voice="${voice}" aria-label="${esc(t("heard"))}: ${esc(text)}">${ICON.speak}</button>`;
}
function dj(text, cls = "", voice = "n", tag = "span") {
  const has = Voice.has(text, voice);
  return `<${tag} class="${has ? "dj " : ""}${cls}" lang="ary-Latn"${has ? ` data-say="${esc(text)}" data-voice="${voice}"` : ""}>${esc(text)}</${tag}>`;
}

/* ---------- effects ---------- */
const FX = {
  cv:null, g:null, parts:[], raf:0, w:0, h:0,
  init() { this.cv = $("#fx"); this.g = this.cv.getContext("2d"); this.size(); addEventListener("resize", () => this.size()); },
  size() { const r = this.cv.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); this.cv.width = Math.max(1, r.width * dpr); this.cv.height = Math.max(1, r.height * dpr); this.g.setTransform(dpr, 0, 0, dpr, 0, 0); this.w = r.width; this.h = r.height; },
  cols:["#17655E", "#5DBDB0", "#E0A631", "#C9A24F", "#FFFFFF", "#1F201D", "#EFE2D6"],
  burst(x, y, n = 34, power = 1) {
    if (reduced) n = Math.min(n, 8);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (3 + Math.random() * 7) * power;
      this.parts.push({ x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 4 * power, r:3 + Math.random() * 6, rot:Math.random() * 6.28, vr:(Math.random() - 0.5) * 0.35, c:this.cols[i % this.cols.length], life:0, max:60 + Math.random() * 40 });
    }
    this.go();
  },
  rain(n = 100, cols) {
    if (reduced) n = 16;
    const cs = cols ? cols.concat(["#F6B932", "#FFFFFF"]) : this.cols;
    for (let i = 0; i < n; i++) this.parts.push({ x:Math.random() * this.w, y:-20 - Math.random() * this.h * 0.6, vx:(Math.random() - 0.5) * 2, vy:2 + Math.random() * 3, r:5 + Math.random() * 8, rot:Math.random() * 6.28, vr:(Math.random() - 0.5) * 0.2, c:cs[i % cs.length], life:0, max:160 + Math.random() * 60, s:i % 3 });
    this.go();
  },
  // zellige shards: small glazed stars and diamonds that pop out of a right answer
  shards(x, y, n = 14, cols) {
    if (reduced) n = Math.min(n, 5);
    const cs = (cols || ["#3B33C4", "#129C72", "#F6B932"]).concat(["#F6B932"]);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.6, sp = 4 + Math.random() * 6;
      this.parts.push({ x, y, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 2, r:6 + Math.random() * 8, rot:Math.random() * 6.28, vr:(Math.random() - 0.5) * 0.3, c:cs[i % cs.length], life:0, max:46 + Math.random() * 26, s:1 + (i % 2) });
    }
    this.go();
  },
  go() { if (!this.raf) this.raf = requestAnimationFrame(() => this.loop()); },
  loop() {
    const g = this.g; g.clearRect(0, 0, this.w, this.h);
    this.parts = this.parts.filter((p) => p.life < p.max && p.y < this.h + 40);
    for (const p of this.parts) {
      p.life++; p.vy += 0.22; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      const a = Math.max(0, 1 - p.life / p.max);
      g.save(); g.globalAlpha = Math.min(1, a * 1.6); g.translate(p.x, p.y); g.rotate(p.rot); g.fillStyle = p.c;
      if (p.s === 1) { g.beginPath(); for (let k = 0; k < 16; k++) { const rr = k % 2 ? p.r * 0.38 : p.r * 0.62, aa = k * Math.PI / 8; g.lineTo(Math.cos(aa) * rr, Math.sin(aa) * rr); } g.closePath(); g.fill(); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.2; g.stroke(); }
      else if (p.s === 2) { g.beginPath(); g.moveTo(0, -p.r * 0.6); g.lineTo(p.r * 0.38, 0); g.lineTo(0, p.r * 0.6); g.lineTo(-p.r * 0.38, 0); g.closePath(); g.fill(); g.strokeStyle = "rgba(255,255,255,.85)"; g.lineWidth = 1.2; g.stroke(); }
      else { g.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); g.rotate(Math.PI / 4); g.fillRect(-p.r / 2, -p.r / 2, p.r, p.r); }
      g.restore();
    }
    this.raf = this.parts.length ? requestAnimationFrame(() => this.loop()) : 0;
    if (!this.raf) g.clearRect(0, 0, this.w, this.h);
  },
};
function stageRect() { return $("#stage").getBoundingClientRect(); }
function centerOf(el) { const r = el.getBoundingClientRect(), s = stageRect(); return { x:r.left + r.width / 2 - s.left, y:r.top + r.height / 2 - s.top }; }
function flyXP(n, fromEl, toEl) {
  const target = toEl || $("#hud-goal");
  const a = fromEl && fromEl.isConnected ? centerOf(fromEl) : { x:stageRect().width / 2, y:stageRect().height / 2 };
  const b = target && target.getBoundingClientRect().width ? centerOf(target) : { x:stageRect().width / 2, y:30 };
  const s = document.createElement("div");
  s.className = "xpfly"; s.textContent = "+" + n + " XP";
  s.style.left = a.x + "px"; s.style.top = a.y + "px";
  $("#stage").appendChild(s);
  const dx = b.x - a.x, dy = b.y - a.y;
  const anim = s.animate([
    { transform:"translate(-50%,-50%) scale(.5)", opacity:0 },
    { transform:"translate(-50%,-110%) scale(1.1)", opacity:1, offset:0.28 },
    { transform:`translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.45)`, opacity:0.1 },
  ], { duration:reduced ? 350 : 900, easing:"cubic-bezier(.5,0,.3,1)" });
  anim.onfinish = () => { s.remove(); target && pulse(target); };
}
function pulse(el) { el.classList.remove("pulse"); void el.offsetWidth; el.classList.add("pulse"); }
let toastTimer = 0;
function toast(msg, icon) {
  const el = $("#toast");
  el.innerHTML = (icon || "") + `<span>${esc(msg)}</span>`;
  el.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("on"), 2300);
}

/* ---------- progress ---------- */
function award(n, fromEl, opts = {}) {
  let amt = n;
  if (S.boost > 0 && opts.boostable) { amt *= 2; S.boost--; }
  const before = levelInfo(S.xp).n;
  S.xp += amt; dayRec().xp += amt;
  if (!opts.silent) flyXP(amt, fromEl, opts.to);
  setTimeout(refreshHUD, reduced ? 200 : 820);
  const after = levelInfo(S.xp);
  if (after.n > before) queueOverlay({ kind:"level", info:after });
  checkGoal();
  persist();
  return amt;
}
// today's glass: poured by the first finished lesson or by reaching the daily goal, whichever comes first
function markDay() {
  const d = today(), rec = dayRec(d);
  if (rec.day) return { usedShield:false };
  rec.day = true;
  let usedShield = false;
  if (S.lastGoalDay === d) { /* counted */ }
  else if (S.lastGoalDay === addDays(d, -1)) S.streak += 1;
  else if (S.lastGoalDay && diffDays(S.lastGoalDay, d) === 2 && S.shields > 0) { S.shields--; S.streak += 1; usedShield = true; }
  else S.streak = 1;
  S.lastGoalDay = d; S.best = Math.max(S.best, S.streak);
  return { usedShield };
}
function checkGoal() {
  const d = today(), rec = dayRec(d);
  if (rec.goalMet || rec.xp < S.goal) return;
  rec.goalMet = true;
  const { usedShield } = markDay();
  queueOverlay({ kind:"goal", streak:S.streak, usedShield });
}
// ok/wrong bookkeeping shared by feed and lessons; returns XP awarded
function hit(ok, fromEl, base, opts = {}) {
  Session.interacted = true;
  const rec = dayRec();
  if (ok) {
    combo++; S.stats.correct++; rec.c++;
    S.stats.bestCombo = Math.max(S.stats.bestCombo, combo);
    const bonus = Math.min(2, Math.floor((combo - 1) / 2));
    Sound.play("good");
    if (combo >= 3) setTimeout(() => Sound.play("combo", combo), 140);
    if (fromEl && fromEl.isConnected) { const c = centerOf(fromEl); FX.shards(c.x, c.y, combo >= 5 ? 26 : 14, glazeNow()); }
    haptic(10);
    renderCombo();
    return award(base + bonus, fromEl, { boostable:true, to:opts.to });
  }
  combo = 0; S.stats.wrong++; rec.w++;
  Sound.play("bad"); haptic([24, 50, 24]);
  renderCombo();
  persist();
  return 0;
}
function renderCombo() {
  const el = $("#combo");
  if (combo >= 2) { el.hidden = false; el.innerHTML = ICON.bolt + `<span>${combo}</span>`; el.title = combo + "× " + t("combo"); pulse(el); }
  else el.hidden = true;
  const lc = $("#l-combo");
  if (lc) { if (combo >= 2) { lc.hidden = false; lc.innerHTML = ICON.bolt + `<span>${combo}</span>`; pulse(lc); } else lc.hidden = true; }
  const b = $("#boost");
  if (S.boost > 0) { b.hidden = false; b.textContent = "2× XP"; } else b.hidden = true;
}
const MILESTONES = [10, 25, 50, 75, 100];
function introduce(id) {
  const now = today();
  let s = S.words[id];
  if (!s) {
    s = S.words[id] = { b:0, due:now, s:0, c:0, w:0, intro:now, fav:false };
    const n = Object.keys(S.words).length;
    if (MILESTONES.includes(n)) setTimeout(() => { toast(t("milestone", { n }), `<span style="color:var(--gold)">${ICON.star}</span>`); FX.rain(60); Sound.play("level"); }, 700);
  }
  s.s++;
  return s;
}
function grade(id, ok) {
  if (!W[id]) return;
  const s = S.words[id] || introduce(id);
  if (ok) { s.c++; s.b = Math.min(5, s.b + 1); s.due = addDays(today(), INTERVALS[s.b]); }
  else { s.w++; s.b = Math.max(0, s.b - 1); s.due = today(); }
  s.last = Date.now();
}
function discover(id, fromEl) {
  if (S.kenz[id]) return false;
  S.kenz[id] = today();
  introduce(id);
  const wd = W[id];
  if (fromEl) setTimeout(() => award(6, fromEl), 450);
  setTimeout(() => { toast(t("foundT") + " " + wd.d, `<span style="color:var(--gold)">${ICON.sparkle}</span>`); Sound.play("open"); FX.rain(60); }, 650);
  persist();
  return true;
}
function dueWords() { const d = today(); return Object.entries(S.words).filter(([id, s]) => W[id] && s.b >= 1 && s.due <= d).map(([id]) => id); }

/* ---------- overlays ---------- */
function queueOverlay(o) { Session.overlayQ.push(o); if (!Session.overlayOpen && !Lesson.active) { clearTimeout(Session.ovTimer); Session.ovTimer = setTimeout(nextOverlay, 900); } }
function nextOverlay() {
  if (Session.overlayOpen || Lesson.active) return;
  const o = Session.overlayQ.shift();
  if (!o) return;
  Session.overlayOpen = true;
  const ov = $("#overlay");
  let html = "";
  if (o.kind === "level") {
    const sub = LEVEL_SUB[o.info.raw];
    html = `<div class="ov-box">${mascot("jumpseq", "", null, "full")}<p class="ov-k">${esc(t("levelK"))}</p><p class="ov-t">${esc(t("levelT", { n:o.info.n }))}</p>
      <p class="ov-s"><b>${dj(o.info.title)}</b>${sub ? esc(L(sub)) : ""}</p>
      <div class="ov-btns"><button class="cta" data-ov="close">${esc(t("keepGoing"))}</button><button class="ghost" data-ov="share">${ICON.share}<span>${esc(t("share"))}</span></button></div></div>`;
    Sound.play("level"); setTimeout(() => FX.rain(), 120);
  } else if (o.kind === "goal") {
    html = `<div class="ov-box"><div style="position:relative">${teaGlass(1, "ov-glass")}<svg viewBox="0 0 40 30" style="position:absolute;left:50%;top:-22px;width:46px;transform:translateX(-50%)" aria-hidden="true"><path class="steam" d="M12 28c-4-6 4-8 0-15M22 28c-4-6 4-8 0-15M32 28c-4-6 4-8 0-15" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".7"/></svg></div>
      <p class="ov-k">${esc(t("goalDoneK"))}</p><p class="ov-t">${dj(t("goalDoneT").replace(/ ?!$/, "!"))}</p>
      <p class="ov-s">${esc(t("goalDoneS", { n:o.streak }))}${o.usedShield ? "<br>" + esc(t("shieldUsed")) : ""}</p>
      <div class="ov-btns"><button class="cta" data-ov="close">${esc(t("keepGoing"))}</button></div></div>`;
    Sound.play("level"); setTimeout(() => FX.rain(90), 120);
  } else if (o.kind === "unit") {
    const prev = cityOf(o.unit - 1), c = cityOf(o.unit), u = UNITS[o.unit];
    html = `<div class="ov-box"><div class="mc" style="width:150px;height:150px">${medallion(o.unit - 1, unitStates(o.unit - 1).map(() => "done"))}</div>
      <p class="ov-k">${esc(cityName(prev))}, ${esc(t("glazedN", { a:unitStates(o.unit - 1).length, b:unitStates(o.unit - 1).length }))}</p>
      <p class="ov-t">${esc(t("nextStop"))}: ${esc(cityName(c))}</p><p class="ov-s"><b>${dj(u.d)}</b>${esc(L(c.scene))}</p>
      <div class="ov-btns"><button class="cta" data-ov="close">${esc(t("continueIn", { c:cityName(c) }))}</button></div></div>`;
    Sound.play("open"); setTimeout(() => FX.rain(70), 120);
  }
  ov.innerHTML = html;
  ov.hidden = false;
  const close = () => { ov.hidden = true; ov.innerHTML = ""; Session.overlayOpen = false; refreshHUD(); if (Session.overlayQ.length) setTimeout(nextOverlay, 350); };
  ov.onclick = (e) => {
    const b = e.target.closest("[data-ov]");
    if (!b) return;
    if (b.dataset.ov === "share" && o.kind === "level") shareThing({ kind:"level", info:o.info }, b);
    else close();
  };
  const btn = $("[data-ov=close]", ov); btn && btn.focus({ preventScroll:true });
}

/* ---------- sharing ---------- */
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function wrapLines(g, text, maxW) {
  const words = String(text).split(" "); const lines = []; let line = "";
  for (const wd of words) { const tst = line ? line + " " + wd : wd; if (g.measureText(tst).width > maxW && line) { lines.push(line); line = wd; } else line = tst; }
  if (line) lines.push(line);
  return lines;
}
async function storyImage(spec) {
  const Wd = 1080, H = 1920;
  const c = document.createElement("canvas"); c.width = Wd; c.height = H;
  const g = c.getContext("2d");
  const grd = g.createLinearGradient(0, 0, Wd * 0.4, H);
  grd.addColorStop(0, spec.c1 || "#2C3BE0"); grd.addColorStop(1, spec.c2 || "#111770");
  g.fillStyle = grd; g.fillRect(0, 0, Wd, H);
  const rg = g.createRadialGradient(Wd * 0.9, 0, 0, Wd * 0.9, 0, Wd * 1.1);
  rg.addColorStop(0, (spec.c3 || "#7E8CFF") + "AA"); rg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = rg; g.fillRect(0, 0, Wd, H);
  try { const tile = await loadImg(svgURI(zelligeTile("#F3D08A", 0.22))); const pat = g.createPattern(tile, "repeat"); g.save(); g.globalAlpha = 0.8; g.scale(2.6, 2.6); g.fillStyle = pat; g.fillRect(0, 0, Wd / 2.6, H / 2.6); g.restore(); } catch (e) {}
  try { await Promise.all([document.fonts.load('700 120px "Bodoni Moda"'), document.fonts.load('500 40px "Readex Pro"'), document.fonts.load('700 100px "Amiri"')]); } catch (e) {}
  g.fillStyle = "#FFFFFF"; g.textBaseline = "alphabetic";
  let y = 560;
  if (spec.art) { try { const art = await loadImg(svgURI(spec.art.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" '))); const aw = 560, ah = aw * (art.height / art.width || 0.75); g.drawImage(art, 90, 300, aw, ah); y = 300 + ah + 150; } catch (e) {} }
  g.font = '500 46px "Readex Pro", system-ui, sans-serif'; g.globalAlpha = 0.85; g.fillText(spec.kicker || "", 90, y - 150); g.globalAlpha = 1;
  g.font = '600 ' + (spec.bigSize || 170) + 'px "Bodoni Moda", Didot, Georgia, serif';
  for (const ln of wrapLines(g, spec.big || "", Wd - 180)) { g.fillText(ln, 90, y); y += (spec.bigSize || 170) * 0.95; }
  if (spec.ar) { y += 30; g.font = '700 110px "Amiri", serif'; g.fillStyle = "#F7DCA0"; g.direction = "rtl"; g.textAlign = "right"; g.fillText(spec.ar, 90 + g.measureText(spec.ar).width, y); g.direction = "ltr"; g.textAlign = "left"; g.fillStyle = "#FFFFFF"; y += 150; }
  g.font = '500 58px "Readex Pro", system-ui, sans-serif';
  for (const ln of wrapLines(g, spec.sub || "", Wd - 180)) { g.fillText(ln, 90, y); y += 76; }
  try { const m = await loadImg(CAT_IMG.f_happy); g.drawImage(m, Wd - 440, H - 620, 360, 360); } catch (e) {}
  g.font = '600 92px "Bodoni Moda", Didot, Georgia, serif'; g.fillStyle = "#F8DFA4"; g.fillText("Wakha", 90, H - 220); g.fillStyle = "#FFFFFF";
  g.font = '400 44px "Readex Pro", system-ui, sans-serif'; g.globalAlpha = 0.8; g.fillText(X("Darija, one lesson at a time", "La darija, une leçon à la fois"), 90, H - 150); g.globalAlpha = 1;
  return await new Promise((res) => c.toBlob(res, "image/png"));
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); toast(t("copied"), ICON.copy); return true; }
  catch (e) {
    const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "absolute"; ta.style.left = "-9999px";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch (e2) {}
    ta.remove(); toast(ok ? t("copied") : t("shareFail"), ICON.copy); return ok;
  }
}
function shareSpec(o) {
  if (o.kind === "word") { const wd = o.word; return { text:t("shareWord", { d:wd.d, ar:wd.ar, m:meaning(wd) }), img:{ kicker:t("newWord"), big:wd.d, ar:wd.ar, sub:meaning(wd), bigSize:wd.d.length > 12 ? 120 : 180 }, name:"wakha-" + wd.id + ".png" }; }
  if (o.kind === "haggle") return { text:t("shareHaggle", { it:o.itemName, s:o.start, p:o.final }), img:{ c1:"#C3264A", c2:"#560A1F", c3:"#FF7F97", kicker:t("haggleK"), big:o.final + " DH", sub:t("paid", { p:o.final, s:o.start }), bigSize:200, art:ITEM_ART[o.item] }, name:"wakha-souk.png" };
  if (o.kind === "level") return { text:t("shareLevel", { n:o.info.n, t:o.info.title }), img:{ c1:"#2A2275", c2:"#0B0925", c3:"#9479FF", kicker:t("levelK"), big:o.info.title, sub:t("levelT", { n:o.info.n }), bigSize:o.info.title.length > 12 ? 130 : 170 }, name:"wakha-level.png" };
  return null;
}
async function shareThing(o) {
  const sp = shareSpec(o); if (!sp) return;
  Sound.play("tap");
  if (Caps.downloads) {
    try { const blob = await storyImage(sp.img); if (blob) { await Caps.downloads.save({ filename:sp.name, data:blob }); toast(t("imgSaved"), ICON.share); return; } }
    catch (e) { if (e && e.code === "declined") return; }
  }
  copyText(sp.text);
}

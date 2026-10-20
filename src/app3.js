/* =========================================================
   v4: TODAY (daily home), JOURNEY (city pager), STORIES, MOTION
   ========================================================= */
ICON.today = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 2.8l2.1 4.3 4.5-1.6-1.6 4.5 4.3 2.1-4.3 2.1 1.6 4.5-4.5-1.6L12 21.2l-2.1-4.3-4.5 1.6 1.6-4.5L2.8 12l4.3-2.1-1.6-4.5 4.5 1.6Z"/><circle cx="12" cy="12" r="3.2"/></svg>`;
ICON.journey = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" stroke-dasharray="2.2 2.6"/></svg>`;
ICON.play = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>`;

const isSide = (node) => ["practice", "daily", "sprint"].includes(node.kind);
function haptic(p) { try { if (S.sound && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
function glazeNow() { return Lesson.active && !isSide(Lesson.node) ? cityOf(Lesson.node.unit).g : null; }
function countUp(el, to, ms = 800, suffix = "") {
  if (!el) return;
  if (reduced) { el.textContent = to + suffix; return; }
  const t0 = performance.now();
  const step = (now) => { const p = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suffix; if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function dailyRec() { const d = today(); if (!S.daily || S.daily.d !== d) S.daily = { d, wotd:false, sprint:null }; return S.daily; }
function hashStr(k) { let h = 2166136261; for (const c of k) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; }
function wordOfDay() { const pool = CORE.filter((id) => W[id] && !W[id].rar && W[id].ex); return pool[hashStr(today()) % pool.length]; }
function greeting() { const h = new Date().getHours(); return h < 5 ? "Tsb7 3la khir" : h < 13 ? "Sba7 lkhir" : h < 21 ? "Msa lkhir" : "Tsb7 3la khir"; }
function nodeLabel(n) {
  if (n.kind === "story") return t("storyT");
  if (n.kind === "review") return t("reviewT");
  if (n.kind === "boss") return t("soukT");
  return t("lessonT", { n:PATH.filter((p) => p.unit === n.unit && p.kind === "lesson").indexOf(n) + 1 });
}
function nodeLine(n) {
  if (n.kind === "story") { const d = DIALOGS.find((x) => x.id === n.story); return d ? L(d.t) : ""; }
  if (n.kind === "review") { const u = UNITS[n.unit]; return L([u.en, u.fr]); }
  if (n.kind === "boss") return t("haggleS");
  return n.words.map((id) => W[id].d).join(", ");
}
function medRing(ui, states) {
  const done = states.filter((x) => x === "done").length, C = 2 * Math.PI * 48;
  return `<div class="medring"><svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="trk" cx="50" cy="50" r="48"/><circle class="val" cx="50" cy="50" r="48" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - done / Math.max(1, states.length))).toFixed(2)}"/></svg><div class="zwrap">${medallion(ui, states)}</div></div>`;
}

// open a lesson; where supported, the tapped medallion grows into the lesson's scene medallion
function openLesson(node, fromMed) {
  closeNodeSheet();
  if (!fromMed || !document.startViewTransition || reduced) { Lesson.open(node); return; }
  fromMed.style.viewTransitionName = "med";
  const vt = document.startViewTransition(() => {
    fromMed.style.viewTransitionName = "";
    Lesson.open(node);
    const m = $("#lesson .sc-med"); if (m && m.offsetParent) m.style.viewTransitionName = "med";
  });
  vt.finished.finally(() => { const m = $("#lesson .sc-med"); if (m) m.style.viewTransitionName = ""; });
}

/* ---------- TODAY ---------- */
function renderToday() {
  const el = $("#v-today");
  const cur = currentNode(), n = PATH[cur];
  const ui = n ? n.unit : UNITS.length - 1, c = cityOf(ui), states = unitStates(ui);
  const done = states.filter((x) => x === "done").length;
  const dr = dailyRec(), wid = wordOfDay(), wd = W[wid];
  const due = dueWords().length, learned = learnedIds().length;
  const sprintOpen = learned >= 8;
  const go = n ? `<button class="td-go" data-start="${cur}"><span><b>${esc(Object.keys(S.lessons).length ? t("cont") : t("startJourney"))}: ${esc(nodeLabel(n))}</b><small>${esc(L(LESSON_SCENES[n.id] || c.scene))}</small></span><i>${ICON.play}</i></button>`
    : `<p class="td-city"><small>${esc(t("allDoneT"))}</small></p>`;
  const days = [];
  for (let k = 6; k >= 0; k--) {
    const key = addDays(today(), -k), [y, m, d] = key.split("-").map(Number);
    const label = new Date(y, m - 1, d).toLocaleDateString(S.lang === "fr" ? "fr-FR" : "en-US", { weekday:"narrow" });
    const met = S.days[key] && S.days[key].goalMet;
    days.push(`<div class="d${met ? " met" : ""}${k === 0 ? " now" : ""}"><i>${met ? flameSVG() : ""}</i><span>${esc(label)}</span></div>`);
  }
  const dateLabel = new Date().toLocaleDateString(S.lang === "fr" ? "fr-FR" : "en-US", { weekday:"long", day:"numeric", month:"long" });
  el.innerHTML = `<div class="today">
    <section class="td-hero hero">
      <div class="td-greet"><h1>${dj(greeting())}</h1><p>${esc(S.stats.lessons ? t("dayTrip", { n:Math.max(1, S.dayCount || 1) }) : t("dayTrip1"))}</p></div>
      <div class="td-med${Session.assembled ? "" : " assemble"}" data-act="journey" role="button" aria-label="${esc(t("journey"))}">${medRing(ui, states)}</div>
      <div class="td-city"><b>${esc(cityName(c))}<span lang="ar">${esc(c.ar)}</span></b><small>${esc(t("lessonsOf", { a:done, b:states.length }))}</small></div>
      ${go}
    </section>
    <div class="td-sec"><h2>${esc(t("todayH"))}</h2><span>${esc(dateLabel)}</span></div>
    <div class="td-row">
      <button class="td-card j-saffron${dr.wotd ? " is-done" : ""}" data-daily="wotd">${dr.wotd ? `<span class="done">${ICON.check}</span>` : ""}<span class="ic">${ICON.sparkle}</span>
        <span><small style="margin:0 0 4px">${esc(t("wotd"))}</small><span class="big" lang="ary-Latn">${esc(wd.d)}</span><small>${esc(meaning(wd))}</small></span></button>
      <button class="td-card j-plum${dr.sprint != null ? " is-done" : ""}" data-daily="sprint"${sprintOpen ? "" : ` aria-disabled="true"`}>${dr.sprint != null ? `<span class="done">${ICON.check}</span>` : ""}<span class="ic">${sprintOpen ? ICON.bolt : ICON.lock}</span>
        <span><b>${esc(t("sprint"))}</b><small>${esc(!sprintOpen ? t("sprintLock") : dr.sprint != null ? t("sprintBest", { n:dr.sprint }) : t("sprintS"))}</small></span></button>
      <button class="td-card j-emerald${due ? "" : " is-done"}" data-act="practice"${learned ? "" : ` aria-disabled="true"`}><span class="ic">${ICON.loop}</span>
        <span><b>${esc(t("reviewC"))}</b><small>${esc(due ? t("reviewS", { n:due }) : t("reviewNone"))}</small></span></button>
    </div>
    <div class="td-sec"><h2>${esc(t("weekH"))}</h2><span>${esc(shownStreak() + " " + t("streakL"))}</span></div>
    <div class="td-week">${days.join("")}</div>
    <div class="td-stats"><div><b class="cu" data-to="${learned}">${learned}</b><span>${esc(t("wordsL"))}</span></div><div><b>${S.xp}</b><span>XP</span></div><div><b>${COLL.filter((id) => S.kenz[id]).length}</b><span>${esc(t("kenzL"))}</span></div></div>
  </div>`;
  Session.assembled = true;
  $("#hud").classList.toggle("on-dark", view === "today" && el.scrollTop < 300);
}

/* ---------- JOURNEY ---------- */
function rowHTML(n, idx, st, glaze) {
  const stars = S.lessons[n.id] ? S.lessons[n.id].stars : 0;
  const face = st === "done" ? ICON.check : n.kind === "story" ? ICON.chat : n.kind === "review" ? ICON.loop : n.kind === "boss" ? ICON.tagI : String(PATH.filter((p) => p.unit === n.unit && p.kind === "lesson").indexOf(n) + 1);
  const end = st === "done" ? `<span class="st">${[1, 2, 3].map((k) => ICON.star.replace("<svg", `<svg class="${k <= stars ? "on" : ""}"`)).join("")}</span>`
    : st === "current" ? `<span class="go">${ICON.play}</span>` : `<span class="lk">${ICON.lock}</span>`;
  return `<button class="jr-row ${st}" data-node="${idx}" style="--t:${glaze}" aria-label="${esc(nodeLabel(n))}, ${esc(st === "locked" ? t("lockedT") : st)}"><span class="tl">${face}</span><span class="tx"><b>${esc(nodeLabel(n))}</b><small>${esc(nodeLine(n))}</small></span>${end}</button>`;
}
function renderJourney(justDone) {
  const el = $("#v-journey");
  const cur = currentNode(), curUnit = PATH[cur] ? PATH[cur].unit : UNITS.length - 1;
  const keep = $(".jr-track", el) ? Session.jrPage : null;
  const pages = UNITS.map((u, ui) => {
    const c = cityOf(ui);
    const nodes = PATH.map((n, idx) => ({ n, idx })).filter((x) => x.n.unit === ui);
    const states = nodes.map((x) => nodeState(x.idx));
    const locked = states.every((x) => x === "locked");
    const rows = nodes.map(({ n, idx }, k) => rowHTML(n, idx, states[k], c.g[k % 3] === "#F0E9DA" ? c.g[0] : c.g[k % 3])).join("");
    return `<section class="jr-page cv${ui}" id="unit-${ui}" data-ui="${ui}"><div class="jr-in">
      <div class="jr-head"><p class="eyebrow">${esc(t("stopN", { n:ui + 1 }))}</p><h2 class="${cityName(c).length > 10 ? "long" : ""}">${esc(cityName(c))}</h2><span class="ar" lang="ar">${esc(c.ar)}</span></div>
      <div class="jr-med">${medallion(ui, states)}</div>
      <p class="jr-scene">${esc(L(c.scene))}</p>
      ${locked && ui > 0 ? `<p class="jr-lockmsg">${esc(t("cityLocked", { c:cityName(cityOf(ui - 1)) }))}</p>` : ""}
      <div class="jr-list">${rows}</div></div></section>`;
  }).join("");
  el.innerHTML = `<div class="jr-nav"><div class="jr-nav-in">${CITIES.map((c, i) => `<button class="jr-chip${i < curUnit ? " done" : ""}" data-city="${i}" aria-label="${esc(cityName(c))}"></button>`).join("")}</div></div><div class="jr-track">${pages}</div>`;
  const track = $(".jr-track", el);
  const page = justDone ? curUnit : keep != null ? keep : curUnit;
  requestAnimationFrame(() => { track.scrollLeft = page * track.clientWidth; jrSync(); });
  track.addEventListener("scroll", () => { if (!Session.jrRaf) Session.jrRaf = requestAnimationFrame(jrSync); }, { passive:true });
  if (justDone) {
    const idx = PATH.findIndex((p) => p.id === justDone);
    const row = $(`.jr-row[data-node="${idx}"]`, el);
    if (row && !reduced) setTimeout(() => row.animate([{ transform:"scale(.94)", background:"rgba(246,185,50,.35)" }, { transform:"none", background:"transparent" }], { duration:900, easing:"cubic-bezier(.3,1.4,.5,1)" }), 250);
  }
}
// pager dots follow the swipe; each city's medallion drifts with a little parallax
function jrSync() {
  Session.jrRaf = 0;
  const track = $("#v-journey .jr-track"); if (!track) return;
  const w = track.clientWidth || 1, x = track.scrollLeft, p = Math.round(x / w);
  Session.jrPage = p;
  $$("#v-journey .jr-chip").forEach((b, i) => b.classList.toggle("on", i === p));
  if (reduced) return;
  $$("#v-journey .jr-page").forEach((pg, i) => {
    const off = (i * w - x) / w;
    if (Math.abs(off) > 1.2) return;
    const m = $(".jr-med", pg); if (m) m.style.transform = `translateX(${(off * 60).toFixed(1)}px) rotate(${(off * 40).toFixed(1)}deg) scale(${(1 - Math.min(0.15, Math.abs(off) * 0.15)).toFixed(3)})`;
  });
}

function renderLearn(justDone) {
  if (view === "today" || !$("#v-today").hidden) renderToday();
  renderJourney(justDone);
}

/* ---------- home + journey events ---------- */
function bindHome() {
  $("#v-today").addEventListener("click", (e) => {
    const s = e.target.closest("[data-start]"); if (s) { Sound.play("tap"); openLesson(PATH[+s.dataset.start], $("#v-today .td-med .zwrap")); return; }
    if (e.target.closest("[data-act=journey]")) { Sound.play("tap"); setView("journey"); return; }
    if (e.target.closest("[data-act=practice]")) { if (learnedIds().length) startPractice(); return; }
    const d = e.target.closest("[data-daily]");
    if (d) {
      Sound.play("tap");
      if (d.dataset.daily === "wotd") Lesson.open({ id:"wotd", kind:"daily", unit:0, words:[wordOfDay()] });
      else if (learnedIds().length >= 8) Lesson.open({ id:"sprint", kind:"sprint", unit:0, words:[] });
      else toast(t("sprintLock"), ICON.lock);
    }
  });
  $("#v-today").addEventListener("scroll", () => { $("#hud").classList.toggle("on-dark", $("#v-today").scrollTop < 300); }, { passive:true });
  $("#v-journey").addEventListener("click", (e) => {
    const ch = e.target.closest("[data-city]");
    if (ch) { const tr = $("#v-journey .jr-track"); tr.scrollTo({ left:+ch.dataset.city * tr.clientWidth, behavior:reduced ? "auto" : "smooth" }); return; }
    const r = e.target.closest("[data-node]");
    if (r) {
      const idx = +r.dataset.node;
      if (nodeState(idx) === "locked") { Sound.play("tap"); openNodeSheet(idx); return; }
      Sound.play("tap");
      openLesson(PATH[idx], $(".jr-med", r.closest(".jr-page")));
    }
  });
  // answers fill from the exact point you tapped
  document.addEventListener("pointerdown", (e) => {
    const o = e.target.closest && e.target.closest(".opt"); if (!o) return;
    const r = o.getBoundingClientRect(); o.style.setProperty("--x", (e.clientX - r.left).toFixed(0) + "px"); o.style.setProperty("--y", (e.clientY - r.top).toFixed(0) + "px");
  }, true);
}

/* ---------- STORIES ---------- */
function storySpecs(node) {
  const d = DIALOGS.find((x) => x.id === node.story) || DIALOGS[0];
  const ks = shuffle(d.lines.map((_, k) => k)).slice(0, 4);
  return [{ t:"story", id:d.id }].concat(ks.map((k, i) => ({ t:"sq", id:d.id, k, rev:i % 2 === 1 })));
}
function exStory(sp, host) {
  const d = DIALOGS.find((x) => x.id === sp.id) || DIALOGS[0];
  const el = shell("story", "wall");
  $(".card-in", el).innerHTML = `
    <div class="st-head a1"><h2 class="prompt-big">${esc(L(d.t))}</h2><button class="say lg" data-act="replay" aria-label="${esc(t("playAll"))}">${ICON.speak}</button></div>
    <p class="prompt a2">${esc(t("storyTap"))}</p>
    <div class="dlg a3">${d.lines.map(([who, dar, en, fr], k) => `<div class="bub ${who}" data-k="${k}" hidden><div><span class="who">${esc(L(d.who[who === "A" ? 0 : 1]))}</span><span class="d" lang="ary-Latn" data-say="${esc(dar)}" data-voice="${who === "A" ? "a" : "n"}">${esc(dar)}</span><span class="t hide">${esc(S.lang === "fr" ? fr : en)}</span></div></div>`).join("")}</div>`;
  const card = { el, kind:"story", run:0 };
  const play = async () => {
    const tok = ++card.run;
    const bubs = $$(".bub", el);
    bubs.forEach((b) => (b.hidden = true));
    for (const b of bubs) {
      if (tok !== card.run || !host.isActive(card)) return;
      b.hidden = false; b.scrollIntoView({ block:"nearest", behavior:reduced ? "auto" : "smooth" });
      const sEl = $(".d", b);
      const said = Session.gesture ? await Voice.play(sEl.dataset.say, { voice:sEl.dataset.voice, mark:[b] }) : false;
      if (tok !== card.run) return;
      await sleep(said ? 300 : 1100);
    }
  };
  el.addEventListener("pointerdown", (e) => { const b = e.target.closest(".bub"); if (b) b.classList.add("reveal"); });
  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=replay]")) { Session.gesture = true; play(); } });
  card.enter = () => { if (!card.started) { card.started = true; setTimeout(play, 350); } };
  card.leave = () => { card.run++; Voice.stop(); };
  return card;
}
function exStoryQ(sp, host) {
  const d = DIALOGS.find((x) => x.id === sp.id) || DIALOGS[0];
  const line = d.lines[sp.k], tr = (l) => (S.lang === "fr" ? l[3] : l[2]);
  const voice = line[0] === "A" ? "a" : "n";
  const others = shuffle(d.lines.filter((_, k) => k !== sp.k)).slice(0, 3);
  const opts = shuffle([line].concat(others));
  const el = shell("sq", "wall");
  const who = L(d.who[line[0] === "A" ? 0 : 1]);
  $(".card-in", el).innerHTML = sp.rev ? `
    <div class="kicker a1"><span class="tag solid">${ICON.chat}${esc(L(d.t))}</span></div>
    <h2 class="prompt-big a2">${esc(t("storyQ2"))}</h2>
    <p class="mean a3">${esc(who)}: “${esc(tr(line))}”</p>
    <div class="opts a4">${opts.map((o) => `<div class="opt-wrap has-say"><button class="opt" data-k="${d.lines.indexOf(o)}"><span class="d" lang="ary-Latn">${esc(o[1])}</span><span class="mk"></span></button>${sayBtn(o[1], "", o[0] === "A" ? "a" : "n")}</div>`).join("")}</div>
    <div class="fbx"></div>` : `
    <div class="kicker a1"><span class="tag solid">${ICON.chat}${esc(L(d.t))}</span></div>
    <h2 class="prompt-big a2">${esc(t("storyQ"))}</h2>
    <div class="listen a3"><button class="play-big" data-act="play" aria-label="${esc(t("hearIt"))}">${ICON.speak}</button><div><p class="eyebrow">${esc(who)}</p><p class="ex-d" lang="ary-Latn">${esc(line[1])}</p></div></div>
    <div class="opts a4">${opts.map((o) => `<button class="opt" data-k="${d.lines.indexOf(o)}"><span>${esc(tr(o))}</span><span class="mk"></span></button>`).join("")}</div>
    <div class="fbx"></div>`;
  const card = { el, kind:"sq", done:false, enter() { if (!sp.rev) setTimeout(() => host.isActive(card) && !card.done && Session.gesture && Voice.play(line[1], { voice, btn:$(".play-big", el) }), 380); } };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    if (e.target.closest("[data-act=play]")) { Session.gesture = true; Voice.play(line[1], { voice, btn:$(".play-big", el) }); return; }
    const b = e.target.closest(".opt"); if (!b || card.done) return;
    card.done = true; const ok = +b.dataset.k === sp.k;
    markOptions(el, b, `.opt[data-k="${sp.k}"]`, ok);
    host.resolve(card, ok, { fromEl:b, base:3, right:line[1], rightTr:tr(line), say:line[1], voice, showRight:true });
  });
  return card;
}

/* boot */
const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === "function") hot.ready(start); else start((hot && hot.data) || {});

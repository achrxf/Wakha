/* =========================================================
   v1.3: TODAY (daily home), JOURNEY (city pager), STORIES, MOTION
   ========================================================= */
ICON.today = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"><path d="M12 2.8l2.1 4.3 4.5-1.6-1.6 4.5 4.3 2.1-4.3 2.1 1.6 4.5-4.5-1.6L12 21.2l-2.1-4.3-4.5 1.6 1.6-4.5L2.8 12l4.3-2.1-1.6-4.5 4.5 1.6Z"/><circle cx="12" cy="12" r="3.2"/></svg>`;
ICON.journey = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="6" r="2.4"/><path d="M8.4 18H15a3 3 0 0 0 0-6H9a3 3 0 0 1 0-6h6.6" stroke-dasharray="2.2 2.6"/></svg>`;
ICON.mark = `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="var(--accent)"/><path d="M6.5 9.5l2.3 6 3.2-6.8 3.2 6.8 2.3-6" fill="none" stroke="var(--bg)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
ICON.play = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.6-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>`;

function openCitySheet(ui) {
  const c = cityOf(ui), prev = cityOf(ui - 1), sh = $("#nsheet");
  sh.className = `nsheet cv${ui}`;
  sh.innerHTML = `<div class="cs-top"><span class="cs-badge">${cityBadge(ui)}</span><div><small>${esc(c.ar)}</small><h3>${esc(t("cityAheadT", { c:cityName(c) }))}</h3></div></div>
    <p>${esc(L(c.scene))}</p><p><b>${esc(t("cityAheadS", { p:cityName(prev) }))}</b></p><p class="plus-note">${esc(t("plusNote"))}</p>
    <button class="ghost block sh-ok" data-act="sheet-close">${esc(t("gotIt"))}</button>`;
  $("[data-act=sheet-close]", sh).addEventListener("click", closeNodeSheet);
  clearTimeout(Session.sheetT); sh.style.transform = ""; $("#sheet-scrim").classList.remove("leaving");
  sh.hidden = false; $("#sheet-scrim").hidden = false;
}
function applyTextSize() { const v = S.textSize || 0; if (v) document.documentElement.dataset.ts = v; else delete document.documentElement.dataset.ts; }
function applyTheme() { applyTextSize(); const th = S.theme || "auto"; if (th === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = th; }
// language picker (a native select: the phone shows its own picker)
function langSelect(id) { return `<label class="lang-pick"><span class="sr">${esc(t("lang"))}</span><select class="lang-select" id="${id}" aria-label="${esc(t("lang"))}">${LANGS.map(([k, n]) => `<option value="${k}"${S.lang === k ? " selected" : ""}>${n}</option>`).join("")}</select>${ICON.down || ""}</label>`; }
function setLang(k) {
  if (!LANGS.some(([x]) => x === k) || S.lang === k) return;
  S.lang = k; document.documentElement.lang = k; persist();
  refreshHUD();
  if (!$("#welcome").hidden) { const st = $(".goal-picks", $("#welcome")) ? 2 : 1; showWelcome(st); }
  if (view === "me") renderMe(); if (view === "guide") renderGuide();
  renderLearn();
  if (Feed.started) Feed.rebuildAhead();
  $("#nav-hint").textContent = t("navHint");
}
function weekdayNarrow(dow) { const d = new Date(2026, 0, 4 + dow); return d.toLocaleDateString(locale(), { weekday:"narrow" }); }
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
    Lesson.noSlide = true; Lesson.open(node); Lesson.noSlide = false;
    const m = $("#lesson .sc-med"); if (m && m.offsetParent) m.style.viewTransitionName = "med";
  });
  vt.finished.finally(() => { const m = $("#lesson .sc-med"); if (m) m.style.viewTransitionName = ""; });
}

/* ---------- TODAY ----------
   The board's home: a greeting, the next lesson on the city's wall tint (its words, one line from
   Mchicha, Start), four tiles, the word of the day set like a street sign, and the trip so far. */
function renderToday() {
  const el = $("#v-today");
  const cur = currentNode(), n = PATH[cur];
  const ui = n ? n.unit : UNITS.length - 1, c = cityOf(ui), states = unitStates(ui);
  const k = n ? PATH.filter((p) => p.unit === ui).indexOf(n) + 1 : states.length;
  const dr = dailyRec(), wid = wordOfDay(), wd = W[wid];
  const due = dueWords().length, learned = learnedIds().length, total = CORE.length + COLL.length;
  const rec = dayRec(), sprintOpen = learned >= 8;
  const storiesAll = PATH.filter((p) => p.kind === "story").length, storiesDone = PATH.filter((p) => p.kind === "story" && S.lessons[p.id]).length;
  const stopsDone = PATH.filter((p) => S.lessons[p.id]).length, curUnit = n ? n.unit : UNITS.length;
  const dateLabel = new Date().toLocaleDateString(locale(), { weekday:"long", day:"numeric", month:"long" });
  const line = rec.goalMet ? t("goalMetLine") : rec.day ? t("dayDoneLine") : !shownStreak() ? t("streakStart") : t("streakKeep");
  const words = n && n.words && n.words.length ? n.words.slice(0, 3) : [];
  const gate = n ? cityGate(ui) : null, plus = isPlus();
  const goBtn = !n ? "" : gate === "ad" ? `<button class="cta block td-go" data-act="adopen" data-city="${ui}">${ICON.speak ? "" : ""}${esc(t("openWithAd", { c:cityName(c) }))}</button><p class="ad-note">${esc(t("adNote"))}</p>`
    : gate === "plus" ? `<button class="cta block td-go" data-act="plus">${esc(t("plusContinue", { c:cityName(c) }))}</button>`
    : `<button class="cta block td-go" data-start="${cur}">${esc(t("startLesson"))} <span>· ${esc(t("minN", { n:STOP_MIN[n.kind] || 4 }))}</span></button>`;
  const lead = n ? `<section class="td-lead cv${ui}"><span class="td-badge">${cityBadge(ui)}</span>
      <div class="where"><span>${esc(t("stopOf", { c:cityName(c), a:k, b:states.length }))}</span><span class="ar" lang="ar">${esc(c.ar)}</span></div>
      <h3>${esc(n.kind === "lesson" ? L([UNITS[ui].en, UNITS[ui].fr]) : nodeLabel(n))}</h3>
      <p class="sc">${esc(L(LESSON_SCENES[n.id] || c.scene))}</p>
      ${words.length ? `<div class="wordrow">${words.map((id) => `<div class="wchip"><b lang="ary-Latn">${esc(W[id].d)}</b><span lang="ary">${esc(W[id].ar)}</span></div>`).join("")}</div>` : ""}
      <div class="td-cat catline" data-act="cat" role="button" aria-label="${esc(t("catName"))}">${mascot("happy", Session.catHi ? "" : "hi")}<p><b>${esc(t("catName"))}</b> · ${esc(line)}</p></div>
      ${goBtn}
    </section>` : `<section class="td-lead"><h3>${esc(t("allDoneT"))}</h3></section>`;
  el.innerHTML = `<div class="today scroll-pad">
    <div class="td-greet"><h1>${dj(greeting())}</h1><span class="ar" lang="ar">${esc(GREET_AR[greeting()] || "")}</span></div>
    <p class="td-date">${esc(dateLabel)}</p>
    ${onTrial() ? `<button class="trial-pill" data-act="plus">${runStar()}<span>${esc(t("trialLeft", { n:trialDaysLeft() }))}</span><b>${esc(t("seePlans"))}</b></button>` : ""}
    ${lead}
    ${plus ? `    <div class="td-tiles">
      <button class="td-tile" data-act="kenz"><span class="l">${esc(t("words"))}</span><span class="v">${learned}<small>/ ${total}</small></span><span class="bar"><i style="transform:scaleX(${(learned / total).toFixed(3)})"></i></span></button>
      <button class="td-tile" data-daily="sprint"${sprintOpen ? "" : ` aria-disabled="true"`}><span class="l">${esc(t("goalT"))}</span><span class="v">${Math.min(rec.xp, 999)}<small>/ ${S.goal} XP</small></span><span class="bar"><i style="transform:scaleX(${Math.min(1, rec.xp / S.goal).toFixed(3)})"></i></span><span class="s">${esc(!sprintOpen ? t("sprintLock") : dr.sprint != null ? t("sprintBest", { n:dr.sprint }) : t("sprint"))}</span></button>
      <button class="td-tile" data-act="practice"${learned ? "" : ` aria-disabled="true"`}><span class="l">${esc(t("dueT"))}</span><span class="v">${due}<small>${esc(t("wordsL"))}</small></span></button>
      <button class="td-tile" data-act="journey"><span class="l">${esc(t("storiesT"))}</span><span class="v">${storiesDone}<small>/ ${storiesAll}</small></span></button>
    </div>
    <section class="plate">
      <div class="hd">${esc(t("wotd"))}<span>${esc(L(CAT[wd.cat] || ["", ""]))}</span></div>
      <div class="sign"><span class="lat" lang="ary-Latn">${dj(wd.d)}</span><span class="ar" lang="ary">${esc(wd.ar)}</span></div>
      <p class="mean">${esc(meaning(wd))}</p>
      ${wd.ex ? `<div class="exrow">${sayBtn(wd.ex[0], "fill")}<div><b lang="ary-Latn">${esc(wd.ex[0])}</b><span>${esc(exTr(wd.ex))}</span></div></div>` : ""}
      <button class="ghost td-wotd${dr.wotd ? " is-done" : ""}" data-daily="wotd">${dr.wotd ? ICON.check : ""}${esc(dr.wotd ? t("doneL") : t("learnIt"))}</button>
    </section>
    <button class="route" data-act="journey">
      <span class="hd">${esc(t("tripT"))}<span>${esc(tn("stopsN", { a:stopsDone, b:PATH.length }, stopsDone))}</span></span>
      <span class="dots">${CITIES.map((x, i) => `<i class="${i < curUnit ? "done" : i === curUnit ? "now cv" + i : ""}"></i>`).join("")}</span>
      <span class="dotnames"><span>${esc(cityName(CITIES[0]))}</span><b>${esc(cityName(cityOf(Math.min(curUnit, UNITS.length - 1))))}</b><span>${esc(cityName(CITIES[CITIES.length - 1]))}</span></span>
    </button>
` : plusCardHTML()}
  </div>`;
  Session.catHi = true;
}
const GREET_AR = { "Sba7 lkhir":"صباح الخير", "Msa lkhir":"مسا الخير", "Tsb7 3la khir":"تصبح على خير" };

/* ---------- JOURNEY ----------
   One list of the ten cities, each with its own wall colour. The open city (the current one unless the
   learner opens another) shows its stops: done, the next one with Start, the rest with their length. */
const STOP_MIN = { lesson:4, story:6, review:5, boss:7 };
function stopTitle(n) {
  if (n.kind === "lesson") return n.words.map((id) => W[id].d).join(" · ");
  if (n.kind === "story") return `${nodeLabel(n)}: ${nodeLine(n)}`;
  return nodeLabel(n);
}
function rowHTML(n, idx, st) {
  const end = st === "done" ? `<em class="dn">${esc(t("doneL"))}</em>`
    : st === "current" ? `<span class="go">${esc(t("start"))}</span>`
    : `<em>${esc(t("minN", { n:STOP_MIN[n.kind] || 4 }))}</em>`;
  return `<button class="jr-row ${st}" data-node="${idx}" aria-label="${esc(nodeLabel(n))}, ${esc(st === "locked" ? t("lockedT") : st)}"><i class="dot"></i><b lang="ary-Latn">${esc(stopTitle(n))}</b>${end}</button>`;
}
function renderJourney() {
  const el = $("#v-journey");
  const cur = currentNode(), curUnit = PATH[cur] ? PATH[cur].unit : UNITS.length - 1;
  const plus = isPlus();
  if (Session.jrOpen == null || (!plus && Session.jrOpen > curUnit)) Session.jrOpen = curUnit;
  const stopsAll = PATH.length, stopsDone = PATH.filter((p) => S.lessons[p.id]).length;
  const rows = UNITS.map((u, ui) => {
    const c = cityOf(ui), nodes = PATH.map((n, idx) => ({ n, idx })).filter((x) => x.n.unit === ui);
    const states = nodes.map((x) => nodeState(x.idx)), done = states.filter((x) => x === "done").length;
    const gate = cityGate(ui), reached = cityReached(ui) || states.some((x) => x !== "locked");
    const locked = !plus && (gate === "plus" || (states.every((x) => x === "locked") && ui > curUnit && !(gate === "ad" && reached)));
    const open = ui === Session.jrOpen && !locked && gate !== "ad";
    const right = gate === "plus" ? `<span class="pill-plus">Plus</span>` : gate === "ad" && reached ? `<span class="pill-ad">${esc(t("openAdShort"))}</span>` : `<span class="c${done === states.length ? " full" : ""}">${esc(t("aOfB", { a:done, b:states.length }))}</span>`;
    const canOpen = !locked && gate !== "ad";
    const head = `<button class="crow${locked ? " locked" : ""}${gate === "plus" ? " plus-locked" : ""}${open ? " open" : ""}" data-city="${ui}" data-gate="${gate || ""}" data-reached="${reached ? 1 : 0}"${canOpen ? ` aria-expanded="${open}"` : ""}><span class="sw">${cityBadge(ui)}</span><span class="nm"><b>${esc(cityName(c))}</b><span class="ar" lang="ar">${esc(c.ar)}</span></span>${right}</button>`;
    if (!canOpen) return `<div class="city">${head}</div>`;
    // every open-able city keeps its stops in the page, folded; opening animates the fold instead of re-rendering
    return `<div class="city cv${ui}${open ? " copen" : ""}" data-ui="${ui}">${head}<div class="cbody"${open ? "" : " inert"}><div class="cbody-in"><p class="cscene">${esc(L(c.scene))}</p><div class="stops">${nodes.map(({ n, idx }, k) => rowHTML(n, idx, states[k])).join("")}</div></div></div></div>`;
  }).join("");
  const test = `<button class="pl-card" data-act="placement">${runStar()}<span><b>${esc(t("plCardT"))}</b><small>${esc(plus ? t("plCardS") : t("plCardFree"))}</small></span>${plus ? "" : `<span class="pill-plus">Plus</span>`}</button>`;
  el.innerHTML = `<div class="journey scroll-pad"><h1 class="jt">${esc(t("journey"))}</h1><p class="jsub">${esc(tn("stopsWords", { a:stopsDone, b:stopsAll, c:learnedIds().length, d:CORE.length + COLL.length }, stopsDone))}</p>${test}<div class="cities">${rows}</div>${plus ? "" : `<p class="jr-free">${esc(t("freeCitiesNote", { n:FREE_CITIES }))}</p>`}</div>`;
}
// fold one city open (and the previous one shut) in place; CSS animates the height, so nothing jumps
function toggleCity(ui) {
  const root = $("#v-journey"), next = Session.jrOpen === ui ? -1 : ui;
  Session.jrOpen = next;
  $$(".city[data-ui]", root).forEach((c) => {
    const on = +c.dataset.ui === next;
    if (c.classList.contains("copen") === on) return;
    c.classList.toggle("copen", on);
    $(".crow", c).setAttribute("aria-expanded", on);
    $(".crow", c).classList.toggle("open", on);
    $(".cbody", c).inert = !on;
  });
  if (next < 0) return;
  // once the fold settles, bring the opened city fully into view if it ended up below the fold
  clearTimeout(Session.jrScrollT);
  Session.jrScrollT = setTimeout(() => {
    const c = $(`.city[data-ui="${next}"]`, root); if (!c) return;
    const r = c.getBoundingClientRect(), vr = root.getBoundingClientRect(), dock = 84;
    const over = r.bottom - (vr.bottom - dock), under = vr.top + 70 - r.top;
    if (under > 0) root.scrollBy({ top:-under, behavior:reduced ? "auto" : "smooth" });
    else if (over > 0) root.scrollBy({ top:Math.min(over, r.top - vr.top - 70), behavior:reduced ? "auto" : "smooth" });
  }, reduced ? 0 : 380);
}
function renderLearn(justDone) {
  if (view === "today" || !$("#v-today").hidden) renderToday();
  renderJourney(justDone);
}

/* ---------- home + journey events ---------- */
function bindHome() {
  $("#v-today").addEventListener("click", (e) => {
    const s = e.target.closest("[data-start]"); if (s) { Sound.play("tap"); openLesson(PATH[+s.dataset.start], null); return; }
    if (e.target.closest("[data-act=kenz]")) { Sound.play("tap"); setView("me"); return; }
    if (e.target.closest("[data-act=journey]")) { Sound.play("tap"); setView("journey"); return; }
    const cb = e.target.closest("[data-act=cat]"); if (cb) { catTalk(cb); return; }
    const ao = e.target.closest("[data-act=adopen]"); if (ao) { openCityWithAd(+ao.dataset.city); return; }
    if (e.target.closest("[data-act=practice]")) { if (learnedIds().length) startPractice(); return; }
    const d = e.target.closest("[data-daily]");
    if (d) {
      Sound.play("tap");
      if (d.dataset.daily === "wotd") Lesson.open({ id:"wotd", kind:"daily", unit:0, words:[wordOfDay()] });
      else if (learnedIds().length >= 8) Lesson.open({ id:"sprint", kind:"sprint", unit:0, words:[] });
      else toast(t("sprintLock"), ICON.lock);
    }
  });
  $("#v-journey").addEventListener("click", (e) => {
    const ch = e.target.closest("[data-city]");
    if (ch) {
      const ui = +ch.dataset.city; Sound.play("tap");
      if (ch.dataset.gate === "plus") { plusCitySheet(ui); return; }
      if (ch.dataset.gate === "ad") { if (ch.dataset.reached === "1") openCityWithAd(ui); else openCitySheet(ui); return; }
      if (ch.classList.contains("locked")) { openCitySheet(ui); return; }
      toggleCity(ui);
      return;
    }
    if (e.target.closest("[data-act=placement]")) { Sound.play("tap"); openPlacement(); return; }
    const r = e.target.closest("[data-node]");
    if (r) {
      const idx = +r.dataset.node;
      if (nodeState(idx) === "locked") { Sound.play("tap"); openNodeSheet(idx); return; }
      Sound.play("tap");
      openLesson(PATH[idx], null);
    }
  });
  // feed cards get depth as you swipe: the leaving card tips back, the next one rises
  const feed = $("#feed");
  const depth = () => {
    Session.fdRaf = 0; if (reduced) return;
    const h = feed.clientHeight || 1, y = feed.scrollTop;
    for (const c of Feed.cards) {
      const off = (c.el.offsetTop - y) / h; const inn = $(".card-in", c.el); if (!inn) continue;
      if (Math.abs(off) > 1.1) { if (inn.style.transform) inn.style.transform = ""; continue; }
      const a = Math.min(1, Math.abs(off));
      inn.style.transform = a < 0.002 ? "" : `perspective(900px) rotateX(${(off * -14).toFixed(2)}deg) scale(${(1 - a * 0.1).toFixed(3)})`;
      inn.style.opacity = (1 - a * 0.55).toFixed(3);
    }
  };
  feed.addEventListener("scroll", () => { if (!Session.fdRaf) Session.fdRaf = requestAnimationFrame(depth); }, { passive:true });
  // daily cards and sound tiles lean toward your finger
  const TILT = ".td-card,.stile,.goal-pick,.kc.got";
  const lean = (e) => {
    const el = e.target.closest && e.target.closest(TILT); if (!el || reduced) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(700px) rotateX(${(-y * 14).toFixed(2)}deg) rotateY(${(x * 16).toFixed(2)}deg)`;
    el.style.setProperty("--gx", ((x + 0.5) * 100).toFixed(0) + "%"); el.style.setProperty("--gy", ((y + 0.5) * 100).toFixed(0) + "%");
  };
  const unlean = (e) => { const el = e.target.closest && e.target.closest(TILT); if (el) el.style.transform = ""; };
  document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse" || e.buttons) lean(e); }, { passive:true });
  document.addEventListener("pointerdown", lean, { passive:true });
  document.addEventListener("pointerup", unlean, { passive:true });
  document.addEventListener("pointerout", (e) => { const el = e.target.closest && e.target.closest(TILT); if (el && !el.contains(e.relatedTarget)) el.style.transform = ""; }, { passive:true });
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
    <div class="dlg a3">${d.lines.map(([who, dar, en, fr], k) => `<div class="bub ${who}" data-k="${k}" hidden><div><span class="who">${esc(L(d.who[who === "A" ? 0 : 1]))}</span><span class="d" lang="ary-Latn" data-say="${esc(dar)}" data-voice="${who === "A" ? "a" : "n"}">${esc(dar)}</span><span class="t hide">${esc(X(en, fr))}</span></div></div>`).join("")}</div>`;
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
  const line = d.lines[sp.k], tr = (l) => X(l[2], l[3]);
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


/* ---------- Mchicha talks ---------- */
const CAT_LINES = ["yallah", "wakha", "merhba", "zwin", "mzyan", "bslama", "inchallah"];
function catPlay(holder, cls) {
  const svg = $(".cat", holder); if (!svg) return;
  svg.classList.remove("jump", "hi", "droop", "hop", "cheer", "sorry", "wag"); void svg.getBoundingClientRect(); svg.classList.add(cls);
  // after a reaction he goes back to resting: four slow wags, then still
  clearTimeout(svg._rest); svg._rest = setTimeout(() => { if (!svg.classList.contains(cls)) return; svg.classList.remove(cls); void svg.getBoundingClientRect(); svg.classList.add("wag"); }, 1000);
}
// blinks: one 140ms squash on every visible cat, every 4-7s; nothing animates in between
function catBlinks() {
  setTimeout(() => {
    if (!document.hidden) for (const c of $$(".cat")) {
      if (!c.querySelector(".cat-eyes") || c.classList.contains("sorry") || c.classList.contains("droop") || !c.getClientRects().length) continue;
      c.classList.add("blink"); setTimeout(() => c.classList.remove("blink"), 140);
    }
    catBlinks();
  }, 4000 + Math.random() * 3000);
}
function catTalk(holder) {
  Session.gesture = true; Sound.unlock();
  const id = CAT_LINES[(Session.catN = ((Session.catN || 0) + 1)) % CAT_LINES.length], wd = W[id];
  catPlay(holder, Session.catN % 2 ? "jump" : "hi");
  haptic(8);
  $$(".cat-say", holder).forEach((b) => b.remove());
  holder.insertAdjacentHTML("beforeend", `<div class="cat-say">${esc(wd.d)}<small>${esc(meaning(wd))}</small></div>`);
  const b = holder.lastElementChild;
  Voice.play(wd.d);
  clearTimeout(Session.catT); Session.catT = setTimeout(() => { b.classList.add("out"); setTimeout(() => b.remove(), 320); }, 2200);
}

/* ---------- 3D: the medallion as a real glazed ceramic plate ----------
   three.js is loaded on demand; if it can't load (offline, no WebGL) the SVG medallion simply stays. */
const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
const Med3D = {
  loading:null, ok:null, r:null, host:null, key:"", raf:0, t0:0, drag:null, rx:0, ry:0, vx:0, vy:0, tx:0, ty:0, spin:0, tilt:{ x:0, y:0 },
  load() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!this.loading) this.loading = new Promise((res, rej) => { const s = document.createElement("script"); s.src = THREE_URL; s.async = true; s.onload = () => (window.THREE ? res(window.THREE) : rej()); s.onerror = rej; document.head.appendChild(s); });
    return this.loading;
  },
  img(svg, size) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(i, 0, 0, size, size); res(c); }; i.onerror = rej; i.src = svgURI(svg); });
  },
  async mount(host, ui, states) {
    if (this.ok === false || reduced || window.__no3d) return;
    let T;
    try { T = await this.load(); } catch (e) { this.ok = false; return; }
    if (!host.isConnected) return;
    try { if (!this.r) this.build(T); } catch (e) { this.ok = false; return; }
    this.ok = true;
    const key = ui + ":" + states.join(",");
    if (key !== this.key) {
      this.key = key;
      const c = cityOf(ui), seed = ui * 31 + 5, size = 1024;
      const [col, rough, bump, gloss] = await Promise.all([
        this.img(Zel.svg(c.g, states, { seed, field:c.field }), size),
        this.img(Zel.svg(c.g, states, { seed, field:c.field, mode:"rough" }), size),
        this.img(Zel.svg(c.g, states, { seed, field:c.field, mode:"bump" }), size),
        this.img(Zel.svg(c.g, states, { seed, field:c.field, mode:"gloss" }), 512),
      ]).catch(() => [null]);
      if (!col) return;
      const m = this.top;
      const tex = (cv, srgb) => { const tx = new T.CanvasTexture(cv); if (srgb) tx.encoding = T.sRGBEncoding; tx.anisotropy = 4; return tx; };
      [m.map, m.roughnessMap, m.bumpMap, m.clearcoatMap].forEach((x) => x && x.dispose());
      m.map = tex(col, true); m.roughnessMap = tex(rough); m.bumpMap = tex(bump); m.clearcoatMap = tex(gloss); m.needsUpdate = true;
    }
    this.attach(host);
  },
  build(T) {
    const r = new T.WebGLRenderer({ antialias:true, alpha:true, powerPreference:"low-power", preserveDrawingBuffer:true });
    r.setPixelRatio(Math.min(2, devicePixelRatio || 1));
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.NoToneMapping;
    r.domElement.className = "med3d";
    const scene = new T.Scene(), cam = new T.PerspectiveCamera(38, 1, 0.1, 50);
    cam.position.set(0, 0, 3.42);
    // a small studio for reflections: a dim room with a big soft box, a warm saffron panel and a cool Majorelle panel
    const env = new T.Scene();
    env.add(new T.Mesh(new T.BoxGeometry(12, 12, 12), new T.MeshBasicMaterial({ color:0x24224a, side:T.BackSide })));
    const panel = (w, h, col, k, pos, rot) => { const m = new T.MeshBasicMaterial({ side:T.DoubleSide }); m.color.setRGB(col[0] * k, col[1] * k, col[2] * k); const p = new T.Mesh(new T.PlaneGeometry(w, h), m); p.position.set(...pos); p.lookAt(0, 0, 0); if (rot) p.rotation.z += rot; env.add(p); };
    panel(5, 3, [1, 1, 1], 3, [0, 4, 3.5]);
    panel(2.5, 4, [1, 0.78, 0.4], 3, [-5, 0.5, 2]);
    panel(2.5, 4, [0.45, 0.42, 1], 2.4, [5, -0.5, 2]);
    panel(6, 1, [1, 1, 1], 2, [0, -4.5, 2]);
    const pm = new T.PMREMGenerator(r);
    scene.environment = pm.fromScene(env, 0.035).texture;
    // the plate: glazed face, brass edge and rim
    const brass = new T.MeshStandardMaterial({ color:0xC9A24F, metalness:1, roughness:0.32 });
    this.top = new T.MeshPhysicalMaterial({ roughness:1, metalness:0, bumpScale:0.045, envMapIntensity:0.55, clearcoat:0.9, clearcoatRoughness:0.05 });
    const g = new T.CylinderGeometry(1, 1, 0.16, 160, 1);
    g.rotateX(Math.PI / 2);
    const plate = new T.Mesh(g, [brass, this.top, brass]);
    const rim = new T.Mesh(new T.TorusGeometry(1.008, 0.045, 24, 180), brass);
    rim.position.z = 0.08;
    const grp = new T.Group(); grp.add(plate, rim); scene.add(grp);
    const key = new T.DirectionalLight(0xffffff, 0.75); key.position.set(-2, 3, 4); scene.add(key);
    scene.add(new T.AmbientLight(0xffffff, 0.35));
    Object.assign(this, { r, scene, cam, grp, keyL:key, T });
    const cv = r.domElement;
    // drag to turn the plate; it springs back. A tap still opens the journey.
    cv.addEventListener("pointerdown", (e) => { this.drag = { x:e.clientX, y:e.clientY, rx:this.tx, ry:this.ty, moved:false }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", (e) => { const d = this.drag; if (!d) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (Math.abs(dx) + Math.abs(dy) > 6) d.moved = true; this.ty = Math.max(-1.1, Math.min(1.1, d.ry + dx / 90)); this.tx = Math.max(-0.8, Math.min(0.8, d.rx + dy / 110)); });
    const up = () => { const d = this.drag; this.drag = null; if (d && d.moved) { this.suppress = performance.now(); this.vy += (this.ty - this.ry) * 0.2; haptic(6); } this.tx = 0; this.ty = 0; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("click", (e) => { if (performance.now() - (this.suppress || 0) < 300) { e.stopPropagation(); e.preventDefault(); } }, true);
    addEventListener("deviceorientation", (e) => { if (e.gamma == null) return; this.tilt.y = Math.max(-0.35, Math.min(0.35, e.gamma / 90)); this.tilt.x = Math.max(-0.3, Math.min(0.3, (e.beta - 45) / 120)); }, { passive:true });
  },
  attach(host) {
    const cv = this.r.domElement;
    if (cv.parentNode !== host) { host.appendChild(cv); this.spin = this.host === null ? -Math.PI * 1.2 : this.spin; }
    this.host = host;
    this.size(); this.t0 = performance.now(); this.go();
  },
  size() { const w = Math.round((this.host.clientWidth || 260) * 1.12); this.r.setSize(w, w, false); this.cam.aspect = 1; this.cam.updateProjectionMatrix(); },
  go() { if (!this.raf) { this.last = 0; this.raf = requestAnimationFrame((t) => this.frame(t)); } },
  frame(now) {
    this.raf = 0;
    if (!this.host || !this.host.isConnected || document.hidden || view !== "today" || Lesson.active || !$("#welcome").hidden) return;
    const t = (now - this.t0) / 1000;
    // slow device? drop to 1x pixels, then fall back to the flat medallion
    if (this.last) { const dt = now - this.last; this.dts = (this.dts || []).concat(dt).slice(-24); if (this.dts.length === 24) { const avg = this.dts.reduce((a, b) => a + b) / 24; if (avg > 48) { this.dts = []; if (this.r.getPixelRatio() > 1) { this.r.setPixelRatio(1); this.size(); } else { this.ok = false; this.host.classList.remove("has3d"); this.r.domElement.remove(); this.host = null; this.last = 0; return; } } } }
    this.last = now;
    // spring the plate toward the target angle
    const k = 0.09, damp = 0.8;
    this.vx = (this.vx + (this.tx + this.tilt.x + Math.cos(t * 0.6) * 0.2 - this.rx) * k) * damp;
    this.vy = (this.vy + (this.ty + this.tilt.y + Math.sin(t * 0.45) * 0.38 - this.ry) * k) * damp;
    this.rx += this.vx; this.ry += this.vy;
    this.spin *= 0.94;
    this.grp.rotation.set(this.rx, this.ry + this.spin, 0);
    this.grp.position.y = Math.sin(t * 1.1) * 0.03;
    this.keyL.position.set(Math.cos(t * 0.5) * 3, 2.5 + Math.sin(t * 0.7), 4);
    // never queue a frame while the GPU is still busy with the last one; if it keeps lagging, step down
    const gl = this.r.getContext();
    if (this.sync && gl.fenceSync) {
      const st = gl.getSyncParameter(this.sync, gl.SYNC_STATUS);
      if (st !== gl.SIGNALED) {
        this.waits = (this.waits || 0) + 1;
        if (this.waits > 20) { this.waits = 0; if (this.r.getPixelRatio() > 1) { this.r.setPixelRatio(1); this.size(); } else { this.ok = false; this.host.classList.remove("has3d"); this.r.domElement.remove(); this.host = null; return; } }
        this.go(); return;
      }
      gl.deleteSync(this.sync); this.sync = null; this.waits = 0;
      if (!this.host.classList.contains("has3d")) this.host.classList.add("has3d");
    }
    this.r.render(this.scene, this.cam);
    if (gl.fenceSync) { this.sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); } else this.host.classList.add("has3d");
    this.go();
  },
};



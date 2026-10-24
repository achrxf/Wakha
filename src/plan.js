/* =========================================================
   PLANS: free tier (ads, 7 cities, cups of tea, 5 min of feed) and Wakha Plus
   (everything, any city in any order, placement test). A 3-day Plus trial starts at install.
   Payments are simulated in this prototype; Ads.show() is the one place a real ad SDK plugs in.
   ========================================================= */
const FREE_CITIES = 7, CUPS_MAX = 3, FEED_FREE_SEC = 300, TRIAL_DAYS = 3;
const PRICE = { monthly:7, yearly:50 };
const plan = () => (S.plan ||= { installedAt:S.createdAt || Date.now(), sub:null, dev:"auto", shortAds:false });
const trialLeftMs = () => Math.max(0, plan().installedAt + TRIAL_DAYS * 864e5 - Date.now());
function isPlus() {
  const p = plan();
  if (p.dev === "plus") return true;
  if (p.dev === "free") return false;
  return !!p.sub || trialLeftMs() > 0;
}
const onTrial = () => plan().dev === "auto" && !plan().sub && trialLeftMs() > 0;
const trialDaysLeft = () => Math.max(1, Math.ceil(trialLeftMs() / 864e5));
// free tier: Tangier is open, the next six cities each open with one ad, the rest are Plus
function cityGate(ui) {
  if (isPlus()) return null;
  if (ui >= FREE_CITIES) return "plus";
  if (ui >= 1 && !(S.adOpen || {})[UNITS[ui].id]) return "ad";
  return null;
}
const cityReached = (ui) => ui === 0 || PATH.filter((p) => p.unit === ui - 1).every((p) => S.lessons[p.id]);

/* ---------- cups of tea (lives) ---------- */
function refillDaily() { if (S.cupsDay !== today()) { S.cupsDay = today(); S.cups = CUPS_MAX; } }
const cupsLeft = () => (isPlus() ? Infinity : (refillDaily(), S.cups ?? CUPS_MAX));
function loseCup() { if (isPlus()) return; refillDaily(); S.cups = Math.max(0, (S.cups ?? CUPS_MAX) - 1); refreshHUD(); const c = $("#hud-cups"); if (c && !reduced) c.animate([{ transform:"scale(1)" }, { transform:"scale(1.18)" }, { transform:"scale(1)" }], { duration:320, easing:EASE_OUT }); }
function cupSVG(full, cls = "") {
  const id = "cg" + (++glassUid);
  return `<svg class="cup ${full ? "cup-f" : "cup-e"} ${cls}" viewBox="0 0 12 18" aria-hidden="true"><defs><clipPath id="${id}"><path d="M1.2 2.5h9.6l-1.2 13.2a1.2 1.2 0 0 1-1.2 1H3.6a1.2 1.2 0 0 1-1.2-1Z"/></clipPath></defs>
    ${full ? `<rect x="0" y="5.2" width="12" height="14" fill="#D98A2B" clip-path="url(#${id})"/><path d="M6.3 2.2c-.9-1.7.8-2.4 2-1.9-.6.3-1 1-2 1.9Z" fill="#2F8A5B"/>` : ""}
    <path d="M1.2 2.5h9.6l-1.2 13.2a1.2 1.2 0 0 1-1.2 1H3.6a1.2 1.2 0 0 1-1.2-1Z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M1.8 6h8.4" stroke="#EBC274" stroke-width="1"/></svg>`;
}
function cupsHUD() {
  if (isPlus()) return `${cupSVG(true)}<b class="inf">∞</b>`;
  const n = cupsLeft(); let h = ""; for (let i = 0; i < CUPS_MAX; i++) h += cupSVG(i < n);
  return h;
}
// the run of days, drawn as an eight-point star (the cups of tea are lives now)
function runStar() { return `<svg class="runstar" viewBox="-12 -12 24 24" aria-hidden="true"><polygon points="${starPts(0, 0, 11, 8.3, 8)}" fill="var(--run,#17655E)"/><polygon points="${starPts(0, 0, 5, 3.8, 8, -Math.PI / 2 + Math.PI / 8)}" fill="#EBC274"/></svg>`; }

/* ---------- ads (simulated) ---------- */
const Ads = {
  busy:false,
  show(kind = "interstitial", reason = "") {
    if (isPlus()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const el = $("#adlayer"); this.busy = true; Voice.stop();
      const secs = plan().shortAds ? 2 : kind === "rewarded" ? 8 : 5;
      const house = (this.n = (this.n || 0) + 1) % 2;
      el.className = "adlayer " + kind;
      el.innerHTML = `<div class="ad-top"><span class="ad-tag">${esc(t("adLabel"))}</span><span class="ad-count" aria-live="polite">${secs}</span></div>
        <div class="ad-body">${house ? `<div class="ad-house">${mascot("wink")}<h3>${esc(t("plusAdT"))}</h3><p>${esc(t("plusAdS"))}</p><button class="cta" data-ad="plus">${esc(t("seePlans"))}</button></div>`
          : `<div class="ad-slot"><b>${esc(t("adSlotT"))}</b><p>${esc(t("adSlotS"))}</p></div>`}</div>
        <p class="ad-note">${esc(kind === "rewarded" ? t("adRewardNote") : t("adNote"))}</p>
        <button class="ad-close" data-ad="close" disabled>${esc(t("adWait"))}</button>`;
      el.hidden = false;
      let left = secs; const cnt = $(".ad-count", el), btn = $(".ad-close", el);
      const timer = setInterval(() => { left--; cnt.textContent = Math.max(0, left); if (left <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = kind === "rewarded" ? t("adClaim") : t("adClose"); cnt.textContent = "✓"; } }, 1000);
      const finish = (ok) => { clearInterval(timer); el.hidden = true; el.innerHTML = ""; el.onclick = null; this.busy = false; resolve(ok); };
      el.onclick = (e) => {
        const a = e.target.closest("[data-ad]"); if (!a) return;
        if (a.dataset.ad === "close" && left <= 0) finish(true);
        if (a.dataset.ad === "plus") { finish(kind !== "rewarded"); openPaywall(reason || "ad"); }
      };
    });
  },
};

/* ---------- sheets for cups, locked cities, Plus ---------- */
function openSheet(html, cls = "") {
  const sh = $("#nsheet");
  sh.className = "nsheet " + cls; sh.innerHTML = html;
  clearTimeout(Session.sheetT); sh.style.transform = ""; $("#sheet-scrim").classList.remove("leaving");
  sh.hidden = false; $("#sheet-scrim").hidden = false;
  $$("[data-act=sheet-close]", sh).forEach((b) => b.addEventListener("click", closeNodeSheet));
  return sh;
}
function cupsSheet(fromLesson) {
  const n = cupsLeft(), full = n >= CUPS_MAX;
  const sh = openSheet(`<div class="cups-big">${Array.from({ length:CUPS_MAX }, (_, i) => cupSVG(i < n)).join("")}</div>
    <h3>${esc(n === 0 ? t("cupsOutT") : t("cupsT"))}</h3><p>${esc(n === 0 ? t("cupsOutS") : t("cupsS", { n }))}</p>
    ${full ? "" : `<button class="cta block" data-act="cup-ad">${esc(t("cupAd"))}</button>`}
    <button class="ghost block sh-plus" data-act="plus">${esc(t("cupsPlus"))}</button>
    ${fromLesson && n === 0 ? `<button class="sh-link" data-act="leave-lesson">${esc(t("leave"))}</button>` : `<button class="ghost block sh-ok" data-act="sheet-close">${esc(t("gotIt"))}</button>`}`, "cups-sheet");
  sh.onclick = async (e) => {
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "cup-ad") { closeNodeSheet(); if (await Ads.show("rewarded", "cups")) { refillDaily(); S.cups = Math.min(CUPS_MAX, (S.cups ?? 0) + 1); persist(); refreshHUD(); toast(t("cupGot"), ""); if (fromLesson && Lesson.active && S.cups > 0 && Lesson.waitCups) { Lesson.waitCups = false; Lesson.advance(); } } }
    if (a.dataset.act === "plus") { closeNodeSheet(); openPaywall("cups"); }
    if (a.dataset.act === "leave-lesson") { closeNodeSheet(); Lesson.close(false); }
  };
}
function plusCitySheet(ui) {
  const c = cityOf(ui);
  const sh = openSheet(`<div class="cs-top"><span class="cs-badge">${cityBadge(ui)}</span><div><small>${esc(c.ar)}</small><h3>${esc(cityName(c))}</h3></div></div>
    <p>${esc(L(c.scene))}</p><p class="plus-note"><b>${esc(t("plusCityT"))}</b> ${esc(t("plusCityS", { n:FREE_CITIES }))}</p>
    <button class="cta block" data-act="plus">${esc(t("seePlans"))}</button><button class="ghost block sh-ok" data-act="sheet-close">${esc(t("gotIt"))}</button>`);
  sh.onclick = (e) => { if (e.target.closest("[data-act=plus]")) { closeNodeSheet(); openPaywall("city"); } };
}
async function openCityWithAd(ui) {
  if (await Ads.show("rewarded", "city")) { (S.adOpen ||= {})[UNITS[ui].id] = true; persist(); toast(t("cityOpened", { c:cityName(cityOf(ui)) }), ""); Session.jrOpen = ui; renderLearn(); return true; }
  return false;
}
function afterLessonAd(done) { if (isPlus()) { done(); return; } Ads.show("interstitial", "lesson").then(done); }

/* ---------- paywall ---------- */
function openPaywall(reason = "") {
  const el = $("#paywall"), p = plan();
  const yearlyMo = (PRICE.yearly / 12).toFixed(2), save = Math.round((1 - PRICE.yearly / (PRICE.monthly * 12)) * 100);
  const status = p.sub ? t("planSubbed", { p:t(p.sub === "yearly" ? "planYearly" : "planMonthly") }) : onTrial() ? t("trialLeft", { n:trialDaysLeft() }) : t("trialOver");
  el.innerHTML = `<div class="pw-in"><button class="pw-x" data-pw="close" aria-label="${esc(t("quit"))}">${ICON.x}</button>
    <div class="pw-hero">${cityBadge(5)}<div><p class="eyebrow">Wakha</p><h2>Wakha Plus</h2><p class="pw-status">${esc(status)}</p></div></div>
    <ul class="pw-list">${["pwF1", "pwF2", "pwF3", "pwF4", "pwF5", "pwF6"].map((k) => `<li>${ICON.check}<span>${esc(t(k, { n:UNITS.length }))}</span></li>`).join("")}</ul>
    <div class="pw-plans">
      <button class="pw-plan on" data-plan="yearly"><span class="pw-badge">${esc(t("saveN", { n:save }))}</span><b>${esc(t("planYearly"))}</b><span class="pr">$${PRICE.yearly}<small>/ ${esc(t("perYear"))}</small></span><span class="sub">${esc(t("perMonthEq", { p:"$" + yearlyMo }))}</span></button>
      <button class="pw-plan" data-plan="monthly"><b>${esc(t("planMonthly"))}</b><span class="pr">$${PRICE.monthly}<small>/ ${esc(t("perMonth"))}</small></span><span class="sub">${esc(t("cancelAny"))}</span></button>
    </div>
    <button class="cta block pw-go" data-pw="buy">${esc(p.sub ? t("planKeep") : t("subscribe"))}</button>
    <p class="pw-fine">${esc(t("pwFine"))}</p><button class="sh-link" data-pw="restore">${esc(t("restore"))}</button></div>`;
  el.hidden = false; el.dataset.reason = reason;
  let choice = "yearly";
  el.onclick = (e) => {
    const pl = e.target.closest("[data-plan]"); if (pl) { choice = pl.dataset.plan; $$(".pw-plan", el).forEach((b) => b.classList.toggle("on", b === pl)); return; }
    const a = e.target.closest("[data-pw]"); if (!a) return;
    if (a.dataset.pw === "close") closePaywall();
    if (a.dataset.pw === "buy") { if (!p.sub) { p.sub = choice; p.subAt = Date.now(); persist(); toast(t("protoPaid"), ""); } closePaywall(); refreshAll(); }
    if (a.dataset.pw === "restore") toast(t("protoRestore"), "");
  };
}
function closePaywall() { const el = $("#paywall"); el.hidden = true; el.innerHTML = ""; el.onclick = null; }
function refreshAll() { refreshHUD(); renderLearn(); if (view === "me") renderMe(); if (view === "guide") renderGuide(); if (view === "feed") Feed.restart(); }

/* ---------- placement test (Plus) ---------- */
const TOPICS = [["hello", "u1", "u11"], ["polite", "u2", "u12"], ["foot", "u10", "u13"], ["q", "u3", "u14"], ["food", "u4", "u15"], ["souk", "u5", "u16"], ["num", "u6", "u17"], ["family", "u7", "u18"], ["travel", "u8", "u19"], ["basics", "u9", "u20"]];
function openPlacement() {
  if (!isPlus()) { openPaywall("test"); return; }
  const el = $("#placement");
  const base = TOPICS.map((x) => UNITS.findIndex((u) => u.id === x[1]));
  const qs = base.map((ui) => { const ws = UNITS[ui].words.filter((id) => W[id] && !W[id].rar); return ws[Math.floor(Math.random() * Math.min(ws.length, 6))]; });
  const st = { step:0, topics:new Set(), known:[] };
  const topicName = (k) => L(CAT[k] || [k, k]);
  const draw = () => {
    if (st.step === 0) {
      el.innerHTML = `<div class="pl-in"><button class="pw-x" data-pl="close" aria-label="${esc(t("quit"))}">${ICON.x}</button><p class="eyebrow">${esc(t("plTestK"))}</p><h2>${esc(t("plTopicsT"))}</h2><p class="soft">${esc(t("plTopicsS"))}</p>
        <div class="pl-topics">${TOPICS.map(([k]) => `<button class="pl-chip${st.topics.has(k) ? " on" : ""}" data-topic="${k}">${esc(topicName(k))}</button>`).join("")}</div>
        <button class="cta block" data-pl="next">${esc(t("plStart"))}</button></div>`;
      return;
    }
    if (st.step <= qs.length) {
      const id = qs[st.step - 1], wd = W[id];
      const opts = makeOptions(wd, false, CORE, true);
      el.innerHTML = `<div class="pl-in"><button class="pw-x" data-pl="close" aria-label="${esc(t("quit"))}">${ICON.x}</button><div class="l-prog pl-prog"><i style="transform:scaleX(${((st.step - 1) / qs.length).toFixed(3)})"></i></div>
        <p class="eyebrow">${esc(t("aOfB", { a:st.step, b:qs.length }))}</p><h2>${esc(t("whatMeans"))}</h2>
        <div class="qsign">${sayBtn(wd.d, "fill")}<span class="lat">${dj(wd.d)}</span><span class="ar" lang="ary">${esc(wd.ar)}</span></div>
        <div class="opts">${opts.map((o) => `<button class="opt" data-ans="${esc(o)}"><span>${esc(meaning(W[o]))}</span></button>`).join("")}</div>
        <button class="sh-link" data-ans="?">${esc(t("plDontKnow"))}</button></div>`;
      return;
    }
    // results: the first city whose words you didn't know, then up to two cities for your topics
    const firstGap = base.find((ui, i) => !st.known[i]);
    const recs = [];
    const add = (ui, why) => { if (ui != null && ui >= 0 && !recs.some((r) => r.ui === ui) && recs.length < 3) recs.push({ ui, why }); };
    add(firstGap != null ? firstGap : 0, t("plWhyLevel"));
    for (const [k, a, b] of TOPICS) if (st.topics.has(k)) { const i = TOPICS.findIndex((x) => x[0] === k); add(UNITS.findIndex((u) => u.id === (st.known[i] ? b : a)), t("plWhyTopic", { t:topicName(k) })); }
    const knownN = st.known.filter(Boolean).length;
    el.innerHTML = `<div class="pl-in"><button class="pw-x" data-pl="close" aria-label="${esc(t("quit"))}">${ICON.x}</button><p class="eyebrow">${esc(t("plResultK", { n:knownN, b:qs.length }))}</p><h2>${esc(t("plResultT"))}</h2>
      <div class="pl-recs">${recs.map((r) => { const c = cityOf(r.ui); return `<button class="pl-rec" data-city="${r.ui}"><span class="sw">${cityBadge(r.ui)}</span><span><b>${esc(cityName(c))}</b><small>${esc(L([UNITS[r.ui].en, UNITS[r.ui].fr]))}</small><em>${esc(r.why)}</em></span>${ICON.right || ""}</button>`; }).join("")}</div>
      <p class="soft">${esc(t("plAnyCity"))}</p></div>`;
    S.placement = { at:Date.now(), known:knownN, topics:[...st.topics], recs:recs.map((r) => r.ui) }; persist();
  };
  el.onclick = (e) => {
    if (e.target.closest("[data-pl=close]")) { el.hidden = true; el.innerHTML = ""; return; }
    const tp = e.target.closest("[data-topic]"); if (tp) { const k = tp.dataset.topic; st.topics.has(k) ? st.topics.delete(k) : st.topics.add(k); tp.classList.toggle("on"); return; }
    if (e.target.closest("[data-pl=next]")) { st.step = 1; draw(); return; }
    const an = e.target.closest("[data-ans]");
    if (an) { st.known[st.step - 1] = an.dataset.ans === qs[st.step - 1]; Sound.play(an.dataset.ans === qs[st.step - 1] ? "good" : "tap"); st.step++; draw(); return; }
    const sv = e.target.closest("[data-say]"); if (sv) return;
    const rc = e.target.closest("[data-city]");
    if (rc) { const ui = +rc.dataset.city; S.focusUnit = ui; Session.jrOpen = ui; persist(); el.hidden = true; el.innerHTML = ""; setView("journey"); renderLearn(); toast(t("plChosen", { c:cityName(cityOf(ui)) }), ""); }
  };
  el.hidden = false; draw();
}

/* ---------- feed: 5 minutes a day on the free tier ---------- */
const feedRec = () => { const d = today(); if (!S.feedSec || S.feedSec.d !== d) S.feedSec = { d, s:0 }; return S.feedSec; };
function feedLocked() { return !isPlus() && feedRec().s >= FEED_FREE_SEC; }
function syncFeedLock() {
  const lock = $("#feedlock"); if (!lock) return;
  const on = view === "feed" && feedLocked();
  if (on && lock.hidden) {
    lock.innerHTML = `<div class="fl-in">${mascot("normal")}<h3>${esc(t("feedDoneT"))}</h3><p>${esc(t("feedDoneS"))}</p><button class="cta block" data-act="plus">${esc(t("feedPlus"))}</button><button class="ghost block" data-act="journey">${esc(t("feedJourney"))}</button></div>`;
    Feed.pause(); Voice.stop();
  }
  lock.hidden = !on;
}
function feedTick() {
  if (view !== "feed" || document.hidden || Lesson.active || isPlus() || !$("#adlayer").hidden) return;
  const r = feedRec(); r.s++;
  if (r.s === FEED_FREE_SEC - 60) toast(t("feedMinute"), "");
  if (r.s % 15 === 0) persist();
  if (r.s >= FEED_FREE_SEC) syncFeedLock();
}
function exAd(sp, host) {
  const el = shell("ad", "night");
  $(".card-in", el).innerHTML = `<div class="kicker a1"><span class="tag solid">${esc(t("adLabel"))}</span></div>
    <div class="ad-card a2">${mascot("happy")}<h2 class="prompt-big">${esc(t("plusAdT"))}</h2><p class="mean">${esc(t("plusAdS"))}</p><button class="cta" data-act="plus">${esc(t("seePlans"))}</button></div>
    <p class="ad-note a3">${esc(t("adNote"))}</p><p class="swipe-cue a4">${ICON.up}<span>${esc(t("swipe"))}</span></p>`;
  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=plus]")) openPaywall("feed"); });
  return { el, kind:"ad" };
}
BUILDERS.ad = exAd;

/* ---------- small Plus card for the free Today screen ---------- */
function plusCardHTML() {
  return `<section class="plus-card"><div class="pc-top">${runStar()}<div><b>Wakha Plus</b><span>${esc(t("plusCardS"))}</span></div></div>
    <ul>${["pcF1", "pcF2", "pcF3"].map((k) => `<li>${ICON.check}<span>${esc(t(k, { n:UNITS.length }))}</span></li>`).join("")}</ul>
    <button class="cta block" data-act="plus">${esc(t("plusTry", { p:"$" + PRICE.monthly }))}</button><p class="ad-note">${esc(t("adNote"))}</p></section>`;
}
function adBannerHTML() { return isPlus() ? "" : `<div class="ad-banner"><span class="ad-tag">${esc(t("adLabel"))}</span><span>${esc(t("adSlotS"))}</span><button class="sh-link" data-act="plus">${esc(t("removeAds"))}</button></div>`; }

/* ---------- start over as a brand-new user (Me → Developer, or open the app with #newuser) ---------- */
function startOver() {
  S = defaultState(); S.lastOpen = today();
  try { saveLocal(); } catch (e) {} try { remoteSave(); } catch (e) {}
  Session.jrOpen = null; Feed.started = false; closeNodeSheet(); closePaywall();
  refreshHUD(); setView("today"); renderLearn(); showWelcome(1);
}

/* ---------- boot ---------- */
function bootPlans() {
  plan(); refillDaily();
  if (!$("#feedlock")) { const fl = document.createElement("div"); fl.id = "feedlock"; fl.className = "feedlock"; fl.hidden = true; $("#v-feed").appendChild(fl); }
  setInterval(feedTick, 1000);
  if (location.hash === "#newuser") { try { history.replaceState(history.state, "", location.pathname + location.search); } catch (e) {} setTimeout(startOver, 50); }
  setTimeout(() => { if (window.__wakha) Object.assign(window.__wakha, { isPlus, cityGate, cupsLeft, openPaywall, openPlacement, Ads, plan, refreshAll, persist }); }, 0);
  // any "Plus" button anywhere opens the paywall
  document.addEventListener("click", (e) => {
    const p = e.target.closest("[data-act=plus]"); if (p && !p.closest("#nsheet,#adlayer,#paywall")) { e.preventDefault(); openPaywall("button"); }
    const j = e.target.closest("#feedlock [data-act=journey]"); if (j) setView("journey");
    if (e.target.closest("#hud-cups")) { Sound.play("tap"); if (isPlus()) toast(t("cupsPlusOn"), ""); else cupsSheet(false); }
  }, true);
}

/* boot (last, so every module above is ready) */
const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === "function") hot.ready(start); else start((hot && hot.data) || {});

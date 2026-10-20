/* =========================================================
   EXERCISES (shared by lessons and the feed)
   ========================================================= */
function shell(type, tile) {
  const el = document.createElement("article");
  el.className = `card jewel j-${tile}`;
  el.dataset.type = type;
  el.innerHTML = ARCH + `<div class="card-in"></div>`;
  return el;
}
const wordCls = (s) => (s.length > 12 ? "word l4" : s.length > 9 ? "word l3" : s.length > 6 ? "word l2" : "word");
const catTag = (wd) => wd.rar ? `<span class="tag rar-${wd.rar}" style="color:var(--rc);border-color:var(--rc)">${ICON.sparkle}${esc(L(RAR[wd.rar]))}</span>` : `<span class="tag">${esc(L(CAT[wd.cat] || ["", ""]))}</span>`;
const nextBtnHTML = (label) => `<button class="next-btn nudge" data-act="next"><span>${esc(label || t("next"))}</span>${ICON.down}</button>`;
function bannerHTML(ok, info, inline) {
  const tri = ok ? pick(PRAISE2) : pick(COMFORT);
  const sub = ok
    ? (info.right && info.showRight ? `<b>${esc(info.right)}</b>${info.rightTr ? ` (${esc(info.rightTr)})` : ""}` : esc(triTr(tri)))
    : (info.right ? `${esc(t("correctAns"))}: <b>${esc(info.right)}</b>${info.rightTr ? ` (${esc(info.rightTr)})` : ""}` : esc(triTr(tri)));
  return `<div class="banner ${inline ? "inline " : ""}${ok ? "ok" : "no"}"><span class="bi">${ok ? ICON.check : ICON.x}</span>
    <div class="bt"><p class="bv">${dj(tri[0])}</p><p class="bs">${sub}</p></div>${info.say ? sayBtn(info.say, "", info.voice || "n") : ""}${inline && !ok ? nextBtnHTML() : ""}</div>`;
}
// distractor options for a word
function makeOptions(wd, reverse, pool, easy) {
  const base = (pool && pool.length >= 4 ? pool : CORE).concat(CORE);
  const cand = [...new Set(base)].filter((id) => id !== wd.id && W[id] && !(wd.grp && W[id].grp === wd.grp));
  const label = (x) => (reverse ? W[x].d : meaning(W[x]));
  const used = new Set([label(wd.id)]);
  const near = shuffle(cand.filter((id) => W[id].cat === wd.cat)), far = shuffle(cand.filter((id) => W[id].cat !== wd.cat));
  const order = easy ? far.concat(near) : near.slice(0, 2).concat(shuffle(near.slice(2).concat(far)));
  const picks = [];
  for (const id of order) { const lb = label(id); if (used.has(lb)) continue; used.add(lb); picks.push(id); if (picks.length === 3) break; }
  return shuffle([wd.id].concat(picks));
}
function markOptions(el, chosen, rightSel, ok) {
  const box = $(".opts", el); box && box.classList.add("done");
  chosen.classList.add(ok ? "ok" : "no"); const mk = $(".mk", chosen); mk && (mk.innerHTML = ok ? ICON.check : ICON.x);
  if (!ok) { const r = $(rightSel, el); if (r) { r.classList.add("ok"); const m2 = $(".mk", r); m2 && (m2.innerHTML = ICON.check); } $(".card-in", el).classList.add("shake"); }
}

function exLearn(sp, host) {
  const wd = W[sp.w];
  const el = shell("learn", host.tile(sp));
  const inFeed = host.mode === "feed";
  const saved = S.words[wd.id] && S.words[wd.id].fav;
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(inFeed ? t("review") : t("newWord"))}</span>${catTag(wd)}</div>
    <div class="word-row a2"><h2 class="${wordCls(wd.d)}">${dj(wd.d)}</h2>${sayBtn(wd.d, "lg")}</div>
    <p class="arw a3" lang="ary">${esc(wd.ar)}</p>
    <p class="mean a4">${esc(meaning(wd))}${wd.lit ? `<span class="lit">${esc(L(wd.lit))}</span>` : ""}</p>
    ${wd.ex ? `<div class="ex a5"><div><p class="ex-d">${dj(wd.ex[0])}</p><p class="ex-t">${esc(exTr(wd.ex))}</p></div>${sayBtn(wd.ex[0], "sm")}</div>` : ""}
    ${wd.note ? `<p class="note a6">${ICON.info}<span>${esc(L(wd.note))}</span></p>` : ""}`;
  const card = { el, kind:"learn", firstEnter() { introduce(wd.id); persist(); }, enter() { setTimeout(() => host.isActive(card) && autoSay(wd.d, "n", $$(".word .dj", el)), 380); } };
  if (inFeed) {
    el.classList.add("has-rail");
    el.insertAdjacentHTML("beforeend", `<div class="rail"><button class="rb heart ${saved ? "on" : ""}" data-act="save" aria-label="${esc(t("save"))}"><span class="ico">${saved ? ICON.heart : ICON.heartLine}</span><span>${esc(t("save"))}</span></button>
      <button class="rb" data-act="share" aria-label="${esc(t("share"))}"><span class="ico">${ICON.share}</span><span>${esc(t("share"))}</span></button></div>` + (S.stats.cards < 20 && !saved ? `<div class="dt-hint"><span>${ICON.tap}${esc(t("doubleTap"))}</span></div>` : ""));
    let lastTap = 0, lx = 0, ly = 0;
    const doSave = (x, y, fromBtn) => {
      const s = S.words[wd.id] || introduce(wd.id);
      const btn = $(".rb.heart", el);
      if (fromBtn && s.fav) { s.fav = false; btn.classList.remove("on"); $(".ico", btn).innerHTML = ICON.heartLine; persist(); return; }
      const first = !s.fav; s.fav = true; btn.classList.add("on"); $(".ico", btn).innerHTML = ICON.heart;
      Session.interacted = true; Sound.play("heart");
      if (x != null) {
        const hp = document.createElement("div"); hp.className = "heart-pop"; hp.innerHTML = ICON.heart; hp.style.left = x + "px"; hp.style.top = y + "px"; el.appendChild(hp);
        hp.animate([{ transform:"scale(.2) rotate(-12deg)", opacity:0 }, { transform:"scale(1.15) rotate(-6deg)", opacity:1, offset:0.25 }, { transform:"scale(.95)", opacity:1, offset:0.55 }, { transform:"scale(1.25) translateY(-60px)", opacity:0 }], { duration:850, easing:"ease-out" }).onfinish = () => hp.remove();
      }
      const hint = $(".dt-hint", el); hint && hint.remove();
      if (first) { award(2, btn); toast(t("saved"), `<span style="color:#FF7FA2">${ICON.heart}</span>`); }
      persist();
    };
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (b) { e.stopPropagation(); if (b.dataset.act === "save") doSave(null, null, true); else if (b.dataset.act === "share") shareThing({ kind:"word", word:wd }); return; }
      const now = performance.now(), r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (now - lastTap < 320 && Math.hypot(x - lx, y - ly) < 40) { doSave(x, y, false); lastTap = 0; } else { lastTap = now; lx = x; ly = y; }
    });
  }
  return card;
}
function exPick(sp, host) {
  const wd = W[sp.w];
  const el = shell("pick", host.tile(sp));
  const opts = makeOptions(wd, false, host.pool(), sp.easy);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(sp.review ? t("review") : "Quiz")}</span>${catTag(wd)}</div>
    <p class="prompt a1">${esc(t("whatMeans"))}</p>
    <div class="word-row a2"><h2 class="${wordCls(wd.d)}">${dj(wd.d)}</h2>${sayBtn(wd.d, "lg")}</div>
    <p class="arw a3" lang="ary" style="font-size:clamp(26px,8vw,38px)">${esc(wd.ar)}</p>
    <div class="opts a4">${opts.map((id) => `<button class="opt" data-id="${esc(id)}"><span>${esc(meaning(W[id]))}</span><span class="mk"></span></button>`).join("")}</div>
    <div class="fbx"></div>`;
  const card = { el, kind:"pick", done:false, enter() { setTimeout(() => host.isActive(card) && !card.done && autoSay(wd.d, "n", $$(".word .dj", el)), 350); } };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const b = e.target.closest(".opt"); if (!b || card.done) return;
    card.done = true; const ok = b.dataset.id === wd.id;
    markOptions(el, b, `.opt[data-id="${CSS.escape(wd.id)}"]`, ok);
    grade(wd.id, ok);
    host.resolve(card, ok, { fromEl:b, base:3, right:meaning(wd), say:wd.d });
  });
  return card;
}
function exRev(sp, host) {
  const wd = W[sp.w];
  const el = shell("rev", host.tile(sp));
  const opts = makeOptions(wd, true, host.pool(), sp.easy);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(sp.review ? t("review") : "Quiz")}</span>${catTag(wd)}</div>
    <p class="prompt a1">${esc(t("howSay"))}</p>
    <h2 class="prompt-big a2">${esc(meaning(wd))}</h2>
    <div class="opts a3">${opts.map((id) => `<div class="opt-wrap has-say"><button class="opt" data-id="${esc(id)}"><span class="d" lang="ary-Latn">${esc(W[id].d)}</span><span class="a" lang="ary">${esc(W[id].ar)}</span><span class="mk"></span></button>${sayBtn(W[id].d, "sm")}</div>`).join("")}</div>
    <div class="fbx"></div>`;
  const card = { el, kind:"rev", done:false };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const b = e.target.closest(".opt"); if (!b || card.done) return;
    card.done = true; const ok = b.dataset.id === wd.id;
    markOptions(el, b, `.opt[data-id="${CSS.escape(wd.id)}"]`, ok);
    grade(wd.id, ok);
    host.resolve(card, ok, { fromEl:b, base:3, right:wd.d, rightTr:meaning(wd), say:wd.d, showRight:true });
  });
  return card;
}
function exListen(sp, host) {
  const wd = W[sp.w], mean = sp.sub === "mean";
  const el = shell("listen", host.tile(sp));
  const opts = makeOptions(wd, !mean, host.pool(), false);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${ICON.ear}${esc(t("heard"))}</span></div>
    <h2 class="prompt-big a2">${esc(mean ? t("listenMean") : t("listenPick"))}</h2>
    <div class="listen a3"><button class="play-big" data-act="play" aria-label="${esc(t("hearIt"))}">${ICON.speak}</button><button class="play-slow" data-act="slow" aria-label="${esc(t("slow"))}">${ICON.turtle}<span>${esc(t("slow"))}</span></button></div>
    <div class="opts a4">${opts.map((id) => `<button class="opt" data-id="${esc(id)}">${mean ? `<span>${esc(meaning(W[id]))}</span>` : `<span class="d" lang="ary-Latn">${esc(W[id].d)}</span>`}<span class="mk"></span></button>`).join("")}</div>
    <div class="fbx"></div>`;
  const play = (rate) => Voice.play(wd.d, { rate, btn:$(rate < 1 ? ".play-slow" : ".play-big", el) });
  const card = { el, kind:"listen", done:false, enter() { setTimeout(() => host.isActive(card) && !card.done && Session.gesture && play(1), 380); } };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const a = e.target.closest("[data-act=play],[data-act=slow]");
    if (a) { Sound.unlock(); Session.gesture = true; play(a.dataset.act === "slow" ? 0.68 : 1); return; }
    const b = e.target.closest(".opt"); if (!b || card.done) return;
    card.done = true; const ok = b.dataset.id === wd.id;
    markOptions(el, b, `.opt[data-id="${CSS.escape(wd.id)}"]`, ok);
    grade(wd.id, ok);
    host.resolve(card, ok, { fromEl:b, base:3, right:wd.d, rightTr:meaning(wd), say:wd.d, showRight:true, noAuto:true });
  });
  return card;
}
function exMatch(sp, host) {
  const ids = sp.words.filter((id) => W[id]).slice(0, 5);
  const el = shell("match", host.tile(sp));
  const left = shuffle(ids), right = shuffle(ids);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(t("matchK"))}</span></div>
    <h2 class="prompt-big a2">${esc(t("tapPairs"))}</h2>
    <div class="match a3"><div class="col">${left.map((id) => `<button class="mt dj-t" data-side="l" data-id="${esc(id)}" lang="ary-Latn">${esc(W[id].d)}</button>`).join("")}</div>
      <div class="col">${right.map((id) => `<button class="mt" data-side="r" data-id="${esc(id)}">${esc(meaning(W[id]))}</button>`).join("")}</div></div>
    <div class="fbx"></div>`;
  const card = { el, kind:"match", done:false, sel:null, left:ids.length, miss:0, bad:new Set() };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const b = e.target.closest(".mt"); if (!b || card.done || b.classList.contains("ok")) return;
    if (b.dataset.side === "l") Voice.play(W[b.dataset.id].d, { btn:b });
    else Sound.play("tap");
    if (!card.sel || card.sel.dataset.side === b.dataset.side) { $$(".mt.sel", el).forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); card.sel = b; return; }
    const a = card.sel; card.sel = null; a.classList.remove("sel");
    if (a.dataset.id === b.dataset.id) {
      a.classList.add("ok"); b.classList.add("ok"); Sound.play("match");
      if (!card.bad.has(a.dataset.id)) grade(a.dataset.id, true);
      if (--card.left === 0) { card.done = true; setTimeout(() => host.resolve(card, true, { fromEl:$(".match", el), base:Math.max(2, 6 - card.miss) }), 250); }
    } else {
      card.miss++; card.bad.add(a.dataset.side === "l" ? a.dataset.id : b.dataset.id);
      grade(a.dataset.side === "l" ? a.dataset.id : b.dataset.id, false);
      a.classList.add("no"); b.classList.add("no"); Sound.play("bad"); combo = 0; renderCombo();
      setTimeout(() => { a.classList.remove("no"); b.classList.remove("no"); }, 450);
    }
  });
  return card;
}
function exBuild(sp, host) {
  const row = BUILDS.find((b) => b[0] === sp.id) || BUILDS[0];
  const [, en, fr, tok, extra, credit, alts] = row;
  const el = shell("build", host.tile(sp));
  const chips = shuffle(tok.concat(extra).map((x, k) => ({ x, k })));
  const sentence = buildSay(tok);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(t("buildK"))}</span></div>
    <p class="prompt a1">${esc(t("say"))}</p>
    <h2 class="prompt-big a2">${esc(S.lang === "fr" ? fr : en)}</h2>
    <div class="slots a3" aria-live="polite"></div>
    <div class="pool a4">${chips.map(({ x, k }) => `<button class="tok" data-k="${k}" lang="ary-Latn">${esc(x)}</button>`).join("")}</div>
    <div class="fbx"></div>`;
  const card = { el, kind:"build", done:false, tries:0, placed:[] };
  const slots = $(".slots", el), pool = $(".pool", el);
  const check = () => {
    const said = card.placed.map((b) => b.textContent);
    const ok = [tok].concat(alts || []).some((g) => g.length === said.length && g.every((x, i) => x === said[i]));
    card.tries++;
    if (ok) {
      card.done = true; slots.classList.add("ok"); S.stats.builds++;
      if (credit && W[credit]) grade(credit, true);
      host.resolve(card, true, { fromEl:slots, base:card.tries === 1 ? 6 : 3, say:sentence, right:sentence, showRight:true });
    } else if (card.tries >= 2) {
      card.done = true;
      if (credit && S.words[credit]) grade(credit, false);
      slots.innerHTML = tok.map((x) => `<span class="tok" lang="ary-Latn">${esc(x)}</span>`).join("");
      slots.classList.add("ok"); $$(".tok", pool).forEach((b) => b.classList.add("ghost-t"));
      host.resolve(card, false, { fromEl:slots, right:sentence, say:sentence });
    } else {
      Sound.play("bad"); slots.classList.remove("shake"); void slots.offsetWidth; slots.classList.add("shake");
      combo = 0; renderCombo(); toast(t("tryAgain"));
      setTimeout(() => { card.placed.forEach((b) => { const src = $(`.tok[data-k="${b.dataset.from}"]`, pool); src && src.classList.remove("ghost-t"); b.remove(); }); card.placed = []; }, 520);
    }
  };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    if (card.done) return;
    const b = e.target.closest(".tok"); if (!b) return;
    Sound.play("tap");
    if (b.parentElement === pool) {
      if (b.classList.contains("ghost-t")) return;
      const c = document.createElement("button"); c.className = "tok"; c.textContent = b.textContent; c.dataset.from = b.dataset.k; c.setAttribute("lang", "ary-Latn");
      slots.appendChild(c); card.placed.push(c); b.classList.add("ghost-t");
      if (card.placed.length === tok.length) setTimeout(check, 180);
    } else if (b.parentElement === slots) {
      const src = $(`.tok[data-k="${b.dataset.from}"]`, pool); src && src.classList.remove("ghost-t");
      card.placed = card.placed.filter((x) => x !== b); b.remove();
    }
  });
  return card;
}
function exSit(sp, host) {
  const row = SITS.find((s) => s[0] === sp.id) || SITS[0];
  const [, emo, prompt, ans, optsRaw] = row;
  const el = shell("sit", host.tile(sp));
  const order = shuffle(optsRaw.map((o, k) => ({ o, k })));
  const rare = W[ans] && W[ans].rar && !S.kenz[ans];
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(t("whatSay"))}</span>${rare ? `<span class="tag rarehint">${ICON.sparkle}${esc(L(RAR[W[ans].rar]))}?</span>` : ""}</div>
    <div class="scene a2"><span class="medal" aria-hidden="true">${emo}</span><p class="scene-txt">${esc(L(prompt))}</p></div>
    <div class="opts a3">${order.map(({ o, k }) => `<button class="opt" data-k="${k}"><span class="d" lang="ary-Latn">${esc(o[0])}</span><span class="tr">${esc(triTr(o))}</span><span class="mk"></span></button>`).join("")}</div>
    <div class="fbx"></div>`;
  const card = { el, kind:"sit", done:false };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const b = e.target.closest(".opt"); if (!b || card.done) return;
    card.done = true; const ok = b.dataset.k === "0";
    markOptions(el, b, '.opt[data-k="0"]', ok);
    const wd = W[ans];
    if (wd) { if (wd.rar) { if (ok) discover(ans, b); else if (S.words[ans]) grade(ans, false); } else grade(ans, ok); }
    host.resolve(card, ok, { fromEl:b, base:4, right:optsRaw[0][0], rightTr:triTr(optsRaw[0]), say:optsRaw[0][0], showRight:true });
  });
  return card;
}

/* ---------- feed-only cards ---------- */
function exReel(sp, host) {
  const row = REELS.find((r) => r[0] === sp.id) || pick(REELS);
  sp.id = row[0];
  const [, tileCls, title, slides, coll] = row;
  const tile = { "t-cobalt":"majorelle", "t-rose":"rose", "t-emerald":"emerald", "t-teal":"teal", "t-saffron":"saffron", "t-fez":"pomegranate", "t-night":"night", "t-mint":"emerald" }[tileCls] || "majorelle";
  const el = shell("reel", tile);
  el.insertAdjacentHTML("afterbegin", `<div class="bars">${slides.map(() => "<i><b></b></i>").join("")}</div>`);
  const sayOf = (s) => (s[1] && !NO_SAY.has(s[1]) && Voice.has(s[1]) ? s[1] : null);
  $(".card-in", el).innerHTML = `
    <div class="kicker"><span class="tag solid">${esc(t("reel"))}</span><span class="tag">${esc(L(title))}</span></div>
    <div class="slides">${slides.map((s, k) => `<div class="slide${k === 0 ? " on" : ""}">${s[0] ? `<div class="emo" aria-hidden="true">${s[0]}</div>` : ""}${s[1] ? `<div class="word-row"><p class="sbig ${s[1].length <= 7 ? "s1" : s[1].length > 15 ? "s3" : ""}" lang="ary-Latn">${esc(s[1])}</p>${sayOf(s) ? sayBtn(s[1]) : ""}</div>` : ""}<p class="stxt">${esc(S.lang === "fr" ? s[3] : s[2])}</p>${k === slides.length - 1 ? `<div><button class="cta" data-act="done" style="margin-top:8px">${esc(t("gotIt"))}</button></div>` : ""}</div>`).join("")}</div>`;
  el.insertAdjacentHTML("beforeend", `<div class="tapzone l" data-act="prev"></div><div class="tapzone r" data-act="fwd"></div>`);
  const card = { el, kind:"reel", k:0, timer:0, finished:false };
  const bars = $$(".bars i", el), sl = $$(".slide", el);
  const MS = 4200;
  const show = (k) => {
    card.k = Math.max(0, Math.min(slides.length - 1, k));
    sl.forEach((s, j) => s.classList.toggle("on", j === card.k));
    bars.forEach((b, j) => { b.classList.toggle("past", j < card.k); b.classList.remove("now"); });
    void el.offsetWidth;
    if (bars[card.k]) bars[card.k].classList.add("now");
    const say = sayOf(slides[card.k]);
    if (say && host.isActive(card)) autoSay(say, "n", $$(".slide.on .say", el));
    schedule();
  };
  const schedule = () => {
    clearTimeout(card.timer);
    if (!host.isActive(card) || card.k >= slides.length - 1) { if (card.k >= slides.length - 1 && bars[card.k]) bars[card.k].classList.add("past"); return; }
    card.timer = setTimeout(() => { Sound.play("whoosh"); show(card.k + 1); }, MS);
  };
  const finish = (btn) => {
    if (card.finished) { host.next(card); return; }
    card.finished = true; S.stats.reels++;
    award(3, btn); Sound.play("good");
    const found = coll ? discover(coll, btn) : false;
    btn.textContent = t("next");
    setTimeout(() => { if (host.isActive(card) && $("#overlay").hidden && !Session.overlayQ.length) host.next(card); }, found ? 2300 : 1000);
  };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "done") { finish(b); return; }
    if (b.dataset.act === "prev") show(card.k - 1);
    if (b.dataset.act === "fwd") { if (card.k < slides.length - 1) { Sound.play("tap"); show(card.k + 1); } else { const d = $(".slide.on [data-act=done]", el); d && finish(d); } }
  });
  card.enter = () => { el.classList.remove("paused"); bars.forEach((b) => b.classList.remove("now")); show(card.k); };
  card.leave = () => { clearTimeout(card.timer); el.classList.add("paused"); };
  return card;
}
function exDialog(sp, host) {
  const d = DIALOGS.find((x) => x.id === sp.id) || DIALOGS[0];
  sp.id = d.id;
  const el = shell("dialog", d.tile);
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${ICON.chat}${esc(t("conv"))}</span></div>
    <h2 class="prompt-big a2">${esc(L(d.t))}</h2>
    <div class="dlg a3">${d.lines.map(([who, dar, en, fr], k) => `<div class="bub ${who}" data-say="${esc(dar)}" data-voice="${who === "A" ? "a" : "n"}" data-k="${k}" hidden><div><span class="who">${esc(L(d.who[who === "A" ? 0 : 1]))}</span><span class="d" lang="ary-Latn">${esc(dar)}</span><span class="t">${esc(S.lang === "fr" ? fr : en)}</span></div></div>`).join("")}</div>
    <div class="a4"><button class="ghost" data-act="replay">${ICON.speak}<span>${esc(t("playAll"))}</span></button></div>`;
  const card = { el, kind:"dialog", run:0, rewarded:false };
  const play = async () => {
    const tok = ++card.run;
    const bubs = $$(".bub", el);
    bubs.forEach((b) => (b.hidden = true));
    for (const b of bubs) {
      if (tok !== card.run || !host.isActive(card)) return;
      b.hidden = false;
      const said = (S.voiceAuto && Session.gesture) ? await Voice.play(b.dataset.say, { voice:b.dataset.voice, mark:[b] }) : false;
      if (tok !== card.run) return;
      await sleep(said ? 250 : 1500);
    }
    if (!card.rewarded) { card.rewarded = true; S.stats.dialogs++; award(3, $(".dlg", el)); }
  };
  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=replay]")) { Session.gesture = true; play(); } });
  card.enter = () => { if (!card.started) { card.started = true; play(); } };
  card.leave = () => { card.run++; Voice.stop(); $$(".bub", el).forEach((b) => (b.hidden = false)); };
  return card;
}
function exProverb(sp, host) {
  const p = PROVERBS.find((x) => x[0] === sp.id) || PROVERBS[0];
  sp.id = p[0];
  const el = shell("proverb", "night");
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${ICON.quote}${esc(t("proverb"))}</span></div>
    <div class="qmark a2" aria-hidden="true">“</div>
    <p class="proverb a2">${dj(p[1])}</p>
    <div class="a3">${sayBtn(p[1], "lg")}</div>
    <div class="pv-row a4"><b>${esc(t("literally"))}</b><span>${esc(S.lang === "fr" ? p[3] : p[2])}</span></div>
    <div class="pv-row a5"><b>${esc(t("means"))}</b><span>${esc(S.lang === "fr" ? p[5] : p[4])}</span></div>`;
  const card = { el, kind:"proverb", enter() { setTimeout(() => host.isActive(card) && autoSay(p[1], "n", $$(".proverb .dj", el)), 450); } };
  return card;
}
function rollMystery(first) {
  if (first && !S.kenz.bssa7a) return { kind:"kenz", id:"bssa7a" };
  const missing = COLL.filter((id) => !S.kenz[id] && !FG.reserved.has(id));
  const r = Math.random();
  if (r < 0.38 && missing.length) {
    const wts = { rare:6, epic:3, legend:1 };
    let tot = missing.reduce((a, id) => a + wts[W[id].rar], 0), x = Math.random() * tot;
    for (const id of missing) { x -= wts[W[id].rar]; if (x <= 0) return { kind:"kenz", id }; }
    return { kind:"kenz", id:missing[0] };
  }
  if (r < 0.6) return { kind:"boost", n:5 };
  if (r < 0.74 && S.shields < 2) return { kind:"shield" };
  return { kind:"xp", n:pick([10, 12, 15, 20]) };
}
const kenzCardHTML = (wd) => `<div class="tcard rar-${wd.rar}"><p class="rl">${esc(L(RAR[wd.rar]))}</p><p class="tw">${dj(wd.d)}</p><p class="ta" lang="ary">${esc(wd.ar)}</p><p class="tm">${esc(meaning(wd))}</p></div>`;
function exMystery(sp, host) {
  const el = shell("mystery", "night");
  el.insertAdjacentHTML("afterbegin", `<div class="glow"></div>`);
  $(".card-in", el).classList.add("center");
  $(".card-in", el).innerHTML = `
    <div class="kicker a1" style="justify-content:center"><span class="tag solid">${esc(t("mystery"))}</span></div>
    <button class="a2" data-act="open" aria-label="${esc(t("tapOpen"))}" style="display:grid;place-items:center">${chestArt()}</button>
    <div class="intro a3"><p class="r-title">${dj("Sandou9!")}</p><p class="r-sub" style="margin-top:6px">${esc(t("tapOpen"))}</p></div>
    <div class="reward" hidden></div>`;
  const card = { el, kind:"mystery", opened:false };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const b = e.target.closest("[data-act=open]"); if (!b || card.opened) return;
    card.opened = true; Session.interacted = true;
    const chest = $(".chest", el);
    chest.classList.add("wobble"); Sound.play("tick"); setTimeout(() => Sound.play("tick"), 160); setTimeout(() => Sound.play("tick"), 320);
    setTimeout(() => {
      chest.classList.remove("wobble"); chest.classList.add("open"); Sound.play("open");
      const ch = $(".kicker", el); if (ch) ch.style.visibility = "hidden";
      const c = centerOf(chest); FX.burst(c.x, c.y - 30, 60, 1.3);
      S.stats.boxes++;
      const rw = rollMystery(sp.first);
      const box = $(".reward", el); $(".intro", el).hidden = true;
      let html = "";
      if (rw.kind === "kenz") {
        S.kenz[rw.id] = today(); introduce(rw.id);
        html = kenzCardHTML(W[rw.id]) + `<p class="r-title">${esc(t("foundT"))}</p><p class="r-sub">${esc(L(W[rw.id].note || W[rw.id].lit || ["", ""]))}</p>`;
        setTimeout(() => { award(6, chest); autoSay(W[rw.id].d); }, 300);
      } else if (rw.kind === "boost") { S.boost = (S.boost || 0) + rw.n; renderCombo(); html = `<p class="r-title">${esc(t("boostT"))}</p><p class="r-sub">${esc(t("boostS"))}</p>`; }
      else if (rw.kind === "shield") { S.shields = Math.min(2, (S.shields || 0) + 1); html = `<div style="width:80px;height:80px;color:#5AB0FF">${ICON.shield}</div><p class="r-title">${esc(t("shieldT"))}</p><p class="r-sub">${esc(t("shieldS", { n:S.shields }))}</p>`; }
      else { html = `<p class="r-title">${esc(t("xpT", { n:rw.n }))}</p><p class="r-sub">${esc(t("xpS"))}</p>`; setTimeout(() => award(rw.n, chest), 300); }
      box.innerHTML = html + nextBtnHTML(); box.hidden = false;
      persist();
    }, 650);
  });
  return card;
}
function exDrop(sp, host) {
  const wd = W[sp.w];
  const el = shell("drop", "night");
  el.insertAdjacentHTML("afterbegin", `<div class="glow"></div>`);
  $(".card-in", el).classList.add("center");
  $(".card-in", el).innerHTML = `
    <div class="kicker a1" style="justify-content:center"><span class="tag solid">${ICON.sparkle}${esc(t("rareDrop"))}</span></div>
    <button class="flip rar-${wd.rar} a2" data-act="flip" aria-label="${esc(t("tapFlip"))}">
      <span class="flip-in"><span class="face back"><span class="shimmer"></span><span class="q">?</span></span>
      <span class="face front"><span style="display:grid;gap:6px;text-align:left"><span style="font:700 11.5px/1 var(--font-ui);letter-spacing:.06em;color:var(--rc-ink)">${esc(L(RAR[wd.rar]))}</span><span style="font:620 34px/1 var(--font-display);font-variation-settings:'SOFT' 100,'opsz' 72" lang="ary-Latn">${esc(wd.d)}</span><span style="font:700 26px/1.35 var(--font-ar);color:#6A4A18;direction:rtl;text-align:left" lang="ary">${esc(wd.ar)}</span><span style="font:500 16px/1.3 var(--font-ui)">${esc(meaning(wd))}</span>${wd.lit || wd.note ? `<span style="font:400 13.5px/1.35 var(--font-ui);color:#544D7C">${esc(L(wd.lit || wd.note))}</span>` : ""}</span></span></span>
    </button>
    <p class="r-sub a3 hint">${esc(t("tapFlip"))}</p>`;
  const card = { el, kind:"drop", open:false };
  el.addEventListener("click", (e) => {
    if (e.target.closest("[data-act=next]")) { host.next(card); return; }
    const f = e.target.closest("[data-act=flip]"); if (!f || card.open) return;
    card.open = true; Sound.play("flip"); Session.interacted = true;
    f.classList.add("open");
    setTimeout(() => {
      const c = centerOf(f); FX.burst(c.x, c.y, 50, 1.2); Sound.play("open");
      S.kenz[wd.id] = today(); introduce(wd.id); S.stats.drops++;
      award({ rare:6, epic:9, legend:14 }[wd.rar], f);
      setTimeout(() => autoSay(wd.d), 400);
      $(".hint", el).outerHTML = `<div class="row-btns">${sayBtn(wd.d)}${nextBtnHTML()}</div>`;
      persist();
    }, 520);
  });
  return card;
}
function exLightning(sp, host) {
  const el = shell("lightning", "night");
  const ids = shuffle(learnedIds().filter((id) => !W[id].rar)).slice(0, 8);
  const N = ids.length, SECS = 20;
  const qs = ids.map((id) => {
    const truth = Math.random() < 0.5; let shown = meaning(W[id]);
    if (!truth) { const others = CORE.filter((x) => x !== id && !(W[id].grp && W[x].grp === W[id].grp) && meaning(W[x]) !== shown); shown = meaning(W[pick(others)]); }
    return { id, truth, shown };
  });
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${ICON.bolt}${esc(t("lightning"))}</span></div>
    <div class="l-intro a2" style="display:grid;gap:14px"><div class="bolt">${ICON.bolt}</div><p class="r-title">${esc(t("lightning"))}</p><p class="r-sub">${esc(t("lightningS", { n:N, s:SECS }))}</p><div><button class="cta" data-act="go">${ICON.bolt}<span>${esc(t("start"))}</span></button></div></div>
    <div class="l-game" hidden style="display:grid;gap:14px"><div class="timer"><i></i></div><p class="lstate"><span class="cnt"></span><span class="sc"></span></p><div class="lq"><p class="w" lang="ary-Latn"></p><p class="m"></p></div>
      <div class="tf"><button class="yes" data-act="t">${ICON.check}<span>${esc(t("tru"))}</span></button><button class="no" data-act="f">${ICON.x}<span>${esc(t("fal"))}</span></button></div></div>
    <div class="l-end2" hidden style="display:grid;gap:12px"></div>`;
  const card = { el, kind:"lightning", k:0, score:0, running:false, t0:0, raf:0, ended:false };
  const game = $(".l-game", el), bar = $(".timer i", el);
  const render = () => { const q = qs[card.k]; $(".w", el).textContent = W[q.id].d; $(".m", el).textContent = "= " + q.shown; $(".cnt", el).textContent = (card.k + 1) + " / " + N; $(".sc", el).textContent = card.score + " ✓"; if (S.voiceAuto) Voice.play(W[q.id].d); };
  const tick = () => { if (!card.running) return; const s = (performance.now() - card.t0) / 1000; bar.style.transform = `scaleX(${Math.max(0, 1 - s / SECS)})`; if (s >= SECS) { end(true); return; } card.raf = requestAnimationFrame(tick); };
  const end = (timeout) => {
    if (card.ended) return;
    card.ended = true; card.running = false; cancelAnimationFrame(card.raf); game.hidden = true;
    const perfect = card.score === N; S.stats.lightning++;
    const box = $(".l-end2", el);
    box.innerHTML = `<div class="bolt">${ICON.bolt}</div><p class="r-title">${esc(perfect ? t("perfect") : timeout && card.k < N ? t("timeUp") : t("score", { a:card.score, b:N }))}</p><p class="r-sub">${esc(t("score", { a:card.score, b:N }))}</p>` + nextBtnHTML();
    box.hidden = false;
    const gain = card.score + (perfect ? 5 : 0);
    if (gain) award(gain, $(".bolt", box));
    if (perfect) { const c = centerOf($(".bolt", box)); FX.burst(c.x, c.y, 60, 1.3); Sound.play("level"); }
    persist();
  };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "next") { host.next(card); return; }
    if (b.dataset.act === "go") { $(".l-intro", el).hidden = true; game.hidden = false; card.running = true; card.t0 = performance.now(); Session.interacted = true; render(); tick(); return; }
    if ((b.dataset.act === "t" || b.dataset.act === "f") && card.running) {
      const q = qs[card.k]; const ok = (b.dataset.act === "t") === q.truth;
      if (ok) { card.score++; combo++; Sound.play("good"); S.stats.correct++; dayRec().c++; }
      else { combo = 0; Sound.play("bad"); S.stats.wrong++; dayRec().w++; grade(q.id, false); game.classList.remove("shake"); void game.offsetWidth; game.classList.add("shake"); }
      S.stats.bestCombo = Math.max(S.stats.bestCombo, combo); renderCombo();
      card.k++; if (card.k >= N) end(false); else render();
    }
  });
  card.leave = () => { if (card.running) { card.pausedAt = performance.now(); card.running = false; cancelAnimationFrame(card.raf); } };
  card.enter = () => { if (card.pausedAt && !card.ended) { card.t0 += performance.now() - card.pausedAt; card.pausedAt = 0; card.running = true; tick(); } };
  return card;
}
function exHaggle(sp, host) {
  const it = HAGGLE.find((h) => h.id === sp.item) || HAGGLE[0];
  sp.item = it.id;
  const el = shell("haggle", "pomegranate");
  const fr = S.lang === "fr", itName = fr ? it.fr : it.en;
  const { offer, rounds } = haggleRounds(it);
  $(".card-in", el).style.justifyContent = "flex-start";
  $(".card-in", el).innerHTML = `
    <div class="h-head a1">${vendorFace()}<div><b>${esc(t("vendor"))}</b><span>${esc(t("haggleK"))}</span></div></div>
    <div class="h-item a2">${ITEM_ART[it.id]}<div class="price"><p class="was"></p><p class="p"><span class="num">${it.start}</span><small>DH</small></p></div></div>
    <div class="h-start a3"><div class="bub A" data-say="${esc(HAGGLE_OPEN[0])}" data-voice="v" style="animation:none"><div><span class="d" lang="ary-Latn">${esc(HAGGLE_OPEN[0])}</span><span class="t">${esc(fr ? HAGGLE_OPEN[2] : HAGGLE_OPEN[1])}</span></div></div><p class="prompt-big">${esc(t("haggleS"))}</p><div><button class="cta" data-act="begin">${esc(t("start2"))}</button></div></div>
    <div class="chat" hidden></div>
    <div class="h-opts" hidden></div>
    <div class="result" hidden></div>`;
  const card = { el, kind:"haggle", price:it.start, round:0, over:false, busy:false };
  const chat = $(".chat", el), optsBox = $(".h-opts", el), num = $(".num", el), was = $(".was", el);
  const maxMsgs = () => (el.clientHeight < (host.mode === "lesson" ? 860 : 760) ? 2 : 3);
  const setPrice = (p) => {
    const from = card.price; card.price = p; if (p < from) was.textContent = from + " DH";
    const t0 = performance.now(), dur = reduced ? 1 : 650;
    const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); num.textContent = Math.round(from + (p - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    step(); if (p < from) Sound.play("coin");
  };
  const say = (who, tri) => {
    const m = document.createElement("div"); m.className = "bub " + (who === "v" ? "A" : "B");
    m.dataset.say = tri[0]; m.dataset.voice = who === "v" ? "v" : "n";
    m.innerHTML = `<div><span class="d" lang="ary-Latn">${esc(tri[0])}</span><span class="t">${esc(fr ? tri[2] : tri[1])}</span></div>`;
    chat.appendChild(m);
    while (chat.children.length > maxMsgs()) chat.firstElementChild.remove();
    return m;
  };
  const vendor = (tri, cb) => {
    const ty = document.createElement("div"); ty.className = "typing"; ty.innerHTML = "<i></i><i></i><i></i>"; chat.appendChild(ty);
    while (chat.children.length > maxMsgs()) chat.firstElementChild.remove();
    setTimeout(async () => { ty.remove(); const m = say("v", tri); cb && cb(); if (S.voiceAuto) Voice.play(tri[0], { voice:"v", mark:[m] }); }, reduced ? 200 : 750);
  };
  const showOpts = () => {
    const R = rounds[card.round];
    optsBox.innerHTML = shuffle(R.o.map((o, k) => ({ o, k }))).map(({ o, k }) => `<button class="opt" data-k="${k}"><span class="d" lang="ary-Latn">${esc(o.d[0])}</span><span style="font:400 13px/1.3 var(--font-ui);opacity:.8">${esc(fr ? o.d[2] : o.d[1])}</span></button>`).join("");
    optsBox.hidden = false;
  };
  const finish = () => {
    card.over = true; optsBox.hidden = true; S.stats.haggles++;
    const ratio = card.price / it.start, stars = ratio <= 0.5 ? 3 : ratio <= 0.72 ? 2 : 1;
    if (!S.stats.bestDeal || ratio < S.stats.bestDeal.ratio) S.stats.bestDeal = { ratio, item:it.id, price:card.price, start:it.start };
    card.stars = stars;
    const res = $(".result", el);
    res.innerHTML = `<div class="stars">${[1, 2, 3].map((k) => ICON.star.replace("<svg", `<svg class="${k <= stars ? "on" : ""}"`)).join("")}</div>
      <p class="r-title">${esc(t("deal"))} ${card.price} DH</p><p class="r-sub">${esc(t(stars === 3 ? "stars3" : stars === 2 ? "stars2" : "stars1"))}</p>
      ${card.price < it.start ? `<p class="r-sub" style="color:var(--tx);font-weight:600">${esc(t("savedDH", { x:it.start - card.price }))}</p>` : ""}
      <div class="row-btns">${stars >= 2 && host.mode === "feed" ? `<button class="ghost" data-act="share">${ICON.share}<span>${esc(Caps.downloads ? t("saveImg") : t("share"))}</span></button>` : ""}${host.mode === "feed" ? nextBtnHTML() : ""}</div>`;
    res.hidden = false; chat.hidden = true;
    if (host.mode === "feed") award(5 + stars * 5, res);
    if (stars >= 2) { const c = centerOf(res); FX.burst(c.x, c.y - 60, stars === 3 ? 70 : 40, 1.2); }
    Sound.play(stars === 3 ? "level" : "good");
    persist();
    if (host.mode === "lesson") setTimeout(() => host.resolve(card, true, { haggle:true, stars, base:5 + stars * 5, fromEl:res }), 900);
  };
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act],.opt"); if (!b) return;
    if (b.dataset.act === "next") { host.next(card); return; }
    if (b.dataset.act === "share") { shareThing({ kind:"haggle", itemName:itName, start:it.start, final:card.price, item:it.id }); return; }
    if (b.dataset.act === "begin") { Session.interacted = true; $(".h-start", el).remove(); chat.hidden = false; vendor(rounds[0].v(card.price), showOpts); return; }
    if (!b.classList.contains("opt") || card.over || card.busy) return;
    card.busy = true;
    const o = rounds[card.round].o[+b.dataset.k];
    optsBox.hidden = true;
    const m = say("u", o.d); Sound.play("tap");
    if (S.voiceAuto) Voice.play(o.d[0], { mark:[m] });
    const np = hagglePrice(card.price, offer, o);
    setTimeout(() => {
      vendor(o.r(np), () => {
        if (np !== card.price) setPrice(np);
        card.busy = false;
        if (o.accept || o.counter || o.final || card.round >= 2) { setTimeout(finish, 1400); return; }
        card.round++;
        setTimeout(() => vendor(rounds[card.round].v(card.price), showOpts), 1500);
      });
    }, 900);
  });
  return card;
}
function exComeback(sp, host) {
  const el = shell("comeback", "majorelle");
  const st = shownStreak(), due = dueWords().length;
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(t("comebackK"))}</span></div>
    <div class="a2" style="display:flex;align-items:center;gap:14px"><div style="width:64px;height:76px">${flameSVG()}</div><h2 class="word">${esc(t("dayN", { n:Math.max(1, S.dayCount || 1) }))}</h2></div>
    <p class="mean a3">${esc(due ? t("comebackS", { n:due }) : st > 0 ? t("comebackS0") : t("comebackNew"))}</p>
    <div class="a4" style="display:flex;gap:8px;flex-wrap:wrap">${st > 0 ? `<span class="tag">${flameSVG().replace("<svg", '<svg style="width:14px;height:16px"')} ${st}</span>` : ""}${S.shields ? `<span class="tag">${ICON.shield} ${S.shields}</span>` : ""}</div>
    <p class="swipe-cue a5">${ICON.up}<span>${esc(t("swipe"))}</span></p>`;
  return { el, kind:"comeback", firstEnter() { FG.force = dueWords().slice(0, 6); if (FG.force.length) Feed.rebuildAhead(false); } };
}
function exNudge(sp, host) {
  const el = shell("nudge", "majorelle");
  $(".card-in", el).innerHTML = `
    <div class="kicker a1"><span class="tag solid">${esc(t("feed"))}</span></div>
    <div class="a2">${mascot("happy", "bob")}</div>
    <h2 class="prompt-big a3">${esc(t("startLesson1"))}</h2>
    <p class="mean a4" style="font-size:17px;color:var(--tx-soft)">${esc(t("feedLocked"))}</p>
    <div class="a5" style="display:flex;gap:10px;flex-wrap:wrap"><button class="cta" data-act="go">${esc(t("start"))}</button></div>
    <p class="swipe-cue a6">${ICON.up}<span>${esc(t("swipe"))}</span></p>`;
  $(".mc", el).style.width = "110px";
  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=go]")) { setView("learn"); const i = currentNode(); if (i >= 0) Lesson.open(PATH[i]); } });
  return { el, kind:"nudge" };
}
const BUILDERS = { learn:exLearn, spot:exLearn, pick:exPick, rev:exRev, listen:exListen, match:exMatch, build:exBuild, sit:exSit, reel:exReel, dialog:exDialog, proverb:exProverb, mystery:exMystery, drop:exDrop, lightning:exLightning, haggle:exHaggle, comeback:exComeback, nudge:exNudge };
function makeEx(sp, host) { const f = BUILDERS[sp.t] || exReel; return f(sp, host); }

/* =========================================================
   LESSONS
   ========================================================= */
const unitOf = (node) => UNITS[node.unit];
const firstFree = (pool, n) => shuffle(pool).slice(0, n);
function lessonSpecs(node) {
  if (node.kind === "boss") return [{ t:"haggle", item:pick(HAGGLE).id, boss:true }];
  const words = node.words.slice();
  const known = learnedIds().filter((id) => !words.includes(id) && !W[id].rar);
  const seq = [];
  const buildFor = (ws) => { const c = BUILDS.filter((b) => ws.includes(b[5])); return c.length ? pick(c)[0] : null; };
  const sitFor = (ws) => { const c = SITS.filter((s) => ws.includes(s[3])); return c.length ? pick(c)[0] : null; };
  if (node.kind === "lesson" || node.kind === "practice") {
    if (node.kind === "lesson") {
      words.forEach((w, k) => {
        seq.push({ t:"learn", w });
        seq.push(k % 2 === 0 ? { t:"pick", w, easy:k === 0 } : { t:"listen", w });
        if (k >= 1) seq.push({ t:"rev", w:words[k - 1] });
      });
    } else words.forEach((w, k) => seq.push({ t:["pick", "rev", "listen"][k % 3], w, review:true }));
    const m = words.concat(firstFree(known, Math.max(0, 4 - words.length))).slice(0, 5);
    if (m.length >= 3) seq.push({ t:"match", words:m });
    seq.push({ t:"listen", w:words[words.length - 1], sub:"mean" });
    const b = buildFor(words); if (b) seq.push({ t:"build", id:b });
    const s = sitFor(words); if (s) seq.push({ t:"sit", id:s });
    if (known.length) seq.push({ t:pick(["pick", "listen"]), w:pick(known), review:true });
    seq.push({ t:"rev", w:words[0] });
    return seq;
  }
  // unit review
  const ws = shuffle(words);
  ws.slice(0, 7).forEach((w, k) => seq.push({ t:["listen", "rev", "pick", "listen"][k % 4], w, sub:k === 3 ? "mean" : undefined }));
  seq.splice(3, 0, { t:"match", words:ws.slice(0, 5) });
  const b = buildFor(words); if (b) seq.push({ t:"build", id:b });
  const s = sitFor(words); if (s) seq.splice(6, 0, { t:"sit", id:s });
  seq.push({ t:"match", words:ws.slice(5, 10).length >= 3 ? ws.slice(5, 10) : ws.slice(0, 4) });
  return seq;
}
const LessonHost = {
  mode:"lesson",
  tile() { return Lesson.tile; },
  pool() { return Lesson.pool; },
  isActive(card) { return Lesson.active && Lesson.card === card; },
  resolve(card, ok, info) { Lesson.answer(card, ok, info); },
  next() { Lesson.advance(); },
};
const Lesson = {
  active:false, node:null, specs:[], i:0, card:null, tile:"majorelle", pool:[], st:null,
  open(node) {
    Voice.stop();
    this.node = node; this.active = true;
    this.tile = node.kind === "practice" ? "night" : node.kind === "boss" ? "pomegranate" : unitOf(node).tile;
    this.specs = lessonSpecs(node);
    this.total0 = this.specs.length; this.i = 0; this.retried = new Set();
    this.pool = [...new Set((node.words || []).concat(learnedIds().filter((id) => !W[id].rar)))];
    this.st = { right:0, wrong:0, xp:0, t0:Date.now() };
    combo = 0;
    const el = $("#lesson");
    el.className = "lesson j-" + this.tile;
    el.innerHTML = `<div class="l-top"><button class="l-x" data-act="quit" aria-label="${esc(t("quit"))}">${ICON.x}</button><div class="l-bar" id="l-bar"><i></i></div><div class="l-combo" id="l-combo" hidden></div></div>
      <div class="l-body"></div><div class="l-foot" hidden></div>
      <div class="l-confirm" hidden><div class="box"><p>${esc(t("quitQ"))}</p><button class="cta block" data-act="stay">${esc(t("keepLearning"))}</button><button class="btn-bad" data-act="leave">${esc(t("leave"))}</button></div></div>`;
    el.hidden = false;
    el.onclick = (e) => {
      const a = e.target.closest("[data-act]"); if (!a) return;
      if (a.dataset.act === "quit") { $(".l-confirm", el).hidden = false; }
      else if (a.dataset.act === "stay") { $(".l-confirm", el).hidden = true; }
      else if (a.dataset.act === "leave") { this.close(false); }
      else if (a.dataset.act === "cont") { this.advance(); }
      else if (a.dataset.act === "finish") { this.close(true); }
    };
    $("#desk-nav").hidden = true;
    this.show();
  },
  progress() { const done = this.i, left = this.specs.length - this.i; $("#l-bar i").style.width = (100 * done / Math.max(1, done + left)).toFixed(1) + "%"; },
  show() {
    const body = $("#lesson .l-body");
    if (this.card) { this.card.leave && this.card.leave(); this.card.el.remove(); }
    const sp = this.specs[this.i];
    const card = makeEx(sp, LessonHost);
    this.card = card;
    card.el.classList.add("play", "is-active");
    body.appendChild(card.el);
    card.firstEnter && card.firstEnter();
    card.enter && card.enter();
    this.progress();
    const foot = $("#lesson .l-foot");
    if (sp.t === "learn") { foot.innerHTML = `<button class="cta block" data-act="cont">${esc(t("continueL"))}</button>`; foot.hidden = false; }
    else { foot.innerHTML = ""; foot.hidden = true; }
    $("#lesson").classList.toggle("nofoot", sp.t === "haggle");
  },
  answer(card, ok, info) {
    if (card !== this.card) return;
    if (ok) this.st.right++; else this.st.wrong++;
    const xp = hit(ok, info.fromEl, info.base ?? 3, { to:$("#l-bar") });
    this.st.xp += xp;
    if (!ok && !this.retried.has(this.i) && this.specs[this.i].t !== "haggle") { this.retried.add(this.i); this.specs.push(Object.assign({}, this.specs[this.i], { retry:true })); }
    card.el.classList.add("answered");
    if (info.haggle) { this.advance(); return; }
    const foot = $("#lesson .l-foot");
    foot.hidden = true;
    const holder = document.createElement("div");
    holder.innerHTML = bannerHTML(ok, info, false);
    const banner = holder.firstElementChild;
    banner.insertAdjacentHTML("beforeend", `<button class="cta" data-act="cont">${esc(t("continueL"))}</button>`);
    $("#lesson").appendChild(banner);
    this.banner = banner;
    if (info.say && !info.noAuto) setTimeout(() => this.card === card && autoSay(info.say, info.voice), ok ? 200 : 350);
    setTimeout(() => { const c = $(".cta", banner); c && c.focus({ preventScroll:true }); }, 60);
  },
  advance() {
    if (this.banner) { this.banner.remove(); this.banner = null; }
    Voice.stop();
    this.i++;
    if (this.i >= this.specs.length) this.finish(); else this.show();
  },
  finish() {
    const st = this.st, n = st.right + st.wrong;
    const acc = n ? st.right / n : 1;
    const isBoss = this.node.kind === "boss";
    const stars = isBoss ? (this.card && this.card.stars) || 1 : acc >= 0.95 ? 3 : acc >= 0.75 ? 2 : 1;
    const perfect = !isBoss && st.wrong === 0;
    const bonus = 10 + (perfect ? 5 : 0);
    if (this.card) { this.card.leave && this.card.leave(); this.card.el.remove(); this.card = null; }
    const nodeId = this.node.id;
    const prevUnitDone = this.node.kind !== "practice" && PATH.filter((p) => p.unit === this.node.unit).every((p) => S.lessons[p.id]);
    if (this.node.kind !== "practice") {
      const prev = S.lessons[nodeId];
      S.lessons[nodeId] = { stars:Math.max(stars, prev ? prev.stars : 0), done:today(), n:(prev ? prev.n : 0) + 1 };
    }
    S.stats.lessons++;
    this.progress(); $("#l-bar i").style.width = "100%";
    const secs = Math.round((Date.now() - st.t0) / 1000);
    const el = shell("end", this.tile);
    el.style.position = "absolute"; el.style.inset = "0";
    el.innerHTML = ARCH + `<div class="l-end"><div>${mascot(perfect || stars === 3 ? "happy" : "wink", "hop")}</div><h2>${esc(perfect ? t("perfectL") : t("lessonDone"))}</h2>
      <div class="stars">${[1, 2, 3].map((k) => ICON.star.replace("<svg", `<svg class="${k <= stars ? "on" : ""}"`)).join("")}</div>
      <div class="l-stats"><div><b class="xpv">${st.xp + bonus}</b><span>${esc(t("xpL"))}</span></div><div><b>${Math.round(acc * 100)}%</b><span>${esc(t("accuracy"))}</span></div><div><b>${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}</b><span>${esc(t("timeL"))}</span></div></div></div>`;
    $("#lesson .l-body").appendChild(el);
    const foot = $("#lesson .l-foot"); foot.innerHTML = `<button class="cta block" data-act="finish">${esc(t("continueL"))}</button>`; foot.hidden = false;
    Sound.play("level"); setTimeout(() => FX.rain(perfect ? 110 : 70), 150);
    award(bonus, $(".xpv", el), { silent:true });
    this.justDone = nodeId;
    const unitNowDone = this.node.kind !== "practice" && PATH.filter((p) => p.unit === this.node.unit).every((p) => S.lessons[p.id]);
    if (unitNowDone && !prevUnitDone && UNITS[this.node.unit + 1]) Session.overlayQ.push({ kind:"unit", unit:this.node.unit + 1 });
    persist();
  },
  close(completed) {
    Voice.stop();
    if (this.card) { this.card.leave && this.card.leave(); this.card = null; }
    if (this.banner) { this.banner.remove(); this.banner = null; }
    const el = $("#lesson"); el.hidden = true; el.innerHTML = "";
    this.active = false; combo = 0; renderCombo();
    refreshHUD(); renderLearn(completed ? this.justDone : null);
    $("#desk-nav").hidden = view !== "feed";
    if (Session.overlayQ.length) { clearTimeout(Session.ovTimer); Session.ovTimer = setTimeout(nextOverlay, 500); }
  },
};

/* =========================================================
   FEED
   ========================================================= */
const FeedHost = {
  mode:"feed",
  tile(sp) { return { learn:"majorelle", spot:"majorelle", pick:"saffron", rev:"emerald", listen:"night", match:"plum", build:"teal", sit:"rose" }[sp.t] || "majorelle"; },
  pool() { return learnedIds().filter((id) => !W[id].rar); },
  isActive(card) { return view === "feed" && Feed.cards[Feed.active] === card; },
  resolve(card, ok, info) {
    hit(ok, info.fromEl, info.base ?? 3);
    card.el.classList.add("answered");
    const fbx = $(".fbx", card.el);
    if (fbx) fbx.innerHTML = bannerHTML(ok, info, true);
    if (info.say && !info.noAuto) setTimeout(() => autoSay(info.say, info.voice), ok ? 150 : 300);
    else if (info.say && !ok) setTimeout(() => autoSay(info.say, info.voice), 300);
    if (ok) autoNext(card, info.say ? 1900 : 1300);
  },
  next() { Feed.next(); },
};
function autoNext(card, ms) { setTimeout(() => { if (FeedHost.isActive(card) && $("#overlay").hidden && !Session.overlayQ.length) Feed.next(); }, ms); }

const FG = {
  recent:[], last:{}, force:[], requeue:[], opener:[], reserved:new Set(),
  RULES:{
    pick:{ gap:2, w:3, min:3 }, rev:{ gap:2, w:3, min:3 }, listen:{ gap:3, w:3, min:3 }, spot:{ gap:5, w:2, min:2 }, match:{ gap:7, w:2, min:4 },
    build:{ gap:6, w:2, min:4 }, sit:{ gap:4, w:3 }, reel:{ gap:5, w:2 }, dialog:{ gap:6, w:2 }, proverb:{ gap:8, w:1 },
    mystery:{ gap:10, w:1, from:6 }, drop:{ gap:12, w:1, from:12 }, lightning:{ gap:14, w:1, min:6 }, haggle:{ gap:20, w:1, from:8 },
  },
  PRACTICE:new Set(["pick", "rev", "listen", "spot", "match", "build", "lightning"]),
  reset() { this.recent = []; this.last = {}; this.force = []; this.requeue = []; this.opener = []; this.reserved = new Set(); },
  since(type, i) { return this.last[type] == null ? 999 : i - this.last[type]; },
  freshest(ids, prefix) {
    const inUse = new Set(Feed.cards.filter((c) => !c.seen).map((c) => c.spec.id).filter(Boolean));
    const avail = ids.filter((id) => !inUse.has(id) && !this.recentIds().has(id));
    if (!avail.length) return null;
    avail.sort((a, b) => (S.shown[prefix + a] || 0) - (S.shown[prefix + b] || 0) || Math.random() - 0.5);
    return avail[0];
  },
  recentIds() { return new Set(Feed.cards.slice(-12).map((c) => c.spec.id).filter(Boolean)); },
  pickWord() {
    const recentW = new Set(Feed.cards.slice(-8).flatMap((c) => [c.spec.w].concat(c.spec.words || [])).filter(Boolean));
    const ids = learnedIds().filter((id) => !W[id].rar && !recentW.has(id));
    if (!ids.length) return null;
    const d = today();
    const due = ids.filter((id) => S.words[id].b >= 1 && S.words[id].due <= d);
    const src = due.length ? due : ids;
    src.sort((a, b) => S.words[a].b - S.words[b].b || (S.words[a].last || 0) - (S.words[b].last || 0));
    return pick(src.slice(0, 3));
  },
  specFor(type) {
    const known = learnedIds().filter((id) => !W[id].rar);
    switch (type) {
      case "pick": case "rev": case "spot": { const w = this.pickWord(); return w ? { t:type, w, review:type !== "spot" } : null; }
      case "listen": { const w = this.pickWord(); return w ? { t:"listen", w, sub:Math.random() < 0.4 ? "mean" : undefined } : null; }
      case "match": return known.length >= 4 ? { t:"match", words:shuffle(known).slice(0, 4) } : null;
      case "build": { const ok = BUILDS.filter((b) => S.words[b[5]]).map((b) => b[0]); const id = this.freshest(ok.length ? ok : BUILDS.map((b) => b[0]), "b:"); return id ? { t:"build", id } : null; }
      case "sit": { const id = this.freshest(SITS.map((s) => s[0]), "s:"); return id ? { t:"sit", id } : null; }
      case "reel": { const id = this.freshest(REELS.map((r) => r[0]), "r:"); return id ? { t:"reel", id } : null; }
      case "dialog": { const id = this.freshest(DIALOGS.map((d) => d.id), "d:"); return id ? { t:"dialog", id } : null; }
      case "proverb": { const id = this.freshest(PROVERBS.map((p) => p[0]), "p:"); return id ? { t:"proverb", id } : null; }
      case "mystery": return { t:"mystery" };
      case "drop": { const m = COLL.filter((id) => !S.kenz[id] && !this.reserved.has(id)); if (!m.length) return null; const w = pick(m); this.reserved.add(w); return { t:"drop", w }; }
      case "lightning": return known.length >= 6 ? { t:"lightning" } : null;
      case "haggle": { const id = this.freshest(HAGGLE.map((h) => h.id), "h:"); return { t:"haggle", item:id || pick(HAGGLE).id, id:id || undefined }; }
    }
    return null;
  },
  next() {
    const i = Feed.cards.length;
    let sp = null;
    if (this.force.length && !this.lastTwoPractice()) { const w = this.force.shift(); sp = { t:pick(["pick", "rev", "listen"]), w, review:true }; }
    if (!sp && this.requeue.length) sp = this.requeue.shift();
    if (!sp && this.opener.length) sp = this.opener.shift();
    if (!sp) sp = this.choose(i);
    this.recent.push(sp.t); if (this.recent.length > 10) this.recent.shift();
    this.last[sp.t] = i;
    return sp;
  },
  lastTwoPractice() { const r = this.recent; return r.length >= 2 && this.PRACTICE.has(r[r.length - 1]) && this.PRACTICE.has(r[r.length - 2]); },
  lastTwoCulture() { const r = this.recent; return r.length >= 2 && !this.PRACTICE.has(r[r.length - 1]) && !this.PRACTICE.has(r[r.length - 2]); },
  choose(i) {
    const known = learnedIds().filter((id) => !W[id].rar).length;
    const sinceSurprise = Math.min(this.since("mystery", i), this.since("drop", i), this.since("haggle", i));
    if (i >= 6 && sinceSurprise >= 13) { const s = (i >= 12 && Math.random() < 0.4 && this.specFor("drop")) || this.specFor("mystery"); if (s) return s; }
    const lastT = this.recent[this.recent.length - 1];
    const cand = [];
    for (const [type, r] of Object.entries(this.RULES)) {
      if (type === lastT) continue;
      if (this.since(type, i) < r.gap) continue;
      if (r.from && i < r.from) continue;
      if (r.min && known < r.min) continue;
      let w = r.w;
      if (this.PRACTICE.has(type) && this.lastTwoPractice()) continue;
      if (this.PRACTICE.has(type) && this.lastTwoCulture()) w *= 2.5;
      if (["mystery", "drop", "haggle", "lightning"].includes(type)) w *= 1;
      cand.push([type, w]);
    }
    for (let tries = 0; tries < 8 && cand.length; tries++) {
      const tot = cand.reduce((a, c) => a + c[1], 0); let x = Math.random() * tot, k = 0;
      for (; k < cand.length; k++) { x -= cand[k][1]; if (x <= 0) break; }
      k = Math.min(k, cand.length - 1);
      const sp = this.specFor(cand[k][0]);
      if (sp) return sp;
      cand.splice(k, 1);
    }
    return this.specFor("sit") || this.specFor("reel") || { t:"reel", id:pick(REELS)[0] };
  },
};
const Feed = {
  el:null, cards:[], active:-1, io:null, started:false,
  init() {
    this.el = $("#feed");
    this.io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting && e.intersectionRatio >= 0.6) this.setActive(+e.target.dataset.i); }, { root:this.el, threshold:[0.6] });
  },
  start() {
    if (this.started) return;
    this.started = true; this.restart();
  },
  restart() {
    this.cards.forEach((c) => { this.io.unobserve(c.el); c.el.remove(); });
    this.cards = []; this.active = -1; FG.reset();
    if (Session.newDay && learnedIds().length) FG.opener.push({ t:"comeback" });
    if (learnedIds().filter((id) => !W[id].rar).length < 3 && currentNode() >= 0) FG.opener.push({ t:"nudge" });
    this.el.scrollTop = 0;
    for (let k = 0; k < 4; k++) this.push();
  },
  push() {
    const sp = FG.next();
    const card = makeEx(sp, FeedHost);
    card.spec = sp; card.i = this.cards.length; card.seen = false;
    card.el.dataset.i = card.i;
    this.cards.push(card); this.el.appendChild(card.el); this.io.observe(card.el);
  },
  ensureAhead() { while (this.cards.length < this.active + 4) this.push(); },
  setActive(i) {
    if (view !== "feed" || i === this.active || !this.cards[i]) return;
    const prev = this.cards[this.active];
    if (prev) { prev.el.classList.remove("is-active"); prev.leave && prev.leave(); }
    Voice.stop();
    this.active = i;
    const c = this.cards[i];
    c.el.classList.add("is-active");
    if (!c.seen) {
      c.seen = true; if (this.booted) c.el.classList.add("play");
      S.stats.cards++; dayRec().n++;
      if (c.spec.t === "drop") FG.reserved.delete(c.spec.w);
      const pre = { reel:"r:", build:"b:", sit:"s:", dialog:"d:", proverb:"p:", haggle:"h:" }[c.spec.t];
      if (pre && (c.spec.id || c.spec.item)) S.shown[pre + (c.spec.id || c.spec.item)] = Date.now();
      c.firstEnter && c.firstEnter();
      persist();
    }
    c.enter && c.enter();
    this.booted = true;
    this.ensureAhead();
    if (Session.overlayQ.length && !Session.overlayOpen) { clearTimeout(Session.ovTimer); nextOverlay(); }
  },
  pause() { const c = this.cards[this.active]; c && c.leave && c.leave(); },
  resume() { const c = this.cards[this.active]; c && c.enter && c.enter(); },
  go(delta) { const c = this.cards[this.active + delta]; if (c) this.el.scrollTo({ top:c.el.offsetTop, behavior:reduced ? "auto" : "smooth" }); },
  next() { this.go(1); },
  rebuildAhead(keep = true, front = null) {
    const removed = [];
    for (let j = this.cards.length - 1; j > this.active; j--) {
      const c = this.cards[j]; if (c.seen) break;
      this.io.unobserve(c.el); c.el.remove(); this.cards.pop();
      if (c.spec.t === "drop") FG.reserved.delete(c.spec.w);
      removed.unshift(c.spec);
    }
    if (keep) FG.requeue = removed.concat(FG.requeue);
    if (front) FG.requeue.unshift(front);
    FG.recent = this.cards.map((c) => c.spec.t).slice(-10);
    this.ensureAhead();
  },
};

/* =========================================================
   VIEWS
   ========================================================= */
let view = "learn";
function currentNode() { return PATH.findIndex((n) => !S.lessons[n.id]); }
function nodeState(idx) { const n = PATH[idx]; if (S.lessons[n.id]) return "done"; return idx === currentNode() ? "current" : "locked"; }
function setView(k) {
  if (Lesson.active) return;
  if (view === "feed" && k !== "feed") Feed.pause();
  view = k;
  $$(".tab").forEach((b) => { b.classList.toggle("on", b.dataset.tab === k); b.setAttribute("aria-current", b.dataset.tab === k ? "page" : "false"); });
  for (const v of ["learn", "feed", "guide", "kenz", "me"]) { const el = $("#v-" + v); el.hidden = v !== k; }
  const el = $("#v-" + k); el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
  $("#desk-nav").hidden = k !== "feed";
  closeNodeSheet();
  Voice.stop();
  if (k === "learn") renderLearn();
  if (k === "feed") { if (!Feed.started) Feed.start(); else Feed.resume(); }
  if (k === "guide") renderGuide();
  if (k === "kenz") renderKenz();
  if (k === "me") renderMe();
  if (k !== "feed") el.scrollTop = 0;
}

// --- Learn path ---
const NODE_DX = [0, 52, 78, 52, 0, -52, -78, -52];
function nodeIcon(n, state) {
  if (state === "done") return ICON.check;
  if (state === "locked") return ICON.lock;
  if (n.kind === "review") return ICON.loop;
  if (n.kind === "boss") return ICON.tagI;
  return ICON.star;
}
function nodeTitle(n) {
  const u = unitOf(n);
  if (n.kind === "review") return t("review2");
  if (n.kind === "boss") return t("boss");
  const k = PATH.filter((p) => p.unit === n.unit && p.kind === "lesson").indexOf(n) + 1;
  return t("lesson", { n:k }) + (u ? "" : "");
}
function renderLearn(justDone) {
  const el = $("#v-learn");
  const cur = currentNode();
  const due = dueWords();
  const curNode = PATH[cur];
  let hero = "";
  if (curNode) {
    const u = unitOf(curNode);
    hero = `<div class="hero jewel j-${u.tile}">${ARCH}<small>${esc(t("unit", { n:curNode.unit + 1 }))}, ${esc(nodeTitle(curNode).toLowerCase())}</small>
      <h3>${dj(u.d)}</h3>
      <div class="chips">${curNode.words.slice(0, curNode.kind === "lesson" ? 4 : 6).map((id) => `<span class="chip">${esc(W[id].d)}${sayBtn(W[id].d)}</span>`).join("")}</div>
      <div><button class="cta" data-start="${cur}">${esc(cur === 0 && !S.stats.lessons ? t("start") : t("jump"))}${ICON.right}</button></div></div>`;
  } else hero = `<div class="path-end">${mascot("happy")}<p>${esc(t("comingSoon"))}</p></div>`;
  const practice = due.length ? `<button class="practice" data-act="practice"><span class="pi">${ICON.loop}</span><span><b>${esc(t("practiceDue", { n:due.length }))}</b><span>${esc(t("wordsLearnedN", { n:learnedIds().length }))}</span></span><span class="go">${ICON.right}</span></button>` : "";
  const units = UNITS.map((u, ui) => {
    const nodes = PATH.map((n, idx) => ({ n, idx })).filter((x) => x.n.unit === ui);
    const doneN = nodes.filter((x) => S.lessons[x.n.id]).length;
    const unitLocked = nodes.every((x) => nodeState(x.idx) === "locked");
    return `<section class="unit" id="unit-${ui}">
      <div class="u-head jewel j-${u.tile}${unitLocked ? " locked" : ""}"><div><small>${esc(t("unit", { n:ui + 1 }))}</small><h3>${dj(u.d)}</h3><p>${esc(L([u.en, u.fr]))}</p></div><div class="u-prog">${esc(t("unitDone", { a:doneN, b:nodes.length }))}</div></div>
      <div class="nodes">${nodes.map(({ n, idx }, k) => {
        const st = nodeState(idx), stars = S.lessons[n.id] ? S.lessons[n.id].stars : 0;
        return `<div class="node-row" style="--dx:${NODE_DX[(idx) % NODE_DX.length]}px">${st === "current" ? `<span class="tip">${esc(idx === 0 && !S.stats.lessons ? t("startHere") : t("start"))}</span>` : ""}
          <button class="node j-${u.tile} ${st}" data-node="${idx}" aria-label="${esc(nodeTitle(n))}, ${esc(st)}"><span class="inner"></span>${nodeIcon(n, st)}</button>
          <div class="node-stars">${st === "done" ? [1, 2, 3].map((s) => ICON.star.replace("<svg", `<svg class="${s <= stars ? "on" : ""}"`)).join("") : ""}</div></div>`;
      }).join("")}</div></section>`;
  }).join("");
  el.innerHTML = `<div class="scroll-pad path-wrap">${hero}${practice}${units}<div class="path-end">${mascot("wink")}<p>${esc(t("comingSoon"))}</p></div></div>`;
  if (justDone) {
    const idx = PATH.findIndex((p) => p.id === justDone);
    const nb = $(`.node[data-node="${idx}"]`, el), nc = $(`.node[data-node="${cur}"]`, el);
    if (nb && !reduced) nb.animate([{ transform:"scale(.6)" }, { transform:"scale(1.15)" }, { transform:"scale(1)" }], { duration:600, easing:"cubic-bezier(.3,1.5,.5,1)" });
    if (nc) setTimeout(() => nc.scrollIntoView({ block:"center", behavior:reduced ? "auto" : "smooth" }), 300);
  }
}
function openNodeSheet(idx) {
  const n = PATH[idx], u = unitOf(n), st = nodeState(idx);
  const sh = $("#nsheet");
  sh.className = `nsheet jewel j-${u.tile}`;
  const stars = S.lessons[n.id] ? S.lessons[n.id].stars : 0;
  sh.innerHTML = `<small>${esc(t("unit", { n:n.unit + 1 }))}, ${esc(nodeTitle(n).toLowerCase())}</small><h3>${n.kind === "lesson" ? n.words.map((id) => esc(W[id].d)).join(", ") : dj(u.d)}</h3>
    ${n.kind !== "boss" ? `<div class="chips">${n.words.slice(0, 8).map((id) => `<span class="chip">${esc(W[id].d)}${sayBtn(W[id].d)}</span>`).join("")}</div>` : `<p>${esc(t("haggleS"))}</p>`}
    ${st === "done" ? `<div class="stars" style="justify-content:flex-start">${[1, 2, 3].map((k) => ICON.star.replace("<svg", `<svg class="${k <= stars ? "on" : ""}"`)).join("")}</div>` : ""}
    ${st === "locked" ? `<p>${esc(t("locked"))}</p>` : `<button class="cta block" data-start="${idx}">${esc(st === "done" ? t("practiceAgain") : t("start"))}</button>`}`;
  sh.hidden = false; $("#sheet-scrim").hidden = false;
}
function closeNodeSheet() { $("#nsheet").hidden = true; $("#sheet-scrim").hidden = true; }

// --- Guide ---
let guideTab = "sounds", guideSound = "3", pbFilter = "all", pbQuery = "";
const SOUND_TILES = ["majorelle", "emerald", "pomegranate", "teal", "plum", "night", "rose", "saffron", "emerald", "majorelle"];
function renderGuide() {
  const el = $("#v-guide");
  const tabs = `<div class="seg" role="tablist">${["sounds", "rules", "phrasebook"].map((k) => `<button role="tab" aria-selected="${guideTab === k}" class="${guideTab === k ? "on" : ""}" data-gt="${k}">${esc(t(k))}</button>`).join("")}</div>`;
  let body = "";
  if (guideTab === "sounds") {
    const sIdx = SOUNDS.findIndex((s) => s.id === guideSound), s = SOUNDS[Math.max(0, sIdx)];
    body = `<p class="g-sub">${esc(t("soundsS"))}</p>
      <div class="gpanel jewel j-${SOUND_TILES[Math.max(0, sIdx)]}"><div class="gtop"><span class="gk" lang="ary-Latn">${esc(s.key)}</span><span class="ga" lang="ar">${esc(s.ar)}</span>${sayBtn(s.say, "lg")}</div>
        <h3>${esc(L(s.t))}</h3><p>${esc(L(s.how))}</p><p><b>${esc(t("soundsLike"))}:</b> ${esc(L(s.like))}</p>
        <div class="exlist">${s.ex.map((x) => { const wd = Object.values(W).find((w) => w.d === x); return `<div class="exrow"><div><p class="d">${dj(x)}</p>${wd ? `<p class="t">${esc(meaning(wd))}</p>` : ""}</div>${sayBtn(x, "sm")}</div>`; }).join("")}</div></div>
      <div class="sgrid" style="margin-top:12px">${SOUNDS.map((x, k) => `<button class="stile jewel j-${SOUND_TILES[k]}" data-snd="${esc(x.id)}" aria-pressed="${x.id === s.id}" style="${x.id === s.id ? "box-shadow:0 0 0 2px var(--gold),0 10px 24px rgba(0,0,0,.25)" : ""}"><span class="gk" lang="ary-Latn">${esc(x.key)}</span><span class="ga" lang="ar">${esc(x.ar)}</span><span class="gn">${esc(L(x.t))}</span></button>`).join("")}</div>`;
  } else if (guideTab === "rules") {
    body = `<p class="g-sub">${esc(t("rulesS"))}</p>` + RULES.map((r, k) => `<div class="rule${k === 0 ? " open" : ""}" data-rule="${r.id}"><button data-act="rule"><b>${esc(L(r.t))}</b>${ICON.down}</button>
      <div class="rb-body"><p>${esc(L(r.body))}</p><div class="exlist">${r.ex.map((x) => `<div class="exrow"><div><p class="d">${dj(x[0])}</p><p class="t">${esc(S.lang === "fr" ? x[2] : x[1])}</p></div>${sayBtn(x[0], "sm")}</div>`).join("")}</div></div></div>`).join("");
  } else {
    const q = pbQuery.trim().toLowerCase();
    const match = (wd) => !q || wd.d.toLowerCase().includes(q) || meaning(wd).toLowerCase().includes(q) || wd.ar.includes(q);
    const groups = UNITS.map((u, ui) => ({ title:t("unit", { n:ui + 1 }) + ": " + u.d, ids:u.words.filter((id) => match(W[id]) && (pbFilter === "all" || S.words[id])) }))
      .concat([{ title:t("kenzT"), ids:COLL.filter((id) => S.kenz[id] && match(W[id])) }]).filter((g) => g.ids.length);
    body = `<p class="g-sub">${esc(t("phraseS"))}</p>
      <label class="searchbox">${ICON.search}<input id="pb-q" type="search" placeholder="${esc(t("search"))}" value="${esc(pbQuery)}" autocomplete="off"></label>
      <div class="pb-tools"><div class="seg">${["all", "learned"].map((k) => `<button class="${pbFilter === k ? "on" : ""}" data-pbf="${k}">${esc(k === "all" ? t("allWords") : t("learnedOnly"))}</button>`).join("")}</div>${dueWords().length ? `<button class="ghost" data-act="practice">${ICON.loop}<span>${esc(t("practiceDue", { n:dueWords().length }))}</span></button>` : ""}</div>
      <div class="pb-list">${groups.length ? groups.map((g) => `<div class="pb-group"><h4>${esc(g.title)}</h4>${g.ids.map((id) => { const wd = W[id], has = !!S.words[id]; return `<div class="pbrow${has ? "" : " locked"}">${sayBtn(wd.d, "sm")}<span class="d">${dj(wd.d)}</span><span class="a" lang="ary">${esc(wd.ar)}</span><span class="m">${esc(meaning(wd))}</span></div>`; }).join("")}</div>`).join("") : `<div class="empty">${esc(t("noResults"))}</div>`}</div>`;
  }
  el.innerHTML = `<div class="scroll-pad"><div class="vh"><div><h2>${esc(t("guide"))}</h2></div></div>${tabs}${body}</div>`;
  const inp = $("#pb-q", el);
  if (inp) inp.addEventListener("input", () => { pbQuery = inp.value; const pos = inp.selectionStart; renderGuide(); const n = $("#pb-q"); n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} });
}
// --- Kenz ---
function renderKenz() {
  const el = $("#v-kenz");
  const got = COLL.filter((id) => S.kenz[id]).length;
  const order = { rare:0, epic:1, legend:2 };
  const ids = COLL.slice().sort((a, b) => order[W[a].rar] - order[W[b].rar]);
  el.innerHTML = `<div class="scroll-pad"><div class="vh"><div><h2>${esc(t("kenzT"))}</h2><p>${esc(t("kenzS"))}</p></div></div>
    <p style="font:600 14px/1 var(--font-ui)">${esc(t("found", { a:got, b:COLL.length }))}</p><div class="kprog"><i style="width:${((got / COLL.length) * 100).toFixed(1)}%"></i></div>
    <div class="kgrid">${ids.map((id) => { const wd = W[id], has = !!S.kenz[id]; return `<div class="kc rar-${wd.rar} ${has ? "got" : "miss"}"><p class="rl">${esc(L(RAR[wd.rar]))}</p>${has ? `${sayBtn(wd.d, "sm")}<div><p class="kw">${dj(wd.d)}</p><p class="ka" lang="ary">${esc(wd.ar)}</p></div><p class="km">${esc(meaning(wd))}</p>` : `<p class="kw">?</p><p class="km">${esc(t("hidden"))}</p>`}</div>`; }).join("")}</div></div>`;
}
// --- Me ---
function weekChart() {
  const days = [], d0 = today();
  for (let k = 6; k >= 0; k--) { const key = addDays(d0, -k); const [y, m, d] = key.split("-").map(Number); days.push({ key, xp:(S.days[key] || {}).xp || 0, dow:new Date(y, m - 1, d).getDay() }); }
  const max = Math.max(S.goal, ...days.map((x) => x.xp)) * 1.15;
  const Wc = 320, Hc = 150, top = 20, bot = 24, ph = Hc - top - bot, bw = 28, gapX = (Wc - 7 * bw) / 6;
  const gy = top + ph - (S.goal / max) * ph;
  const bars = days.map((x, i) => {
    const hgt = Math.max(3, (x.xp / max) * ph), xx = i * (bw + gapX), yy = top + ph - hgt, isT = i === 6;
    return `<rect x="${xx.toFixed(1)}" y="${yy.toFixed(1)}" width="${bw}" height="${hgt.toFixed(1)}" rx="7" style="fill:${isT ? "var(--gold)" : x.xp >= S.goal ? "var(--good)" : "var(--surface-3)"}"/>
      <text x="${(xx + bw / 2).toFixed(1)}" y="${Hc - 6}" text-anchor="middle" class="${isT ? "lbl" : ""}">${esc(UI[S.lang].daysShort[x.dow])}</text>
      ${isT || x.xp > 0 ? `<text x="${(xx + bw / 2).toFixed(1)}" y="${(yy - 6).toFixed(1)}" text-anchor="middle" class="${isT ? "lbl" : ""}">${x.xp}</text>` : ""}`;
  }).join("");
  return `<svg class="chart" viewBox="0 0 ${Wc} ${Hc}" width="100%" role="img" aria-label="${esc(t("week"))}"><line x1="0" x2="${Wc}" y1="${gy.toFixed(1)}" y2="${gy.toFixed(1)}" style="stroke:var(--fg-faint)" stroke-dasharray="4 4" stroke-width="1"/>${bars}</svg>`;
}
function renderMe() {
  const el = $("#v-me");
  const li2 = levelInfo(S.xp);
  const learned = learnedIds().length;
  const tot = S.stats.correct + S.stats.wrong;
  const acc = tot ? Math.round((S.stats.correct / tot) * 100) + "%" : "–";
  const bd = S.stats.bestDeal;
  el.innerHTML = `<div class="scroll-pad">
    <div class="me-top">${mascot("happy")}<div style="min-width:0;flex:1"><p class="sub" style="margin:0 0 4px">${esc(t("meLevel", { n:li2.n }))}</p><h2>${dj(li2.title)}</h2>
      <div class="lvlbar"><i style="width:${(li2.pct * 100).toFixed(1)}%"></i></div><p class="sub">${esc(t("xpToNext", { n:li2.nextAt - S.xp, l:li2.n + 1 }))}</p></div></div>
    <div class="stats"><div class="stat"><b>${shownStreak()}</b><span>${esc(t("stStreak"))}</span></div><div class="stat"><b>${S.best}</b><span>${esc(t("stBest"))}</span></div>
      <div class="stat"><b>${learned}</b><span>${esc(t("stWords"))}</span></div><div class="stat"><b>${acc}</b><span>${esc(t("stAcc"))}</span></div></div>
    <div class="panel"><h3>${esc(t("week"))}</h3>${weekChart()}</div>
    <div class="panel"><h3>${esc(t("bestDeal"))}</h3><p class="sub" style="margin:0">${bd ? esc(t("paid", { p:bd.price, s:bd.start })) : esc(t("none"))}</p></div>
    <div class="panel"><h3>${esc(t("settings"))}</h3>
      <div class="setrow"><span>${esc(t("lang"))}</span><div class="seg"><button data-lang="en" class="${S.lang === "en" ? "on" : ""}">English</button><button data-lang="fr" class="${S.lang === "fr" ? "on" : ""}">Français</button></div></div>
      <div class="setrow"><span>${esc(t("voiceAuto"))}</span><button class="switch" role="switch" id="sw-voice" aria-checked="${S.voiceAuto}" aria-label="${esc(t("voiceAuto"))}"></button></div>
      <div class="setrow"><span>${esc(t("sfx"))}</span><button class="switch" role="switch" id="sw-sound" aria-checked="${S.sound}" aria-label="${esc(t("sfx"))}"></button></div>
      <div class="setrow"><span>${esc(t("goalSet"))}</span><div class="seg">${[50, 100, 200].map((n) => `<button data-goal="${n}" class="${S.goal === n ? "on" : ""}">${n}</button>`).join("")}</div></div>
      <div class="setrow" style="display:block"><button class="danger" data-act="reset">${esc(t("reset"))}</button>
        <div class="confirm" hidden><p class="sub">${esc(t("resetQ"))}</p><div class="row-btns" style="justify-content:flex-start"><button class="btn-bad" data-act="erase">${esc(t("erase"))}</button><button class="btn-plain" data-act="cancel">${esc(t("cancel"))}</button></div></div></div>
    </div>
    <p class="foot">${esc(t("audioNote2"))}</p></div>`;
}

/* ---------- HUD + dock ---------- */
function refreshHUD() {
  const st = shownStreak();
  const sEl = $("#hud-streak");
  sEl.innerHTML = flameSVG() + `<b>${st}</b>`;
  sEl.classList.toggle("cold", !dayRec().goalMet);
  sEl.setAttribute("aria-label", st + " " + t("stStreak"));
  const rec = dayRec(), pct = Math.min(1, rec.xp / S.goal);
  const gEl = $("#hud-goal");
  gEl.innerHTML = teaGlass(pct, "gl") + `<span class="bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></span><b>${Math.min(rec.xp, 999)}/${S.goal}</b>`;
  gEl.classList.toggle("full", pct >= 1);
  gEl.setAttribute("aria-label", t("goalK") + ": " + rec.xp + "/" + S.goal + " XP");
  const li2 = levelInfo(S.xp), C = 2 * Math.PI * 17;
  $("#hud-lvl").innerHTML = `<svg viewBox="0 0 38 38" aria-hidden="true"><circle cx="19" cy="19" r="17" fill="none" style="stroke:rgba(255,255,255,.12)" stroke-width="3"/><circle cx="19" cy="19" r="17" fill="none" style="stroke:var(--gold);transition:stroke-dashoffset .6s" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${(C * (1 - li2.pct)).toFixed(2)}"/></svg><b>${li2.n}</b>`;
  $("#hud-lvl").setAttribute("aria-label", t("meLevel", { n:li2.n }) + ", " + li2.title);
  refreshTabs();
}
function refreshTabs() {
  for (const k of ["learn", "feed", "guide", "kenz", "me"]) {
    const b = $("#tab-" + k);
    b.innerHTML = ICON[k] + `<span>${esc(t(k))}</span>` + (k === "learn" ? `<i class="badge" ${dueWords().length ? "" : "hidden"}>${dueWords().length}</i>` : "");
  }
}

/* ---------- welcome ---------- */
function showWelcome(step = 1) {
  const el = $("#welcome");
  el.className = "welcome jewel j-majorelle";
  if (step === 1) {
    el.innerHTML = `<svg class="big-arch" viewBox="0 0 200 320" aria-hidden="true"><path d="M30 320V150A70 70 0 1 1 170 150V320" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M46 320V152A54 54 0 1 1 154 152V320" fill="none" stroke="currentColor" stroke-width=".8"/></svg>
      ${mascot("happy", "bob")}
      <div class="salam"><span class="word">${dj("Salam!")}</span><span class="arw">سلام</span>${sayBtn("Salam!")}</div>
      <h1>${esc(t("welcomeT"))}</h1><p>${esc(t("welcomeS"))}</p>
      <button class="cta block" data-w="next">${esc(t("getStarted"))}</button>`;
  } else {
    const g = [[50, "goalChill", 0.35, 1], [100, "goalReg", 0.65, 2], [200, "goalSer", 1, 4]];
    el.innerHTML = `<h1>${esc(t("haveFun"))}</h1><p>${esc(t("goalS"))}</p>
      <div class="goal-picks">${g.map(([n, k, p, l]) => `<button class="goal-pick" data-goal="${n}">${teaGlass(p, "gl")}<span><b>${esc(t(k))}</b><span>${esc(t("perDay", { n }))}, ${esc(t(l === 1 ? "aboutLesson" : "aboutLessons", { n:l }))}</span></span></button>`).join("")}</div>`;
  }
  el.hidden = false;
  el.onclick = (e) => {
    if (e.target.closest("[data-w=next]")) { Sound.play("tap"); showWelcome(2); return; }
    const gp = e.target.closest(".goal-pick");
    if (gp) {
      $$(".goal-pick", el).forEach((x) => x.classList.toggle("sel", x === gp));
      S.goal = +gp.dataset.goal; S.goalChosen = true; S.onboarded = true; persist(); Sound.play("good");
      setTimeout(() => { el.hidden = true; el.innerHTML = ""; refreshHUD(); renderLearn(); Lesson.open(PATH[0]); }, 380);
    }
  };
}

/* =========================================================
   BOOT
   ========================================================= */
function start(data) {
  installPatterns();
  const fromHot = data && data.S ? migrate(data.S) : null;
  S = fromHot || loadLocal() || defaultState();
  Voice.init(); FX.init(); Feed.init();
  const t0 = today();
  Session.newDay = !!(S.lastOpen && S.lastOpen !== t0);
  if (S.lastOpen !== t0) { S.lastOpen = t0; S.dayCount = (S.dayCount || 0) + 1; }
  refreshHUD(); renderCombo();
  setView("learn");
  if (!S.onboarded) showWelcome(1);

  // Darija audio: any element with data-say plays its clip
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-say]");
    if (!b || b.closest(".mt")) return;
    e.stopPropagation();
    Session.gesture = true; Sound.unlock();
    Voice.play(b.dataset.say, { voice:b.dataset.voice || "n", btn:b, mark:$$(`.dj[data-say="${CSS.escape(b.dataset.say)}"]`, b.closest(".card,.gpanel,.exrow,.pbrow,.hero,.nsheet,.chip,.kc,.welcome,.banner,.ov-box") || document).filter((x) => x !== b) });
  }, true);
  addEventListener("pointerdown", () => { Session.gesture = true; Sound.unlock(); }, { capture:true });
  $$(".tab").forEach((b) => b.addEventListener("click", () => { Sound.play("tap"); setView(b.dataset.tab); }));
  ["#hud-streak", "#hud-goal", "#hud-lvl"].forEach((s) => $(s).addEventListener("click", () => setView("me")));
  $("#v-learn").addEventListener("click", (e) => {
    const s = e.target.closest("[data-start]"); if (s) { closeNodeSheet(); Lesson.open(PATH[+s.dataset.start]); return; }
    const n = e.target.closest("[data-node]"); if (n) { Sound.play("tap"); openNodeSheet(+n.dataset.node); return; }
    if (e.target.closest("[data-act=practice]")) startPractice();
  });
  $("#nsheet").addEventListener("click", (e) => { const s = e.target.closest("[data-start]"); if (s) { closeNodeSheet(); Lesson.open(PATH[+s.dataset.start]); } });
  $("#sheet-scrim").addEventListener("click", closeNodeSheet);
  $("#v-guide").addEventListener("click", (e) => {
    const g = e.target.closest("[data-gt]"); if (g) { guideTab = g.dataset.gt; renderGuide(); return; }
    const sd = e.target.closest("[data-snd]"); if (sd) { guideSound = sd.dataset.snd; renderGuide(); $("#v-guide").scrollTo({ top:0, behavior:reduced ? "auto" : "smooth" }); const s = SOUNDS.find((x) => x.id === guideSound); Session.gesture = true; Voice.play(s.say, { btn:$(".gpanel .say") }); return; }
    const r = e.target.closest("[data-act=rule]"); if (r) { r.parentElement.classList.toggle("open"); return; }
    const f = e.target.closest("[data-pbf]"); if (f) { pbFilter = f.dataset.pbf; renderGuide(); return; }
    if (e.target.closest("[data-act=practice]")) startPractice();
  });
  $("#v-me").addEventListener("click", (e) => {
    const lg = e.target.closest("[data-lang]"); if (lg) { S.lang = lg.dataset.lang; persist(); renderMe(); refreshHUD(); if (Feed.started) Feed.rebuildAhead(); $("#nav-hint").textContent = t("navHint"); return; }
    const gl = e.target.closest("[data-goal]"); if (gl) { S.goal = +gl.dataset.goal; S.goalChosen = true; checkGoal(); persist(); renderMe(); refreshHUD(); return; }
    if (e.target.closest("#sw-sound")) { S.sound = !S.sound; persist(); renderMe(); if (S.sound) Sound.play("good"); return; }
    if (e.target.closest("#sw-voice")) { S.voiceAuto = !S.voiceAuto; persist(); renderMe(); return; }
    const a = e.target.closest("[data-act]"); if (!a) return;
    if (a.dataset.act === "reset") $(".confirm", $("#v-me")).hidden = false;
    if (a.dataset.act === "cancel") $(".confirm", $("#v-me")).hidden = true;
    if (a.dataset.act === "erase") { const lang = S.lang; S = defaultState(); S.lang = lang; S.lastOpen = today(); saveLocal(); remoteSave(); Feed.started = false; refreshHUD(); setView("learn"); showWelcome(1); }
  });
  $("#nav-up").innerHTML = ICON.up; $("#nav-down").innerHTML = ICON.down; $("#nav-hint").textContent = t("navHint");
  $("#nav-up").addEventListener("click", () => Feed.go(-1));
  $("#nav-down").addEventListener("click", () => Feed.go(1));
  addEventListener("keydown", (e) => {
    if (!$("#overlay").hidden) return;
    const tag = (e.target && e.target.tagName) || "";
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (Lesson.active) {
      if (e.key === "Enter") { const c = $("#lesson .banner .cta") || $("#lesson .l-foot:not([hidden]) .cta"); if (c) { e.preventDefault(); c.click(); } }
      else if (/^[1-5]$/.test(e.key)) { const b = Lesson.card && $$(".opts .opt, .h-opts .opt", Lesson.card.el)[+e.key - 1]; b && b.click(); }
      else if (e.key === "Escape") { $(".l-confirm") && ($(".l-confirm").hidden = false); }
      return;
    }
    if (view !== "feed") return;
    if (["ArrowDown", "PageDown", "j"].includes(e.key)) { e.preventDefault(); Feed.go(1); }
    else if (["ArrowUp", "PageUp", "k"].includes(e.key)) { e.preventDefault(); Feed.go(-1); }
    else if (/^[1-4]$/.test(e.key)) { const c = Feed.cards[Feed.active]; const b = c && $$(".opts .opt, .h-opts .opt", c.el)[+e.key - 1]; b && b.click(); }
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { flushSaves(); Voice.stop(); if (view === "feed") Feed.pause(); }
    else if (view === "feed" && !Lesson.active) Feed.resume();
  });
  try { window.claude && window.claude.hot && window.claude.hot.snapshot && window.claude.hot.snapshot(() => ({ S })); } catch (e) {}
  connectCapabilities(() => { refreshHUD(); renderLearn(); if (S.onboarded) { $("#welcome").hidden = true; } Feed.started = false; if (view === "feed") Feed.start(); });
  window.__wakha = { get S() { return S; }, set S(v) { S = v; }, Feed, FG, Lesson, PATH, UNITS, W, COLL, CORE, BUILDS, SITS, today, levelInfo, dueWords, setView, currentNode, Voice, AUD, audioKey,
    get view() { return view; }, inject(sp) { Feed.rebuildAhead(true, sp); }, startPractice };
}
function startPractice() {
  const due = dueWords();
  const words = (due.length ? due : learnedIds().filter((id) => !W[id].rar)).slice(0, 8);
  if (!words.length) return;
  Lesson.open({ id:"practice", kind:"practice", unit:0, words });
}
const hot = window.claude && window.claude.hot;
if (hot && typeof hot.ready === "function") hot.ready(start); else start((hot && hot.data) || {});

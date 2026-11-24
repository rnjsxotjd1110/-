// 앱 뼈대: 장면 전환, 메인 루프, 저장, 알림, 굴림 연출 연결
(function () {
  var A = G.app = {
    s: null, scene: 'title', overlay: null, tab: 'machine', sub: { nova: 'res', rec: 'ach' },
    toasts: [], toast: null, cut: null, t: 0, shake: 0, seenTabs: { machine: 1, rec: 1 },
    selFace: null, selUpg: null, pendingRolls: 0, lastVisual: 0, rollQueue: null, leverHeld: false, rollBadge: null, saveMsg: 0
  };
  var C = G.core;

  function applySettings() {
    var st = A.s.settings;
    G.setLang(st.lang); G.setNotation(st.notation);
    G.audio.set({ sfx: st.sfx === undefined ? 0.7 : st.sfx, bgm: st.bgm === undefined ? 0.5 : st.bgm, muted: !!st.muted });
  }
  A.applySettings = applySettings;

  function newGame() {
    A.s = C.newState();
    A.s.settings.sfx = 0.7; A.s.settings.bgm = 0.5;
    if (A.prevSettings) { var keep = A.prevSettings; for (var k in keep) A.s.settings[k] = keep[k]; }
    C.invalidate(); G.orrery.clearFx(); A.cut = null; A.pendingRoll = null;
    A.seenTabs = { machine: 1, rec: 1 }; A.tab = 'machine'; A.line = null; C.conQueue.length = 0; C.dexQueue.length = 0;
    G.tray.place(C.derive(A.s).dice.map(spec), [2, 2]);
    applySettings(); G.save.adopt(A.s); G.save.save(A.s);
  }
  function loadGame() {
    var s = G.save.load(); if (!s) return false;
    if (s === 'broken') return 'broken';
    A.s = s; C.invalidate(); G.orrery.clearFx(); A.cut = null; A.pendingRoll = null; A.toasts.length = 0; A.toast = null;
    applySettings();
    var secs = (Date.now() - (s.lastSave || Date.now())) / 1000;
    var rep = C.offline(s, secs);
    if (rep) { A.away = rep; A.overlay = 'away'; }
    G.story.prime(s); C.conQueue.length = 0; C.dexQueue.length = 0; A.line = null;
    A.seenTabs = s.seenTabs || { machine: 1, rec: 1 };
    var d = C.derive(s);
    G.tray.place(d.dice.map(spec), d.dice.map(function () { return 0; }));
    C.achQueue.length = 0;
    return true;
  }
  // 도감 이름·그림
  G.dexName = function (key) { var p = key.split('_'); return G.T('dex_cls' + p[1]) + ' ' + G.nm('tiers', +p[0]); };
  G.dexIcon = function (key) { if (!key) return null; var p = key.split('_'); return G.planets.bodySprite(+p[0], 11 + (+p[0]) * 3, 0, 6, +p[1]); };
  A.newGame = newGame; A.loadGame = loadGame;

  function spec(d, i) {
    var mat = { d4: 'clay', d6: 'ivory', d8: 'brass', d12: 'teal' }[d.shape] || 'ivory';
    var sp = d.sp;
    if (A.overlay === 'box' && A.boxPrev && !A.boxRevealed && A.s && A.s.dice.indexOf(d) >= 0) sp = A.boxPrev.slots[A.s.dice.indexOf(d)]; // 상자 결과를 미리 보여 주지 않음
    if (sp && A.s && A.s.coll[sp]) mat = 'sp_' + sp;
    if (A.s && i >= A.s.dice.length) mat = 'ember';
    return { shape: d.shape, faces: d.faces, mat: mat };
  }
  A.spec = spec;

  // ── 굴림 연출 ───────────────────────────────────
  function showRoll(r) {
    var d = C.derive(A.s);
    var specs = d.dice.map(spec);
    if (specs.length !== r.idx.length) specs = specs.slice(0, r.idx.length);
    var iv = d.interval || 2;
    var dur = r.fate ? 1.1 : (r.manual ? 0.75 : Math.max(0.28, Math.min(0.95, iv * 0.85)));
    if (G.audio) G.audio.play('roll');
    G.tray.roll(specs, r.idx, dur, function () { landed(r); });
  }
  function landed(r) {
    if (r.fate) A.fateBusy = 0;
    A.shownSum = r.sum;
    var sp = G.tray.sumPos();
    var big = r.align || r.rarity >= 8 || r.fate;
    var reduce = A.s.settings.reduce;
    if (big) G.orrery.pop(sp.x, sp.y - 20, r.fate ? G.T('fate_pop') : (r.align ? G.T('align_pop') : '×' + G.fmt(r.rarity, true)), r.fate ? 4 : 3, 'g11b', false, null, 'sumx');
    if (r.fate && !reduce) A.shake = Math.max(A.shake, 0.3);
    if (r.fate) A.edge = { t: 0.7, d: 0.7, c: [4, 7] }; else if (r.align) A.edge = { t: 0.5, d: 0.5, c: [3, 2] };
    var jp = r.jackpot;
    if (jp && (jp.align || jp.rarity >= 8) && jp.sum !== r.sum) {
      var jq = G.orrery.bodyXY(A.view, jp.sum);
      G.orrery.flash(jp.sum, 1);
      G.orrery.burst(jq.x, jq.y, reduce ? 6 : (jp.align ? 26 : 16), jp.align ? [4, 3, 8, 7] : [4, 3, 8], 40);
      G.orrery.pop(jq.x, jq.y - 18, jp.align ? G.T('jack_align', G.fmt(jp.n)) : G.T('jack_rare', G.fmt(jp.rarity, true)), 3, 'g11b', false, null, 'jp' + jp.sum);
      if (jp.align && G.audio) G.audio.play('align');
    }
    if (r.batch && r.batch > 1) A.rollBadge = { n: r.batch, t: 1.2 };
    if (r.align) { if (G.audio) G.audio.play('align'); if (!reduce) A.shake = Math.max(A.shake, 0.25); }
    var target = r.sum;
    G.orrery.beam(sp.x, sp.y, target, function () {
      var p = G.orrery.bodyXY(A.view, target);
      var n = Math.min(r.fate ? 60 : 40, 6 + Math.round(Math.log(Math.max(1, r.rarity)) * 6) + (r.align ? 14 : 0) + (r.fate ? 30 : 0));
      if (reduce) n = Math.min(n, 6);
      G.orrery.flash(target, 1);
      G.orrery.burst(p.x, p.y, n, r.align ? [4, 3, 8, 7] : (r.rarity >= 4 ? [4, 3, 8] : [8, 3]), 26 + Math.min(40, r.rarity * 2));
      if (r.fate) G.orrery.pop(p.x, p.y - 14, G.T('fate_res', target, G.fmt(r.mass), G.fmt(r.fateX, true)), 4, 'g11b', false, null, 'fate');
      else G.orrery.pop(p.x, p.y - 10, '+' + G.fmt(r.mass), r.rarity >= 4 ? 3 : 8, 'g9', false, null, 'm' + target);
      var tu = (r.tierUps || []).concat(r.batchTierUps || []);
      tu.slice(-2).forEach(function (u) {
        G.orrery.ring(u[0]);
        var q = G.orrery.bodyXY(A.view, u[0]);
        G.orrery.pop(q.x, q.y - 20, G.T('tier_up', G.nm('tiers', u[1])), 4, 'g11b', false, null, 't' + u[0]);
        if (G.audio) G.audio.play('tierup', { tier: u[1] });
        if (u[1] >= 6 && !reduce) A.shake = Math.max(A.shake, 0.15 + (u[1] - 6) * 0.08);
      });
      if (r.born !== undefined) G.orrery.ring(r.born);
    });
  }
  A.doFateRoll = function () {
    if (A.cut || A.fateBusy > A.t) return; // 자동 굴림 중에도 바로 굴린다
    var r = C.fateRoll(A.s);
    if (!r) return;
    if (G.audio) G.audio.play('fate');
    A.pendingRoll = null; A.fateBusy = A.t + 3; // 운명 연출이 끝날 때까지 다른 굴림은 쟁반에 안 보임 (최대 3초)
    showRoll(r);
  };
  A.doManualRoll = function () {
    if (A.cut || A.fateBusy > A.t) return;
    var r = C.manualRoll(A.s);
    if (!r) return;
    if (G.audio) G.audio.play('lever');
    if (r.twin) { r.batchTierUps = (r.twin.tierUps || []); r.batch = 2; }
    showRoll(r);
  };

  // ── 알림 (한 번에 하나, R-065) ───────────────────
  A.notify = function (lines, kind, data) { A.toasts.push({ lines: lines, kind: kind || 'info', t: 0, data: data }); if (A.toasts.length > 6) A.toasts.splice(0, A.toasts.length - 6); };
  function updToasts(dt) {
    while (A.toasts.length && A.toasts[0].kind === 'evq' && !(A.s && A.s.ev.cur)) A.toasts.shift();
    if (!A.toast && A.toasts.length) { A.toast = A.toasts.shift(); A.toast.t = 0; if (A.toast.kind === 'ach' && G.audio) G.audio.play('ach'); if (A.toast.kind === 'unlock' && G.audio) G.audio.play('unlock'); }
    if (A.toast) { A.toast.t += dt; if (A.toast.t > 2.8) A.toast = null; }
  }
  function drawToast() {
    var t = A.toast; if (!t) return;
    if (t.t < 0.03 || t.t > 2.77) return;
    var slide = Math.min(1, t.t / 0.18, (2.8 - t.t) / 0.18);
    var w = 0; t.lines.forEach(function (l, i) { w = Math.max(w, G.font.measure(l, i === 0 ? 'g11b' : 'g11')); });
    var icon = t.kind === 'ach' ? G.spr.medal : (t.kind === 'dex' ? (G.dexIcon && G.dexIcon(t.data)) : null);
    var iw = icon ? icon.w + 4 : 0;
    w += 14 + iw;
    var h = 8 + t.lines.length * 13;
    var x = Math.round(208 - w / 2), y = Math.round(22 - (1 - slide) * (h + 24));
    G.nine(G.spr.paper, x, y, w, h);
    if (icon) { G.gfx.setClip(x + 2, y + 2, w - 4, h - 4); G.gfx.blit(icon, x + 6, y + Math.floor((h - icon.h) / 2)); G.gfx.resetClip(); }
    t.lines.forEach(function (l, i) { G.font.draw(l, x + 7 + iw, y + 4 + i * 13, i === 0 ? 12 : 13, i === 0 ? 'g11b' : 'g11'); });
  }

  // 탭 열림 확인
  function tabOpen(key) {
    var s = A.s;
    if (key === 'machine' || key === 'rec') return true;
    if (key === 'upg') return s.dustRun >= 25 || Object.keys(s.up).length > 0 || s.novas > 0;
    if (key === 'dice') return s.box > 0 || (s.stats.boxes || 0) > 0 || s.novas > 0 || s.collapses > 0;
    if (key === 'nova') return C.maxTier(s) >= 7 || s.novas > 0 || s.collapses > 0;
    if (key === 'col') return C.maxTier(s) >= 9 || s.collapses > 0 || !!A.seenTabs.n_col;
    return false;
  }
  A.tabOpen = tabOpen;
  function checkUnlocks() {
    ['upg', 'dice', 'nova', 'col'].forEach(function (k) {
      if (tabOpen(k) && !A.seenTabs[k] && !A.seenTabs['n_' + k]) { A.seenTabs['n_' + k] = 1; A.notify([G.T('new_unlock'), G.T('unlock_' + k)], 'unlock'); }
    });
    if (A.s.novas >= 3 && !A.seenTabs.n_chal) { A.seenTabs.n_chal = 1; A.notify([G.T('new_unlock'), G.T('unlock_chal')], 'unlock'); }
  }

  // ── 초신성·붕괴 연출 연결 ───────────────────────
  A.startNova = function () {
    if (!C.canNova(A.s) || A.cut) return;
    var gain = C.novaGain(A.s);
    A.cut = { kind: 'nova', t: 0, gain: gain, done: false, chal: A.s.chal };
    if (G.audio) G.audio.play('nova');
  };
  A.startCollapse = function () {
    if (!C.canCollapse(A.s) || A.cut) return;
    A.cut = { kind: 'col', t: 0, gain: Math.max(1, C.collapseGain(A.s)), done: false };
    if (G.audio) G.audio.play('collapse');
  };
  function updCut(dt) {
    var c = A.cut; if (!c) return;
    // 연출을 빠르게 (초신성 약 1.9초, 붕괴 약 2.4초). 결과가 적용된 뒤에는 클릭·스페이스로 바로 넘김
    c.t += dt * (c.kind === 'nova' ? 1.8 : 1.7);
    if (c.done && c.t > (c.kind === 'nova' ? 1.4 : 2.0) && (G.ui.inp.released || G.ui.inp.keysPressed.Space)) { A.cut = null; G.ui.inp.released = false; G.ui.inp.keysPressed.Space = false; return; }
    var mid = c.kind === 'nova' ? 1.1 : 1.6;
    if (!c.done && c.t >= mid) {
      c.done = true;
      if (c.kind === 'nova') { var info = C.nova(A.s); if (info && info.chalDone) { A.notify([G.T('chal_clear'), G.nm('chal', info.chalDone)], 'ach'); if (G.audio) G.audio.play('chal'); } }
      else { C.collapse(A.s); G.audio.startBgm(1); }
      G.orrery.clearFx(); A.shownSum = undefined;
      var d = C.derive(A.s);
      G.tray.place(d.dice.map(spec), d.dice.map(function () { return 0; }));
      G.save.save(A.s);
    }
    if (c.t >= (c.kind === 'nova' ? 3.4 : 4.0)) A.cut = null;
  }

  // ── 메인 루프 ───────────────────────────────────
  var last = 0, saveT = 0;
  var lastDraw = 0;
  function frame(now) {
    // 주사율이 높은 모니터(120·144Hz)에서도 초당 60번까지만 그린다
    // 한 프레임 계산이 평균 10ms를 넘는 느린 컴퓨터에서는 초당 30번으로 낮춘다
    if (now - lastDraw < (slowPc ? 31 : 15) && lastDraw) { requestAnimationFrame(frame); return; }
    lastDraw = now;
    var fs0 = performance.now();
    try { frameInner(now); } catch (e) { console.error(e && e.stack || e); try { G.gfx.resetClip(); G.gfx.setOffset(0, 0); G.ui.block(false); G.ui.endFrame(); } catch (e2) { } }
    var cost = performance.now() - fs0;
    costAvg = costAvg * 0.97 + Math.min(100, cost) * 0.03;
    if (!slowPc && costAvg > 10) slowPc = true; else if (slowPc && costAvg < 4) slowPc = false;
    requestAnimationFrame(frame);
  }
  var slowPc = false, costAvg = 0;
  function frameInner(now) {
    var raw = (now - last) / 1000 || 0;
    var dt = Math.min(0.1, raw); last = now;
    if (raw > 2 && A.s && (A.scene === 'play' || A.scene === 'ending') && !window.__timeScale) {
      if (raw < 60) { for (var ct = 0; ct < raw; ct += 0.5) C.tick(A.s, Math.min(0.5, raw - ct), {}); }
      else { var rep = C.offline(A.s, raw); if (rep && raw >= 60 && A.scene === 'play' && A.overlay !== 'confirm') { A.away = rep; A.overlay = 'away'; } }
    }
    if (window.__freeze) return;
    if (window.__timeScale) dt *= window.__timeScale;
    A.t += dt; A.dt = dt;
    if (window.__logNext) G.textLog = [];
    var gx = G.gfx;
    G.ui.resetHover();
    if (A.scene === 'play' && A.s) {
      if (!A.cut && A.overlay !== 'confirm' && A.scene !== 'ending') {
        var steps = window.__timeScale && window.__timeScale > 4 ? Math.ceil(dt / 0.1) : 1;
        var sdt = dt / steps;
        for (var i = 0; i < steps; i++) {
          var rolled = C.tick(A.s, sdt, {});
          if (rolled.length) {
            var r = rolled[rolled.length - 1];
            if (rolled.length > 1) r.batch = (r.batch || 1) + rolled.length - 1;
            if (A.pendingRoll) { r.batchTierUps = (r.batchTierUps || []).concat(A.pendingRoll.tierUps || [], A.pendingRoll.batchTierUps || []); }
            if ((!G.tray.rolling() || r.batch) && !(A.fateBusy > A.t)) { showRoll(r); A.pendingRoll = null; }
            else A.pendingRoll = r;
          }
        }
        if (A.pendingRoll && !G.tray.rolling() && !(A.fateBusy > A.t)) { showRoll(A.pendingRoll); A.pendingRoll = null; }
        while (C.chalQueue.length) { var cid = C.chalQueue.shift(); A.notify([G.T('chal_clear'), G.nm('chal', cid)], 'ach'); if (G.audio) G.audio.play('chal'); }
        while (C.achQueue.length) { var id = C.achQueue.shift(); A.notify([G.T('ach_get'), G.nm('ach', id)], 'ach'); }
        if (A.s.ended && !A.s.endSeen && A.scene !== 'ending') { A.scene = 'ending'; A.endT = 0; if (G.audio) G.audio.play('ending'); }
        checkUnlocks();
        // 관측 의뢰·도감·일지
        while (C.conQueue.length) {
          var cq = C.conQueue.shift();
          if (cq.kind === 'ok') { A.notify([G.T('con_ok'), cq.fate ? G.T('con_reward2') : G.T('con_reward')], 'ach'); if (G.audio) G.audio.play('chal'); A.conFlash = 1; }
          else if (cq.kind === 'fail') A.notify([G.T('con_fail')], 'info');
          else if (cq.kind === 'new') A.conFlash = 0.6;
        }
        while (C.dexQueue.length) { var dk = C.dexQueue.shift(); A.notify([G.T('dex_new'), G.dexName(dk)], 'dex', dk); }
        A.storyT = (A.storyT || 0) + dt;
        if (A.storyT > 1 && !A.cut) { A.storyT = 0; var ln = G.story.check(A.s); if (ln) A.line = { l: ln, t: 0 }; }
        if (A.lastFate !== undefined && A.s.fate.n > A.lastFate) { if (G.audio) G.audio.play('fateready'); if (!A.s.stats.fates && !A.fateHinted) { A.fateHinted = 1; A.notify([G.T('fate_ready'), G.T('fate_ready2')], 'unlock'); } }
        A.lastFate = A.s.fate.n;
        if (A.lastNovas !== undefined && (A.s.novas !== A.lastNovas || A.s.collapses !== A.lastCols) && !A.cut) { var dd = C.derive(A.s); G.tray.place(dd.dice.map(spec), dd.dice.map(function () { return 0; })); G.orrery.clearFx(); A.shownSum = undefined; if (A.s.collapses !== A.lastCols) G.audio.startBgm(1); }
        if (A.lastDiceN !== undefined && A.s.dice.length !== A.lastDiceN && !G.tray.rolling()) { var d2 = C.derive(A.s); G.tray.place(d2.dice.map(spec), d2.dice.map(function () { return 0; })); }
        A.lastNovas = A.s.novas; A.lastCols = A.s.collapses; A.lastDiceN = A.s.dice.length;
        // 이벤트 등장 소리
        if (A.s.ev.cur && !A.s.ev.cur._snd) { A.s.ev.cur._snd = 1; if (G.audio) G.audio.play('evspawn'); if (!C.res(A.s, 's2')) A.notify([G.T('ev_appear', G.T('ev_' + A.s.ev.cur.type)), G.T('ev_hint')], 'evq'); }
      }
      updCut(dt);
      saveT += dt;
      if (saveT > 15) { saveT = 0; A.s.seenTabs = A.seenTabs; var sr = G.save.save(A.s); if (sr === 'locked' && !A.overlay) { A.confirmText = G.T('save_locked_q'); A.confirmYes = G.T('b_take_over'); A.confirmFn = function () { G.save.adopt(A.s); G.save.save(A.s); }; A.confirmNo = G.T('b_reload'); A.confirmNoFn = function () { A.loadGame(); }; A.overlay = 'confirm'; } else if (sr === false && !A.failWarned) { A.failWarned = 1; A.notify([G.T('save_fail')], 'info'); } }
    }
    G.orrery.update(dt, A.view); G.tray.update(dt);
    updToasts(dt);
    if (A.line) { A.line.t += dt; if (A.line.t > 7) A.line = null; }
    if (A.conFlash > 0) A.conFlash = Math.max(0, A.conFlash - dt);
    A.shake = Math.max(0, A.shake - dt);
    if (A.rollBadge) { A.rollBadge.t -= dt; if (A.rollBadge.t <= 0) A.rollBadge = null; }
    if (A.saveMsg > 0) A.saveMsg -= dt;

    gx.clear(12);
    if (A.scene === 'title') G.sceneTitle.draw(dt);
    else if (A.scene === 'play') G.scenePlay.draw(dt);
    else if (A.scene === 'ending') G.sceneFx.ending(dt);
    if (A.overlay === 'credits') G.sceneFx.credits(dt);
    drawToast();
    G.ui.drawTooltip();
    gx.present();
    G.ui.endFrame();
    if (window.__logNext) { window.__lastLog = G.textLog; G.textLog = null; window.__logNext = false; window.__freeze = true; }
  }

  function boot() {
    var cv = document.getElementById('screen');
    G.gfx.init(cv); G.ui.bind(cv);
    window.addEventListener('beforeunload', function () { if (A.s && A.scene !== 'title' && !document.hidden) { A.s.seenTabs = A.seenTabs; G.save.save(A.s); } G.save.release(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && A.s && A.scene !== 'title') { A.s.seenTabs = A.seenTabs; G.save.save(A.s); } });
    window.addEventListener('blur', function () { G.ui.inp.keys = {}; G.ui.inp.down = false; });
    var q = location.search;
    // 개발·검수용 진입점
    if (q.indexOf('demo=') >= 0) { G.save.disable(); G.devDemo(q); }
    requestAnimationFrame(function (t) { last = t; frame(t); });
    setTimeout(function () { window.__ready = true; }, 80);
  }
  A.boot = boot;
})();

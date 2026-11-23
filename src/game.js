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
    C.invalidate(); G.orrery.clearFx();
    A.seenTabs = { machine: 1, rec: 1 }; A.tab = 'machine';
    G.tray.place(C.derive(A.s).dice.map(spec), [2, 2]);
    applySettings(); G.save.save(A.s);
  }
  function loadGame() {
    var s = G.save.load(); if (!s) return false;
    A.s = s; C.invalidate(); G.orrery.clearFx();
    applySettings();
    var secs = (Date.now() - (s.lastSave || Date.now())) / 1000;
    var rep = C.offline(s, secs);
    if (rep) { A.away = rep; A.overlay = 'away'; }
    A.seenTabs = s.seenTabs || { machine: 1, rec: 1 };
    var d = C.derive(s);
    G.tray.place(d.dice.map(spec), d.dice.map(function () { return 0; }));
    C.achQueue.length = 0;
    return true;
  }
  A.newGame = newGame; A.loadGame = loadGame;

  function spec(d, i) {
    var mat = { d4: 'clay', d6: 'ivory', d8: 'brass', d12: 'teal' }[d.shape] || 'ivory';
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
    var dur = r.manual ? 0.75 : Math.max(0.28, Math.min(0.95, iv * 0.85));
    if (G.audio) G.audio.play('roll');
    G.tray.roll(specs, r.idx, dur, function () { landed(r); });
  }
  function landed(r) {
    var sp = G.tray.sumPos();
    var big = r.align || r.rarity >= 8;
    var reduce = A.s.settings.reduce;
    if (big) G.orrery.pop(sp.x, sp.y - 20, r.align ? G.T('align_pop') : '×' + G.fmt(r.rarity, true), 3, 'g11b', false, null, 'sumx');
    if (r.batch && r.batch > 1) A.rollBadge = { n: r.batch, t: 1.2 };
    if (r.align) { if (G.audio) G.audio.play('align'); if (!reduce) A.shake = Math.max(A.shake, 0.25); }
    var target = r.sum;
    G.orrery.beam(sp.x, sp.y, target, function () {
      var p = G.orrery.bodyXY(A.view, target);
      var n = Math.min(40, 6 + Math.round(Math.log(Math.max(1, r.rarity)) * 6) + (r.align ? 14 : 0));
      if (reduce) n = Math.min(n, 6);
      G.orrery.flash(target, 1);
      G.orrery.burst(p.x, p.y, n, r.align ? [4, 3, 8, 7] : (r.rarity >= 4 ? [4, 3, 8] : [8, 3]), 26 + Math.min(40, r.rarity * 2));
      G.orrery.pop(p.x, p.y - 10, '+' + G.fmt(r.mass), r.rarity >= 4 ? 3 : 8, 'g9', false, null, 'm' + target);
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
  A.doManualRoll = function () {
    if (A.cut) return;
    var r = C.manualRoll(A.s);
    if (!r) return;
    if (G.audio) G.audio.play('lever');
    showRoll(r);
    if (r.twin) setTimeout(function () { }, 0);
  };

  // ── 알림 (한 번에 하나, R-065) ───────────────────
  A.notify = function (lines, kind) { A.toasts.push({ lines: lines, kind: kind || 'info', t: 0 }); if (A.toasts.length > 6) A.toasts.splice(0, A.toasts.length - 6); };
  function updToasts(dt) {
    if (!A.toast && A.toasts.length) { A.toast = A.toasts.shift(); A.toast.t = 0; if (A.toast.kind === 'ach' && G.audio) G.audio.play('ach'); if (A.toast.kind === 'unlock' && G.audio) G.audio.play('unlock'); }
    if (A.toast) { A.toast.t += dt; if (A.toast.t > 2.8) A.toast = null; }
  }
  function drawToast() {
    var t = A.toast; if (!t) return;
    var slide = Math.min(1, t.t / 0.18, (2.8 - t.t) / 0.18);
    var w = 0; t.lines.forEach(function (l, i) { w = Math.max(w, G.font.measure(l, i === 0 ? 'g11b' : 'g11')); });
    var icon = t.kind === 'ach' ? G.spr.medal : null;
    w += 14 + (icon ? 16 : 0);
    var h = 8 + t.lines.length * 13;
    var x = Math.round(208 - w / 2), y = Math.round(22 - (1 - slide) * (h + 24));
    G.nine(G.spr.paper, x, y, w, h);
    if (icon) G.gfx.blit(icon, x + 6, y + Math.floor((h - icon.h) / 2));
    t.lines.forEach(function (l, i) { G.font.draw(l, x + 7 + (icon ? 16 : 0), y + 4 + i * 13, i === 0 ? 12 : 13, i === 0 ? 'g11b' : 'g11'); });
  }

  // 탭 열림 확인
  function tabOpen(key) {
    var s = A.s;
    if (key === 'machine' || key === 'rec') return true;
    if (key === 'upg') return s.dustRun >= 25 || Object.keys(s.up).length > 0 || s.novas > 0;
    if (key === 'dice') return C.forgeUnlocked(s) || s.novas > 0 || s.collapses > 0;
    if (key === 'nova') return C.maxTier(s) >= 7 || s.novas > 0 || s.collapses > 0;
    if (key === 'col') return C.maxTier(s) >= 9 || s.collapses > 0;
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
    c.t += dt;
    var mid = c.kind === 'nova' ? 1.1 : 1.6;
    if (!c.done && c.t >= mid) {
      c.done = true;
      if (c.kind === 'nova') { var info = C.nova(A.s); if (info && info.chalDone) { A.notify([G.T('chal_clear'), G.nm('chal', info.chalDone)], 'ach'); if (G.audio) G.audio.play('chal'); } }
      else { C.collapse(A.s); G.audio.startBgm(1); }
      G.orrery.clearFx();
      var d = C.derive(A.s);
      G.tray.place(d.dice.map(spec), d.dice.map(function () { return 0; }));
      G.save.save(A.s);
    }
    if (c.t >= (c.kind === 'nova' ? 3.4 : 4.0)) A.cut = null;
  }

  // ── 메인 루프 ───────────────────────────────────
  var last = 0, saveT = 0;
  function frame(now) {
    try { frameInner(now); } catch (e) { console.error(e && e.stack || e); if (!window.__errShown) { window.__errShown = 1; } }
    requestAnimationFrame(frame);
  }
  function frameInner(now) {
    var dt = Math.min(0.1, (now - last) / 1000 || 0); last = now;
    if (window.__freeze) return;
    if (window.__timeScale) dt *= window.__timeScale;
    A.t += dt;
    if (window.__logNext) G.textLog = [];
    var gx = G.gfx;
    G.ui.resetHover();
    if (A.scene === 'play' && A.s) {
      if (!A.cut && A.overlay !== 'away' && A.scene !== 'ending') {
        var steps = window.__timeScale && window.__timeScale > 4 ? Math.ceil(dt / 0.1) : 1;
        var sdt = dt / steps;
        for (var i = 0; i < steps; i++) {
          var rolled = C.tick(A.s, sdt, {});
          if (rolled.length) {
            var r = rolled[rolled.length - 1];
            if (rolled.length > 1) r.batch = (r.batch || 1) + rolled.length - 1;
            if (!G.tray.rolling() || r.batch) showRoll(r);
            else A.pendingRoll = r;
          }
        }
        if (A.pendingRoll && !G.tray.rolling()) { showRoll(A.pendingRoll); A.pendingRoll = null; }
        while (C.achQueue.length) { var id = C.achQueue.shift(); A.notify([G.T('ach_get'), G.nm('ach', id)], 'ach'); }
        if (A.s.ended && !A.s.endSeen) { A.s.endSeen = true; A.scene = 'ending'; A.endT = 0; if (G.audio) G.audio.play('ending'); }
        checkUnlocks();
        // 이벤트 등장 소리
        if (A.s.ev.cur && !A.s.ev.cur._snd) { A.s.ev.cur._snd = 1; if (G.audio) G.audio.play('evspawn'); }
      }
      updCut(dt);
      saveT += dt;
      if (saveT > 15) { saveT = 0; A.s.seenTabs = A.seenTabs; G.save.save(A.s); }
    }
    G.orrery.update(dt, A.view); G.tray.update(dt);
    updToasts(dt);
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
    window.addEventListener('beforeunload', function () { if (A.s && A.scene !== 'title') { A.s.seenTabs = A.seenTabs; G.save.save(A.s); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden && A.s && A.scene !== 'title') { A.s.seenTabs = A.seenTabs; G.save.save(A.s); } });
    var q = location.search;
    // 개발·검수용 진입점
    if (q.indexOf('demo=') >= 0) { G.devDemo(q); } else { var sp = /speed=(\d+)/.exec(q); if (sp) window.__timeScale = +sp[1]; }
    requestAnimationFrame(function (t) { last = t; frame(t); });
    setTimeout(function () { window.__ready = true; }, 80);
  }
  A.boot = boot;
})();

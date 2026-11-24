// 겹 창: 설정, 복귀 리포트, 확인
(function () {
  var A = G.app, gx = G.gfx, F = G.font, U = G.ui;
  function dim() { // 뒤 화면을 어둡게: 팔레트 안에서 한 단계씩 어두운 색으로 치환
    var map = [0, 0, 11, 2, 9, 10, 0, 5, 9, 10, 21, 18, 23, 12, 13, 14, 6, 20, 21, 16, 22, 23, 23, 23];
    gx.remapRect(0, 0, 640, 360, map);
    if (G.textLog) G.textLog.length = 0; // 어둡게 덮인 글자는 점검 대상에서 뺀다
  }
  function slider(id, x, y, w, v) {
    G.nine(G.spr.inset, x, y + 3, w, 7);
    var fw = Math.round((w - 4) * v);
    gx.rect(x + 2, y + 5, fw, 3, 2); gx.hline(x + 2, y + 5, fw, 3);
    var kx = x + 2 + fw - 3;
    var h = U.hitArea(id, x - 2, y - 2, w + 4, 17);
    gx.blit(G.spr.knob, kx - 2, y - 1);
    if (U.isActive(id) && U.inp.down && U.inp.x >= 0) { v = Math.max(0, Math.min(1, (U.inp.x - x - 2) / (w - 4))); }
    return Math.round(v * 10) / 10;
  }
  function choice(id, x, y, items, cur) {
    var px = x, out = cur;
    items.forEach(function (it) {
      var w = F.measure(it[1], 'g11');
      var h = U.hitArea(id + it[0], px - 2, y - 2, w + 4, 16);
      var sel = cur === it[0];
      F.draw(it[1], px, y, sel ? 4 : (h.over ? 8 : 15), 'g11', 12);
      if (sel) gx.rect(px, y + 13, w, 2, 3);
      if (h.clicked) { out = it[0]; G.audio.play('tab'); }
      px += w + 10;
    });
    return out;
  }
  function settings(s, fromTitle) {
    dim();
    var w = 316, h = fromTitle ? 236 : 262, x = (640 - w) >> 1, y = (360 - h) >> 1;
    G.nine(G.spr.panel, x, y, w, h);
    F.draw(G.T('set_title'), x + 12, y + 10, 4, 'g11b', 12);
    U.groove(x + 8, y + 26, w - 16);
    var st = s.settings, lx = x + 14, vx = x + 124, yy = y + 36;
    // 소리
    F.draw(G.T('set_mute'), lx, yy, 15, 'g11');
    var m = choice('mute', vx, yy, [[false, G.T('on')], [true, G.T('off')]], !!st.muted);
    if (m !== !!st.muted) { st.muted = m; G.audio.unlock(); A.applySettings(); if (!m) G.audio.startBgm(s.collapses > 0 ? 1 : 0); }
    yy += 22;
    F.draw(G.T('set_sfx'), lx, yy, 15, 'g11');
    var nv = slider('ssfx', vx, yy, 140, st.sfx === undefined ? 0.7 : st.sfx);
    F.draw(Math.round(nv * 10) + '/10', vx + 146, yy, 8, 'g9');
    if (nv !== st.sfx) { st.sfx = nv; A.applySettings(); }
    yy += 20;
    F.draw(G.T('set_bgm'), lx, yy, 15, 'g11');
    var nb = slider('sbgm', vx, yy, 140, st.bgm === undefined ? 0.5 : st.bgm);
    F.draw(Math.round(nb * 10) + '/10', vx + 146, yy, 8, 'g9');
    if (nb !== st.bgm) { st.bgm = nb; A.applySettings(); }
    yy += 22;
    F.draw(G.T('set_notation'), lx, yy, 15, 'g11');
    var nn = choice('not', vx, yy, [['ko', G.T('not_ko')], ['en', G.T('not_en')], ['sci', G.T('not_sci')], ['eng', G.T('not_eng')]], st.notation);
    if (nn !== st.notation) { st.notation = nn; A.applySettings(); }
    yy += 22;
    F.draw(G.T('set_reduce'), lx, yy, 15, 'g11');
    var rd = choice('red', vx, yy, [[false, G.T('off')], [true, G.T('on')]], !!st.reduce);
    st.reduce = rd;
    yy += 22;
    F.draw(G.T('set_lang'), lx, yy, 15, 'g11');
    var lg = choice('lang', vx, yy, [['ko', '한국어'], ['en', 'English']], st.lang);
    if (lg !== st.lang) { st.lang = lg; if (lg === 'en' && st.notation === 'ko') st.notation = 'en'; if (lg === 'ko' && st.notation === 'en') st.notation = 'ko'; A.applySettings(); A.titleInfo = null; }
    yy += 24;
    U.groove(x + 8, yy, w - 16);
    yy += 8;
    var bw = 94;
    if (!fromTitle) {
      if (U.button('sv', lx, yy, bw, 19, G.T('b_save'), { font: 'g11b' })) { s.seenTabs = A.seenTabs; var rr = G.save.save(s); A.notify([rr === true ? G.T('saved') : (rr === 'locked' ? G.T('save_locked') : G.T('save_fail'))], 'info'); }
      if (U.button('ex', lx + bw + 6, yy, bw, 19, G.T('b_export'), { font: 'g11b' })) exportSave(s);
      if (U.button('im', lx + (bw + 6) * 2, yy, bw, 19, G.T('b_import'), { font: 'g11b' })) importSave();
      yy += 25;
      if (U.button('cr', lx, yy, bw, 19, G.T('b_credits'), { font: 'g11b' })) A.overlay = 'credits';
      if (U.button('tt', lx + bw + 6, yy, bw, 19, G.T('b_title'), { font: 'g11b' })) { s.seenTabs = A.seenTabs; G.save.save(s); A.overlay = null; A.scene = 'title'; A.cut = null; A.titleInfo = null; G.orrery.clearFx(); A.toasts.length = 0; A.toast = null; }
      if (U.button('fs', lx, yy + 25, bw, 19, G.T('fullscreen'), { font: 'g11b' })) toggleFs();
      yy += 25;
    } else {
      if (U.button('im', lx, yy, bw, 19, G.T('b_import'), { font: 'g11b' })) importSave(true);
      if (U.button('cr', lx + bw + 6, yy, bw, 19, G.T('b_credits'), { font: 'g11b' })) A.overlay = 'credits';
      if (U.button('fs', lx + (bw + 6) * 2, yy, bw, 19, G.T('fullscreen'), { font: 'g11b' })) toggleFs();
      yy += 25;
    }
    if (U.button('cl', lx + (bw + 6) * 2, yy, bw, 19, G.T('b_close'), { font: 'g11b' }) || U.inp.keysPressed.Escape) { A.overlay = null; if (A.s && !fromTitle) G.save.save(A.s); if (fromTitle && G.save.has() && !A.demo) { try { var raw = JSON.parse(localStorage.getItem(G.save.KEY)); raw.settings = s.settings; localStorage.setItem(G.save.KEY, JSON.stringify(raw)); } catch (e) { } } A.titleInfo = null; }
  }
  function toggleFs() {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (e) { }
  }
  function exportSave(s) {
    var code = G.save.toCode(s);
    function fallback() { try { window.prompt(G.T('export_title'), code); } catch (e) { } }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(function () { A.notify([G.T('exported')], 'info'); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }
  function importSave(fromTitle) {
    var code = null;
    try { code = window.prompt(G.T('import_prompt'), ''); } catch (e) { }
    if (!code) return;
    var s = G.save.fromCode(code);
    if (!s) { A.notify([G.T('import_bad')], 'info'); G.audio.play('deny'); return; }
    if (!fromTitle && A.s) { A.confirmText = G.T('import_confirm'); A.confirmYes = G.T('b_import'); A.confirmFn = function () { applyImport(s); }; A.overlay = 'confirm'; return; }
    applyImport(s);
  }
  function applyImport(s) {
    A.s = s; G.core.invalidate(); G.save.adopt(s); G.save.save(s); A.applySettings(); A.cut = null;
    A.seenTabs = s.seenTabs || { machine: 1, rec: 1, n_upg: 1, n_dice: 1, n_nova: 1, n_col: 1, n_chal: 1 };
    if (!s.settings.muted) G.audio.startBgm(s.collapses > 0 ? 1 : 0);
    var d = G.core.derive(s); G.tray.place(d.dice.map(A.spec), d.dice.map(function () { return 0; }));
    G.orrery.clearFx(); A.overlay = null; A.scene = 'play';
    A.notify([G.T('import_ok')], 'info');
  }
  function away(s) {
    dim();
    var r = A.away; if (!r) { A.overlay = null; return; }
    var w = 250, h = 132, x = (640 - w) >> 1, y = (360 - h) >> 1;
    G.nine(G.spr.panel, x, y, w, h);
    F.draw(G.T('away_title'), x + 12, y + 10, 4, 'g11b', 12);
    F.drawRight(G.T('away_time', G.fmtTime(r.secs)), x + w - 12, y + 11, 15, 'g9');
    U.groove(x + 8, y + 26, w - 16);
    gx.blit(G.spr.icDust, x + 14, y + 37);
    F.draw(G.T('away_dust', G.fmt(r.dust)), x + 27, y + 35, 3, 'g11b', 12);
    F.draw(G.T('away_rolls', G.fmt(r.rolls)) + ' · ' + G.T('away_tiers', G.fmt(r.tierUps)), x + 14, y + 54, 8, 'g11');
    if (r.novas || r.cols) F.draw(G.T('away_novas', r.novas || 0, r.cols || 0), x + 14, y + 86, 8, 'g9');
    F.draw(G.T('away_eff', Math.round(r.eff * 100)) + (r.capped ? ' · ' + G.T('away_cap', r.capH) : ''), x + 14, y + 72, 15, 'g9');
    if (U.button('awayok', x + w - 92, y + h - 30, 80, 20, G.T('b_ok'), { font: 'g11b', sfx: 'buy' }) || U.inp.keysPressed.Enter) { A.overlay = null; A.away = null; }
  }
  function confirm(s) {
    dim();
    var w = 280, h = 96, x = (640 - w) >> 1, y = (360 - h) >> 1;
    G.nine(G.spr.panel, x, y, w, h);
    var lines = F.wrap(A.confirmText || '', w - 24, 'g11');
    lines.forEach(function (l, i) { F.draw(l, x + 12, y + 12 + i * 13, 4, 'g11', 12); });
    if (U.button('cy', x + 12, y + h - 30, 120, 20, A.confirmYes || G.T('m_yes'), { font: 'g11b' })) { A.overlay = null; var f = A.confirmFn; A.confirmNo = null; A.confirmNoFn = null; if (f) f(); }
    else if (U.button('cn', x + w - 112, y + h - 30, 100, 20, A.confirmNo || G.T('m_no'), { font: 'g11b' }) || (U.inp.keysPressed.Escape && !A.confirmNoFn)) { A.overlay = null; var nf = A.confirmNoFn; A.confirmNo = null; A.confirmNoFn = null; if (nf) nf(); }
  }
  // ── 주사위 상자 열기 (하나 / 모두) ──────────────
  var RAR_COL = [15, 19, 7, 3], RAR_HI = [4, 4, 8, 4];
  var boxSnd = 0, revealN = 0;
  // 열기 전 보관함·쟁반 칸을 기억해 두고 연다. 연출이 끝나기 전까지 화면은 열기 전 모습
  G.openBoxesUi = function (s, n) {
    n = Math.min(n, s.box); if (n < 1) return;
    var prev = { coll: JSON.parse(JSON.stringify(s.coll)), slots: s.dice.map(function (d) { return d.sp; }) };
    var list = [];
    for (var i = 0; i < n; i++) { var r = G.core.openBox(s); if (r) list.push(r); }
    if (!list.length) return;
    A.boxPrev = prev; A.boxRevealed = false; A.boxT = 0; boxSnd = 0; revealN = 0;
    if (list.length === 1) { A.boxRes = list[0]; A.boxList = null; }
    else {
      // 같은 주사위끼리 묶고, 좋은 등급이 마지막에 나오게
      var g = {}, order = [];
      list.forEach(function (r) { if (!g[r.id]) { g[r.id] = { id: r.id, rar: r.rar, n: 0, isNew: false, lv: 0, dust: 0 }; order.push(g[r.id]); } var e = g[r.id]; e.n++; e.isNew = e.isNew || r.isNew; e.lv = Math.max(e.lv, r.lv); e.dust += r.dust || 0; });
      order.sort(function (a, b) { return a.rar - b.rar || a.n - b.n; });
      A.boxList = { groups: order, n: list.length, news: order.filter(function (e) { return e.isNew; }).length, dust: order.reduce(function (t, e) { return t + e.dust; }, 0), best: order[order.length - 1].rar };
      A.boxRes = null;
    }
    A.overlay = 'box';
  };
  function revealDone(s, selId) {
    if (A.boxRevealed) return;
    A.boxRevealed = true; if (selId) A.selSp = selId;
    var d = G.core.derive(s); G.tray.place(d.dice.map(A.spec), d.dice.map(function () { return 0; }));
  }
  function closeBox() { A.overlay = null; A.boxRes = null; A.boxList = null; A.boxPrev = null; }
  function shakeBox(t, cx, cy, reduce, col, big) {
    var shk = reduce ? 0 : Math.round(Math.sin(t * 50) * (1 + t * 3));
    if (big) { G.gfx.blitScaled(G.spr.box, cx - 46 + shk, cy - 6, 3); G.gfx.blitScaled(G.spr.box, cx + 10 - shk, cy - 6, 3); }
    G.gfx.blitScaled(G.spr.box, cx - 24 + shk, cy - 20 - (big ? 12 : 0), 4);
    if (!reduce && Math.floor(t * 12) % 2) G.gfx.pset(cx - 30 + Math.round(Math.random() * 60), cy - 26 + Math.round(Math.random() * 10), col);
  }
  function rays(t, cx, cy, rar, k) {
    var col = RAR_COL[rar], hi = RAR_HI[rar], a0 = t * 0.5, nr = 8 + rar * 4;
    for (var i = 0; i < nr; i++) {
      var a = a0 + i / nr * Math.PI * 2, L = (40 + rar * 14) * k;
      for (var w = -1; w <= 1; w++) {
        var ox = Math.round(-Math.sin(a) * w), oy = Math.round(Math.cos(a) * w * 0.7);
        G.gfx.line(cx + Math.round(Math.cos(a) * 16) + ox, cy + Math.round(Math.sin(a) * 12) + oy, cx + Math.round(Math.cos(a) * (16 + L)) + ox, cy + Math.round(Math.sin(a) * (12 + L * 0.7)) + oy, w === 0 ? hi : col, i % 2 ? 2 : 0);
      }
    }
  }
  function boxOpen(s) {
    dim();
    if (!A.boxRes && !A.boxList) { closeBox(); return; }
    A.boxT = (A.boxT || 0) + (G.app.dt || 1 / 60);
    var t = A.boxT, cx = 320, cy = 150, reduce = s.settings.reduce;
    var skip = U.inp.released && !A.boxRevealed && t > 0.15;
    if (A.boxList) return boxMany(s, t, cx, cy, reduce, skip);
    var r = A.boxRes, sp = G.core.spById(r.id), col = RAR_COL[r.rar], hi = RAR_HI[r.rar];
    if (skip) { A.boxT = t = 1.2; }
    if (t < 0.75) { shakeBox(t, cx, cy, reduce, r.rar >= 2 ? col : 4, false); return; }
    if (!boxSnd) { boxSnd = 1; G.audio.play(r.rar >= 2 ? 'align' : 'unlock'); if (!reduce) { G.orrery.burst(cx, cy, 14 + r.rar * 10, [hi, col, 4], 50 + r.rar * 15); if (r.rar >= 3) A.shake = 0.4; } if (r.rar >= 2) A.edge = { t: 0.8, d: 0.8, c: [hi, col] }; }
    rays(t, cx, cy, r.rar, Math.min(1, (t - 0.75) / 0.3));
    G.gfx.blitScaled(G.spr.box, cx - 24, cy + 18, 4);
    var up = Math.min(1, (t - 0.75) / 0.35), bounce = Math.round(Math.abs(Math.sin(up * Math.PI)) * 10 * (1 - up));
    var ic = G.dieIcon('d6', 'sp_' + r.id, 2.0);
    G.gfx.blit(ic, cx - (ic.w >> 1), cy - 4 - (ic.h >> 1) - Math.round(up * 26) - bounce);
    if (r.rar >= 3 && !reduce) { var tw = Math.floor(t * 8) % 4; G.gfx.blit(G.spr.twinkle[tw % 3], cx + 20, cy - 52); G.gfx.blit(G.spr.twinkle[(tw + 1) % 3], cx - 28, cy - 30); }
    if (t < 1.1) return;
    revealDone(s, r.id);
    var ty = 222;
    G.nine(G.spr.panel, 170, ty - 6, 300, 104);
    F.drawCenter(r.dust ? G.T('dup_dust', G.fmt(r.dust)) : (r.isNew ? G.T('new_die') : G.T('star_up', r.lv)), cx, ty, r.isNew ? 3 : 15, 'g9');
    F.drawCenter(G.nm('sp', r.id), cx, ty + 11, col, 'g11b', 12);
    F.drawCenter(G.T('rar' + r.rar), cx, ty + 27, col, 'g9');
    G.drawStars(cx - 14, ty + 39, r.lv, G.DATA.starMax);
    F.drawCenter(G.spText(sp.eff, G.core.spVal(s, r.id)), cx, ty + 49, 8, 'g9');
    if (r.auto) F.drawCenter(G.T('equipped_in', s.dice.map(function (d) { return d.sp; }).indexOf(r.id) + 1), cx, ty + 60, 15, 'g9');
    boxButtons(s, ty + 72);
  }
  function boxButtons(s, y) {
    var more = s.box > 0;
    if (U.button('boxok', more ? 186 : 260, y, 120, 20, G.T('b_box_close'), { font: 'g11b' }) || U.inp.keysPressed.Escape) closeBox();
    else if (more && U.button('boxag', 334, y, 120, 20, (s.box > 1 ? G.T('b_open_all') : G.T('b_open1')) + ' ' + s.box, { font: 'g11b', sfx: 'tap' })) G.openBoxesUi(s, s.box);
  }
  // 여러 개: 큰 상자 더미가 흔들리다 터지고, 주사위가 한 칸씩 굴러 나온다
  function boxMany(s, t, cx, cy, reduce, skip) {
    var L = A.boxList, G2 = L.groups, n = G2.length;
    var step = Math.min(0.16, 1.8 / n), endT = 0.85 + step * n;
    if (skip) { A.boxT = t = endT + 0.01; }
    if (t < 0.85) { shakeBox(t, cx, cy + 10, reduce, L.best >= 2 ? RAR_COL[L.best] : 4, true); F.drawCenter('×' + L.n, cx, cy + 40, 4, 'g11b', 12); return; }
    if (!boxSnd) { boxSnd = 1; G.audio.play('unlock'); if (!reduce) G.orrery.burst(cx, cy - 20, 30, [4, 3, 8], 60); }
    var shown = Math.min(n, Math.floor((t - 0.85) / step) + 1);
    if (shown > revealN) {
      var e = G2[shown - 1]; revealN = shown;
      if (e.rar >= 2) { G.audio.play('align'); A.edge = { t: 0.6, d: 0.6, c: [RAR_HI[e.rar], RAR_COL[e.rar]] }; if (e.rar >= 3 && !reduce) A.shake = 0.35; }
      else G.audio.play('tap');
    }
    if (t < endT) rays(t, cx, cy - 40, G2[shown - 1].rar, Math.min(1, (t - 0.85) / 0.3) * 0.7);
    // 격자: 8칸 × 2줄
    var pw = 8 * 44 + 24, ph = 2 * 52 + 78, px = cx - (pw >> 1), py = 112;
    G.nine(G.spr.panel, px, py, pw, ph);
    for (var i = 0; i < shown; i++) {
      var e2 = G2[i], x = px + 12 + (i % 8) * 44, y = py + 10 + Math.floor(i / 8) * 52;
      var age = t - 0.85 - i * step, pop = Math.min(1, age / 0.12);
      gx.rect(x, y, 40, 48, 23); gx.rect(x, y, 40, 2, RAR_COL[e2.rar]);
      var ic = G.dieIcon('d6', 'sp_' + e2.id, 1.15);
      gx.blit(ic, x + 20 - (ic.w >> 1), y + 20 - (ic.h >> 1) - Math.round((1 - pop) * 8));
      if (e2.n > 1) F.drawRight('×' + e2.n, x + 38, y + 4, 4, 'g7');
      if (e2.isNew) F.draw(G.T('tag_new'), x + 2, y + 4, 3, 'g7');
      for (var k = 0; k < e2.lv; k++) gx.rect(x + 6 + k * 6, y + 42, 4, 2, 3);
      if (U.over(x, y, 40, 48)) U.tip([{ t: G.nm('sp', e2.id), f: 'g11b', c: RAR_COL[e2.rar] }, { t: G.T('rar' + e2.rar) + ' · ' + G.T('star_up', e2.lv), c: 13 }, { t: G.spText(G.core.spById(e2.id).eff, G.core.spVal(s, e2.id)), c: 13 }], x, y);
    }
    if (t < endT) { F.drawCenter(G.T('skip_hint'), cx, py + ph - 20, 14, 'g9'); return; }
    revealDone(s, G2[n - 1].id);
    F.drawCenter(G.T('box_sum', L.n, L.news), cx, py + ph - 62, 4, 'g11b', 12);
    if (L.dust > 0) F.drawCenter(G.T('box_dust', G.fmt(L.dust)), cx, py + ph - 46, 15, 'g9');
    boxButtons(s, py + ph - 30);
  }
  G.overlays = { settings: settings, away: away, confirm: confirm, dim: dim, boxOpen: boxOpen };
})();

// 겹 창: 설정, 복귀 리포트, 확인
(function () {
  var A = G.app, gx = G.gfx, F = G.font, U = G.ui;
  function dim() { // 뒤 화면을 어둡게: 팔레트 안에서 한 단계씩 어두운 색으로 치환
    var map = [0, 0, 11, 2, 9, 10, 0, 5, 9, 10, 21, 18, 23, 12, 13, 14, 6, 20, 21, 16, 22, 23, 23, 23];
    gx.remapRect(0, 0, 640, 360, map);
  }
  function slider(id, x, y, w, v) {
    G.nine(G.spr.inset, x, y + 3, w, 7);
    var fw = Math.round((w - 4) * v);
    gx.rect(x + 2, y + 5, fw, 3, 2); gx.hline(x + 2, y + 5, fw, 3);
    var kx = x + 2 + fw - 3;
    var h = U.hitArea(id, x - 2, y - 2, w + 4, 17);
    gx.blit(G.spr.knob, kx - 2, y - 1);
    if (U.isActive(id) && U.inp.down) { v = Math.max(0, Math.min(1, (U.inp.x - x - 2) / (w - 4))); }
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
    if (U.button('cy', x + 12, y + h - 30, 120, 20, A.confirmYes || G.T('m_yes'), { font: 'g11b' })) { A.overlay = null; if (A.confirmFn) A.confirmFn(); }
    if (U.button('cn', x + w - 112, y + h - 30, 100, 20, G.T('m_no'), { font: 'g11b' }) || U.inp.keysPressed.Escape) A.overlay = null;
  }
  G.overlays = { settings: settings, away: away, confirm: confirm, dim: dim };
})();

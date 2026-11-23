// 타이틀: 상자 없는 글자 메뉴 + 주사위 선택 표시, 빈 곳을 누르면 시작
(function () {
  var A = G.app, gx = G.gfx, F = G.font, U = G.ui;
  var sel = 0, deco = null;
  function decoView() {
    if (deco) return deco;
    var tiers = { 2: 2, 3: 3, 4: 1, 5: 4, 6: 6, 7: 3, 8: 5, 9: 4, 10: 7, 11: 2, 12: 8 };
    var bodies = {}; var orbits = [];
    for (var s = 2; s <= 12; s++) { orbits.push(s); bodies[s] = { t: tiers[s], seed: s * 13 + 5, a0: s * 2.17 }; }
    deco = { orbits: orbits, bodies: bodies, stage: 0, sunForm: 0 };
    return deco;
  }
  function items() {
    var has = G.save.has();
    var it = [];
    if (has) it.push(['continue', G.T('m_continue')]);
    it.push(['new', G.T('m_new')]);
    it.push(['settings', G.T('m_settings')]);
    it.push(['credits', G.T('m_credits')]);
    return it;
  }
  function act(key) {
    G.audio.play('tap');
    if (key === 'continue') { if (A.loadGame()) { A.scene = 'play'; if (!A.s.settings.muted) G.audio.startBgm(A.s.collapses > 0 ? 1 : 0); } else start(); }
    else if (key === 'new') {
      if (G.save.has()) { A.confirmText = G.T('m_confirmNew'); A.confirmYes = G.T('m_yes'); A.confirmFn = start; A.overlay = 'confirm'; }
      else start();
    } else if (key === 'settings') { if (!A.s) { var p = G.save.load(); A.s = p || G.core.newState(); A.tmpTitle = !p; } A.overlay = 'settings'; }
    else if (key === 'credits') A.overlay = 'credits';
  }
  function start() { A.prevSettings = A.s ? A.s.settings : null; A.newGame(); A.scene = 'play'; if (!A.s.settings.muted) G.audio.startBgm(0); }
  function draw(dt) {
    var v = decoView();
    var saved = null;
    if (!A.titleInfo) { var p = G.save.load(); A.titleInfo = p ? { stage: G.stageOf(p), sun: G.sunOf(p), lang: p.settings.lang } : { stage: 0, sun: 0 }; if (p) { G.setLang(p.settings.lang); G.setNotation(p.settings.notation); } }
    v.stage = A.titleInfo.stage; v.sunForm = A.titleInfo.sun;
    G.starfield.draw(v.stage, A.t, 0, 0, 0, 0, 640, 360, 1);
    U.block(!!A.overlay);
    G.orrery.draw(v, A.t * 1.5, { noRuler: true, seedOff: 1 }); G.orrery.drawPops();
    // 오른쪽: 로고와 메뉴
    var lx = 430;
    var lw = G.embossMeasure('주사위', 3);
    G.embossText(G.getLang() === 'en' ? 'Dice' : '주사위', lx, 46, 3, [4, 3, 11], 'g11b', 12);
    G.embossText(G.getLang() === 'en' ? 'Orrery' : '성계', lx + 34, 86, 3, [8, 7, 10], 'g11b', 12);
    var sub = G.getLang() === 'en' ? '주사위 성계' : 'D I C E   O R R E R Y';
    F.draw(sub, lx + 2, 130, 8, 'g11b', 12);
    var it = items();
    if (sel >= it.length) sel = 0;
    var anyHit = false;
    it.forEach(function (m, i) {
      var y = 164 + i * 22;
      var w = F.measure(m[1], 'g11b');
      var h = U.hitArea('tm' + m[0], lx + 10, y - 3, w + 16, 18);
      if (h.over) { sel = i; anyHit = true; }
      var on = sel === i;
      if (on) gx.blit(G.spr.menuDie, lx, y + 2);
      F.draw(m[1], lx + 14 + (on ? 2 : 0), y, on ? 4 : 15, 'g11b', 12);
      if (h.clicked) act(m[0]);
    });
    if (!A.overlay) {
      if (U.inp.keysPressed.ArrowDown) { sel = (sel + 1) % it.length; G.audio.play('tab'); }
      if (U.inp.keysPressed.ArrowUp) { sel = (sel + it.length - 1) % it.length; G.audio.play('tab'); }
      if (U.inp.keysPressed.Enter || U.inp.keysPressed.Space) act(it[sel][0]);
      // 빈 곳 누르면 시작
      if (U.inp.released && !anyHit && !U.over(598, 336, 40, 20)) act(it[0][0] === 'continue' ? 'continue' : 'new');
    }
    // 소리 아이콘
    var muted = A.s ? A.s.settings.muted : true;
    gx.blit(muted ? G.spr.icMute11 : G.spr.icSnd11, 620, 342);
    F.draw('v1.0', 432, 344, 14, 'g7');
    U.block(false);
    if (A.overlay === 'settings') G.overlays.settings(A.s, true);
    else if (A.overlay === 'confirm') G.overlays.confirm(A.s);
  }
  G.sceneTitle = { draw: draw };
})();

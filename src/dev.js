// 개발·검수용 진입: ?demo=early|mid|late|col|end  (+&speed=N 시간 배속)
(function () {
  var C = G.core;
  function bot(s, secs) {
    var dt = 1, R = Math.random;
    for (var t = 0; t < secs; t += dt) {
      if (C.derive(s).interval === 0 || t < 300) { s.manualCd = 0; C.manualRoll(s); }
      C.tick(s, dt, {});
      if (s.ev.cur) C.catchEvent(s);
      var g = 0;
      while (g++ < 30) {
        var ups = G.UPGRADES.filter(function (u) { return !s.up[u.id] && C.upgradeVisible(s, u) && s.dust >= u.cost; });
        if (ups.length) { C.buyUpgrade(s, ups[0].id); continue; }
        if (s.dust >= C.costDie(s)) { C.buyDie(s); continue; }
        if (C.forgeUnlocked(s) && s.dust >= C.costForge(s) * 4) { var di = Math.floor(R() * s.dice.length), f = Math.floor(R() * s.dice[di].faces.length); if (C.forge(s, di, f, s.dice[di].faces[f] < 4 ? 1 : 1)) continue; }
        if (s.dust >= C.costWind(s) && C.costWind(s) <= C.costPower(s) * 1.5 && (C.derive(s).interval === 0 || C.derive(s).interval > 0.06)) { C.buyWind(s); continue; }
        if (s.dust >= C.costPower(s)) { C.buyPower(s); continue; }
        break;
      }
      var av = G.RESEARCH.filter(function (r) { return C.researchAvail(s, r) && s.cores >= r.cost; });
      if (av.length) C.buyResearch(s, av[0].id);
      var sv = G.SRESEARCH.filter(function (r) { return C.sresAvail(s, r) && s.sing >= r.cost && r.eff !== 'ending'; });
      if (sv.length) C.buySres(s, sv[0].id);
    }
  }
  G.devDemo = function (q) {
    var m = /demo=(\w+)/.exec(q); var name = m ? m[1] : '';
    var sp = /speed=(\d+)/.exec(q); if (sp) window.__timeScale = +sp[1];
    var s = C.newState(); s.settings.muted = true;
    var A = G.app; A.s = s; A.demo = true;
    if (name === 'fresh') { }
    if (name === 'early') bot(s, 150);
    if (name === 'mid') bot(s, 1500);
    if (name === 'late' || name === 'col' || name === 'end') {
      bot(s, 2400);
      for (var n = 0; n < (name === 'late' ? 4 : 9); n++) { while (!C.canNova(s)) bot(s, 300); C.nova(s); bot(s, 60); }
      bot(s, 1200);
    }
    if (name === 'col' || name === 'end') {
      var guard = 0;
      while (!C.canCollapse(s) && guard++ < 200) { bot(s, 300); if (C.canNova(s) && !C.canCollapse(s)) C.nova(s); }
      if (C.canCollapse(s)) C.collapse(s);
      s.sing += 200; s.singAll += 200;
      ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8'].forEach(function (id) { C.buySres(s, id); });
      C.setShape(s, 0, 'd8'); C.setShape(s, 1, 'd12');
      bot(s, 900);
    }
    if (name === 'end') { G.CHALLENGES.forEach(function (c) { s.chalDone[c.id] = 1; }); s.sing += 999; ['q9', 'q10', 'q11', 'q12'].forEach(function (id) { C.buySres(s, id); }); }
    C.invalidate();
    A.seenTabs = { machine: 1, rec: 1, upg: 1, dice: 1, nova: 1, col: 1, n_upg: 1, n_dice: 1, n_nova: 1, n_col: 1, n_chal: 1 };
    C.achQueue.length = 0;
    var d = C.derive(s);
    G.tray.place(d.dice.map(A.spec), d.dice.map(function () { return 0; }));
    A.applySettings();
    A.scene = 'play';
    var tab = /tab=(\w+)/.exec(q); if (tab) A.tab = tab[1];
    var sub = /sub=(\w+)/.exec(q); if (sub) { A.sub.nova = sub[1]; A.sub.rec = sub[1]; }
    if (/ov=settings/.test(q)) A.overlay = 'settings';
    if (/ov=away/.test(q)) { A.away = { secs: 3 * 3600 + 720, dust: 1.23e9, rolls: 5400, tierUps: 14, eff: 0.5 }; A.overlay = 'away'; }
    if (/ov=credits/.test(q)) A.overlay = 'credits';
    if (/ev=1/.test(q)) C.spawnEvent(s);
    if (/nova=1/.test(q) && C.canNova(s)) A.startNova();
  };
})();

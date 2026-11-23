// 메인 플레이 화면
(function () {
  var A = G.app, C = G.core, gx = G.gfx, F = G.font, U = G.ui;
  var PX = 416, PY = 20, PW = 224, PH = 340;

  function stageOf(s) {
    if (s.ended) return 4;
    if (s.collapses >= 5) return 4;
    if (s.collapses >= 1) return 3;
    if (s.novas >= 5) return 2;
    if (s.novas >= 1) return 1;
    return 0;
  }
  function sunOf(s) {
    if (s.ended || s.collapses >= 5) return 5;
    if (s.collapses >= 1) return 4;
    if (s.novas >= 6) return 3;
    if (s.novas >= 3) return 2;
    if (s.novas >= 1) return 1;
    return 0;
  }
  G.stageOf = stageOf; G.sunOf = sunOf;

  function buildView(s) {
    var d = C.derive(s);
    var v = A.view || {};
    v.orbits = d.orbits; v.bodies = s.bodies; v.stage = stageOf(s); v.sunForm = sunOf(s);
    var mt = C.maxTier(s), gt = mt < 8 ? 8 : (mt < 10 ? 10 : 0);
    var best = 0; Object.keys(s.bodies).forEach(function (k) { best = Math.max(best, s.bodies[k].m); });
    var nxt = gt ? d.th[gt - 2] : 0;
    v.goal = gt ? [G.T('goal_next', G.nm('tiers', gt)), nxt ? G.fmt(best) + ' / ' + G.fmt(nxt) : ''] : null;
    v.goalTip = gt ? [G.T('goal_now', G.nm('tiers', Math.max(1, mt))), nxt ? G.T('goal_mass', G.fmt(best), G.fmt(nxt)) + ' → ' + G.nm('tiers', mt + 1) : ''] : null;
    A.view = v;
    return v;
  }

  // ── 상단 바 ─────────────────────────────────────
  function topbar(s) {
    gx.rect(0, 0, 640, 20, 13); gx.hline(0, 17, 640, 18); gx.hline(0, 18, 640, 2); gx.hline(0, 19, 640, 12);
    gx.blit(G.spr.icDust, 5, 4);
    if (U.hitArea('dusttip', 2, 2, 140, 16).over) U.tip([{ t: G.T('tip_dust'), f: 'g11b', c: 12 }], 10, 10);
    var dl = F.draw(G.T('dust_lbl'), 16, 4, 8, 'g9', 12);
    var w = F.draw(G.fmt(s.dust), 20 + dl, 3, 3, 'g11b', 12) + dl + 3;
    var rate = C.production(s);
    F.draw('+' + G.fmt(rate, true) + G.T('per_sec'), 21 + w, 4, 8, 'g9', 12);
    var x = Math.max(150, 21 + w + F.measure('+' + G.fmt(rate, true) + G.T('per_sec'), 'g9') + 12);
    if (s.coresAll > 0 || s.novas > 0) { gx.blit(G.spr.icCore, x, 4); x += F.draw(G.fmt(s.cores), x + 12, 3, 7, 'g11b', 12) + 22; }
    if (s.singAll > 0 || s.collapses > 0) { gx.blit(G.spr.icSing, x, 4); x += F.draw(G.fmt(s.sing), x + 12, 3, 19, 'g11b', 12) + 22; }
    // 버프
    var B = s.ev.buffs, bx = Math.max(x, 300), d = C.derive(s);
    var hm = C.harmony(s, d);
    if (hm > 1.005) { var hw = F.draw(G.T('harmony', hm.toFixed(2)), bx, 4, 8, 'g9', 12); var hh = U.hitArea('harm', bx, 2, hw, 16); if (hh.over) U.tip([{ t: G.T('harmony', hm.toFixed(2)), f: 'g11b', c: 12 }, { t: G.T('tip_harmony'), c: 13 }, { t: G.effText('harmony', C.derive(s).harmonyPer), c: 13 }], bx, 10); bx += hw + 10; }
    var hidden = 0;
    [['flare', B.flare], ['pulsar', B.pulsar], ['rogue', B.rogue]].forEach(function (b) { if (b[1] > 0 && bx >= 470) hidden++; if (b[1] > 0 && bx < 470) bx += F.draw(G.T('buff_' + b[0]) + ' ' + Math.ceil(b[1]) + (G.getLang() === 'en' ? 's' : '초'), bx, 4, 7, 'g9', 12) + 8; });
    [['shower', B.shower], ['align', B.align], ['moons', B.moons]].forEach(function (b) { if (b[1] > 0 && bx >= 470) hidden++; if (b[1] > 0 && bx < 470) bx += F.draw(G.T('buff_' + b[0], Math.ceil(b[1])), bx, 4, 7, 'g9', 12) + 8; });
    if (hidden) F.draw('+' + hidden, bx, 4, 7, 'g9', 12);
    if (s.chal) F.drawRight(G.nm('chal', s.chal), 592, 4, 17, 'g9', 12);
    // 소리, 설정
    var sm = U.hitArea('snd', 598, 2, 16, 16);
    gx.blit(s.settings.muted ? G.spr.icMute11 : G.spr.icSnd11, 600, 4);
    if (sm.over) U.tip([{ t: s.settings.muted ? G.T('sound_off') : G.T('sound_on'), c: 12 }], 600, 10);
    if (sm.clicked) { s.settings.muted = !s.settings.muted; G.audio.unlock(); A.applySettings(); if (!s.settings.muted) { G.audio.startBgm(s.collapses > 0 ? 1 : 0); G.audio.play('tap'); } }
    var gm = U.hitArea('gear', 618, 2, 16, 16, !A.cut);
    gx.blit(G.spr.icGear11, 621, 4);
    if (gm.clicked) { A.overlay = 'settings'; G.audio.play('tap'); }
    if (sm.over || gm.over) { }
  }

  // ── 하늘 이벤트 그리기 ─────────────────────────
  function eventPos(e) {
    var p = 1 - e.life / G.DATA.eventLife;
    var x = e.dir > 0 ? -12 + p * 440 : 428 - p * 440;
    var y = 30 + e.y * 170 + Math.sin(p * 6) * 6;
    return { x: Math.round(x), y: Math.round(y) };
  }
  function drawEvent(s, t) {
    var e = s.ev.cur; if (!e) return;
    var p = eventPos(e);
    gx.setClip(0, 20, 416, 224);
    var type = e.type;
    var tail = e.dir > 0 ? -1 : 1;
    if (type === 'comet' || type === 'shower' || type === 'meteor') {
      var n = type === 'shower' ? 3 : 1;
      for (var k = 0; k < n; k++) {
        var ox = k * 9 * -tail, oy = k * 7;
        for (var i = 1; i < 18; i++) { var c = i < 4 ? 4 : (i < 9 ? 8 : (i < 14 ? 9 : 14)); if (i > 10 && (i + Math.floor(t * 20)) % 2) continue; gx.pset(p.x + ox + i * tail, p.y + oy + Math.round(i * 0.25), c); if (i < 8) gx.pset(p.x + ox + i * tail, p.y + oy + Math.round(i * 0.25) + 1, 9); }
        if (type === 'meteor') { var sp = G.planets.bodySprite(2, 5, Math.floor(t * 8) % 32); gx.blit(sp, p.x + ox - (sp.w >> 1), p.y + oy - (sp.h >> 1)); }
        else gx.blit(G.spr.comet, p.x + ox - 4, p.y + oy - 3, tail > 0);
      }
    } else if (type === 'flare') {
      var sp2 = G.planets.sunSprite(1, Math.floor(t * 8) % 48);
      // 작은 플레어: 중심만
      for (var a = 0; a < 12; a++) { var ang = a / 12 * Math.PI * 2 + t; var r = 5 + ((a + Math.floor(t * 6)) % 3); gx.pset(p.x + Math.round(Math.cos(ang) * r), p.y + Math.round(Math.sin(ang) * r), a % 2 ? 7 : 3); }
      gx.circleFill(p.x, p.y, 3, 3); gx.pset(p.x - 1, p.y - 1, 4); gx.pset(p.x, p.y - 1, 4);
    } else if (type === 'rogue') {
      var q = G.dice3d.qmul(G.dice3d.qaxis([0, 0, 1], t * 4), G.dice3d.qaxis([1, 0.4, 0], t * 3));
      var ds = G.dice3d.render({ shape: 'd6', faces: [2, 5, 1, 6, 3, 4], mat: 'ember' }, q, 0.9);
      gx.blit(ds, p.x - ds.R, p.y - ds.R);
    } else if (type === 'align') {
      for (var j = 0; j < 5; j++) { var sp3 = G.planets.bodySprite(3 + (j % 3), j + 1, Math.floor(t * 4) % 32); gx.blit(sp3, p.x - 20 + j * 10 - (sp3.w >> 1), p.y - (sp3.h >> 1)); }
    } else if (type === 'pulsar') {
      var sp4 = G.planets.bodySprite(10, 3, Math.floor(t * 10) % 32); gx.blit(sp4, p.x - (sp4.w >> 1), p.y - (sp4.h >> 1));
    } else if (type === 'moons') {
      var a2 = t * 3;
      var m1 = G.planets.bodySprite(3, 7, 0), m2 = G.planets.bodySprite(3, 11, 9);
      gx.blit(m1, p.x + Math.round(Math.cos(a2) * 6) - (m1.w >> 1), p.y + Math.round(Math.sin(a2) * 3) - (m1.h >> 1));
      gx.blit(m2, p.x - Math.round(Math.cos(a2) * 6) - (m2.w >> 1), p.y - Math.round(Math.sin(a2) * 3) - (m2.h >> 1));
    }
    // 잡을 수 있음을 알리는 반짝임 고리
    if (Math.floor(t * 3) % 2 === 0) { gx.pset(p.x - 9, p.y, 3); gx.pset(p.x + 9, p.y, 3); gx.pset(p.x, p.y - 9, 3); gx.pset(p.x, p.y + 9, 3); }
    gx.resetClip();
    var hx0 = Math.max(0, p.x - 18), hit = U.hitArea('event', hx0, Math.max(20, p.y - 16), Math.max(0, Math.min(416, p.x + 18) - hx0), 32);
    if (hit.over) U.tip([{ t: G.T('ev_' + type), f: 'g11b', c: 12 }, { t: evText(type, s), c: 13 }], p.x, p.y);
    if (hit.clicked || (hit.over && U.inp.pressed)) catchEv(s, p);
  }
  function evText(type, s, info) {
    var k = C.derive(s).eventMult;
    var nums = { shower: 20 * k, flare: 20 * k, rogue: 30 * k, align: Math.round(3 * k), pulsar: 20 * k, moons: 10 * k };
    if (nums[type] !== undefined) return G.T('evr_' + type, G.fmt(nums[type]));
    if (type === 'comet') return G.T('evr_comet', G.fmt(info ? info.dust : C.production(s) * 60 * C.derive(s).eventMult + 25));
    if (type === 'meteor') return info ? G.T('evr_meteor', info.sum, G.fmt(info.mass)) : G.T('ev_meteor');
    return G.T('evr_' + type);
  }
  function catchEv(s, p) {
    var info = C.catchEvent(s);
    if (!info) return;
    G.audio.play('evcatch');
    G.orrery.burst(p.x, p.y, 18, [4, 3, 8, 7], 40);
    G.orrery.pop(p.x, p.y - 12, G.T('ev_' + info.type), 4, 'g11b');
    A.notify([G.T('ev_' + info.type), evText(info.type, s, info)], 'ev');
  }

  // ── 궤도 툴팁 ───────────────────────────────────
  function orbitTip(s, v, mx, my) {
    var o = G.orrery.orbitAt(v, mx, my);
    v.hoverOrbit = o;
    if (o === null || o === undefined) return;
    var d = C.derive(s), b = s.bodies[o];
    var lines = [{ t: G.T('orb', o) + (b ? ' · ' + G.nm('tiers', b.t) : ''), f: 'g11b', c: 12 }];
    var p = d.dist[o] || 0;
    lines.push({ t: G.T('chance') + ' ' + G.pct(p) + ' · ' + G.T('rarity') + ' ×' + G.fmt(d.rarity(o), true), c: 13 });
    if (b) {
      lines.push({ t: G.T('mass') + ' ' + G.fmt(b.m) + (b.t < 10 ? ' / ' + G.fmt(d.th[b.t - 1]) : ''), c: 13 });
      lines.push({ t: G.T('prod') + ' ' + G.fmt(C.bodyRate(s, d, o, b) * C.harmony(s, d) * d.globalMult, true) + G.T('per_sec'), c: 13 });
    } else lines.push({ t: G.T('orb_empty'), c: 14 });
    if (!(d.dist[o] > 0)) lines.push({ t: G.T('orb_dead'), c: 17 }); else lines.push({ t: G.T('tip_rarity'), c: 11 });
    U.tip(lines, mx, my);
  }

  function draw(dt) {
    var s = A.s;
    var v = buildView(s);
    var shx = 0, shy = 0;
    if (A.shake > 0 && !s.settings.reduce) { shx = Math.round((Math.random() - 0.5) * 3); shy = Math.round((Math.random() - 0.5) * 3); }
    gx.setOffset(shx, shy);
    var cut = A.cut;
    U.block(!!A.overlay || !!cut);
    if (cut && G.sceneFx.cutDraw(cut, v, A.t)) { /* 연출이 성계를 대신 그림 */ }
    else G.orrery.draw(v, A.t, {});
    gx.setOffset(0, 0);
    if (!cut) drawEvent(s, A.t);
    // 쟁반
    var lh = U.hitArea('lever', G.tray.LEV.x, G.tray.LEV.y, G.tray.LEV.w, G.tray.LEV.h, !cut);
    G.tray.draw({ leverHot: lh.over || (s.stats.rolls === 0 && Math.floor(A.t * 2.5) % 2 === 0), leverHeld: lh.state === 'down', reduce: s.settings.reduce });
    G.orrery.drawPops();
    G.tray.drawBadge(A.shownSum, A.rollBadge && A.rollBadge.n > 1 ? A.rollBadge.n : 0);
    if (s.ev.cur && !cut && !A.overlay && U.inp.released && U.inp.x >= 0 && U.inp.x < 416 && U.inp.y >= 20 && U.inp.y < 244 && !U.hover()) catchEv(s, eventPos(s.ev.cur));
    var feltHit = U.hitArea('felt', G.tray.IN.x, G.tray.IN.y, G.tray.IN.w, G.tray.IN.h, !cut);
    if ((lh.clicked || feltHit.clicked) && !A.overlay) A.doManualRoll();
    if (U.inp.keysPressed.Space && !A.overlay && !cut) A.doManualRoll();
    // 누르고 있으면 반복 (연타 불필요)
    if (!A.overlay && !cut && (U.inp.keys.Space || ((lh.state === 'down' || feltHit.state === 'down') && U.inp.down)) && s.manualCd <= 0) { A.holdT = (A.holdT || 0) + dt; if (A.holdT > 0.35) A.doManualRoll(); } else if (!U.inp.down && !U.inp.keys.Space) A.holdT = 0;
    // 궤도 툴팁
    if (!A.overlay && !cut && U.inp.y >= 20 && U.inp.y < 244 && U.inp.x < 416 && !U.hover()) orbitTip(s, v, U.inp.x, U.inp.y);
    else v.hoverOrbit = null;
    if (v.goalTip && U.over(0, 246, 200, 20)) U.tip([{ t: v.goalTip[0], f: 'g11b', c: 12 }, { t: v.goalTip[1], c: 13 }], U.inp.x, U.inp.y - 40);
    topbar(s);
    // 오른쪽 판
    G.nine(G.spr.panel, PX, PY, PW, PH);
    G.panels.draw(s, PX, PY, PW, PH);
    if (cut) G.sceneFx.cutText(cut);
    U.block(false);
    // 겹 창
    if (A.overlay === 'settings') G.overlays.settings(s);
    else if (A.overlay === 'away') G.overlays.away(s);
    else if (A.overlay === 'confirm') G.overlays.confirm(s);
  }
  G.scenePlay = { draw: draw, stageOf: stageOf, buildView: buildView };
})();

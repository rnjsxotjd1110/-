// 오른쪽 판의 탭 내용
(function () {
  var A = G.app, C = G.core, gx = G.gfx, F = G.font, U = G.ui;
  var X0, Y0, W0;

  function costLine(x, y, cost, ok, icon) {
    gx.blit(icon || G.spr.icDust, x, y + 2);
    F.draw(isFinite(cost) ? G.fmt(cost) : '-', x + 12, y, ok ? 3 : 9, 'g11b', 12);
  }
  function btn(id, x, y, w, h, label, en, style) { return U.button(id, x, y, w, h, label, { enabled: en, font: 'g11b', style: style, sfx: 'buy' }); }

  // ── 기계 ───────────────────────────────────────
  function plate(i, icon, name, lv, eff, cost, ok, label, en, onClick, icon2) {
    var px = X0 + (i % 2) * 106, py = Y0 + 2 + Math.floor(i / 2) * 90, pw = 102, ph = 86;
    G.nine(G.spr.inset, px, py, pw, ph);
    gx.blit(icon, px + 5, py + 5);
    F.draw(name, px + 23, py + 5, 4, 'g11b', 12);
    if (U.over(px, py, pw, 30) && plate.tips) U.tip([{ t: plate.tips[i], c: 12 }], U.inp.x, U.inp.y);
    F.draw(lv, px + 6, py + 22, 15, 'g9');
    F.wrap(eff, pw - 10, 'g9').slice(0, 2).forEach(function (l, k) { F.draw(l, px + 6, py + 32 + k * 9, 8, 'g9'); });
    if (cost !== null) costLine(px + 6, py + 51, cost, ok, icon2);
    if (cost === null && !en && i < 3) return;
    if (btn('pl' + i, px + 5, py + 65, pw - 10, 18, label, en)) onClick();
    else if (U.inp.released && U.over(px + 5, py + 65, pw - 10, 18) && !en && cost !== null) G.audio.play('deny');
  }
  plate.tips = null;
  function machine(s) {
    plate.tips = [G.T('tip_power'), G.T('tip_wind'), G.T('tip_dice'), G.T('tip_con')];
    var d = C.derive(s);
    var cp = C.costPower(s);
    plate(0, G.spr.icPower, G.T('power'), G.T('lv', s.lv.power), G.T('power_eff', G.fmt(d.power, true)), cp, s.dust >= cp, G.T('b_power'), s.dust >= cp, function () { C.buyPower(s); });
    var cw = C.costWind(s), wmax = d.interval > 0 && d.interval <= G.DATA.wind.intMin * 1.001 && !s.ev.buffs.pulsar;
    plate(1, G.spr.icWind, G.T('wind'), G.T('lv', s.lv.wind), s.lv.wind ? (wmax ? G.T('wind_max') : G.T('wind_eff', d.interval >= 1 ? d.interval.toFixed(1) : d.interval.toFixed(2))) : G.T('wind_none'),
      wmax ? null : cw, s.dust >= cw, G.T('b_wind'), !wmax && s.dust >= cw, function () { C.buyWind(s); });
    var cd = C.costDie(s), full = !isFinite(cd);
    var dk = Object.keys(d.dist).map(Number).filter(function (k) { return d.dist[k] > 0; });
    var orb = [Math.min.apply(null, dk), Math.max.apply(null, dk)];
    var chalBlock = full && s.dice.length < C.maxDice(s) && s.dice.length + 1 > C.chalMinOrbit(s);
    plate(2, G.spr.icDie, G.T('dice'), G.T('n_dice', s.dice.length), chalBlock ? G.T('dice_chal', C.chalMinOrbit(s)) : (full ? G.T('dice_max') : G.T('dice_eff', orb[0], orb[orb.length - 1])),
      full ? null : cd, s.dust >= cd, G.T('b_dice'), !full && s.dust >= cd, function () { if (C.buyDie(s)) G.audio.play('unlock'); });
    contractCard(s, X0 + 106, Y0 + 92, 102, 86);
    histogram(s, d, X0, Y0 + 186, W0, 46, false);
    // 최근 합
    var ry = Y0 + 262;
    U.groove(X0, ry - 6, W0);
    F.draw(G.T('recent'), X0 + 2, ry + 3, 8, 'g9');
    for (var i = 0; i < 7; i++) {
      var x = X0 + 48 + i * 23;
      G.nine(G.spr.inset, x, ry, 21, 17);
      if (s.last[i] !== undefined) F.drawCenter(String(s.last[i]), x + 11, ry + 3, i === 0 ? 4 : 15, 'g11b');
    }
    // 정렬 확률
    var pa = 0; Object.keys(d.al).forEach(function (k) { pa += d.al[k]; });
    var alh = U.hitArea('alignline', X0, ry + 22, W0, 12);
    if (alh.over) U.tip([{ t: G.T('tip_align'), c: 12 }], U.inp.x, U.inp.y);
    F.draw(G.T('align_pop').replace('!', '') + ' ' + G.pct(pa) + ' · ×' + G.fmt(d.alignMult, true), X0 + 2, ry + 24, 8, 'g9');
  }

  // ── 관측 의뢰 칸 ───────────────────────────────
  var CON_SPK = { orbit: 'seo', align: 'do', event: 'seo', dust: 'kwan' };
  var SPK_COL = { kwan: 7, do: 19, seo: 3 };
  function conGoalText(c) {
    if (c.type === 'orbit') return G.T('con_orbit', c.sum, G.nm('tiers', c.tier));
    if (c.type === 'align') return G.T('con_align', G.fmt(c.n));
    if (c.type === 'event') return G.T('con_event');
    return G.T('con_dust', G.fmt(c.n));
  }
  G.conGoalText = conGoalText;
  function contractCard(s, px, py, pw, ph) {
    G.nine(G.spr.inset, px, py, pw, ph);
    var fl = A.conFlash || 0;
    if (fl > 0 && Math.floor(fl * 10) % 2) { gx.hline(px + 2, py + 1, pw - 4, 4); gx.hline(px + 2, py + ph - 2, pw - 4, 4); }
    gx.blit(G.spr.icScroll, px + 5, py + 5);
    F.draw(G.T('forge'), px + 23, py + 5, 4, 'g11b', 12);
    if (U.over(px, py, pw, 30)) U.tip([{ t: G.T('tip_con'), c: 12 }], U.inp.x, U.inp.y);
    if (!C.conUnlocked(s)) { F.wrap(G.T('con_lock'), pw - 10, 'g9').slice(0, 2).forEach(function (l, k) { F.draw(l, px + 6, py + 26 + k * 9, 15, 'g9'); }); return; }
    var c = s.con.cur;
    if (!c) {
      F.draw(G.T('con_wait', Math.ceil(s.con.wait)), px + 6, py + 26, 15, 'g9');
      return;
    }
    var spk = CON_SPK[c.type];
    F.draw(G.T('spk_' + spk), px + 6, py + 22, SPK_COL[spk], 'g9');
    F.wrap(conGoalText(c), pw - 10, 'g9').slice(0, 2).forEach(function (l, k) { F.draw(l, px + 6, py + 31 + k * 9, 4, 'g9'); });
    // 진행 막대 + 남은 시간
    var pr = C.conProgress(s, c), bw = pw - 38;
    G.nine(G.spr.insetDark, px + 6, py + 53, bw, 7);
    var fw = Math.round((bw - 4) * pr); if (fw > 0) { gx.rect(px + 8, py + 55, fw, 3, 3); gx.hline(px + 8, py + 55, fw, 4); }
    var urgent = c.left < 30;
    F.drawRight(G.T('con_left', Math.ceil(c.left)), px + pw - 5, py + 52, urgent && Math.floor(A.t * 3) % 2 ? 17 : 15, 'g9');
    gx.blit(G.spr.box, px + pw - 17 - (c.type === 'align' || c.type === 'event' ? 12 : 0), py + 21);
    if (c.type === 'align' || c.type === 'event') gx.blit(G.spr.fateGem, px + pw - 15, py + 20);
    var rcd = s.con.rcd || 0;
    var lab = rcd > 0 ? G.T('b_reroll') + ' ' + Math.ceil(rcd) : G.T('b_reroll');
    if (U.button('conrr', px + 5, py + 65, pw - 10, 18, lab, { enabled: rcd <= 0, font: 'g9' })) { if (C.rerollContract(s)) G.audio.play('tab'); }
  }

  // 분포 그래프. carved=true면 깎지 않은 분포 눈금도 표시
  function histogram(s, d, x, y, w, h, withStd) {
    F.draw(G.T('dist'), x + 2, y, 8, 'g9');
    var orb = d.orbits.filter(function (o) { return d.dist[o] > 0 || (withStd && d.std[o] > 0); }), n = orb.length;
    var cw = Math.max(3, Math.floor(w / n)), tw = cw * n, bx = x + Math.floor((w - tw) / 2);
    var by = y + 12 + h;
    var pm = 0; orb.forEach(function (o) { pm = Math.max(pm, d.dist[o] || 0, withStd ? (d.std[o] || 0) : 0); });
    var hov = A.view && A.view.hoverOrbit, lastS = A.shownSum !== undefined ? A.shownSum : s.last[0], lastLX = -99;
    orb.forEach(function (o, i) {
      var p = d.dist[o] || 0;
      var hgt = Math.max(p > 0 ? 1 : 0, Math.round(p / pm * h));
      var xx = bx + i * cw;
      var hot = o === hov, lastHit = o === lastS;
      var body = cw > 3 ? cw - 1 : cw;
      for (var j = 0; j < hgt; j++) {
        var c = j === hgt - 1 ? (hot || lastHit ? 4 : 2) : (hot || lastHit ? 8 : 11);
        gx.hline(xx, by - j, body, c);
      }
      if (body > 2 && hgt > 1) gx.vline(xx + body - 1, by - hgt + 2, hgt - 2, hot || lastHit ? 9 : 18);
      if (withStd) { var ps = d.std[o] || 0; if (ps > 0) { var hs = Math.round(ps / pm * h); gx.hline(xx, by - hs, body, 15); } }
      // 아래 숫자
      var stepL = Math.max(1, Math.ceil((F.measure(String(orb[n - 1]), 'g7') + 4) / cw));
      var showLbl = (o % stepL) === 0;
      var lwid = F.measure(String(o), 'g7');
      if (showLbl && xx + (body >> 1) - (lwid >> 1) > lastLX + 3) { F.drawCenter(String(o), xx + (body >> 1), by + 3, hot ? 4 : (s.bodies[o] ? 8 : 14), 'g7'); lastLX = xx + (body >> 1) + (lwid >> 1); }
      // 막대 위에 마우스
      var ha = U.hitArea('hb' + o, xx, by - h, cw, h + 10);
      if (ha.over) { A.view.hoverOrbitPanel = o; U.tip([{ t: G.T('orb', o), f: 'g11b', c: 12 }, { t: G.T('chance') + ' ' + G.pct(p) + ' · ' + G.T('rarity') + ' ×' + G.fmt(d.rarity(o), true), c: 13 }], U.inp.x, U.inp.y); }
    });
    gx.hline(bx, by + 1, tw, 18);
  }

  // ── 개량 ───────────────────────────────────────
  function upgrades(s) {
    var vis = G.UPGRADES.filter(function (u) { return C.upgradeVisible(s, u); });
    var hidden = G.UPGRADES.length - vis.length;
    var sel = A.selUpg && G.UPGRADES.filter(function (u) { return u.id === A.selUpg; })[0];
    if (!sel || !C.upgradeVisible(s, sel)) { sel = vis.filter(function (u) { return !s.up[u.id]; })[0] || vis[0]; A.selUpg = sel && sel.id; }
    var TIER_F = [[11, 18], [15, 14], [3, 2], [7, 5], [19, 16], [4, 8]];
    vis.forEach(function (u, i) {
      var x = X0 + (i % 8) * 26, y = Y0 + 2 + Math.floor(i / 8) * 26;
      var blk = C.pairBlocked(s, u);
      var own = !!s.up[u.id], ok = !own && !blk && s.dust >= u.cost;
      var h = U.hitArea('ug' + u.id, x, y, 24, 24);
      var rn = (G.nm('up', u.id).match(/ (\d)$/) || [])[1];
      var ti = rn ? +rn - 1 : 0;
      var fc = TIER_F[Math.max(0, ti)];
      gx.rect(x + 1, y + 1, 22, 22, own ? 13 : 21);
      gx.hline(x + 1, y, 22, fc[0]); gx.vline(x, y + 1, 22, fc[0]); gx.hline(x + 1, y + 23, 22, fc[1]); gx.vline(x + 23, y + 1, 22, fc[1]);
      if (own) { gx.hline(x + 1, y + 1, 22, 12); }
      var ic = G.spr.cat[u.cat] || G.spr.cat.lens;
      gx.blit(ic, x + 5, y + 5, false, own || ok ? null : SIL);
      for (var tp = 0; tp <= ti; tp++) gx.rect(x + 19 - tp * 3, y + 19, 2, 2, blk ? 14 : 4);
      if (u.pair) { gx.rect(x + 2, y + 19, 2, 2, blk ? 14 : 7); gx.pset(x + 4, y + 20, blk ? 14 : 7); }
      if (blk) { for (var bk = 2; bk < 12; bk++) { gx.pset(x + 5 + bk, y + 5 + bk, 14); gx.pset(x + 18 - bk, y + 5 + bk, 14); } }
      if (ok && Math.floor(A.t * 2) % 2 === 0) { gx.rect(x + 19, y + 2, 2, 2, 3); }
      if (sel && sel.id === u.id) { gx.hline(x - 1, y - 2, 26, 4); gx.hline(x - 1, y + 25, 26, 4); gx.vline(x - 2, y - 1, 26, 4); gx.vline(x + 25, y - 1, 26, 4); }
      if (h.over) { var tl = [{ t: G.nm('up', u.id), f: 'g11b', c: 12 }, { t: G.effText(u.eff, u.v), c: 13 }, { t: own ? G.T('bought') : (blk ? G.T('pair_taken', G.nm('up', C.pairOf(u).id)) : G.fmt(u.cost)), c: own ? 11 : (ok ? 5 : 14) }]; if (u.pair && !own && !blk) tl.push({ t: G.T('pair_or') + ' ' + G.nm('up', C.pairOf(u).id), c: 7 }); U.tip(tl, x, y); }
      if (h.clicked) { A.selUpgLock = u.id; A.selUpg = u.id; G.audio.play('tab'); }
    });
    if (hidden > 0) {
      var i2 = vis.length, x2 = X0 + (i2 % 8) * 26, y2 = Y0 + 2 + Math.floor(i2 / 8) * 26;
      G.nine(G.spr.tile, x2, y2, 24, 24); F.drawCenter('?', x2 + 12, y2 + 6, 14, 'g11b');
    }
    // 고른 개량
    var dy = Y0 + 112;
    U.groove(X0, dy, W0);
    if (sel) {
      var own2 = !!s.up[sel.id];
      gx.blit(G.spr.cat[sel.cat], X0 + 2, dy + 9);
      F.draw(G.nm('up', sel.id), X0 + 22, dy + 9, 4, 'g11b', 12);
      F.wrap(G.effText(sel.eff, sel.v), W0 - 24, 'g9').slice(0, 2).forEach(function (l, k) { F.draw(l, X0 + 22, dy + 24 + k * 10, 8, 'g9'); });
      var blk2 = C.pairBlocked(s, sel), par = C.pairOf(sel);
      if (par && !own2) {
        var pl = blk2 ? G.T('pair_taken', G.nm('up', par.id)) : G.T('pair_or') + ' ' + G.nm('up', par.id);
        F.draw(pl, X0 + 22, dy + 60, 7, 'g9');
        if (U.over(X0 + 22, dy + 58, F.measure(pl, 'g9') + 4, 12)) U.tip([{ t: G.T('tip_pair'), c: 12 }], U.inp.x, U.inp.y);
      }
      if (own2) F.draw(G.T('bought'), X0 + 22, dy + 44, 2, 'g11b');
      else if (blk2) { }
      else {
        costLine(X0 + 22, dy + 44, sel.cost, s.dust >= sel.cost);
        if (btn('ugbuy', X0 + W0 - 92, dy + 41, 90, 19, G.T('b_buy'), s.dust >= sel.cost)) { C.buyUpgrade(s, sel.id); A.selUpgLock = null; }
      }
    }
    var nextU = G.UPGRADES.filter(function (u) { return !C.upgradeVisible(s, u); })[0];
    if (nextU) F.draw(G.T('upg_next', G.fmt(nextU.req)), X0 + 2, dy + 74, 15, 'g9');
    // 지금 걸린 효과
    var d = C.derive(s);
    var sy2 = dy + 92;
    U.groove(X0, sy2 - 4, W0);
    var rows = [[G.T('prod'), '×' + G.fmt(d.globalMult, true)], [G.T('mass'), '×' + G.fmt(d.power, true)], [G.T('align_pop').replace('!', ''), '×' + G.fmt(d.alignMult, true)],
      [G.T('n_bodies'), String(Object.keys(s.bodies).length)],
      [G.T('harmony', '').replace('×', '').trim(), '×' + C.harmony(s, d).toFixed(2)], [G.T('roller_s'), d.interval ? d.interval.toFixed(2) + 's' : '-']];
    rows.forEach(function (r, i) {
      var cx2 = X0 + (i % 2) * 106, cy2 = sy2 + 4 + Math.floor(i / 2) * 15;
      F.draw(r[0], cx2 + 2, cy2, 15, 'g9');
      F.drawRight(r[1], cx2 + 100, cy2 - 1, 4, 'g11b');
    });
    var owned = G.UPGRADES.filter(function (u) { return s.up[u.id]; }).length;
    F.drawRight(G.T('owned_n', owned, G.UPGRADES.length), X0 + W0 - 2, dy + 10, 15, 'g9');
  }
  var MEDAL = (function () { var base = []; for (var i = 0; i < 24; i++) base[i] = i; var sets = [[3, 2, 11, 4], [19, 16, 6, 4], [7, 5, 10, 8], [15, 14, 13, 4], [8, 9, 10, 4], [17, 20, 22, 8], [2, 1, 0, 4], [4, 8, 9, 4]]; return sets.map(function (c) { var m = base.slice(); m[3] = c[0]; m[2] = c[1]; m[11] = c[2]; m[4] = c[3]; return m; }); })();
  var SIL = []; for (var si2 = 0; si2 < 24; si2++) SIL[si2] = si2 === 12 ? 12 : 13;
  var DIM = []; for (var di = 0; di < 24; di++) DIM[di] = di; [4, 8, 3, 7, 19, 2].forEach(function (c) { DIM[c] = 15; }); [9, 5, 16, 11, 1, 10].forEach(function (c) { DIM[c] = 14; }); [17, 20].forEach(function (c) { DIM[c] = 14; });

  // ── 주사위 보관함 ──────────────────────────────
  var RAR_COL = [15, 19, 7, 3];
  var iconCache = {};
  function dieIcon(shape, mat, size) {
    var key = shape + mat + size;
    if (iconCache[key]) return iconCache[key];
    var D3 = G.dice3d;
    var q = D3.qmul(D3.qaxis([1, 0, 0], 0.22), D3.restQuat(shape, 0, 0.38));
    var die = { shape: shape, faces: C.newDie(shape).faces, mat: mat };
    return (iconCache[key] = D3.render(die, q, size, -1, false));
  }
  G.dieIcon = dieIcon;
  function stars(x, y, n, max) { for (var i = 0; i < max; i++) gx.blit(i < n ? G.spr.star : G.spr.starOff, x + i * 6, y); }
  G.drawStars = stars;
  function refreshTray2() { var d = C.derive(A.s); G.tray.place(d.dice.map(A.spec), d.dice.map(function () { return 0; })); }
  function dicePanel(s) {
    var y = Y0 + 2;
    // 상자를 여는 중에는 열기 전 보관함을 보여 준다 (결과를 미리 보여 주지 않음)
    var hideBox = A.overlay === 'box' && A.boxPrev && !A.boxRevealed;
    var coll = hideBox ? A.boxPrev.coll : s.coll;
    if (A.selSlot === undefined || A.selSlot >= s.dice.length) A.selSlot = 0;
    F.draw(G.T('tray_slots') + ' · ' + (s.dice[0] ? s.dice[0].shape : 'd6'), X0 + 2, y + 2, 15, 'g9');
    var owned = G.SPDICE.filter(function (x) { return coll[x.id]; }).length;
    if (U.button('autoeq', X0 + W0 - 96, y - 1, 94, 15, G.T('b_auto'), { enabled: owned > 0, font: 'g9' })) { C.autoEquip(s); refreshTray2(); G.audio.play('forge'); }
    // 쟁반 칸
    var sw = Math.min(34, Math.floor((W0 + 2) / Math.max(1, s.dice.length)) - 2), sy = y + 16;
    s.dice.forEach(function (die, i) {
      var x = X0 + i * (sw + 2), sel = A.selSlot === i;
      var h = U.hitArea('slot' + i, x, sy, sw, 36);
      G.nine(sp ? G.spr.tileOwn : G.spr.tile, x, sy, sw, 36);
      var dsp = hideBox ? A.boxPrev.slots[i] : die.sp;
      var sp = dsp && coll[dsp] ? C.spById(dsp) : null;
      var ic = dieIcon(die.shape, sp ? 'sp_' + sp.id : A.spec(die, 0).mat, 1.0);
      gx.blit(ic, x + (sw >> 1) - (ic.w >> 1), sy + 17 - (ic.h >> 1));
      if (sp) gx.rect(x + 2, sy + 2, sw - 4, 2, RAR_COL[sp.rar]);
      F.drawCenter(String(i + 1), x + (sw >> 1), sy + 27, sel ? 4 : 14, 'g7');
      if (sel) { gx.hline(x, sy - 2, sw, 4); gx.hline(x, sy + 37, sw, 4); gx.vline(x - 2, sy, 36, 4); gx.vline(x + sw + 1, sy, 36, 4); }
      if (h.over) U.tip([{ t: sp ? G.nm('sp', sp.id) : G.T('plain_die'), f: 'g11b', c: sp ? RAR_COL[sp.rar] : 12 }].concat(sp ? [{ t: G.spText(sp.eff, C.spVal(s, sp.id)), c: 13 }] : []), x, sy);
      if (h.clicked) { A.selSlot = i; if (sp) A.selSp = sp.id; G.audio.play('tab'); }
    });
    // 보관함 격자 (그림만, 수치는 고른 칸 설명에서)
    var gy = sy + 44;
    U.groove(X0, gy - 3, W0);
    F.draw(G.T('coll_title', owned, G.SPDICE.length), X0 + 2, gy + 1, 15, 'g9');
    G.SPDICE.forEach(function (sp, i) {
      var x = X0 + (i % 8) * 26, yy = gy + 13 + Math.floor(i / 8) * 28;
      var lv = coll[sp.id] || 0, sel = A.selSp === sp.id;
      var slot = -1; s.dice.forEach(function (d, k) { if ((hideBox ? A.boxPrev.slots[k] : d.sp) === sp.id) slot = k; });
      var h = U.hitArea('sp' + sp.id, x, yy, 24, 26);
      gx.rect(x + 1, yy + 1, 22, 24, lv ? 21 : 23);
      gx.hline(x + 1, yy, 22, lv ? RAR_COL[sp.rar] : 14); gx.hline(x + 1, yy + 25, 22, 12); gx.vline(x, yy + 1, 24, 12); gx.vline(x + 23, yy + 1, 24, 12);
      var ic = dieIcon('d6', 'sp_' + sp.id, 0.82);
      gx.setClip(x + 1, yy + 1, 22, 20); gx.blit(ic, x + 12 - (ic.w >> 1), yy + 11 - (ic.h >> 1), false, lv ? null : SIL); gx.resetClip();
      if (lv) for (var k = 0; k < lv; k++) gx.rect(x + 3 + k * 4, yy + 21, 2, 2, 3);
      if (slot >= 0) F.draw(String(slot + 1), x + 17, yy + 17, 4, 'g7');
      if (sp.rar === 3 && lv && Math.floor(A.t * 3 + i) % 5 === 0) { gx.pset(x + 5, yy + 4, 4); gx.pset(x + 18, yy + 15, 4); }
      if (sel) { gx.hline(x - 1, yy - 2, 26, 4); gx.hline(x - 1, yy + 27, 26, 4); gx.vline(x - 2, yy - 1, 28, 4); gx.vline(x + 25, yy - 1, 28, 4); }
      if (h.clicked) { A.selSp = sp.id; G.audio.play('tab'); }
    });
    // 고른 주사위
    var iy = gy + 72;
    U.groove(X0, iy - 3, W0);
    var cur = A.selSp ? C.spById(A.selSp) : null;
    if (cur) {
      var lv2 = coll[cur.id] || 0;
      F.draw(lv2 ? G.nm('sp', cur.id) : '???', X0 + 2, iy + 2, lv2 ? RAR_COL[cur.rar] : 14, 'g11b', 12);
      F.drawRight(G.T('rar' + cur.rar), X0 + W0 - 2, iy + 3, RAR_COL[cur.rar], 'g9');
      stars(X0 + 2, iy + 17, lv2, G.DATA.starMax);
      var v = lv2 ? C.spVal(s, cur.id) : cur.v;
      F.draw(G.spText(cur.eff, v), X0 + 36, iy + 16, lv2 ? 8 : 14, 'g9');
      var inSel = s.dice[A.selSlot] && s.dice[A.selSlot].sp === cur.id;
      if (!lv2) F.draw(G.T('not_owned'), X0 + 2, iy + 31, 14, 'g9');
      else {
        var where = -1; s.dice.forEach(function (d, k) { if (d.sp === cur.id) where = k; });
        if (where >= 0) F.draw(G.T('equipped_in', where + 1), X0 + 2, iy + 31, 15, 'g9');
        var lab = inSel ? G.T('b_unequip') : G.T('b_equip');
        if (U.button('eq', X0 + W0 - 84, iy + 28, 82, 17, lab + (inSel ? '' : ' ' + (A.selSlot + 1)), { font: 'g9' })) { C.equip(s, A.selSlot, inSel ? null : cur.id); refreshTray2(); G.audio.play('forge'); }
      }
    } else F.draw(G.T('pick_slot'), X0 + 2, iy + 4, 15, 'g9');
    // 상자
    var by = iy + 52;
    U.groove(X0, by - 3, W0);
    gx.blitScaled(G.spr.box, X0 + 4, by + 3, 2);
    if (s.box > 0 && Math.floor(A.t * 2) % 2) { gx.pset(X0 + 2, by + 4, 4); gx.pset(X0 + 28, by + 2, 4); }
    F.draw('×' + G.fmt(s.box), X0 + 32, by + 4, s.box > 0 ? 4 : 15, 'g11b', 12);
    F.draw(s.box > 0 || (s.stats.boxes || 0) ? G.T('box_odds') : G.T('box_none'), X0 + 34, by + 20, 15, 'g7');
    if (U.button('obox', X0 + W0 - 132, by + 1, 62, 17, G.T('b_open1'), { enabled: s.box > 0, font: 'g9', sfx: 'tap' })) G.openBoxesUi(s, 1);
    if (U.button('oboxall', X0 + W0 - 66, by + 1, 64, 17, G.T('b_open_all'), { enabled: s.box > 1, font: 'g9', sfx: 'tap' })) G.openBoxesUi(s, s.box);
  }
  // 모양 비교용: 한 번 굴림의 기대 질량, 궤도 범위, 정렬 확률
  function shapeStats(s) {
    var d = C.derive(s), pa = 0; Object.keys(d.al).forEach(function (k) { pa += d.al[k]; });
    var ks = Object.keys(d.dist).map(Number).filter(function (k) { return d.dist[k] > 0; });
    return { mass: C.rollValue(s) * d.power * d.batchDieMult, orb: Math.min.apply(null, ks) + '~' + Math.max.apply(null, ks), al: pa, alm: d.alignMult };
  }

  // ── 초신성 ─────────────────────────────────────
  function bigBar(x, y, w, frac, ramp) {
    G.nine(G.spr.inset, x, y, w, 9);
    var fw = Math.round((w - 4) * Math.max(0, Math.min(1, frac)));
    if (fw > 0) { gx.rect(x + 2, y + 2, fw, 5, ramp[1]); gx.hline(x + 2, y + 2, fw, ramp[0]); }
  }
  function novaTop(s) {
    var d = C.derive(s);
    var y = Y0 + 2;
    if (C.canNova(s)) {
      var g = C.novaGain(s);
      if (U.button('novabtn', X0, y, W0, 22, G.T('nova_btn'), { style: 'core', font: 'g11b', sfx: 'tap' })) { A.confirmText = G.T('nova_confirm', G.fmt(g)) + (s.chal ? ' ' + G.T('nova_chal_warn') : ''); A.confirmYes = G.T('nova_btn'); A.confirmFn = A.startNova; A.overlay = 'confirm'; }
      F.draw(G.T('nova_gain', G.fmt(g)), X0 + 2, y + 27, 7, 'g11b', 12);
      F.draw(G.T('total_mass', G.fmt(C.totalMass(s)), G.fmt(C.novaNext(s))), X0 + 2, y + 41, 8, 'g9');
    } else {
      F.draw(G.T('nova_need'), X0 + 2, y + 2, 8, F.measure(G.T('nova_need'), 'g11') > W0 - 4 ? 'g9' : 'g11');
      var mt = C.maxTier(s), best = 0;
      Object.keys(s.bodies).forEach(function (k) { best = Math.max(best, s.bodies[k].m); });
      var need = d.th[G.DATA.novaTier - 2], prev = d.th[G.DATA.novaTier - 3];
      var frac = best > prev ? (Math.log(best) - Math.log(prev)) / (Math.log(need) - Math.log(prev)) : 0;
      frac = Math.min(0.97, frac);
      bigBar(X0, y + 18, W0, frac, [8, 7]);
      F.draw(G.nm('tiers', Math.max(1, mt)) + ' → ' + G.nm('tiers', 8), X0 + 2, y + 29, 15, 'g9');
      F.drawRight(G.fmt(best) + ' / ' + G.fmt(need), X0 + W0 - 2, y + 29, 8, 'g9');
    }
    if (C.res(s, 's6')) {
      // 자동 초신성: [자동 켜짐/꺼짐] [기준 25%] — 기준은 눌러서 10·25·50·100% 순으로 바꿈
      var an = C.autoNovaNeed(s), ag = C.novaGain(s), pct = s.settings.autoNovaPct || 25;
      var ay = C.canNova(s) ? y + 28 : y + 41;
      var l2 = G.T('auto_nova_pct', pct), l1 = G.T('auto_nova_s') + ' ' + (s.chal && s.settings.autoNova ? G.T('auto_nova_paused') : (s.settings.autoNova ? G.T('on') : G.T('off')));
      var w2 = F.measure(l2, 'g9'), w1 = F.measure(l1, 'g9');
      var x2 = X0 + W0 - 2 - w2, x1 = x2 - 10 - w1;
      var h1 = U.hitArea('autonova', x1 - 2, ay - 2, w1 + 4, 13), h2 = U.hitArea('autonovapct', x2 - 2, ay - 2, w2 + 4, 13);
      F.draw(l1, x1, ay, s.settings.autoNova ? 3 : 15, 'g9');
      gx.hline(x1, ay + 10, w1, h1.over ? 4 : 11);
      F.draw(l2, x2, ay, h2.over ? 4 : 8, 'g9');
      gx.hline(x2, ay + 10, w2, h2.over ? 4 : 11);
      if (h1.over || h2.over) U.tip([{ t: G.T('auto_nova') + ' · ' + G.T('auto_nova_at', G.fmt(an)), f: 'g11b', c: 12 }, { t: G.T('tip_auto_nova', pct, G.fmt(s.coresLayer)), c: 13 }, { t: G.T('auto_nova_now', G.fmt(ag), G.fmt(an)), c: ag >= an ? 16 : 11 }, { t: G.T('tip_auto_nova2'), c: 11 }], X0 - 8, ay + 6);
      if (h1.clicked) { s.settings.autoNova = !s.settings.autoNova; G.audio.play('tab'); }
      if (h2.clicked) { var opts = [10, 25, 50, 100]; s.settings.autoNovaPct = opts[(opts.indexOf(pct) + 1) % opts.length]; G.audio.play('tab'); }
    }
  }
  function novaPanel(s) {
    novaTop(s);
    var chalOpen = s.novas >= 3 || s.collapses > 0;
    var ty = Y0 + 60;
    if (chalOpen) A.sub.nova = U.tabs('nsub', X0 + 2, ty, [{ key: 'res', label: G.T('research') }, { key: 'chal', label: G.T('challenges') }], A.sub.nova, { gap: 14 });
    else F.draw(G.T('research'), X0 + 2, ty, 4, 'g11');
    U.groove(X0, ty + 17, W0);
    if (A.sub.nova === 'chal' && chalOpen) challenges(s, ty + 22); else research(s, ty + 22);
  }
  var RES_IC = { g1: 'weight', g2: 'harp', g3: 'orbit', g4: 'weight', g5: 'harp', g6: 'dice', r1: 'gear', r2: 'dice', r3: 'gear', r4: 'hand', r5: 'ring', r6: 'hand', s1: 'scope', s2: 'comet', s3: 'scope', s4: 'gear', s5: 'gear', s6: 'comet' };
  function research(s, y) {
    var cols = [X0 + 34, X0 + 104, X0 + 174];
    [0, 1, 2].forEach(function (br) {
      F.drawCenter(G.T('br' + br), cols[br], y + 1, 8, 'g11b', 12);
      var list = G.RESEARCH.filter(function (r) { return r.br === br; });
      list.forEach(function (r, i) {
        var cx = cols[br], cy = y + 24 + i * 30;
        var own = !!s.research[r.id], av = C.researchAvail(s, r), ok = av && s.cores >= r.cost;
        if (i > 0) { // 놋쇠 연결 막대
          var py = cy - 30 + 12;
          gx.rect(cx - 1, py, 2, cy - 12 - py, own ? 2 : 18);
          if (own) gx.vline(cx - 1, py, cy - 12 - py, 3);
        }
        G.nine(own ? G.spr.tileOwn : (ok ? G.spr.tileHot : G.spr.tile), cx - 11, cy - 11, 22, 22);
        gx.blit(G.spr.cat[RES_IC[r.id]], cx - 7, cy - 7, false, own || ok ? null : DIM);
        var nm = G.nm('res', r.id);
        if (!own) F.drawCenter(G.fmt(r.cost), cx + 19, cy - 5, ok ? 7 : 15, 'g9', 12);
        var h = U.hitArea('rs' + r.id, cx - 12, cy - 12, 24, 24);
        if (h.over) U.tip([{ t: nm, f: 'g11b', c: 12 }, { t: G.effText(r.eff, r.v), c: 13 }, { t: own ? G.T('bought') : G.T('nova_gain', '').replace('+', '') + G.fmt(r.cost), c: own ? 11 : (ok ? 5 : 14) }], cx, cy);
        if (h.clicked) { if (ok) { C.buyResearch(s, r.id); G.audio.play('unlock'); G.orrery.burst(cx, cy, 14, [4, 3, 7], 30); } else G.audio.play('deny'); }
      });
    });
    // 별핵 정제 (반복)
    var ry2 = Y0 + 277;
    U.groove(X0, ry2 - 4, W0);
    var lvr = s.lv.refine || 0, cr = C.costRefine(s);
    F.draw(G.T('refine') + ' ' + G.T('lv', lvr), X0 + 2, ry2 + 1, 4, 'g11b', 12);
    F.draw(G.effText('mass', G.fmt(Math.pow(G.DATA.refine.v, lvr), true)), X0 + 2, ry2 + 15, 8, 'g9');
    var crw = F.measure(G.fmt(cr), 'g9'); gx.blit(G.spr.icCore, X0 + W0 - 66 - crw - 12, ry2 + 15); F.drawRight(G.fmt(cr), X0 + W0 - 66, ry2 + 15, s.cores >= cr ? 7 : 9, 'g9');
    if (U.button('refine', X0 + W0 - 62, ry2 + 4, 62, 19, G.T('b_refine'), { font: 'g11b', style: 'core', enabled: s.cores >= cr, sfx: 'buy' })) C.buyRefine(s);
  }
  function challenges(s, y) {
    G.CHALLENGES.forEach(function (c, i) {
      var yy = y + 1 + i * 37;
      if (i > 0) U.groove(X0, yy - 3, W0);
      var k = C.chalStage(s, c.id), n = c.goals.length, all = k >= n;
      var act = s.chal === c.id, unl = C.chalUnlocked(s, c), g = C.chalGoal(s, c.id);
      var nw = F.draw(G.nm('chal', c.id), X0 + 2, yy + 1, all ? 2 : 4, 'g11b', 12);
      for (var st = 0; st < n; st++) { gx.rect(X0 + 8 + nw + st * 6, yy + 4, 4, 4, st < k ? 2 : 21); gx.hline(X0 + 8 + nw + st * 6, yy + 4, 4, st < k ? 3 : 18); }
      F.draw(G.nm('chal', c.id, 1), X0 + 2, yy + 13, 8, 'g9');
      if (g) F.draw(G.T('chal_goal_t', G.goalShort(g)), X0 + 2, yy + 24, act ? 7 : 15, 'g9');
      var rh = U.hitArea('chr' + c.id, X0, yy, W0 - 66, 35);
      if (rh.over) U.tip([{ t: G.nm('chal', c.id) + ' · ' + G.T('chal_stage', k, n), f: 'g11b', c: 12 }, { t: G.T('chal_reward', G.effText(c.reward, c.v)), c: 13 }, { t: k ? G.T('chal_now', G.effText(c.reward, rewardNow(c, k))) : '', c: 11 }].filter(function (l) { return l.t; }), U.inp.x, U.inp.y);
      var bx = X0 + W0 - 62;
      if (all) F.drawRight(G.T('chal_done'), X0 + W0 - 4, yy + 2, 2, 'g11b');
      else if (act) { if (U.button('cq' + c.id, bx, yy + 1, 60, 18, G.T('chal_quit'), { font: 'g11b' })) { A.confirmText = G.T('chal_confirm_quit'); A.confirmYes = G.T('b_quit_chal'); A.confirmFn = function () { C.quitChallenge(s); refreshTray(); }; A.overlay = 'confirm'; } }
      else if (!unl) F.drawRight(k >= 2 ? G.T('chal_lock_col') : G.T('chal_lock', c.req, s.novas), X0 + W0 - 2, yy + 3, 15, 'g9');
      else if (U.button('cs' + c.id, bx, yy + 1, 60, 18, G.T('chal_start'), { font: 'g11b', enabled: !s.chal })) { A.confirmText = G.nm('chal', c.id) + ' · ' + G.T('chal_confirm_start'); A.confirmYes = G.T('b_start_chal'); A.confirmFn = function () { C.startChallenge(s, c.id); refreshTray(); G.audio.play('unlock'); }; A.overlay = 'confirm'; }
    });
  }
  function rewardNow(c, k) {
    if (c.reward === 'moveStart' || c.reward === 'perDie' || c.reward === 'harmonyX') return Math.round(c.v * k * 100) / 100;
    return G.fmt(Math.pow(c.v, k), true);
  }
  function refreshTray() { var d = C.derive(A.s); G.tray.place(d.dice.map(A.spec), d.dice.map(function () { return 0; })); G.orrery.clearFx(); }

  // ── 붕괴 ───────────────────────────────────────
  function colPanel(s) {
    var y = Y0 + 2;
    if (C.canCollapse(s)) {
      var g = Math.max(1, C.collapseGain(s));
      if (U.button('colbtn', X0, y, W0, 22, G.T('col_btn'), { style: 'teal', font: 'g11b', sfx: 'tap' })) { A.confirmText = G.T(C.sres(s, 'q4') ? 'col_confirm_keep' : 'col_confirm', G.fmt(g)); A.confirmYes = G.T('col_btn'); A.confirmFn = A.startCollapse; A.overlay = 'confirm'; }
      F.draw(G.T('col_gain', G.fmt(g)), X0 + 2, y + 27, 19, 'g11b', 12);
      // 붕괴 사이 시간에 따른 특이점 몫: 40%에서 시작해 50분이면 100%
      var lb = C.layerBonus(s), lbt = G.T('layer_pct', Math.round(lb * 100));
      F.drawRight(lbt, X0 + W0 - 2, y + 29, lb >= 1 ? 16 : 8, 'g9');
      if (U.over(X0 + W0 - F.measure(lbt, 'g9') - 4, y + 26, F.measure(lbt, 'g9') + 4, 13)) U.tip([{ t: lbt, f: 'g11b', c: 12 }, { t: G.T('tip_layer'), c: 13 }], U.inp.x, U.inp.y);
    } else {
      var cn = s.chal ? G.nm('chal', s.chal) : G.T('col_need');
      F.draw(cn, X0 + 2, y + 2, 8, F.measure(cn, 'g11') > W0 - 4 ? 'g9' : 'g11');
      var best = 0; Object.keys(s.bodies).forEach(function (k) { best = Math.max(best, s.bodies[k].m); });
      var thc = C.derive(s).th, need = thc[G.DATA.collapseTier - 2], prev = thc[G.DATA.collapseTier - 3];
      bigBar(X0, y + 18, W0, best > prev ? Math.min(0.97, (Math.log(best) - Math.log(prev)) / (Math.log(need) - Math.log(prev))) : 0, [19, 16]);
      F.draw(G.nm('tiers', Math.max(1, C.maxTier(s))) + ' → ' + G.nm('tiers', 10), X0 + 2, y + 29, 15, 'g9');
    }
    var heavy = G.DATA.collapseHeavy;
    var keepR = C.sres(s, 'q4');
    var warn = F.wrap(G.T(keepR ? 'col_warn_keep' : 'col_warn', s.collapses >= G.DATA.collapseHeavyN ? G.DATA.collapseHeavyLate : heavy), W0 - 4, 'g9');
    warn.forEach(function (l, i) { F.draw(l, X0 + 2, y + 42 + i * 10, 8, 'g9'); });
    if (C.sres(s, 'q11')) {
      var lab = G.T('auto_col') + ' ' + (s.settings.autoCollapse ? G.T('on') : G.T('off'));
      var h = U.hitArea('autocol', X0, y + 64, F.measure(lab, 'g9') + 4, 11);
      F.draw(lab, X0 + 2, y + 64, s.settings.autoCollapse ? 19 : 15, 'g9');
      if (h.clicked) { s.settings.autoCollapse = !s.settings.autoCollapse; G.audio.play('tab'); }
    }
    // 특이점 연구: 블랙홀 둘레의 고리
    var cx = X0 + W0 / 2, cy = Y0 + 186, R = 82;
    U.groove(X0, Y0 + 80, W0);
    F.draw(G.T('sres'), X0 + 2, Y0 + 86, 4, 'g11');
    // 블랙홀
    for (var yy = -20; yy <= 20; yy++) for (var xx = -44; xx <= 44; xx++) {
      var e = (xx * xx) / (44 * 44) + (yy * yy) / (12 * 12);
      var r2 = xx * xx + yy * yy;
      var ang = Math.atan2(yy, xx);
      if (r2 <= 150) gx.pset(cx + xx, cy + yy, 0);
      else if (r2 <= 196) gx.pset(cx + xx, cy + yy, ((Math.floor(ang * 6 + A.t * 3)) & 1) ? 16 : 19);
      else if (e <= 1 && e > 0.38 && (yy > 0 || r2 > 260)) {
        var band = Math.floor((e - 0.38) / 0.62 * 4);
        var swirl = (Math.floor(ang * 8 - A.t * 2 + e * 6) & 3) === 0;
        gx.pset(cx + xx, cy + yy, swirl ? 4 : [19, 16, 6, 0][band]);
      }
    }
    for (var ai = 0; ai < 180; ai++) { if (ai % 2) continue; var aa = ai / 180 * Math.PI * 2; gx.pset(Math.round(cx + Math.cos(aa) * R), Math.round(cy + Math.sin(aa) * R * 0.66), 16); }
    // 특이점 압축 (반복)
    var cy2 = Y0 + 277;
    U.groove(X0, cy2 - 4, W0);
    var lvc = s.lv.compress || 0, cc2 = C.costCompress(s);
    F.draw(G.T('compress') + ' ' + G.T('lv', lvc), X0 + 2, cy2 + 2, 4, 'g11b', 12);
    F.draw(G.effText('mass', G.fmt(Math.pow(G.DATA.compress.v, lvc), true)), X0 + 2, cy2 + 15, 8, 'g9');
    var ccw = F.measure(G.fmt(cc2), 'g9'); gx.blit(G.spr.icSing, X0 + W0 - 66 - ccw - 12, cy2 + 15); F.drawRight(G.fmt(cc2), X0 + W0 - 66, cy2 + 15, s.sing >= cc2 ? 19 : 9, 'g9');
    if (U.button('compress', X0 + W0 - 62, cy2 + 4, 62, 19, G.T('b_compress'), { font: 'g11b', style: 'teal', enabled: s.sing >= cc2, sfx: 'buy' })) C.buyCompress(s);
    G.SRESEARCH.forEach(function (r, i) {
      var a = -Math.PI / 2 + i / G.SRESEARCH.length * Math.PI * 2;
      var nx = Math.round(cx + Math.cos(a) * R), ny = Math.round(cy + Math.sin(a) * R * 0.66);
      var own = !!s.sres[r.id], av = C.sresAvail(s, r);
      var endBlock = r.eff === 'ending' && !C.endingReady(s);
      var ok = av && s.sing >= r.cost && !endBlock;
      G.nine(own ? G.spr.tileOwn : (ok ? G.spr.tileHot : G.spr.tile), nx - 7, ny - 7, 14, 14);
      var spr = own ? G.spr.sresOn : (av ? G.spr.sresAvail : G.spr.starOff);
      gx.blit(spr, nx - 3, ny - 3);
      if (ok && Math.floor(A.t * 2) % 2) { gx.pset(nx - 6, ny, 19); gx.pset(nx + 6, ny, 19); }
      if (!own) F.drawCenter(G.fmt(r.cost), nx, ny + 8, ok ? 19 : 15, 'g9', 12);
      var h = U.hitArea('sr' + r.id, nx - 10, ny - 8, 20, 20);
      if (h.over) U.tip([{ t: G.nm('sres', r.id), f: 'g11b', c: 12 }, { t: G.effText(r.eff, r.v), c: 13 }].concat(r.outer ? [{ t: G.effText('outerCap', r.outer), c: 13 }] : []).concat([{ t: own ? G.T('bought') : (endBlock ? G.T('ending_need') : G.T('col_gain', '').replace('+', '') + G.fmt(r.cost)), c: own ? 11 : (ok ? 16 : 14) }]), nx, ny);
      if (h.clicked) { if (ok) { C.buySres(s, r.id); G.audio.play('unlock'); G.orrery.burst(nx, ny, 14, [4, 19, 16], 30); } else G.audio.play('deny'); }
    });
  }

  // ── 기록 ───────────────────────────────────────
  function records(s) {
    A.sub.rec = U.tabs('rsub', X0 + 2, Y0 + 2, [{ key: 'ach', label: G.T('rec_ach') }, { key: 'dex', label: G.T('rec_dex') }, { key: 'log', label: G.T('rec_log') }, { key: 'stats', label: G.T('rec_stats') }], A.sub.rec, { gap: 14 });
    U.groove(X0, Y0 + 19, W0);
    if (A.sub.rec === 'stats') return stats(s, Y0 + 26);
    if (A.sub.rec === 'dex') return dexPanel(s, Y0 + 26);
    if (A.sub.rec === 'log') return logPanel(s, Y0 + 26);
    var y = Y0 + 26;
    G.ACH.forEach(function (a, i) {
      var x = X0 + (i % 8) * 26, yy = y + Math.floor(i / 8) * 28;
      var got = !!s.ach[a[0]];
      var hid = !got && G.NAMES.hiddenAch[a[0]];
      G.nine(got ? G.spr.tileOwn : G.spr.tile, x, yy, 24, 26);
      if (hid) F.drawCenter('?', x + 12, yy + 7, 14, 'g11b');
      else gx.blit(got ? G.spr.medal : G.spr.medalOff, x + 6, yy + 6, false, got ? MEDAL[Math.floor(i / 5) % MEDAL.length] : null);
      var h = U.hitArea('ac' + a[0], x, yy, 24, 26);
      if (h.over) U.tip([{ t: hid ? G.T('ach_hidden') : G.nm('ach', a[0]), f: 'g11b', c: 12 }, { t: hid ? G.T('ach_hidden') : G.nm('ach', a[0], 1), c: 13 }], x, yy);
    });
    var n = Object.keys(s.ach).length;
    F.drawRight(n + '/' + G.ACH.length, X0 + W0 - 2, y + 146, 15, 'g9');
  }
  // 천체 도감: 단계(가로 10) × 갈래(세로 3) 그림 격자
  function dexPanel(s, y) {
    var n = C.dexCount(s);
    F.draw(G.T('dex_title', n), X0 + 2, y, 4, 'g11b', 12);
    F.drawRight(G.T('dex_bonus', Math.round(n * C.dexPer(s) * 100)), X0 + W0 - 2, y + 1, 3, 'g9');
    var cw = 20, ch = 24, gx0 = X0 + 4, gy0 = y + 30;
    for (var c = 0; c < 3; c++) F.draw(G.T('dex_cls' + c), X0 + 2, gy0 + c * (ch + 18) - 11, [7, 15, 19][c], 'g9');
    for (var c2 = 0; c2 < 3; c2++) for (var t = 1; t <= 10; t++) {
      var x = gx0 + (t - 1) * cw, yy = gy0 + c2 * (ch + 18), key = t + '_' + c2, got = !!s.dex[key];
      var h = U.hitArea('dx' + key, x, yy, cw - 1, ch);
      gx.rect(x, yy, cw - 1, ch, got ? 23 : 13);
      gx.hline(x, yy + ch - 1, cw - 1, got ? [7, 15, 19][c2] : 21);
      var spr = G.planets.bodySprite(t, 11 + t * 3, 0, 6, c2);
      gx.setClip(x, yy, cw - 1, ch - 1);
      gx.blit(spr, x + ((cw - 1) >> 1) - (spr.w >> 1), yy + (ch >> 1) - (spr.h >> 1), false, got ? null : SIL);
      gx.resetClip();
      if (h.over) U.tip([{ t: got ? G.dexName(key) : G.T('dex_unknown'), f: 'g11b', c: 12 }, { t: G.T('dex_where' + c2), c: 13 }], x, yy);
    }
  }
  // 일지: 지금까지 나온 대사 (최근이 위)
  function logPanel(s, y) {
    var ls = G.story.seen(s).slice().reverse();
    if (!ls.length) { F.draw(G.T('log_empty'), X0 + 2, y + 4, 15, 'g11'); return; }
    var yy = y, maxY = Y0 + 296;
    for (var i = 0; i < ls.length && yy < maxY - 20; i++) {
      var l = ls[i];
      F.draw(G.story.who(l), X0 + 2, yy, G.story.color(l), 'g9');
      var lines = F.wrap(G.story.text(l), W0 - 6, 'g9');
      lines.forEach(function (t, k) { if (yy + 11 + k * 10 < maxY) F.draw(t, X0 + 4, yy + 11 + k * 10, i === 0 ? 4 : 8, 'g9'); });
      yy += 15 + lines.length * 10;
      if (yy < maxY) U.groove(X0, yy - 3, W0);
    }
  }
  function stats(s, y) {
    var st = s.stats;
    var rows = [
      ['st_time', G.fmtTime(s.t)], ['st_rolls', G.fmt(st.rolls)], ['st_manual', G.fmt(st.manual)], ['st_aligns', G.fmt(st.aligns)], ['st_events', G.fmt(st.events)],
      ['st_best', G.nm('tiers', Math.max(1, st.bestTier))], ['st_hit', G.fmt(st.bestHit)], ['st_rare', '×' + G.fmt(st.bestRarity, true)], ['st_dust', G.fmt(s.dustAll)],
      ['st_novas', G.fmt(s.novas)], ['st_fast', st.fastestNova ? G.fmtTime(st.fastestNova) : '-'], ['st_cores', G.fmt(s.coresAll)], ['st_cols', G.fmt(s.collapses)], ['st_sing', G.fmt(s.singAll)]
    ];
    rows.forEach(function (r, i) {
      var yy = y + i * 18;
      if (i > 0) U.groove(X0, yy - 3, W0);
      F.draw(G.T(r[0]), X0 + 2, yy + 1, 15, 'g11');
      F.drawRight(r[1], X0 + W0 - 2, yy + 1, 4, 'g11b');
    });
  }

  // ── 탭 틀 ──────────────────────────────────────
  function dotFor(s, key) {
    if (key === 'upg') return G.UPGRADES.some(function (u) { return !s.up[u.id] && C.upgradeVisible(s, u) && s.dust >= u.cost; });
    if (key === 'dice') return s.box > 0;
    if (key === 'nova') return C.canNova(s) || G.RESEARCH.some(function (r) { return C.researchAvail(s, r) && s.cores >= r.cost; });
    if (key === 'col') return C.canCollapse(s) || G.SRESEARCH.some(function (r) { return C.sresAvail(s, r) && s.sing >= r.cost && (r.eff !== 'ending' || C.endingReady(s)); });
    return false;
  }
  function draw(s, PX, PY, PW, PH) {
    X0 = PX + 8; Y0 = PY + 30; W0 = PW - 16;
    var keys = ['machine', 'upg', 'dice', 'nova', 'col', 'rec'];
    var items = keys.map(function (k) { return { key: k, label: G.T('tab_' + k), hidden: !A.tabOpen(k), dot: dotFor(s, k) && A.tab !== k }; });
    if (!A.tabOpen(A.tab)) A.tab = 'machine';
    var tw = 0, nv = 0; items.forEach(function (it) { if (!it.hidden) { tw += F.measure(it.label, 'g11'); nv++; } });
    var gap = Math.max(5, Math.min(10, Math.floor((PW - 20 - tw) / Math.max(1, nv - 1))));
    var tfont = 'g11';
    if (tw + 5 * (nv - 1) > PW - 20) { tfont = 'g9'; tw = 0; items.forEach(function (it) { if (!it.hidden) tw += F.measure(it.label, 'g9'); }); gap = Math.max(4, Math.floor((PW - 20 - tw) / Math.max(1, nv - 1))); }
    var nt = U.tabs('tab', PX + 10, PY + 9, items, A.tab, { gap: gap, font: tfont });
    if (nt !== A.tab) { A.tab = nt; A.seenTabs[nt] = 1; }
    U.groove(PX + 8, PY + 26, PW - 16);
    if (A.tab === 'machine') machine(s);
    else if (A.tab === 'upg') upgrades(s);
    else if (A.tab === 'dice') dicePanel(s);
    else if (A.tab === 'nova') novaPanel(s);
    else if (A.tab === 'col') colPanel(s);
    else if (A.tab === 'rec') records(s);
  }
  G.panels = { draw: draw, histogram: histogram };
})();

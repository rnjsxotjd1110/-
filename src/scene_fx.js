// 큰 연출: 초신성, 중력 붕괴, 엔딩, 크레딧
(function () {
  var A = G.app, gx = G.gfx, F = G.font, U = G.ui, O = G.orrery;
  var CX = O.CX, CY = O.CY;
  function ring(cx, cy, r, cols, th) {
    for (var yy = -r - th; yy <= r + th; yy++) for (var xx = -r - th; xx <= r + th; xx++) {
      var d = Math.sqrt(xx * xx + yy * yy * 2.2);
      if (d <= r && d > r - th) {
        var k = (r - d) / th;
        gx.pset(cx + xx, cy + yy, k < 0.34 ? cols[0] : (k < 0.67 ? cols[1] : cols[2]));
      }
    }
  }
  function flashFill(k, c) { // k: 0..1 덮는 비율 (Bayer 문턱)
    for (var y = 20; y < 244; y++) for (var x = 0; x < 416; x++) if (gx.bayer(x, y) < k) gx.pset(x, y, c);
  }
  function cutDraw(c, v, t) {
    if (c.kind === 'nova') {
      O.draw(v, t, {});
      gx.setClip(0, 20, 416, 224);
      if (c.t < 1.1) {
        var k = c.t / 1.1;
        var r = Math.round(14 + k * k * 120);
        for (var yy = -r; yy <= r; yy++) for (var xx = -r; xx <= r; xx++) {
          var d = Math.sqrt(xx * xx + yy * yy);
          if (d > r) continue;
          var q = d / r;
          var col = q < 0.5 ? 4 : (q < 0.75 ? 3 : (q < 0.92 ? 7 : 5));
          if (q > 0.92 && gx.bayer(CX + xx, CY + yy) < (q - 0.92) * 10) continue;
          gx.pset(CX + xx, CY + yy, col);
        }
        if (!c.parts && k > 0.85) { c.parts = 1; O.burst(CX, CY, A.s.settings.reduce ? 10 : 60, [4, 3, 7, 8], 120); }
      } else if (c.t < 1.8) {
        var f = 1 - (c.t - 1.1) / 0.7;
        if (!A.s.settings.reduce) flashFill(f, f > 0.5 ? 4 : 8);
        ring(CX, CY, Math.round((c.t - 1.1) * 260), [4, 3, 7], 5);
      } else if (c.t < 2.8) {
        ring(CX, CY, Math.round((c.t - 1.1) * 260), [8, 7, 5], 3);
      }
      gx.resetClip();
      return true;
    }
    if (c.kind === 'col') {
      if (c.t < 1.6) {
        // 모든 천체가 소용돌이치며 중심으로
        var k2 = c.t / 1.6;
        G.starfield.draw(v.stage, t, 0, 0, 0, 20, 416, 246);
        gx.setClip(0, 20, 416, 224);
        var L = v._layout;
        Object.keys(v.bodies).forEach(function (key) {
          var b = v.bodies[key], o = L && L.map[key]; if (!o) return;
          var rr = 1 - k2 * k2;
          var a = b.a0 + t * 0.3 + k2 * k2 * 9;
          var x = Math.round(CX + Math.cos(a) * o.rx * rr), y = Math.round(CY + Math.sin(a) * o.ry * rr);
          var sp = G.planets.bodySprite(b.t, b.seed, 0);
          gx.blit(sp, x - (sp.w >> 1), y - (sp.h >> 1));
        });
        var sun = G.planets.sunSprite(v.sunForm, Math.floor(t * 6) % 48);
        if (k2 < 0.7) gx.blit(sun, CX - (sun.w >> 1), CY - (sun.h >> 1));
        hole(Math.round(k2 * 22), t);
        gx.resetClip();
        return true;
      }
      O.draw(v, t, {});
      gx.setClip(0, 20, 416, 224);
      var k3 = Math.max(0, 1 - (c.t - 1.6) / 2.2);
      if (k3 > 0) hole(Math.round(22 * k3), t);
      gx.resetClip();
      return true;
    }
    return false;
  }
  function hole(r, t) {
    if (r <= 0) return;
    for (var yy = -r * 2; yy <= r * 2; yy++) for (var xx = -r * 3; xx <= r * 3; xx++) {
      var d2 = xx * xx + yy * yy;
      var e = (xx * xx) / (9 * r * r) + (yy * yy) / (r * r * 0.5);
      if (d2 <= r * r * 0.5) gx.pset(CX + xx, CY + yy, 0);
      else if (d2 <= r * r * 0.75) gx.pset(CX + xx, CY + yy, ((xx + yy + Math.floor(t * 8)) & 3) ? 6 : 19);
      else if (e <= 1 && e > 0.35) gx.pset(CX + xx, CY + yy, e > 0.8 ? 6 : (((xx + Math.floor(t * 14)) & 7) < 2 ? 19 : 16));
    }
  }
  function cutText(c) {
    var t0 = c.kind === 'nova' ? 1.3 : 1.8, t1 = c.kind === 'nova' ? 3.4 : 4.0;
    if (c.t < t0 || c.t > t1) return;
    var title = c.kind === 'nova' ? G.T('nova_title') : G.T('col_title');
    var ramp = c.kind === 'nova' ? [4, 3, 11] : [19, 16, 6];
    var w = G.embossMeasure(title, 3);
    var slide = Math.min(1, (c.t - t0) / 0.2);
    G.embossText(title, Math.round(CX - w / 2), Math.round(60 - (1 - slide) * 10), 3, ramp, 'g11b', 12);
    var g = c.kind === 'nova' ? G.T('nova_gain', G.fmt(c.gain)) : G.T('col_gain', G.fmt(c.gain));
    F.drawCenter(g, CX, 104, c.kind === 'nova' ? 7 : 19, 'g11b', 12);
  }

  // ── 엔딩 ───────────────────────────────────────
  function ending(dt) {
    A.endT = (A.endT || 0) + dt;
    var t = A.endT, s = A.s;
    var v = G.scenePlay.buildView(s);
    v.alignK = Math.min(1, t / 4);
    G.starfield.draw(4, A.t, 0, 0, 0, 0, 640, 360);
    O.draw(v, A.t, { noRuler: true });
    // 오른쪽: 문장 하나씩
    var lx = 430, lines = [G.T('end1'), G.T('end2'), G.T('end3')];
    var yy = 70;
    lines.forEach(function (l, i) {
      var st = 4.5 + i * 2.6;
      var wl = F.wrap(l, 200, 'g11b');
      if (t >= st) wl.forEach(function (w2, j) { F.drawOutlined(w2, lx, yy + j * 14, t - st < 0.3 ? 8 : 4, 'g11b', 12); });
      yy += wl.length * 14 + 10;
    });
    if (t > 13) {
      var ek = G.embossMeasure(G.T('cr_game'), 3) > 200 ? 2 : 3;
      G.embossText(G.T('cr_game'), lx, 200, ek, [4, 3, 11], 'g11b', 12);
      F.drawOutlined(G.T('end_thanks'), lx, 248, 8, 'g11', 12);
    }
    if (t > 14.5) {
      if (U.button('endc', lx, 274, 110, 20, G.T('b_continue'), { font: 'g11b' })) { v.alignK = 0; A.scene = 'play'; G.save.save(s); }
    } else if (t > 4 && t < 13 && U.inp.released) A.endT = 13;
  }

  // ── 크레딧 ─────────────────────────────────────
  function credits(dt) {
    G.overlays.dim();
    var w = 340, h = 220, x = (640 - w) >> 1, y = (360 - h) >> 1;
    G.nine(G.spr.panel, x, y, w, h);
    G.embossText(G.T('cr_game'), x + 14, y + 12, 2, [4, 3, 11], 'g11b', 12);
    var rows = [['cr_made', 'cr_made2'], ['cr_font', 'cr_font2'], ['cr_pal', 'cr_pal2'], ['cr_sound', 'cr_sound2'], ['cr_tool', 'cr_tool2']];
    rows.forEach(function (r, i) {
      var yy = y + 52 + i * 28;
      if (i > 0) U.groove(x + 10, yy - 5, w - 20);
      F.draw(G.T(r[0]), x + 14, yy, 15, 'g9');
      F.draw(G.T(r[1]), x + 14, yy + 10, 4, 'g11');
    });
    if (U.button('crc', x + w - 92, y + h - 28, 80, 19, G.T('b_close'), { font: 'g11b' }) || U.inp.keysPressed.Escape) A.overlay = A.scene === 'title' ? null : 'settings';
  }
  G.sceneFx = { cutDraw: cutDraw, cutText: cutText, ending: ending, credits: credits };
})();

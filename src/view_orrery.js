// 성계(오러리) 화면: 중심별, 궤도, 천체, 눈금자, 적중 연출
(function () {
  var V = { x: 0, y: 20, w: 416, h: 268 };
  var CX = 206, CY = 152;
  var flashes = {}; // 궤도별 깜빡임 남은 시간
  var beams = [];   // 쟁반 -> 천체 빛줄기
  var parts = [];   // 픽셀 파티클
  var pops = [];    // 튀어오르는 숫자
  var rings = [];   // 단계 상승 고리

  function layout(orbits) {
    var n = orbits.length;
    var r0 = 34, rmax = 196;
    var sp = n > 1 ? Math.min(15, (rmax - r0) / (n - 1)) : 0;
    var m = {};
    orbits.forEach(function (s, i) { m[s] = { rx: Math.round(r0 + i * sp), ry: Math.round((r0 + i * sp) * 0.4) }; });
    return { map: m, sp: sp };
  }
  function bodyPos(L, s, b, t) {
    var o = L.map[s];
    if (!o) return null;
    var w = 9 / Math.pow(o.rx, 1.5) * 4;
    var a = b.a0 + t * w;
    return { x: Math.round(CX + Math.cos(a) * o.rx), y: Math.round(CY + Math.sin(a) * o.ry), back: Math.sin(a) < 0, a: a };
  }

  function drawOrbitLine(o, col, dashPh, sparse) {
    var n = Math.max(40, Math.round(o.rx * 2.2));
    var last = null;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2;
      var x = Math.round(CX + Math.cos(a) * o.rx), y = Math.round(CY + Math.sin(a) * o.ry);
      var key = x + ',' + y;
      if (key === last) continue;
      last = key;
      if (sparse ? ((i % 6) === 0) : (((i + dashPh) % 4) < 2)) G.gfx.pset(x, y, col);
    }
  }

  // st: {orbits:[s...], bodies:{s:{mass,tier,seed,a0}}, rarity:{s:x}, sunForm, stage}
  function draw(st, t, opts) {
    opts = opts || {};
    var gx = G.gfx;
    G.starfield.draw(st.stage || 0, t, opts.camX || 0, opts.camY || 0, V.x, V.y, V.w, V.h);
    gx.setClip(V.x, V.y, V.w, V.h);
    var L = layout(st.orbits);
    st._layout = L;
    // 궤도선
    st.orbits.forEach(function (s, i) {
      var o = L.map[s];
      var f = flashes[s] || 0;
      var col = f > 0.5 ? 3 : (f > 0.2 ? 2 : (st.bodies[s] ? 11 : 18));
      if (st.hoverOrbit === s) col = 8;
      drawOrbitLine(o, col, 0, !st.bodies[s] && f <= 0.2 && st.hoverOrbit !== s);
    });
    // 눈금자: 중심에서 오른쪽으로
    var rulerY = CY;
    var first = st.orbits[0], lastS = st.orbits[st.orbits.length - 1];
    if (first !== undefined) {
      var xa = CX + L.map[first].rx, xb = CX + L.map[lastS].rx;
      gx.hline(xa, rulerY, xb - xa + 1, 18);
      st.orbits.forEach(function (s, i) {
        var o = L.map[s];
        var x = CX + o.rx;
        var f = flashes[s] || 0;
        var hot = f > 0.2 || st.hoverOrbit === s;
        gx.vline(x, rulerY - 1, 3, hot ? 3 : 11);
        var label = String(s);
        var lw = G.font.measure(label, 'g7');
        var above = (i % 2) === 0;
        if (L.sp >= 9 || true) {
          G.font.draw(label, x - (lw >> 1), above ? rulerY - 10 : rulerY + 3, hot ? 4 : (st.bodies[s] ? 15 : 14), 'g7', 12);
        }
      });
    }
    // 천체 위치 계산
    var list = [];
    Object.keys(st.bodies).forEach(function (k) {
      var s = +k, b = st.bodies[s];
      var p = bodyPos(L, s, b, t);
      if (!p) return;
      list.push({ s: s, b: b, p: p });
    });
    list.sort(function (a, b) { return a.p.y - b.p.y; });
    var frame = Math.floor(t * 4) % 32;
    function drawBody(it) {
      var spr = G.planets.bodySprite(it.b.tier, it.b.seed, (frame + it.b.seed) % 32);
      gx.blit(spr, it.p.x - (spr.w >> 1), it.p.y - (spr.h >> 1));
      it.b._x = it.p.x; it.b._y = it.p.y;
    }
    function arm(it) {
      // 오러리 팔: 중심 기둥에서 천체까지 놋쇠 막대
      var ex = it.p.x, ey = it.p.y;
      G.gfx.line(CX, CY + 1, ex, ey + 1, 18);
      G.gfx.line(CX, CY, ex, ey, it.b.tier >= 6 ? 11 : 18);
    }
    list.forEach(function (it) { arm(it); });
    list.forEach(function (it) { if (it.p.back) drawBody(it); });
    var sun = G.planets.sunSprite(st.sunForm || 0, Math.floor(t * 6) % 48);
    if (G.planets.SUNS[Math.min(st.sunForm || 0, 5)].twin) {
      var a = t * 0.6;
      var s2 = G.planets.sunSprite(0, Math.floor(t * 6 + 20) % 48), s3 = G.planets.sunSprite(1, Math.floor(t * 6) % 48);
      var dx = Math.round(Math.cos(a) * 9), dy = Math.round(Math.sin(a) * 4);
      if (dy < 0) { gx.blit(s3, CX + dx - (s3.w >> 1), CY + dy - (s3.h >> 1)); gx.blit(s2, CX - dx - (s2.w >> 1), CY - dy - (s2.h >> 1)); }
      else { gx.blit(s2, CX - dx - (s2.w >> 1), CY - dy - (s2.h >> 1)); gx.blit(s3, CX + dx - (s3.w >> 1), CY + dy - (s3.h >> 1)); }
    } else gx.blit(sun, CX - (sun.w >> 1), CY - (sun.h >> 1));
    list.forEach(function (it) { if (!it.p.back) drawBody(it); });
    // 단계 상승 고리
    rings.forEach(function (r) {
      var b = st.bodies[r.s]; if (!b || b._x === undefined) return;
      var rad = Math.round(4 + (1 - r.life) * 12);
      var col = r.life > 0.6 ? 4 : (r.life > 0.3 ? 3 : 2);
      for (var i = 0; i < 24; i++) {
        var a2 = i / 24 * Math.PI * 2;
        if ((i + Math.floor(r.life * 8)) % 2) continue;
        gx.pset(b._x + Math.round(Math.cos(a2) * rad), b._y + Math.round(Math.sin(a2) * rad * 0.8), col);
      }
    });
    // 빛줄기
    beams.forEach(function (bm) {
      var b = st.bodies[bm.s];
      var tx = b && b._x !== undefined ? b._x : CX, ty = b && b._y !== undefined ? b._y : CY;
      var k = Math.min(1, bm.t);
      var hx = Math.round(bm.x + (tx - bm.x) * k), hy = Math.round(bm.y + (ty - bm.y) * k);
      // 꼬리 점선
      for (var i = 0; i < 10; i++) {
        var kk = Math.max(0, k - i * 0.03);
        var x = Math.round(bm.x + (tx - bm.x) * kk), y = Math.round(bm.y + (ty - bm.y) * kk);
        gx.pset(x, y, i < 2 ? 4 : (i < 5 ? 3 : 2));
      }
      gx.pset(hx, hy, 4); gx.pset(hx + 1, hy, 3); gx.pset(hx - 1, hy, 3); gx.pset(hx, hy + 1, 3); gx.pset(hx, hy - 1, 3);
    });
    // 파티클
    parts.forEach(function (p) { gx.pset(Math.round(p.x), Math.round(p.y), p.c); });
    gx.resetClip();
    // 숫자
    pops.forEach(function (p) {
      var y = Math.round(p.y - (1 - p.life) * 14);
      if (p.big) G.embossText(p.text, Math.round(p.x - G.embossMeasure(p.text, 2) / 2), y - 6, 2, p.ramp || [4, 3, 11], 'g11b', 12);
      else G.font.drawCenter(p.text, Math.round(p.x), y, p.c || 4, p.font || 'g9', 12);
    });
  }

  function update(dt, st) {
    Object.keys(flashes).forEach(function (k) { flashes[k] -= dt * 1.5; if (flashes[k] <= 0) delete flashes[k]; });
    for (var i = beams.length - 1; i >= 0; i--) {
      var bm = beams[i];
      bm.t += dt * 2.4;
      if (bm.t >= 1 && !bm.done) { bm.done = true; if (bm.onHit) bm.onHit(); }
      if (bm.t > 1.35) beams.splice(i, 1);
    }
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.life -= dt;
      if (p.life < 0.25) p.c = p.c2 || 11;
      if (p.life <= 0) parts.splice(j, 1);
    }
    for (var k2 = pops.length - 1; k2 >= 0; k2--) { pops[k2].life -= dt * (pops[k2].big ? 0.55 : 0.9); if (pops[k2].life <= 0) pops.splice(k2, 1); }
    for (var r = rings.length - 1; r >= 0; r--) { rings[r].life -= dt * 1.2; if (rings[r].life <= 0) rings.splice(r, 1); }
  }

  function burst(x, y, n, cols, speed) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * (speed || 30);
      parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 10, life: 0.5 + Math.random() * 0.5, c: cols[i % cols.length], c2: 11 });
    }
  }
  function bodyXY(st, s) {
    var b = st.bodies[s];
    if (b && b._x !== undefined) return { x: b._x, y: b._y };
    var L = st._layout; if (!L || !L.map[s]) return { x: CX, y: CY };
    return { x: CX + L.map[s].rx, y: CY };
  }
  function orbitAt(st, mx, my) {
    var L = st._layout; if (!L) return null;
    var best = null, bd = 4;
    st.orbits.forEach(function (s) {
      var o = L.map[s];
      var dx = (mx - CX) / o.rx, dy = (my - CY) / o.ry;
      var d = Math.abs(Math.sqrt(dx * dx + dy * dy) - 1) * o.rx;
      if (d < bd) { bd = d; best = s; }
    });
    // 천체 위 우선
    Object.keys(st.bodies).forEach(function (k) {
      var b = st.bodies[k];
      if (b._x !== undefined && Math.abs(b._x - mx) <= 5 && Math.abs(b._y - my) <= 5) best = +k;
    });
    return best;
  }

  G.orrery = {
    V: V, CX: CX, CY: CY, draw: draw, update: update, burst: burst, bodyXY: bodyXY, orbitAt: orbitAt,
    flash: function (s, v) { flashes[s] = Math.max(flashes[s] || 0, v || 1); },
    flashAll: function (v) { return v; },
    beam: function (x, y, s, onHit) { beams.push({ x: x, y: y, s: s, t: 0, onHit: onHit }); },
    pop: function (x, y, text, c, font, big, ramp) { pops.push({ x: x, y: y, text: text, c: c, font: font, life: 1, big: big, ramp: ramp }); if (pops.length > 24) pops.shift(); },
    ring: function (s) { rings.push({ s: s, life: 1 }); },
    clearFx: function () { beams.length = 0; parts.length = 0; pops.length = 0; rings.length = 0; flashes = {}; },
    partsCount: function () { return parts.length; }
  };
})();

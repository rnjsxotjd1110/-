// 절차적 천체: 구 셰이딩 + 잡음 무늬 -> 팔레트 램프 양자화(경계에만 디더)
(function () {
  function hash(x, y, z) {
    var h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  }
  function sm(t) { return t * t * (3 - 2 * t); }
  function noise3(x, y, z) {
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    var xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi);
    function L(a, b, t) { return a + (b - a) * t; }
    var n000 = hash(xi, yi, zi), n100 = hash(xi + 1, yi, zi), n010 = hash(xi, yi + 1, zi), n110 = hash(xi + 1, yi + 1, zi);
    var n001 = hash(xi, yi, zi + 1), n101 = hash(xi + 1, yi, zi + 1), n011 = hash(xi, yi + 1, zi + 1), n111 = hash(xi + 1, yi + 1, zi + 1);
    return L(L(L(n000, n100, xf), L(n010, n110, xf), yf), L(L(n001, n101, xf), L(n011, n111, xf), yf), zf);
  }
  function fbm(x, y, z, o) {
    var s = 0, a = 0.5, f = 1, t = 0;
    for (var i = 0; i < (o || 3); i++) { s += noise3(x * f, y * f, z * f) * a; t += a; a *= 0.5; f *= 2.03; }
    return s / t;
  }
  var LT0 = (function () { var v = [-0.62, -0.55, 0.56], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();

  var TIER_R = [0, 2, 3.8, 5.0, 6.0, 5.6, 8.4, 8.0, 6.4, 4.0, 2.8];
  var NAMES_KO = ['', '먼지 구름', '미행성', '암석 행성', '바다 행성', '고리 행성', '가스 거성', '갈색 왜성', '적색 왜성', '백색 왜성', '중성자별'];

  var cache = {};
  var cacheN = 0;
  function bodySprite(tier, seed, frame, lb) {
    lb = lb === undefined ? -1 : lb;
    var key = tier + ':' + seed + ':' + frame + ':' + lb;
    var c = cache[key];
    if (c) return c;
    if (cacheN > 4000) { cache = {}; cacheN = 0; }
    c = make(tier, seed, frame, lb);
    cache[key] = c; cacheN++;
    return c;
  }

  function outline(s, col) {
    var w = s.w, h = s.h, d = new Uint8Array(s.d);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (s.d[y * w + x] !== 255) continue;
      if ((x > 0 && s.d[y * w + x - 1] !== 255) || (x < w - 1 && s.d[y * w + x + 1] !== 255) ||
        (y > 0 && s.d[(y - 1) * w + x] !== 255) || (y < h - 1 && s.d[(y + 1) * w + x] !== 255)) d[y * w + x] = col;
    }
    s.d = d;
  }

  function make(tier, seed, frame, lb) {
    var gx = G.gfx;
    var LT = LT0;
    if (lb >= 0) { var th = lb / 16 * Math.PI * 2; var v3 = [Math.cos(th) * 0.85, Math.sin(th) * 0.85, 0.55]; var ll = Math.hypot(v3[0], v3[1], v3[2]); LT = [v3[0] / ll, v3[1] / ll, v3[2] / ll]; }
    var r = TIER_R[tier] + (tier >= 2 && tier <= 9 ? ((seed % 3) - 1) * (tier >= 8 ? 0.8 : 0.6) : 0);
    var vari = seed % 3;
    var pad = tier === 5 ? 6 : (tier >= 8 ? 5 : 2);
    var S = Math.ceil(r) * 2 + 1 + pad * 2;
    var s = gx.makeSprite(S, S);
    var cx = S / 2, cy = S / 2;
    var ph = frame / 32 * Math.PI * 2;
    var sd = seed * 7.13;
    function put(x, y, c) { if (x >= 0 && y >= 0 && x < S && y < S) s.d[y * S + x] = c; }

    if (tier === 1) {
      // 먼지 구름: 흩어진 알갱이, 느리게 소용돌이
      for (var i = 0; i < 9; i++) {
        var a = i * 2.4 + seed + ph * (i % 2 ? 0.5 : -0.4);
        var rr = 0.6 + (i % 4) * 0.55;
        var x = Math.round(cx - 0.5 + Math.cos(a) * rr * 1.4), y = Math.round(cy - 0.5 + Math.sin(a) * rr);
        put(x, y, i < 3 ? 8 : (i < 6 ? 15 : 14));
      }
      return s;
    }
    var cosP = Math.cos(ph), sinP = Math.sin(ph);
    // 고리 뒤쪽
    if (tier === 5) ring(s, cx, cy, r, false, seed, LT);
    for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
      var nx = (px + 0.5 - cx) / r, ny = (py + 0.5 - cy) / r;
      var rad = r;
      if (tier === 2) {
        var ang = Math.atan2(ny, nx);
        rad = r * (0.78 + 0.32 * noise3(Math.cos(ang) * 1.3 + sd, Math.sin(ang) * 1.3, sd));
        nx = (px + 0.5 - cx) / rad; ny = (py + 0.5 - cy) / rad;
      }
      var d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      var nz = Math.sqrt(1 - d2);
      var l = nx * LT[0] + ny * LT[1] + nz * LT[2];
      // 자전한 표면 좌표
      var X = nx * cosP + nz * sinP, Z = -nx * sinP + nz * cosP, Y = ny;
      var shade = 1 - Math.max(0, Math.min(1, l * 0.95 + 0.12));
      var col;
      if (tier === 2 || tier === 3) {
        var t = fbm(X * 2.2 + sd, Y * 2.2, Z * 2.2, 3);
        var crater = fbm(X * 4 + sd + 9, Y * 4, Z * 4, 2) > 0.62 ? 0.22 : 0;
        var ramp = tier === 2 ? G.RAMP.rock : [8, 9, 10, 21, 23];
        if (tier === 3 && (seed % 3) === 1) ramp = [15, 14, 13, 21, 12];
        if (tier === 3 && (seed % 3) === 2) ramp = [3, 2, 11, 18, 21];
        col = gx.rampPick(ramp, shade * 0.85 + (t - 0.5) * 0.35 + crater, px, py, 0.12);
      } else if (tier === 4) {
        var land = fbm(X * 1.8 + sd, Y * 1.8, Z * 1.8, 4);
        var lth = [0.53, 0.47, 0.6][vari];
        if (land > lth) col = gx.rampPick(vari === 1 ? [8, 9, 10, 21] : [2, 1, 0, 0], shade * 0.9 + (land - lth) * 0.6, px, py, 0.12);
        else col = gx.rampPick([19, 16, 6, 0], shade * 0.95, px, py, 0.12);
        if (Math.abs(Y) > 0.82 && shade < 0.6) col = 4; // 극관
      } else if (tier === 5) {
        var bnd = Math.sin(Y * 7 + fbm(X * 2 + sd, Y * 2, Z * 2, 2) * 3);
        col = gx.rampPick([[8, 9, 10, 21, 23], [15, 14, 13, 21, 12], [3, 2, 11, 18, 21]][vari], shade * 0.85 + bnd * 0.08, px, py, 0.12);
      } else if (tier === 6) {
        var tb = fbm(X * 1.5 + sd, Y * 6, Z * 1.5, 3);
        var stripe = Math.sin(Y * 9 + tb * 4);
        var rampG = [[8, 7, 5, 10, 21], [4, 8, 9, 10, 21], [3, 2, 11, 18, 21]][vari];
        col = gx.rampPick(rampG, shade * 0.8 + stripe * 0.12, px, py, 0.12);
        // 폭풍 점
        var sx = X - 0.35, sy = Y - 0.3;
        if (Z > 0 && sx * sx * 1.2 + sy * sy * 4 < 0.05) col = shade < 0.5 ? 17 : 20;
      } else if (tier === 7) {
        var tb2 = fbm(X * 1.5 + sd, Y * 5, Z * 1.5, 3);
        var st2 = Math.sin(Y * 8 + tb2 * 3);
        col = gx.rampPick([5, 10, 21, 23], shade * 0.75 + st2 * 0.12 + 0.05, px, py, 0.12);
      } else if (tier === 8) {
        // 적색 왜성: 스스로 빛남. 가장자리 어두움 + 쌀알 무늬
        var gr = fbm(X * 3 + sd + ph * 0.3, Y * 3, Z * 3, 2);
        var limb = 1 - nz;
        col = gx.rampPick([8, 7, 17, 20, 22], limb * 0.9 + (gr - 0.5) * 0.3 + 0.05, px, py, 0.15);
      } else if (tier === 9) {
        var limb2 = 1 - nz;
        col = gx.rampPick([4, 4, 8, 15], limb2 * 1.1, px, py, 0.15);
      } else if (tier === 10) {
        col = d2 < 0.35 ? 4 : 19;
      }
      put(px, py, col);
    }
    if (tier === 5) ring(s, cx, cy, r, true, seed, LT);
    if (tier <= 7) outline(s, 12);
    if (tier === 8) {
      // 코로나 가시
      var n = 12;
      for (var k = 0; k < n; k++) {
        var a2 = k / n * Math.PI * 2 + seed;
        var len = 1 + Math.round(noise3(k * 1.7 + seed, frame * 0.15, 0) * 3);
        for (var q = 1; q <= len; q++) {
          var xx = Math.round(cx - 0.5 + Math.cos(a2) * (r + q)), yy = Math.round(cy - 0.5 + Math.sin(a2) * (r + q));
          if (s.d[yy * S + xx] === 255) put(xx, yy, q === 1 ? 17 : (q === 2 ? 20 : 22));
        }
      }
    }
    if (tier === 9) {
      var tw = (frame % 8) < 4 ? 3 : 2;
      for (var q2 = 1; q2 <= tw; q2++) {
        var cc = q2 === 1 ? 4 : 8;
        put(Math.floor(cx) + Math.ceil(r) + q2 - 1, Math.floor(cy), cc); put(Math.floor(cx) - Math.ceil(r) - q2, Math.floor(cy), cc);
        put(Math.floor(cx), Math.floor(cy) + Math.ceil(r) + q2 - 1, cc); put(Math.floor(cx), Math.floor(cy) - Math.ceil(r) - q2, cc);
      }
    }
    if (tier === 10) {
      // 펄서 빔
      var ba = ph * 2;
      for (var q3 = 2; q3 <= 6; q3++) {
        var c3 = q3 < 4 ? 19 : (q3 < 6 ? 16 : 6);
        [0, Math.PI].forEach(function (o) {
          var xx = Math.round(cx - 0.5 + Math.cos(ba + o) * (r + q3 - 1)), yy = Math.round(cy - 0.5 + Math.sin(ba + o) * (r + q3 - 1) * 0.8);
          if (s.d[yy * S + xx] === 255) put(xx, yy, c3);
        });
      }
    }
    return s;
  }
  function ring(s, cx, cy, r, front, seed, LT) {
    var S = s.w;
    var R1 = r * 1.55, R2 = r * ([2.15, 1.9, 2.3][seed % 3]);
    var tilt = 0.32;
    var RC = [[8, 4, 9, 10], [19, 16, 6, 0], [3, 2, 11, 18]][Math.floor(seed / 3) % 3];
    for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
      var x = px + 0.5 - cx, y = (py + 0.5 - cy) / tilt;
      var d = Math.sqrt(x * x + y * y);
      if (d < R1 || d > R2) continue;
      var isFront = (py + 0.5 - cy) > 0;
      if (isFront !== front) continue;
      if (!front) { // 뒤쪽 고리는 행성 뒤에 가려짐 -> 먼저 그림
        var nx = x / r, ny = (py + 0.5 - cy) / r;
        if (nx * nx + ny * ny <= 1) continue;
      }
      var band = (d - R1) / (R2 - R1);
      var c = band < 0.3 ? RC[0] : (band < 0.55 ? RC[1] : (band < 0.7 ? RC[2] : RC[0]));
      if (x * LT[0] < -R1 * 0.4 * Math.abs(LT[0])) c = band < 0.5 ? RC[2] : RC[3]; // 빛 반대쪽은 어두움
      if (!front) c = band < 0.5 ? RC[2] : RC[0];
      s.d[py * S + px] = c;
    }
  }

  // 중심별 (form 0~5)
  var SUNS = [
    { ramp: [4, 3, 7, 5, 10], cor: [3, 7, 5], r: 13 },      // 노란 별
    { ramp: [8, 7, 5, 10, 21], cor: [7, 5, 10], r: 14 },    // 주황 별
    { ramp: [4, 4, 8, 9, 14], cor: [4, 8, 15], r: 12 },     // 흰 별
    { ramp: [7, 17, 20, 22, 23], cor: [17, 20, 22], r: 17 },// 붉은 거성
    { ramp: [4, 19, 16, 6, 0], cor: [19, 16, 6], r: 12 },   // 청록 별
    { ramp: [4, 3, 7, 5, 10], cor: [3, 7, 5], r: 11, twin: true } // 쌍성
  ];
  var sunCache = {};
  function sunSprite(form, frame) {
    var key = form + ':' + frame;
    if (sunCache[key]) return sunCache[key];
    var cfg = SUNS[Math.min(form, SUNS.length - 1)];
    var r = cfg.r, pad = 7;
    var S = r * 2 + 1 + pad * 2;
    var s = G.gfx.makeSprite(S, S);
    var cx = S / 2, cy = S / 2, ph = frame / 48 * Math.PI * 2;
    for (var py = 0; py < S; py++) for (var px = 0; px < S; px++) {
      var nx = (px + 0.5 - cx) / r, ny = (py + 0.5 - cy) / r, d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      var nz = Math.sqrt(1 - d2);
      var gr = fbm(nx * 3 + Math.cos(ph) * 0.6, ny * 3 + Math.sin(ph) * 0.6, nz * 3, 3);
      var limb = 1 - nz;
      var hl = Math.max(0, 1 - Math.hypot(nx + 0.35, ny + 0.35) / 0.45);
      s.d[py * S + px] = G.gfx.rampPick(cfg.ramp, 0.22 + limb * 0.78 + (gr - 0.5) * 0.3 - hl * 0.3, px, py, 0.14);
    }
    // 코로나: 각도별 가시 길이
    var n = 28;
    for (var k = 0; k < n; k++) {
      var a = k / n * Math.PI * 2;
      var len = 1 + Math.round(noise3(Math.cos(a) * 2, Math.sin(a) * 2, frame * 0.08) * 5);
      for (var q = 1; q <= len; q++) {
        var xx = Math.round(cx - 0.5 + Math.cos(a) * (r + q - 0.3)), yy = Math.round(cy - 0.5 + Math.sin(a) * (r + q - 0.3));
        if (xx < 0 || yy < 0 || xx >= S || yy >= S) continue;
        if (s.d[yy * S + xx] !== 255) continue;
        var ci = q <= 1 ? 0 : (q <= 3 ? 1 : 2);
        if (q === len && q > 2 && ((xx + yy) & 1)) continue;
        s.d[yy * S + xx] = cfg.cor[ci];
      }
    }
    sunCache[key] = s;
    return s;
  }

  G.planets = { bodySprite: bodySprite, sunSprite: sunSprite, TIER_R: TIER_R, NAMES_KO: NAMES_KO, noise3: noise3, fbm: fbm, hash: hash, SUNS: SUNS };
})();

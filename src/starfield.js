// 별 배경: 성운(평평한 단계 + 경계 디더) + 깊이가 다른 별 3층 + 반짝임
(function () {
  var BW = 720, BH = 420;
  var neb = null, nebStage = -1;
  var far = [], mid = [], near = [], galaxies = [];
  var STAGES = [
    // 진행 단계별 성운 색 (어두움 -> 밝음)
    { base: 0, bands: [6, 16], th: [0.6, 0.74], density: 1 },
    { base: 0, bands: [21, 18, 10], th: [0.58, 0.7, 0.8], density: 1.2 },
    { base: 0, bands: [23, 22, 20], th: [0.57, 0.68, 0.8], density: 1.4 },
    { base: 12, bands: [6, 16, 19], th: [0.57, 0.69, 0.82], density: 1.6 },
    { base: 0, bands: [6, 16, 19], th: [0.55, 0.67, 0.8], density: 1.9 }
  ];
  function rnd(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function build(stage) {
    var st = STAGES[Math.min(stage, STAGES.length - 1)];
    neb = new Uint8Array(BW * BH);
    var fbm = G.planets.fbm, bay = G.gfx.bayer;
    var band = new Int8Array(BW * BH);
    for (var y = 0; y < BH; y++) for (var x = 0; x < BW; x++) {
      var wx = fbm(x / 90 + 7.3, y / 70 + stage, 1.7 + nebSeed, 3), wy = fbm(x / 90 + 2.1, y / 70 + 4.4 + stage, 3.3 + nebSeed, 3);
      var v = fbm(x / 140 + wx * 1.6 + stage * 3.1 + nebSeed * 5.7, y / 100 + wy * 1.6 + nebSeed * 2.3, 0.5 + stage, 4);
      var bandShape = Math.exp(-Math.pow((y - BH * 0.35 - (x - BW / 2) * 0.35) / 160, 2));
      v = v * (0.55 + 0.55 * bandShape);
      var bi = -1;
      for (var i = 0; i < st.bands.length; i++) if (v > st.th[i]) bi = i;
      band[y * BW + x] = bi;
    }
    // 평평한 단계 + 경계에만 1px 엇갈림 (넓은 바둑판 무늬 없음)
    for (var y2 = 0; y2 < BH; y2++) for (var x2 = 0; x2 < BW; x2++) {
      var k = y2 * BW + x2, b0 = band[k];
      var edge = (x2 + 1 < BW && band[k + 1] > b0) || (y2 + 1 < BH && band[k + BW] > b0);
      if (edge && ((x2 + y2) & 1)) b0 = b0 + 1;
      neb[k] = b0 < 0 ? st.base : st.bands[Math.min(st.bands.length - 1, b0)];
    }
    var R = rnd(1234 + stage);
    far = []; mid = []; near = []; galaxies = [];
    var nf = Math.round(380 * st.density), nm = Math.round(110 * st.density);
    for (var a = 0; a < nf; a++) far.push({ x: R() * BW, y: R() * BH, c: [14, 16, 15, 9][(R() * 4) | 0] });
    for (var b = 0; b < nm; b++) mid.push({ x: R() * BW, y: R() * BH, c: [15, 8, 9, 3][(R() * 4) | 0], p: R() * 6.28 });
    for (var c2 = 0; c2 < 14 + stage * 3; c2++) near.push({ x: R() * BW, y: R() * BH, p: R() * 6.28, sp: 0.6 + R() * 1.2 });
    if (stage >= 2) for (var g = 0; g < stage - 1; g++) galaxies.push({ x: 60 + R() * (BW - 120), y: 40 + R() * (BH - 80), f: R() < 0.5 });
    nebStage = stage;
  }

  // 먼 은하 (직접 찍은 9x5 나선)
  var GAL = null;
  function galSprite() {
    if (GAL) return GAL;
    GAL = G.spr.parse([
      '...ggm...',
      '.mggpgm..',
      'mg.pwpgm.',
      '..mgpggm.',
      '...mgg...'
    ]);
    return GAL;
  }

  // camX, camY: 카메라 흔들림(작게), t: 시간(초)
  var nebSeed = 0;
  function draw(stage, t, camX, camY, x0, y0, w, h, seedOff) {
    seedOff = seedOff || 0;
    if (stage !== nebStage || seedOff !== nebSeed) { nebSeed = seedOff; build(stage); }
    var buf = G.gfx.buf, W = G.gfx.W;
    var drift = t * 2.0;
    var ox = Math.floor(40 + camX * 0.15 + Math.sin(t * 0.004) * 38) % BW, oy = Math.floor(30 + camY * 0.15) % BH;
    var hole = arguments[9];
    var DARK = [0, 0, 11, 2, 8, 10, 0, 5, 9, 10, 21, 18, 12, 12, 13, 14, 6, 20, 21, 16, 22, 23, 23, 23];
    for (var y = y0; y < y0 + h; y++) {
      var sy = ((y + oy) % BH + BH) % BH;
      var row = sy * BW;
      var o = y * W;
      for (var x = x0; x < x0 + w; x++) {
        var sx = ((x + ox) % BW + BW) % BW;
        var c = neb[row + sx];
        if (hole) {
          var ex = (x - hole[0]) / hole[2], ey = (y - hole[1]) / hole[3], e = ex * ex + ey * ey;
          if (e < 1 && !(e > 0.9 && ((x + y) & 1))) { c = DARK[c]; if (e < 0.45 && !(e > 0.4 && ((x + y) & 1))) c = DARK[c]; }
        }
        buf[o + x] = c;
      }
    }
    G.gfx.setClip(x0, y0, w, h);
    function layer(arr, f, fn) {
      var dx = camX * f + drift * f, dy = camY * f;
      for (var i = 0; i < arr.length; i++) {
        var s = arr[i];
        var px = ((Math.floor(s.x - dx) % BW) + BW) % BW - 40, py = ((Math.floor(s.y - dy) % BH) + BH) % BH - 30;
        fn(s, px, py);
      }
    }
    galaxies.forEach(function (g) {
      var px = ((Math.floor(g.x - camX * 0.05) % BW) + BW) % BW - 40, py = g.y - 30;
      G.gfx.blit(galSprite(), px, py, g.f);
    });
    layer(far, 0.25, function (s, x, y) { G.gfx.pset(x, y, s.c); });
    layer(mid, 0.5, function (s, x, y) {
      var tw = Math.sin(t * 1.3 + s.p);
      G.gfx.pset(x, y, tw > 0.85 ? 4 : s.c);
    });
    layer(near, 1.0, function (s, x, y) {
      var v = Math.sin(t * s.sp + s.p);
      var f = v > 0.7 ? 2 : (v > 0.1 ? 1 : 0);
      G.gfx.blit(G.spr.twinkle[f], x - 3, y - 3);
    });
    G.gfx.resetClip();
  }
  G.starfield = { draw: draw, STAGES: STAGES };
})();

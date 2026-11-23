// 저해상도 색번호 버퍼 렌더러. 모든 그리기는 팔레트 색번호(0~23)로만 한다.
(function () {
  var W = 640, H = 360;
  var buf = new Uint8Array(W * H);
  var clip = { x0: 0, y0: 0, x1: W, y1: H };
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  var ox = 0, oy = 0; // 화면 흔들림 오프셋

  function setClip(x, y, w, h) {
    clip.x0 = Math.max(0, x | 0); clip.y0 = Math.max(0, y | 0);
    clip.x1 = Math.min(W, (x + w) | 0); clip.y1 = Math.min(H, (y + h) | 0);
  }
  function resetClip() { clip.x0 = 0; clip.y0 = 0; clip.x1 = W; clip.y1 = H; }

  function pset(x, y, c) {
    x = (x + ox) | 0; y = (y + oy) | 0;
    if (x < clip.x0 || y < clip.y0 || x >= clip.x1 || y >= clip.y1 || c === 255) return;
    buf[y * W + x] = c;
  }
  function pget(x, y) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    return buf[y * W + x];
  }
  function rect(x, y, w, h, c) {
    x = (x + ox) | 0; y = (y + oy) | 0; w |= 0; h |= 0;
    var xa = Math.max(clip.x0, x), ya = Math.max(clip.y0, y);
    var xb = Math.min(clip.x1, x + w), yb = Math.min(clip.y1, y + h);
    for (var j = ya; j < yb; j++) {
      var o = j * W;
      for (var i = xa; i < xb; i++) buf[o + i] = c;
    }
  }
  function hline(x, y, w, c) { rect(x, y, w, 1, c); }
  function vline(x, y, h, c) { rect(x, y, 1, h, c); }
  function clear(c) { buf.fill(c); }
  // 색 치환 사각형 (map: 배열 old->new)
  function remapRect(x, y, w, h, map) {
    x = (x + ox) | 0; y = (y + oy) | 0;
    var xa = Math.max(clip.x0, x), ya = Math.max(clip.y0, y);
    var xb = Math.min(clip.x1, x + w), yb = Math.min(clip.y1, y + h);
    for (var j = ya; j < yb; j++) for (var i = xa; i < xb; i++) {
      var k = j * W + i, m = map[buf[k]];
      if (m !== undefined && m !== 255) buf[k] = m;
    }
  }
  // 스프라이트: {w,h,d:Uint8Array(255=투명)}
  function blit(s, x, y, flipX, map) {
    x |= 0; y |= 0;
    for (var j = 0; j < s.h; j++) {
      for (var i = 0; i < s.w; i++) {
        var c = s.d[j * s.w + (flipX ? s.w - 1 - i : i)];
        if (c === 255) continue;
        if (map) { c = map[c]; if (c === undefined || c === 255) continue; }
        pset(x + i, y + j, c);
      }
    }
  }
  // 스프라이트를 정수 배율로 확대
  function blitScaled(s, x, y, k, map) {
    for (var j = 0; j < s.h; j++) for (var i = 0; i < s.w; i++) {
      var c = s.d[j * s.w + i];
      if (c === 255) continue;
      if (map) { c = map[c]; if (c === undefined || c === 255) continue; }
      rect(x + i * k, y + j * k, k, k, c);
    }
  }
  function bayer(x, y) { return (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16; }
  // v(0..1, 0=밝음)를 램프 색으로. 경계에만 좁은 디더.
  function rampPick(ramp, v, x, y, band) {
    var n = ramp.length;
    if (v <= 0) return ramp[0];
    if (v >= 1) return ramp[n - 1];
    var f = v * (n - 1), i = Math.floor(f), fr = f - i;
    var b = band === undefined ? 0.18 : band;
    var t = (fr - 0.5) / (2 * b) + 0.5;
    if (t <= 0) return ramp[i];
    if (t >= 1) return ramp[Math.min(n - 1, i + 1)];
    return t > bayer(x, y) ? ramp[Math.min(n - 1, i + 1)] : ramp[i];
  }
  function circleFill(cx, cy, r, c) {
    for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) pset(cx + x, cy + y, c);
  }
  // 픽셀 직선 (브레젠험)
  function line(x0, y0, x1, y1, c, dash) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy, n = 0;
    for (;;) {
      if (!dash || ((n >> 1) % dash) === 0) pset(x0, y0, c);
      n++;
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }

  // 화면 출력: 정수 배율
  var canvas, ctx, img, u32, lut = new Uint32Array(256), scale = 1;
  function init(cv) {
    canvas = cv; ctx = cv.getContext('2d');
    img = ctx.createImageData(W, H);
    u32 = new Uint32Array(img.data.buffer);
    for (var i = 0; i < 256; i++) {
      var p = G.PAL_RGB[i] || G.PAL_RGB[0];
      lut[i] = (255 << 24) | (p[2] << 16) | (p[1] << 8) | p[0];
    }
    ctx.imageSmoothingEnabled = false;
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', function () { setTimeout(fit, 50); });
  }
  function fit() {
    var fit = Math.min(window.innerWidth / W, window.innerHeight / H);
    // 정수 배율. 창이 원래 크기보다 작을 때만 어쩔 수 없이 축소
    var k = fit >= 1 ? Math.floor(fit) : fit;
    scale = k;
    canvas.style.width = Math.floor(W * k) + 'px';
    canvas.style.height = Math.floor(H * k) + 'px';
  }
  function present() {
    for (var i = 0; i < W * H; i++) u32[i] = lut[buf[i]];
    ctx.putImageData(img, 0, 0);
  }
  function makeSprite(w, h) { var d = new Uint8Array(w * h); d.fill(255); return { w: w, h: h, d: d }; }

  G.gfx = {
    W: W, H: H, buf: buf, pset: pset, pget: pget, rect: rect, hline: hline, vline: vline, clear: clear,
    blit: blit, blitScaled: blitScaled, bayer: bayer, rampPick: rampPick, circleFill: circleFill, line: line,
    setClip: setClip, resetClip: resetClip, remapRect: remapRect, init: init, present: present, makeSprite: makeSprite,
    setOffset: function (x, y) { ox = x | 0; oy = y | 0; },
    getScale: function () { return scale; },
    canvas: function () { return canvas; }
  };
})();

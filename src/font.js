// 갈무리 BDF 비트맵 글자를 그대로 찍는다 (안티앨리어싱 없음).
(function () {
  var cache = {};
  var LH = { g11: 13, g11b: 13, g9: 11, g7: 9 };
  function glyph(font, code) {
    var key = font + ':' + code;
    if (cache[key] !== undefined) return cache[key];
    var f = FONTDATA[font];
    var g = f && f.g[code];
    if (!g) { cache[key] = null; return null; }
    var dw = g[0], w = g[1], h = g[2], xo = g[3], yo = g[4], hex = g[5], rl = g[6];
    var bits = new Uint8Array(w * h);
    for (var r = 0; r < h; r++) {
      var row = hex.substr(r * rl, rl);
      var v = parseInt(row, 16);
      var nb = rl * 4;
      for (var c = 0; c < w; c++) {
        if ((v >> (nb - 1 - c)) & 1) bits[r * w + c] = 1;
      }
    }
    var o = { dw: dw, w: w, h: h, xo: xo, yo: yo, bits: bits };
    cache[key] = o;
    return o;
  }
  function measure(str, font) {
    font = font || 'g11';
    var w = 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      var g = glyph(font, str.charCodeAt(i));
      w += g ? g.dw : 6;
    }
    return w;
  }
  // y = 글자 상자 위쪽. 반환: 너비
  function draw(str, x, y, color, font, shadow) {
    font = font || 'g11';
    str = String(str);
    var asc = FONTDATA[font].asc;
    var px = x | 0;
    y |= 0;
    if (G.textLog) G.textLog.push([px, y, measure(str, font), (LH[font] || 12), color, shadow === undefined ? -1 : shadow, str]);
    for (var i = 0; i < str.length; i++) {
      var g = glyph(font, str.charCodeAt(i));
      if (!g) { px += 6; continue; }
      var top = y + asc - (g.h + g.yo);
      for (var r = 0; r < g.h; r++) for (var c = 0; c < g.w; c++) {
        if (g.bits[r * g.w + c]) {
          if (shadow !== undefined && shadow !== null) G.gfx.pset(px + g.xo + c, top + r + 1, shadow);
        }
      }
      for (var r2 = 0; r2 < g.h; r2++) for (var c2 = 0; c2 < g.w; c2++) {
        if (g.bits[r2 * g.w + c2]) G.gfx.pset(px + g.xo + c2, top + r2, color);
      }
      px += g.dw;
    }
    return px - x;
  }
  function drawRight(str, xr, y, color, font, shadow) { var w = measure(str, font); draw(str, xr - w, y, color, font, shadow); return w; }
  function drawCenter(str, xc, y, color, font, shadow) { var w = measure(str, font); draw(str, (xc - w / 2) | 0, y, color, font, shadow); return w; }
  // 너비 맞춰 줄바꿈 (공백 우선, 길면 글자 단위)
  function wrap(str, maxW, font) {
    var out = [];
    String(str).split('\n').forEach(function (para) {
      var words = para.split(' ');
      var line = '';
      words.forEach(function (wd) {
        var t = line ? line + ' ' + wd : wd;
        if (measure(t, font) <= maxW) { line = t; return; }
        if (line) out.push(line);
        if (measure(wd, font) <= maxW) { line = wd; return; }
        line = '';
        for (var i = 0; i < wd.length; i++) {
          var t2 = line + wd[i];
          if (measure(t2, font) > maxW) { out.push(line); line = wd[i]; } else line = t2;
        }
      });
      out.push(line);
    });
    return out;
  }
  // 정수 배율 큰 글자 (로고·큰 숫자)
  function drawScaled(str, x, y, k, color, font) {
    font = font || 'g11b';
    str = String(str);
    var asc = FONTDATA[font].asc, px = x | 0;
    for (var i = 0; i < str.length; i++) {
      var g = glyph(font, str.charCodeAt(i));
      if (!g) { px += 6 * k; continue; }
      var top = y + (asc - (g.h + g.yo)) * k;
      for (var r = 0; r < g.h; r++) for (var c = 0; c < g.w; c++)
        if (g.bits[r * g.w + c]) G.gfx.rect(px + (g.xo + c) * k, top + r * k, k, k, typeof color === 'function' ? color(c, r, g) : color);
      px += g.dw * k;
    }
    return px - x;
  }
  G.font = { draw: draw, drawRight: drawRight, drawCenter: drawCenter, measure: measure, wrap: wrap, glyph: glyph, LH: LH, drawScaled: drawScaled };
})();

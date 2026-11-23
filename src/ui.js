// 즉시 모드 UI: 입력 상태 + 위젯(놋쇠 버튼, 글자 탭, 딱지 툴팁)
(function () {
  var inp = { x: -1, y: -1, down: false, pressed: false, released: false, wheel: 0, keys: {}, keysPressed: {}, consumed: false, any: false };
  var hotId = null, activeId = null, hoverId = null;
  var tooltip = null;

  function bind(cv) {
    function pos(e) {
      var r = cv.getBoundingClientRect();
      var k = G.gfx.getScale();
      inp.x = Math.floor((e.clientX - r.left) / k);
      inp.y = Math.floor((e.clientY - r.top) / k);
    }
    cv.addEventListener('mousemove', function (e) { pos(e); });
    cv.addEventListener('mousedown', function (e) { pos(e); inp.down = true; inp.pressed = true; inp.any = true; cv.focus(); e.preventDefault(); if (G.audio) G.audio.unlock(); });
    window.addEventListener('mouseup', function (e) { pos(e); if (inp.down) inp.released = true; inp.down = false; });
    cv.addEventListener('mouseleave', function () { inp.x = -1; inp.y = -1; });
    cv.addEventListener('wheel', function (e) { inp.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; pos(t); inp.down = true; inp.pressed = true; inp.any = true; e.preventDefault(); if (G.audio) G.audio.unlock(); }, { passive: false });
    cv.addEventListener('touchmove', function (e) { var t = e.changedTouches[0]; pos(t); e.preventDefault(); }, { passive: false });
    cv.addEventListener('touchend', function (e) { var t = e.changedTouches[0]; pos(t); inp.released = true; inp.down = false; e.preventDefault(); setTimeout(function () { inp.x = -1; inp.y = -1; }, 50); }, { passive: false });
    window.addEventListener('keydown', function (e) {
      if (!inp.keys[e.code]) inp.keysPressed[e.code] = true;
      inp.keys[e.code] = true; inp.any = true;
      if (e.code === 'Space' || e.code.indexOf('Arrow') === 0) e.preventDefault();
      if (G.audio) G.audio.unlock();
    });
    window.addEventListener('keyup', function (e) { inp.keys[e.code] = false; });
  }
  function endFrame() {
    inp.pressed = false; inp.released = false; inp.wheel = 0; inp.keysPressed = {}; inp.any = false;
    if (!inp.down) activeId = null;
  }
  function over(x, y, w, h) { return inp.x >= x && inp.y >= y && inp.x < x + w && inp.y < y + h; }

  // 반환: 'click' | null. 상태: normal/hover/down/off
  var blocked = false;
  function hitArea(id, x, y, w, h, enabled) {
    if (blocked) return { clicked: false, state: enabled === false ? 'off' : 'normal', over: false };
    var o = over(x, y, w, h);
    if (o) hoverId = id;
    if (o && inp.pressed && enabled !== false) activeId = id;
    var clicked = false;
    if (inp.released && activeId === id && o && enabled !== false) clicked = true;
    var state = enabled === false ? 'off' : (activeId === id && o ? 'down' : (o ? 'hover' : 'normal'));
    return { clicked: clicked, state: state, over: o };
  }

  // 놋쇠 버튼. style: 'brass'|'core'|'teal'
  function button(id, x, y, w, h, label, opts) {
    opts = opts || {};
    var en = opts.enabled !== false;
    var r = hitArea(id, x, y, w, h, en);
    var S = G.spr, sp;
    var style = opts.style || 'brass';
    if (!en) sp = S.btnOff;
    else if (r.state === 'down') sp = S.btnDown;
    else if (r.state === 'hover') sp = style === 'core' ? S.btnCoreHover : S.btnHover;
    else sp = style === 'core' ? S.btnCore : (style === 'teal' ? S.btnTeal : S.btn);
    var dy = r.state === 'down' ? 1 : 0;
    G.nine(sp, x, y + dy, w, h - dy);
    var font = opts.font || 'g11';
    var col = en ? (r.state === 'down' ? 4 : 12) : 15;
    if (style === 'teal' && en && r.state !== 'hover') col = 4;
    var tw = G.font.measure(label, font);
    var ty = y + dy + Math.floor((h - (font === 'g9' ? 9 : 11)) / 2) - (font === 'g9' ? 1 : 1);
    if (opts.icon) {
      var iw = opts.icon.w + 2;
      G.gfx.blit(opts.icon, x + Math.floor((w - tw - iw) / 2), y + dy + Math.floor((h - opts.icon.h) / 2));
      G.font.draw(label, x + Math.floor((w - tw - iw) / 2) + iw, ty, col, font);
    } else G.font.draw(label, x + Math.floor((w - tw) / 2), ty, col, font);
    if (r.clicked && G.audio) G.audio.play(opts.sfx || 'tap');
    return r.clicked;
  }

  // 글자 탭 + 2px 밑줄
  function tabs(id, x, y, items, current, opts) {
    var px = x, out = current;
    opts = opts || {};
    var gap = opts.gap || 10;
    items.forEach(function (it) {
      if (it.hidden) return;
      var w = G.font.measure(it.label, 'g11');
      var r = hitArea(id + it.key, px - 3, y - 2, w + 6, 16, it.enabled !== false);
      var sel = current === it.key;
      var col = sel ? 4 : (r.over ? 8 : 15);
      if (it.enabled === false) col = 14;
      G.font.draw(it.label, px, y, col, 'g11', 12);
      if (sel) { G.gfx.rect(px, y + 13, w, 2, 3); }
      if (it.dot) { G.gfx.rect(px + w + 1, y, 2, 2, 17); }
      if (r.clicked) { out = it.key; if (G.audio) G.audio.play('tab'); }
      px += w + gap;
    });
    return out;
  }

  // 종이 딱지 툴팁 (프레임 끝에 그림)
  function tip(lines, x, y) { tooltip = { lines: lines, x: x, y: y }; }
  function drawTooltip() {
    if (!tooltip) return;
    var t = tooltip; tooltip = null;
    var w = 0, h = 6;
    t.lines.forEach(function (l) { w = Math.max(w, G.font.measure(l.t, l.f || 'g9')); h += (l.f === 'g11' || l.f === 'g11b') ? 13 : 11; });
    w += 10;
    var x = Math.min(G.gfx.W - w - 2, t.x + 8), y = t.y + 10;
    if (y + h > G.gfx.H - 2) y = t.y - h - 4;
    if (x < 2) x = 2; if (y < 2) y = 2;
    G.nine(G.spr.paper, x, y, w, h);
    var cy = y + 3;
    t.lines.forEach(function (l) {
      G.font.draw(l.t, x + 5, cy, l.c === undefined ? 12 : l.c, l.f || 'g9');
      cy += (l.f === 'g11' || l.f === 'g11b') ? 13 : 11;
    });
  }
  // 홈 선 (어두운 1px + 밝은 1px)
  function groove(x, y, w) { G.gfx.hline(x, y, w, 12); G.gfx.hline(x, y + 1, w, 11); }
  function grooveV(x, y, h) { G.gfx.vline(x, y, h, 12); G.gfx.vline(x + 1, y, h, 11); }

  G.ui = { inp: inp, bind: bind, endFrame: endFrame, over: over, hitArea: hitArea, button: button, tabs: tabs, tip: tip, drawTooltip: drawTooltip, groove: groove, grooveV: grooveV,
    resetHover: function () { hoverId = null; }, hover: function () { return hoverId; }, block: function (b) { blocked = !!b; } };
})();

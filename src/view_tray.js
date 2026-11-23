// 주사위 쟁반: 굴림 애니메이션(튀며 구르다 정해진 면으로 착지), 레버
(function () {
  var T = { x: 0, y: 266, w: 416, h: 94 };
  var IN = { x: 8, y: 274, w: 324, h: 78 }; // 펠트 바닥
  var LEV = { x: 338, y: 270, w: 76, h: 86 };
  var dice = [];    // 화면 주사위 상태
  var shakeT = 0, leverT = 0;
  var rollId = 0;

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  // specs: [{shape, faces, mat}], results: [faceIdx...], dur: 초, onLand
  function roll(specs, results, dur, onLand) {
    rollId++;
    var n = specs.length;
    var gap = Math.min(50, Math.floor((IN.w - 96) / Math.max(1, n)));
    var startX = IN.x + 34 + Math.floor((IN.w - 96 - gap * (n - 1)) / 2);
    var prev = dice;
    dice = specs.map(function (sp, i) {
      var tx = startX + i * gap + Math.round((Math.random() - 0.5) * 8);
      var ty = IN.y + 40 + Math.round((Math.random() - 0.5) * 10);
      var far = Math.min(1, dur / 0.8);
      var sx = tx - 50 - far * 120 - Math.random() * 20, sy = ty - 14 + Math.random() * 28;
      var yaw = 0;
      var qf = G.dice3d.restQuat(sp.shape, results[i], yaw);
      var dist = tx - sx;
      return {
        spec: sp, face: results[i], qf: qf, sx: sx, sy: sy, tx: tx, ty: ty,
        th: dist / 12 + Math.PI * 2 * (1 + Math.floor(Math.random() * 2)), wob: (Math.random() - 0.5) * 3,
        t: -i * 0.06 * far, dur: dur, landed: false, hops: dur > 0.5 ? 3 : 2
      };
    });
    leverT = 1;
    var myId = rollId;
    var landed = 0;
    dice.forEach(function (d) {
      d.onLand = function () {
        landed++;
        if (G.audio) G.audio.play('land', { pitch: 0.9 + Math.random() * 0.2 });
        if (landed === dice.length && myId === rollId && onLand) onLand();
      };
    });
    if (prev.length && dur < 0.4) { /* 빠른 굴림: 이전 주사위는 즉시 교체 */ }
  }

  function update(dt) {
    dice.forEach(function (d) {
      if (d.landed) return;
      d.t += dt / d.dur;
      if (d.t >= 1) { d.t = 1; d.landed = true; shakeT = Math.max(shakeT, 0.08); d.onLand && d.onLand(); }
    });
    shakeT = Math.max(0, shakeT - dt);
    leverT = Math.max(0, leverT - dt * 3);
  }

  function diePose(d) {
    var t = Math.max(0, d.t), e = ease(t);
    var x = d.sx + (d.tx - d.sx) * e;
    var y = d.sy + (d.ty - d.sy) * e;
    var hop = Math.abs(Math.sin(t * Math.PI * d.hops)) * 20 * (1 - t) * (1 - t);
    var rem = 1 - e;
    var q = G.dice3d.qmul(G.dice3d.qaxis([0, 0, -1], d.th * rem), G.dice3d.qmul(G.dice3d.qaxis([1, 0, 0], d.wob * rem), d.qf));
    return { x: Math.round(x), y: Math.round(y), hop: Math.round(hop), q: q, vis: d.t > -0.001 };
  }

  function draw(opts) {
    opts = opts || {};
    var gx = G.gfx;
    G.nine(G.spr.panel, T.x, T.y, T.w, T.h);
    // 펠트 바닥 (홈 파인 칸)
    G.nine(G.spr.inset, IN.x - 2, IN.y - 2, IN.w + 4, IN.h + 4);
    // 펠트: 안쪽 가장자리 그늘 + 성긴 직물 결
    for (var y = IN.y; y < IN.y + IN.h; y++) for (var x = IN.x; x < IN.x + IN.w; x++) {
      var e = Math.min(x - IN.x, y - IN.y);
      if (e < 3 && (e < 2 || ((x + y) & 1))) gx.pset(x, y, 23);
      else if (((x + 2 * y) % 9 === 0) && ((y % 3) === 0)) gx.pset(x, y, 23);
    }
    var sh = shakeT > 0 && !opts.reduce ? 1 : 0;
    gx.setClip(IN.x, IN.y, IN.w, IN.h);
    var dsz = dice.length > 5 ? 1.45 : 1.75;
    // 그림자 먼저
    dice.forEach(function (d) {
      var p = diePose(d); if (!p.vis) return;
      var r = Math.round(dsz * 9) - Math.min(5, p.hop >> 2);
      for (var j = -3; j <= 3; j++) for (var i = -r; i <= r; i++) {
        if ((i * i) / (r * r) + (j * j) / 10 <= 1) gx.pset(p.x + i + 4, p.y + Math.round(dsz * 9) + j + sh, 23);
      }
    });
    dice.forEach(function (d, i) {
      var p = diePose(d); if (!p.vis) return;
      var spr = G.dice3d.render(d.spec, p.q, dsz * (d.spec.shape === 'd12' ? 0.95 : 1), -1);
      d._sx = p.x; d._sy = p.y - p.hop;
      gx.blit(spr, p.x - spr.R, p.y - spr.R - p.hop + sh);
    });
    gx.resetClip();
    drawLever(opts);
  }

  function drawLever(opts) {
    var gx = G.gfx;
    var x = LEV.x, y = LEV.y;
    // 레버 홈 (세로)
    var slotX = x + 33, slotY = y + 8, slotH = 48;
    G.nine(G.spr.insetDark, slotX - 2, slotY - 2, 10, slotH + 4);
    // 눈금 표시
    for (var i = 0; i < 5; i++) { gx.hline(slotX - 7, slotY + 4 + i * 10, 3, 11); gx.hline(slotX + 10, slotY + 4 + i * 10, 3, 11); }
    var pull = opts.leverHeld ? 1 : leverT;
    var ky = slotY + Math.round(pull * (slotH - 16));
    gx.rect(slotX + 1, ky + 8, 2, slotY + slotH - ky - 8, 15);
    gx.rect(slotX + 3, ky + 8, 1, slotY + slotH - ky - 8, 14);
    G.gfx.blit(G.spr.knobBig, slotX - 5, ky - 4);
    var lab = opts.leverLabel || G.T('roll');
    var hot = opts.leverHot;
    var lw = G.embossMeasure(lab, 1, 'g11b');
    G.font.draw(lab, x + 38 - (lw >> 1), y + 62, hot ? 4 : 3, 'g11b', 12);
    G.font.drawCenter('Space', x + 38, y + 75, 15, 'g7');
  }
  // 합 배지: 펠트 오른쪽 끝 고정 자리
  function drawBadge(sum, batch) {
    var x = IN.x + IN.w - 50, y = IN.y + 8;
    G.nine(G.spr.insetDark, x, y, 44, 34);
    G.font.drawCenter(G.T('sum_lbl'), x + 22, y + 3, 15, 'g9');
    if (sum !== undefined) {
      var t = String(sum), w = G.embossMeasure(t, 2);
      G.embossText(t, x + 22 - (w >> 1), y + 14, 2, [4, 8, 9], 'g11b', 12);
    }
    if (batch) G.font.drawCenter(G.T('n_rolls2', G.fmt(batch)), x + 22, y + 46, 8, 'g9', 23);
  }
  function leverHit(mx, my) { return mx >= LEV.x && my >= LEV.y && mx < LEV.x + LEV.w && my < LEV.y + LEV.h; }
  function centerOf(i) { var d = dice[i]; return d ? { x: d._sx || d.tx, y: d._sy || d.ty } : { x: IN.x + IN.w / 2, y: IN.y + 20 }; }
  function rolling() { return dice.some(function (d) { return !d.landed; }); }
  function sumPos() {
    return { x: IN.x + IN.w - 28, y: IN.y + 20 };
    if (!dice.length) return { x: IN.x + IN.w / 2, y: IN.y };
    var xs = dice.map(function (d) { return d.tx; });
    return { x: Math.round((Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2), y: IN.y + 4 };
  }
  // 저장된 화면 주사위를 정지 상태로 놓기
  function place(specs, faces) {
    roll(specs, faces, 0.01, null);
    dice.forEach(function (d) { d.t = 1; d.landed = true; });
  }
  function dieAt(mx, my) {
    for (var i = 0; i < dice.length; i++) { var d = dice[i]; if (d.landed && Math.abs(mx - d.tx) < 16 && Math.abs(my - d.ty) < 16) return i; }
    return -1;
  }
  G.tray = { drawBadge: drawBadge, T: T, IN: IN, LEV: LEV, roll: roll, update: update, draw: draw, leverHit: leverHit, centerOf: centerOf, rolling: rolling, sumPos: sumPos, place: place, dieAt: dieAt, dice: function () { return dice; } };
})();

// 주사위 쟁반: 굴림 애니메이션(튀며 구르다 정해진 면으로 착지), 레버
(function () {
  var T = { x: 0, y: 288, w: 416, h: 72 };
  var IN = { x: 8, y: 296, w: 330, h: 56 }; // 펠트 바닥
  var LEV = { x: 346, y: 294, w: 62, h: 60 };
  var dice = [];    // 화면 주사위 상태
  var shakeT = 0, leverT = 0;
  var rollId = 0;

  function ease(t) { return 1 - Math.pow(1 - t, 3); }

  // specs: [{shape, faces, mat}], results: [faceIdx...], dur: 초, onLand
  function roll(specs, results, dur, onLand) {
    rollId++;
    var n = specs.length;
    var gap = Math.min(40, Math.floor((IN.w - 40) / Math.max(1, n)));
    var startX = IN.x + Math.floor((IN.w - gap * (n - 1)) / 2);
    var prev = dice;
    dice = specs.map(function (sp, i) {
      var tx = startX + i * gap + Math.round((Math.random() - 0.5) * 8);
      var ty = IN.y + 26 + Math.round((Math.random() - 0.5) * 10);
      var sx = IN.x - 14 - Math.random() * 30, sy = IN.y + 10 + Math.random() * 30;
      var yaw = (Math.random() - 0.5) * 1.2;
      var qf = G.dice3d.restQuat(sp.shape, results[i], yaw);
      var dist = tx - sx;
      return {
        spec: sp, face: results[i], qf: qf, sx: sx, sy: sy, tx: tx, ty: ty,
        th: dist / 7 + Math.PI * 2 * (1 + Math.floor(Math.random() * 2)), wob: (Math.random() - 0.5) * 3,
        t: -i * 0.06, dur: dur, landed: false, hops: dur > 0.5 ? 3 : 2
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
    var hop = Math.abs(Math.sin(t * Math.PI * d.hops)) * 12 * (1 - t) * (1 - t);
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
    // 펠트 결: 아주 드문 점
    for (var y = IN.y; y < IN.y + IN.h; y++) for (var x = IN.x; x < IN.x + IN.w; x++) {
      if (G.planets.hash(x, y, 7) > 0.985) gx.pset(x, y, 23);
    }
    var sh = shakeT > 0 && !opts.reduce ? 1 : 0;
    gx.setClip(IN.x, IN.y, IN.w, IN.h);
    // 그림자 먼저
    dice.forEach(function (d) {
      var p = diePose(d); if (!p.vis) return;
      var r = 8 - Math.min(4, p.hop >> 2);
      for (var j = -2; j <= 2; j++) for (var i = -r; i <= r; i++) {
        if ((i * i) / (r * r) + (j * j) / 6.5 <= 1) gx.pset(p.x + i + 3, p.y + 9 + j + sh, 23);
      }
    });
    var size = dice.length > 6 ? 1.0 : 1.2;
    dice.forEach(function (d, i) {
      var p = diePose(d); if (!p.vis) return;
      var spr = G.dice3d.render(d.spec, p.q, size, d.landed && opts.hl ? d.face : -1);
      d._sx = p.x; d._sy = p.y - p.hop;
      gx.blit(spr, p.x - spr.R, p.y - spr.R - p.hop + sh);
    });
    gx.resetClip();
    drawLever(opts);
  }

  function drawLever(opts) {
    var gx = G.gfx;
    var x = LEV.x, y = LEV.y;
    // 레버 홈
    var slotX = x + 26, slotY = y + 6, slotH = 34;
    G.nine(G.spr.insetDark, slotX - 1, slotY - 1, 8, slotH + 2);
    var pull = opts.leverHeld ? 1 : leverT;
    var ky = slotY + Math.round(pull * (slotH - 12));
    // 막대
    gx.vline(slotX + 2, ky + 6, slotY + slotH - ky - 6, 15);
    gx.vline(slotX + 3, ky + 6, slotY + slotH - ky - 6, 14);
    G.gfx.blit(G.spr.knob, slotX - 2, ky - 3);
    var lab = opts.leverLabel || '굴리기';
    var hot = opts.leverHot;
    G.font.drawCenter(lab, x + 30, y + 44, hot ? 4 : 8, 'g11b', 12);
  }

  function leverHit(mx, my) { return mx >= LEV.x && my >= LEV.y && mx < LEV.x + LEV.w && my < LEV.y + LEV.h; }
  function centerOf(i) { var d = dice[i]; return d ? { x: d._sx || d.tx, y: d._sy || d.ty } : { x: IN.x + IN.w / 2, y: IN.y + 20 }; }
  function rolling() { return dice.some(function (d) { return !d.landed; }); }
  function sumPos() {
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
    for (var i = 0; i < dice.length; i++) { var d = dice[i]; if (d.landed && Math.abs(mx - d.tx) < 11 && Math.abs(my - d.ty) < 11) return i; }
    return -1;
  }
  G.tray = { T: T, IN: IN, LEV: LEV, roll: roll, update: update, draw: draw, leverHit: leverHit, centerOf: centerOf, rolling: rolling, sumPos: sumPos, place: place, dieAt: dieAt, dice: function () { return dice; } };
})();

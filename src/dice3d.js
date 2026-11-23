// 저해상도 실시간 3D 주사위 렌더러 (볼록 다면체 광선 투사 -> 팔레트 램프 양자화)
(function () {
  var PHI = (1 + Math.sqrt(5)) / 2;
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  // 쿼터니언 [w,x,y,z]
  function qmul(a, b) {
    return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  }
  function qaxis(ax, ang) { var s = Math.sin(ang / 2); ax = norm(ax); return [Math.cos(ang / 2), ax[0] * s, ax[1] * s, ax[2] * s]; }
  function qrot(q, v) {
    var p = [0, v[0], v[1], v[2]];
    var qc = [q[0], -q[1], -q[2], -q[3]];
    var r = qmul(qmul(q, p), qc);
    return [r[1], r[2], r[3]];
  }
  function qconj(q) { return [q[0], -q[1], -q[2], -q[3]]; }
  function qarc(a, b) { // a를 b로 돌리는 최단 회전
    a = norm(a); b = norm(b);
    var d = dot(a, b);
    if (d > 0.99999) return [1, 0, 0, 0];
    if (d < -0.99999) { var ax = Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]); return qaxis(ax, Math.PI); }
    var c = cross(a, b);
    var q = [1 + d, c[0], c[1], c[2]];
    var l = Math.hypot(q[0], q[1], q[2], q[3]);
    return [q[0] / l, q[1] / l, q[2] / l, q[3] / l];
  }

  // 모양 정의: planes [{n,d,val,u,v}], readDown: d4는 바닥 면이 결과
  var SHAPES = {};
  function addFaces(list, dist) {
    return list.map(function (n) {
      n = norm(n);
      var ref = Math.abs(n[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      var u = norm(cross(ref, n));
      var v = cross(n, u);
      return { n: n, d: dist, u: u, v: v };
    });
  }
  SHAPES.d6 = { planes: addFaces([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 1), base: [2, 5, 1, 6, 3, 4], k: 6.6, pips: true };
  (function () {
    var v = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
    SHAPES.d4 = { planes: addFaces(v.map(function (a) { return [-a[0], -a[1], -a[2]]; }), 0.55), base: [1, 2, 3, 4], k: 7.2, readDown: true };
    var o = [];
    [1, -1].forEach(function (x) { [1, -1].forEach(function (y) { [1, -1].forEach(function (z) { o.push([x, y, z]); }); }); });
    SHAPES.d8 = { planes: addFaces(o, 0.92), base: [1, 7, 5, 3, 6, 4, 2, 8], k: 7.0 };
    var ic = [];
    [1, -1].forEach(function (a) { [1, -1].forEach(function (b) {
      ic.push([0, a, b * PHI]); ic.push([a, b * PHI, 0]); ic.push([b * PHI, 0, a]);
    }); });
    SHAPES.d12 = { planes: addFaces(ic, 1.05), base: [1, 2, 3, 4, 5, 6, 12, 11, 10, 9, 8, 7], k: 6.4 };
  })();
  // 반대 면 짝 맞추기(d12: 합 13)
  (function () {
    var p = SHAPES.d12.planes, used = {}, vals = [], next = 1;
    for (var i = 0; i < p.length; i++) {
      if (used[i]) continue;
      for (var j = i + 1; j < p.length; j++) {
        if (!used[j] && dot(p[i].n, p[j].n) < -0.99) { used[i] = used[j] = 1; vals[i] = next; vals[j] = 13 - next; next++; break; }
      }
    }
    SHAPES.d12.base = vals;
    var q = SHAPES.d8.planes, u8 = {}, v8 = [], n8 = 1;
    for (var a = 0; a < q.length; a++) {
      if (u8[a]) continue;
      for (var b = a + 1; b < q.length; b++) if (!u8[b] && dot(q[a].n, q[b].n) < -0.99) { u8[a] = u8[b] = 1; v8[a] = n8; v8[b] = 9 - n8; n8++; break; }
    }
    SHAPES.d8.base = v8;
  })();

  // 3x5 숫자 (면 숫자용, 직접 찍은 데이터)
  var DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
    '111100111001111', '111100111101111', '111001001010010', '111101111101111', '111101111001111'];
  // 눈 위치 (3x3 격자 좌표 -1,0,1)
  var PIPS = {
    1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
    7: [[-1, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [1, 1]],
    8: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]]
  };

  // 카메라: 정사영, 비스듬히 내려다봄
  var VD = norm([0, -1, -0.62]);
  var VR = [1, 0, 0];
  var VU = norm([0, -VD[2], VD[1]]); if (VU[1] < 0) VU = [-VU[0], -VU[1], -VU[2]];
  var LT = norm([-0.55, 0.85, 0.5]); // 왼쪽 위 앞에서 오는 빛

  // 재질 램프: 밝음 -> 어두움 (몸체 5단), 눈 색 2단
  var MATS = {
    ivory: { body: [4, 8, 9, 14, 13], pip: [20, 22], edge: 4, outline: 12 },
    brass: { body: [3, 2, 11, 18, 21], pip: [12, 12], edge: 4, outline: 12 },
    clay: { body: [8, 7, 5, 10, 21], pip: [12, 23], edge: 4, outline: 12 },
    teal: { body: [19, 16, 6, 0, 0], pip: [4, 8], edge: 4, outline: 12 },
    ember: { body: [7, 17, 20, 22, 23], pip: [4, 8], edge: 8, outline: 12 }
  };

  function shadeIdx(l) { // 빛 세기 -> 0..4
    if (l > 0.82) return 0;
    if (l > 0.55) return 1;
    if (l > 0.3) return 2;
    if (l > 0.1) return 3;
    return 4;
  }

  // die: {shape:'d6', faces:[...], mat:'ivory'}, q: 회전, size: 배율(1=기본)
  // 1) 2×2 과표본으로 윤곽·면을 구하고 2) 눈은 투영 위치에 정해진 픽셀 모양으로 찍는다.
  function render(die, q, size, highlightFace) {
    var sh = SHAPES[die.shape];
    var k = sh.k * (size || 1);
    var R = Math.ceil(k * 1.9) + 2;
    var w = R * 2 + 1, h = R * 2 + 1;
    var spr = G.gfx.makeSprite(w, h);
    var mat = MATS[die.mat || 'ivory'];
    var qc = qconj(q);
    var bD = qrot(qc, VD), bR = qrot(qc, VR), bU = qrot(qc, VU);
    var planes = sh.planes, np = planes.length;
    var wn = planes.map(function (p) { return qrot(q, p.n); });
    var bev = 0.1;
    var faceOf = new Int16Array(w * h).fill(-1);
    function cast(sx, sy) {
      var O0 = bR[0] * sx - bU[0] * sy - bD[0] * 4, O1 = bR[1] * sx - bU[1] * sy - bD[1] * 4, O2 = bR[2] * sx - bU[2] * sy - bD[2] * 4;
      var tin = -1e9, tout = 1e9, fi = -1, t2 = -1e9, f2 = -1;
      for (var i = 0; i < np; i++) {
        var p = planes[i], n = p.n;
        var den = n[0] * bD[0] + n[1] * bD[1] + n[2] * bD[2];
        var num = p.d - (n[0] * O0 + n[1] * O1 + n[2] * O2);
        if (Math.abs(den) < 1e-9) { if (num < 0) return null; continue; }
        var t = num / den;
        if (den < 0) { if (t > tin) { t2 = tin; f2 = fi; tin = t; fi = i; } else if (t > t2) { t2 = t; f2 = i; } }
        else if (t < tout) tout = t;
      }
      if (tin > tout || fi < 0) return null;
      return { fi: fi, f2: f2, gap: tin - t2, y: (O1 + bD[1] * tin) };
    }
    for (var py = 0; py < h; py++) {
      for (var px = 0; px < w; px++) {
        // 2×2 과표본: 2개 이상 맞으면 칠함
        var hits = 0;
        for (var ss = 0; ss < 4; ss++) {
          var hx = (px - R + (ss & 1 ? 0.25 : -0.25)) / k, hy = (py - R + (ss & 2 ? 0.25 : -0.25)) / k;
          if (cast(hx, hy)) hits++;
        }
        if (hits < 2) continue;
        var c0 = cast((px - R) / k, (py - R) / k);
        if (!c0) c0 = cast((px - R + 0.25) / k, (py - R + 0.25) / k) || cast((px - R - 0.25) / k, (py - R - 0.25) / k);
        if (!c0) continue;
        var n = wn[c0.fi];
        var l = dot(n, LT);
        var si = shadeIdx(l);
        var c;
        if (c0.f2 >= 0 && c0.gap < bev) {
          var n2 = wn[c0.f2];
          var ne = norm([n[0] + n2[0], n[1] + n2[1], n[2] + n2[2]]);
          var le = dot(ne, LT);
          c = le > 0.72 ? mat.edge : mat.body[Math.min(4, Math.max(si, shadeIdx(le)) + 1)];
        } else {
          // 바닥 쪽 접촉 음영 (세계 좌표 y가 낮을수록 한 단계 어둡게)
          var wy = qrot(q, [0, 0, 0])[1];
          c = mat.body[si];
          faceOf[py * w + px] = c0.fi;
        }
        spr.d[py * w + px] = c;
      }
    }
    // 바닥 접촉 음영: 실루엣 아래쪽 2px 안을 한 단계 어둡게
    for (var x2 = 0; x2 < w; x2++) {
      var bottom = -1;
      for (var y2 = h - 1; y2 >= 0; y2--) if (spr.d[y2 * w + x2] !== 255) { bottom = y2; break; }
      if (bottom < 0) continue;
      for (var dy = 0; dy < 2; dy++) {
        var idx = (bottom - dy) * w + x2;
        var cc = spr.d[idx]; var bi = mat.body.indexOf(cc);
        if (bi >= 0 && bi < 4 && dy === 0) spr.d[idx] = mat.body[bi + 1];
      }
    }
    // 눈 / 숫자
    var pipCol = mat.pip;
    for (var f = 0; f < np; f++) {
      var nwf = wn[f];
      var facing = -dot(nwf, VD);
      if (facing < (sh.pips ? 0.45 : 0.12)) continue;
      var pl = planes[f];
      var val = die.faces[f];
      var siF = shadeIdx(dot(nwf, LT));
      if (sh.pips && val >= 1 && val <= 9) {
        var pts = PIPS[val], sp = 0.52;
        var r = (val > 6 ? 0.19 : 0.23) * k;
        // 화면에서 면 법선 방향 (찌그러짐 방향)
        var a = dot(nwf, VR), b = -dot(nwf, VU);
        var al = Math.hypot(a, b) || 1; a /= al; b /= al;
        var ff = Math.max(0.25, facing);
        var wx = Math.max(1, Math.round(2 * r * Math.sqrt(a * a * ff * ff + b * b)));
        var wyy = Math.max(1, Math.round(2 * r * Math.sqrt(b * b * ff * ff + a * a)));
        if (facing > 0.8) { wx = wyy = Math.max(2, Math.round(2 * r)); }
        for (var m = 0; m < pts.length; m++) {
          var P = [pl.n[0] * pl.d + pl.u[0] * pts[m][0] * sp + pl.v[0] * pts[m][1] * sp,
            pl.n[1] * pl.d + pl.u[1] * pts[m][0] * sp + pl.v[1] * pts[m][1] * sp,
            pl.n[2] * pl.d + pl.u[2] * pts[m][0] * sp + pl.v[2] * pts[m][1] * sp];
          var W = qrot(q, P);
          var cx = dot(W, VR) * k + R, cy = -dot(W, VU) * k + R;
          var x0 = Math.round(cx - wx / 2), y0 = Math.round(cy - wyy / 2);
          for (var yy = 0; yy < wyy; yy++) for (var xx = 0; xx < wx; xx++) {
            var corner = (wx >= 3 && wyy >= 3) && ((xx === 0 || xx === wx - 1) && (yy === 0 || yy === wyy - 1));
            if (corner) continue;
            var X = x0 + xx, Y = y0 + yy;
            if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
            if (faceOf[Y * w + X] !== f) continue;
            var dark = (xx === 0 && wx >= 3) || (yy === 0 && wyy >= 3);
            spr.d[Y * w + X] = (dark || siF >= 3) ? pipCol[1] : pipCol[0];
          }
        }
      } else if (!sh.pips && facing > 0.5) {
        if (sh.readDown && highlightFace >= 0) val = die.faces[highlightFace];
        var str = String(val), tw = str.length * 4 - 1;
        var Pc = [pl.n[0] * pl.d, pl.n[1] * pl.d, pl.n[2] * pl.d];
        var Wc = qrot(q, Pc);
        var ccx = Math.round(dot(Wc, VR) * k + R - tw / 2), ccy = Math.round(-dot(Wc, VU) * k + R - 2.5);
        for (var di = 0; di < str.length; di++) {
          var dg = DIG[+str[di]];
          for (var gy = 0; gy < 5; gy++) for (var gx2 = 0; gx2 < 3; gx2++) {
            if (dg[gy * 3 + gx2] !== '1') continue;
            var X2 = ccx + di * 4 + gx2, Y2 = ccy + gy;
            if (X2 < 0 || Y2 < 0 || X2 >= w || Y2 >= h || faceOf[Y2 * w + X2] !== f) continue;
            spr.d[Y2 * w + X2] = pipCol[siF >= 3 ? 1 : 0];
          }
        }
      }
    }
    // 1px 외곽선
    var out = new Uint8Array(spr.d);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (spr.d[y * w + x] !== 255) continue;
      if ((x > 0 && spr.d[y * w + x - 1] !== 255) || (x < w - 1 && spr.d[y * w + x + 1] !== 255) ||
        (y > 0 && spr.d[(y - 1) * w + x] !== 255) || (y < h - 1 && spr.d[(y + 1) * w + x] !== 255)) out[y * w + x] = mat.outline;
    }
    spr.d = out;
    spr.R = R;
    return spr;
  }

  // 면 i가 위(또는 d4는 아래)를 향하는 최종 자세 + 무작위 방향
  function restQuat(shape, faceIdx, yaw) {
    var sh = SHAPES[shape];
    var target = sh.readDown ? [0, -1, 0] : [0, 1, 0];
    var q = qarc(sh.planes[faceIdx].n, target);
    return qmul(qaxis([0, 1, 0], yaw), q);
  }
  // 위를 향한 면 찾기 (결과 확인용)
  function upFace(shape, q) {
    var sh = SHAPES[shape], best = -2, bi = 0;
    var tgt = sh.readDown ? [0, -1, 0] : [0, 1, 0];
    for (var i = 0; i < sh.planes.length; i++) { var d = dot(qrot(q, sh.planes[i].n), tgt); if (d > best) { best = d; bi = i; } }
    return bi;
  }

  G.dice3d = { SHAPES: SHAPES, render: render, restQuat: restQuat, upFace: upFace, qmul: qmul, qaxis: qaxis, MATS: MATS };
})();

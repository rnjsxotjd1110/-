// 게임 규칙 (브라우저·Node 공용 순수 로직). 화면 코드는 여기를 부르기만 한다.
var G = (typeof G !== 'undefined') ? G : {};
if (typeof require !== 'undefined' && typeof G.DATA === 'undefined') { G = require('./data.js'); }
(function () {
  var D = G.DATA;
  var CAP = 1e300;
  var SHAPE_FACES = { d4: 4, d6: 6, d8: 8, d12: 12 };
  var D6_ORDER = [2, 5, 1, 6, 3, 4]; // dice3d d6 면 순서의 기본 눈
  function baseFaces(shape) {
    if (shape === 'd6') return D6_ORDER.slice();
    if (G.dice3d && G.dice3d.SHAPES[shape]) return G.dice3d.SHAPES[shape].base.slice();
    var a = []; for (var i = 1; i <= SHAPE_FACES[shape]; i++) a.push(i); return a;
  }
  var rng = Math.random;
  function setRng(f) { rng = f; }

  function newDie(shape) { return { shape: shape || 'd6', faces: baseFaces(shape || 'd6') }; }

  function newState() {
    var s = {
      v: D.version, t: 0, created: Date.now(), lastSave: Date.now(),
      dust: 0, dustRun: 0, dustAll: 0,
      dice: [newDie(), newDie()],
      bodies: {},
      lv: { power: 0, wind: 0 }, forges: 0,
      up: {},
      autoT: 0, manualCd: 0,
      cores: 0, coresLayer: 0, coresAll: 0, novas: 0, research: {},
      sing: 0, singAll: 0, collapses: 0, sres: {},
      chal: null, chalDone: {},
      ach: {},
      ev: { next: 30, cur: null, buffs: {}, seen: {} },
      stats: { rolls: 0, manual: 0, aligns: 0, events: 0, bestTier: 0, bestHit: 0, bestRarity: 1, streak: 0, lastSum: 0, maxDust: 0, tierUps: 0, runStart: 0, fastestNova: 0 },
      last: [], // 최근 합
      shapes: { d6: true },
      ended: false, endSeen: false,
      settings: { sfx: 0.7, bgm: 0.5, muted: true, notation: 'ko', reduce: false, lang: 'ko', autoNova: false, autoCollapse: false }
    };
    return s;
  }

  // ── 유도 값 ─────────────────────────────────────
  function has(s, id) { return !!s.up[id]; }
  function res(s, id) { return !!s.research[id]; }
  function sres(s, id) { return !!s.sres[id]; }
  function chalRule(s, rule) { if (!s.chal) return false; var c = G.CHALLENGES.filter(function (x) { return x.id === s.chal; })[0]; return c && c.rule === rule; }
  function chalReward(s, reward) { var v = 1; G.CHALLENGES.forEach(function (c) { if (s.chalDone[c.id] && c.reward === reward) v *= c.v; }); return v; }
  function upSum(s, eff) { var v = 0; G.UPGRADES.forEach(function (u) { if (s.up[u.id] && u.eff === eff) v += u.v; }); return v; }
  function upProd(s, eff) { var v = 1; G.UPGRADES.forEach(function (u) { if (s.up[u.id] && u.eff === eff) v *= u.v; }); return v; }
  function resV(s, eff, mode) {
    var v = mode === 'sum' ? 0 : 1;
    G.RESEARCH.forEach(function (r) { if (s.research[r.id] && r.eff === eff) v = mode === 'sum' ? v + r.v : v * r.v; });
    return v;
  }
  function sresV(s, eff, mode) {
    var v = mode === 'sum' ? 0 : 1;
    G.SRESEARCH.forEach(function (r) { if (s.sres[r.id] && r.eff === eff) v = mode === 'sum' ? v + r.v : v * r.v; });
    return v;
  }

  function activeDice(s) {
    var d = s.dice.slice();
    if (s.ev.buffs.rogue > 0) d.push(newDie('d6'));
    return d;
  }
  function maxFace(s) { return res(s, 'g6') ? D.maxFaceOver : D.maxFaceBase; }

  // 분포: 실제 눈으로 합 확률, 정렬 확률
  function convolve(dice, useBase) {
    var dist = { 0: 1 };
    dice.forEach(function (d) {
      var faces = useBase ? stdFaces(d.shape) : d.faces;
      var n = faces.length, nd = {};
      Object.keys(dist).forEach(function (k) {
        var p = dist[k];
        faces.forEach(function (v) { var t = +k + v; nd[t] = (nd[t] || 0) + p / n; });
      });
      dist = nd;
    });
    return dist;
  }
  function stdFaces(shape) { var a = []; for (var i = 1; i <= SHAPE_FACES[shape]; i++) a.push(i); return a; }
  function alignDist(dice) {
    var out = {};
    if (dice.length < 2) return out;
    for (var v = 1; v <= 12; v++) {
      var p = 1;
      for (var i = 0; i < dice.length; i++) {
        var c = 0; dice[i].faces.forEach(function (f) { if (f === v) c++; });
        p *= c / dice[i].faces.length;
        if (!p) break;
      }
      if (p) out[v * dice.length] = (out[v * dice.length] || 0) + p;
    }
    return out;
  }

  var cacheS = null, cacheV = -1, ver = 0, cache = null;
  function derive(s) {
    if (s === cacheS && ver === cacheV) return cache;
    var dice = activeDice(s);
    var d = {};
    d.dice = dice;
    d.dist = convolve(dice, false);
    d.std = convolve(dice, true);
    d.al = alignDist(dice);
    var keys = Object.keys(d.std).map(Number);
    d.stdMin = Math.min.apply(null, keys); d.stdMax = Math.max.apply(null, keys);
    // 희소도: 지금(깎은) 분포 기준. 표준 범위를 넘는 바깥 궤도는 칸마다 추가 배율.
    var pmax = 0; Object.keys(d.dist).forEach(function (k) { pmax = Math.max(pmax, d.dist[k]); });
    var rexp = D.rarityExp + upSum(s, 'rarity') + D.shapeBonus.d8 * dice.filter(function (x) { return x.shape === 'd8'; }).length;
    d.rarity = function (sum) {
      var p = d.dist[sum] || d.std[sum];
      var r = p ? Math.pow(pmax / p, rexp) : 1;
      if (sum > d.stdMax) r *= Math.min(8, Math.pow(D.outerRarityStep, sum - d.stdMax));
      return r;
    };
    // 정렬 확률이 깎기로 높아지면 정렬 배율은 그만큼 줄어든다 (기대값 유지)
    var alStd = Math.pow(1 / 6, Math.max(0, dice.length - 1));
    var alCur = 0; Object.keys(d.al).forEach(function (k) { alCur += d.al[k]; });
    d.alignDamp = alCur > alStd ? Math.sqrt(alStd / alCur) : 1;
    // 궤도 목록 (실제로 나올 수 있는 합)
    var orb = Object.keys(d.dist).map(Number).filter(function (k) { return d.dist[k] > 0; });
    Object.keys(s.bodies).forEach(function (k) { if (orb.indexOf(+k) < 0) orb.push(+k); });
    orb.sort(function (a, b) { return a - b; });
    d.orbits = orb;
    // 굴림 힘
    var lp = s.lv.power;
    d.power = (1 + lp * 0.5) * Math.pow(D.power.grow, lp);
    d.massMult = upProd(s, 'mass') * resV(s, 'mass') * sresV(s, 'mass') * (res(s, 'g4') ? Math.pow(1 + s.coresLayer, 0.4) : 1) * Math.pow(1 + s.singAll, D.singMassExp);
    var nd12 = dice.filter(function (x) { return x.shape === 'd12'; }).length;
    d.massMult *= Math.pow(D.perDieMass, dice.length) * Math.pow(D.shapeBonus.d12, nd12) * Math.pow(D.refine.v, s.lv.refine || 0) * Math.pow(D.compress.v, s.lv.compress || 0);
    d.power *= d.massMult;
    // 태엽 간격
    var lw = s.lv.wind;
    var iv = lw > 0 ? D.wind.int0 * Math.pow(D.wind.intK, lw - 1) : 0;
    iv *= upProd(s, 'interval') * resV(s, 'interval') * chalReward(s, 'interval');
    if (chalRule(s, 'slowWind') && lw > 0) iv = 3;
    if (s.ev.buffs.pulsar > 0) iv /= 3;
    d.interval = lw > 0 ? Math.max(D.wind.intMin * (s.ev.buffs.pulsar > 0 ? 0.34 : 1), iv) : 0;
    d.rollsPerSec = d.interval ? 1 / d.interval : 0;
    d.twin = upSum(s, 'twin') + resV(s, 'twin', 'sum');
    d.alignMult = Math.max(1.5, (D.alignBase + dice.length) * upProd(s, 'align') * resV(s, 'align') * d.alignDamp * (1 + D.shapeBonus.d4 * dice.filter(function (x) { return x.shape === 'd4'; }).length));
    d.manualMult = (d.interval > 0 && d.interval < 0.5) ? 1 : D.manualMult + upSum(s, 'manual');
    // 단계
    var thK = upProd(s, 'threshold') * chalReward(s, 'threshold') * (chalRule(s, 'heavySky') ? 10 : 1) * Math.pow(D.collapseHeavy, Math.min(s.collapses, 8)) * Math.pow(D.collapseHeavyLate, Math.max(0, s.collapses - 8));
    d.th = [];
    for (var t = 2; t <= 10; t++) d.th.push(D.tierTable[Math.min(t, 8) - 2] * Math.pow(D.tierFactorHigh, Math.max(0, t - 8)) * thK);
    d.tierMult = D.tierMultBase + upSum(s, 'tierMult') + resV(s, 'tierMult', 'sum') + sresV(s, 'tierMult', 'sum');
    // 생산 배율
    var gm = upProd(s, 'prod') * resV(s, 'prod') * chalReward(s, 'prod') * sresV(s, 'prod');
    if (s.ev.buffs.flare > 0) gm *= 4;
    d.globalMult = gm;
    d.harmonyPer = chalRule(s, 'noHarmony') ? 0 : (D.harmonyPerTier + upSum(s, 'harmony') + resV(s, 'harmony', 'sum')) * chalReward(s, 'harmonyX');
    d.neighbor = upSum(s, 'neighbor');
    d.outerLens = upProd(s, 'outerLens'); d.innerLens = upProd(s, 'innerLens');
    d.eventMult = upProd(s, 'event');
    d.debris = upSum(s, 'debris');
    d.alignSpread = upSum(s, 'alignSpread');
    d.coreMult = sresV(s, 'coreX');
    cacheS = s; cacheV = ver; cache = d;
    return d;
  }
  function invalidate() { ver++; }

  function tierOf(m, th) {
    if (m <= 0) return 0;
    var t = 1;
    for (var i = 0; i < th.length; i++) if (m >= th[i]) t = i + 2;
    return t;
  }
  function bodyRate(s, d, sum, b) {
    if (!b || b.m <= 0) return 0;
    if (chalRule(s, 'oddOnly') && sum % 2 === 0) return 0;
    var r = Math.pow(b.m, D.massExp) * D.prodPerMass * Math.pow(d.tierMult, b.t - 1);
    var rar = d.rarity(sum);
    if (rar >= 4) r *= d.outerLens; else if (rar < 2) r *= d.innerLens;
    if (d.neighbor) {
      var adj = (s.bodies[sum - 1] ? 1 : 0) + (s.bodies[sum + 1] ? 1 : 0);
      r *= 1 + d.neighbor * adj;
    }
    return r;
  }
  function harmony(s, d) {
    var t = 0; Object.keys(s.bodies).forEach(function (k) { t += s.bodies[k].t; });
    return 1 + d.harmonyPer * t;
  }
  function production(s) {
    var d = derive(s);
    var tot = 0;
    Object.keys(s.bodies).forEach(function (k) { tot += bodyRate(s, d, +k, s.bodies[k]); });
    return tot * harmony(s, d) * d.globalMult;
  }

  // ── 질량 붙이기 ─────────────────────────────────
  var listeners = { tierUp: null };
  function addMass(s, d, sum, m, out) {
    var b = s.bodies[sum];
    if (!b) {
      b = s.bodies[sum] = { m: 0, t: 0, seed: (sum * 7919 + s.novas * 31 + s.collapses * 131) % 997, a0: rng() * Math.PI * 2 };
      if (out) out.born = sum;
    }
    b.m = Math.min(CAP, b.m + m);
    var nt = tierOf(b.m, d.th);
    if (nt > b.t) {
      var old = b.t;
      b.t = nt;
      if (old > 0) {
        s.stats.tierUps++;
        if (d.debris > 0) { var g = production(s) * d.debris; s.dust += g; s.dustRun += g; s.dustAll += g; }
        if (out) (out.tierUps = out.tierUps || []).push([sum, nt]);
      }
      if (nt > s.stats.bestTier) s.stats.bestTier = nt;
    }
    return b;
  }

  // 한 번 굴림 (개별). 반환: 화면 연출용 정보
  function rollOnce(s, manual) {
    var d = derive(s);
    var dice = d.dice;
    var idx = dice.map(function (dd) { return Math.floor(rng() * dd.faces.length); });
    var vals = idx.map(function (f, i) { return dice[i].faces[f]; });
    return applyRoll(s, d, idx, vals, manual);
  }
  function applyRoll(s, d, idx, vals, manual, forcedAlign) {
    var sum = 0; vals.forEach(function (v) { sum += v; });
    var align = vals.length >= 2 && vals.every(function (v) { return v === vals[0]; });
    var B = s.ev.buffs;
    if (!align && B.align > 0) { // 행성 정렬 이벤트: 모든 주사위에 같은 눈이 있으면 정렬로 바꿈
      var v0 = vals[0];
      if (d.dice.every(function (dd) { return dd.faces.indexOf(v0) >= 0; })) {
        vals = vals.map(function () { return v0; });
        idx = d.dice.map(function (dd) { return dd.faces.indexOf(v0); });
        sum = v0 * vals.length; align = true;
      }
    }
    if (B.align > 0) B.align--;
    var m = d.power * d.rarity(sum);
    if (align) m *= d.alignMult;
    if (manual) m *= d.manualMult;
    if (B.shower > 0) { m *= 3; B.shower--; }
    var out = { idx: idx, vals: vals, sum: sum, align: align, mass: m, manual: !!manual, rarity: d.rarity(sum) };
    addMass(s, d, sum, m, out);
    if (align && d.alignSpread) { addMass(s, d, sum - 1, m * d.alignSpread, out); addMass(s, d, sum + 1, m * d.alignSpread, out); }
    if (B.moons > 0) { addMass(s, d, sum - 1, m * 0.5, out); addMass(s, d, sum + 1, m * 0.5, out); B.moons--; }
    s.stats.rolls++;
    if (manual) s.stats.manual++;
    if (align) s.stats.aligns++;
    if (m > s.stats.bestHit) s.stats.bestHit = m;
    if (out.rarity > s.stats.bestRarity) s.stats.bestRarity = out.rarity;
    s.stats.streak = (sum === s.stats.lastSum) ? s.stats.streak + 1 : 1;
    s.stats.lastSum = sum;
    s.last.unshift(sum); if (s.last.length > 8) s.last.length = 8;
    if (align) s.stats.alignDice = Math.max(s.stats.alignDice || 0, vals.length);
    return out;
  }
  // 여러 번 굴림을 기대값으로 묶어 처리 (빠른 태엽·오프라인)
  function rollBatch(s, k) {
    var d = derive(s);
    var out = { tierUps: [] };
    var sums = Object.keys(d.dist).map(Number);
    var B = s.ev.buffs;
    var showerK = Math.min(k, B.shower || 0);
    sums.forEach(function (sum) {
      var p = d.dist[sum], pa = d.al[sum] || 0;
      var hits = k * p;
      var m = d.power * d.rarity(sum) * (hits + k * pa * (d.alignMult - 1));
      m *= 1 + (showerK / k) * 2;
      addMass(s, d, sum, m, out);
      if (d.alignSpread && pa) { addMass(s, d, sum - 1, k * pa * d.power * d.rarity(sum) * d.alignMult * d.alignSpread, out); addMass(s, d, sum + 1, k * pa * d.power * d.rarity(sum) * d.alignMult * d.alignSpread, out); }
    });
    if (B.shower) B.shower = Math.max(0, B.shower - k);
    if (B.align) B.align = Math.max(0, B.align - k);
    if (B.moons) B.moons = Math.max(0, B.moons - k);
    var aligns = 0; Object.keys(d.al).forEach(function (q) { aligns += d.al[q]; });
    s.stats.rolls += k;
    s.stats.aligns += Math.round(k * aligns);
    return out;
  }

  // ── 시간 진행 ───────────────────────────────────
  // opts: {visual: 함수(roll) — 개별 굴림 연출 콜백, offline: bool}
  function tick(s, dt, opts) {
    opts = opts || {};
    var d = derive(s);
    s.t += dt;
    // 생산
    var rate = production(s);
    var eff = opts.offline ? offlineEff(s) : 1;
    var g = rate * dt * eff;
    s.dust += g; s.dustRun += g; s.dustAll += g;
    capAll(s);
    if (s.dust > s.stats.maxDust) s.stats.maxDust = s.dust;
    s.manualCd = Math.max(0, s.manualCd - dt);
    // 태엽 굴림
    var rolled = [];
    if (d.interval > 0) {
      s.autoT += dt * eff;
      var n = Math.floor(s.autoT / d.interval);
      if (n > 0) {
        s.autoT -= n * d.interval;
        var extra = 0;
        if (d.twin > 0) { if (n <= 8) { for (var i = 0; i < n; i++) if (rng() < d.twin) extra++; } else extra = Math.round(n * Math.min(1, d.twin)); }
        var tot = n + extra;
        if (tot <= 6 && !opts.offline) { for (var j = 0; j < tot; j++) rolled.push(rollOnce(s, false)); }
        else if (tot > 0) {
          var shown = opts.offline ? 0 : 1;
          var bo = rollBatch(s, tot - shown);
          if (shown) { var r1 = rollOnce(s, false); r1.batch = tot; r1.batchTierUps = bo.tierUps; rolled.push(r1); }
        }
      }
    }
    // 이벤트
    var B = s.ev.buffs;
    ['flare', 'pulsar', 'rogue'].forEach(function (k) { if (B[k] > 0) { B[k] -= dt; if (B[k] <= 0) { B[k] = 0; invalidate(); } } });
    if (s.ev.cur) {
      s.ev.cur.life -= dt;
      if (res(s, 's2') && s.ev.cur.life < D.eventLife - 1.5) catchEvent(s);
      else if (s.ev.cur && s.ev.cur.life <= 0) s.ev.cur = null;
    } else if (s.dustAll > 200 || s.novas > 0) {
      s.ev.next -= dt;
      if (s.ev.next <= 0) spawnEvent(s);
    }
    // 자동화
    if (s.chal && maxTier(s) >= chalGoal(s.chal)) { s.chalDone[s.chal] = 1; chalQueue.push(s.chal); s.chal = null; invalidate(); }
    if (res(s, 's5')) autoBuy(s);
    if (res(s, 's4')) autoUpgrade(s);
    if (res(s, 's6') && s.settings.autoNova && canNova(s) && novaGain(s) >= Math.max(1, Math.floor(s.coresLayer * 0.25))) nova(s);
    if (sres(s, 'q11') && s.settings.autoCollapse && canCollapse(s)) collapse(s);
    checkAch(s);
    return rolled;
  }
  function capAll(s) {
    ['dust', 'dustRun', 'dustAll', 'cores', 'coresLayer', 'coresAll', 'sing', 'singAll'].forEach(function (k) { if (!(s[k] < CAP)) s[k] = isNaN(s[k]) ? 0 : CAP; if (s[k] < 0) s[k] = 0; });
    ['power', 'wind', 'refine', 'compress'].forEach(function (k) { if (!(s.lv[k] >= 0)) { s.lv[k] = 0; invalidate(); } });
    if (!(s.t >= 0)) s.t = 0; if (!(s.stats.rolls >= 0)) s.stats.rolls = 0;
    for (var k2 in s.bodies) { var b = s.bodies[k2]; if (!(b.m < CAP)) b.m = isNaN(b.m) ? 1 : CAP; }
  }
  function offlineEff(s) { return res(s, 's3') ? 1 : D.offlineEff; }

  function manualRoll(s) {
    if (s.manualCd > 0) return null;
    s.manualCd = D.manualCooldown;
    var r = rollOnce(s, true);
    var d = derive(s);
    if (d.twin > 0 && rng() < d.twin) { r.twin = rollOnce(s, true); }
    checkAch(s);
    return r;
  }

  // ── 이벤트 ──────────────────────────────────────
  function spawnEvent(s) {
    var freq = resV(s, 'eventFreq') * (has(s, 'net') ? 0.7 : 1);
    s.ev.next = (D.eventGap[0] + rng() * (D.eventGap[1] - D.eventGap[0])) * freq;
    var types = G.EVENTS.slice();
    if (s.dice.length >= (sres(s, 'q6') ? 6 : 5) || chalRule(s, 'twoDice')) types = types.filter(function (t) { return t !== 'rogue'; });
    var type = types[Math.floor(rng() * types.length)];
    if (!s.ev.seenFirst) { type = 'comet'; s.ev.seenFirst = true; }
    s.ev.cur = { type: type, life: D.eventLife, y: 0.2 + rng() * 0.6, dir: rng() < 0.5 ? 1 : -1 };
  }
  function catchEvent(s) {
    var e = s.ev.cur; if (!e) return null;
    s.ev.cur = null;
    var d = derive(s);
    var k = d.eventMult;
    var B = s.ev.buffs;
    var info = { type: e.type };
    switch (e.type) {
      case 'comet': var g = production(s) * 60 * k + 25; s.dust += g; s.dustRun += g; s.dustAll += g; info.dust = g; break;
      case 'shower': B.shower = (B.shower || 0) + 20 * k; break;
      case 'flare': B.flare = 20 * k; break;
      case 'rogue': B.rogue = 30 * k; break;
      case 'align': B.align = (B.align || 0) + Math.round(3 * k); break;
      case 'pulsar': B.pulsar = 20 * k; break;
      case 'meteor':
        var low = null; Object.keys(s.bodies).forEach(function (q) { var b = s.bodies[q]; if (!low || b.t < s.bodies[low].t) low = q; });
        var sum = low ? +low : d.orbits[Math.floor(d.orbits.length / 2)];
        var m = d.power * 40 * k * Math.max(1, d.rarity(sum));
        var o = {}; addMass(s, d, sum, m, o); info.sum = sum; info.mass = m; break;
      case 'moons': B.moons = (B.moons || 0) + 10 * k; break;
    }
    s.stats.events++;
    s.ev.seen[e.type] = 1;
    invalidate();
    return info;
  }

  // ── 구매 ────────────────────────────────────────
  function costPower(s) { return D.power.cost0 * Math.pow(D.power.costK, s.lv.power); }
  function costWind(s) { return D.wind.cost0 * Math.pow(D.wind.costK, s.lv.wind); }
  function maxDice(s) { return chalRule(s, 'twoDice') ? 2 : (sres(s, 'q6') ? 6 : 5); }
  function costDie(s) {
    var n = s.dice.length + 1;
    if (n > maxDice(s)) return Infinity;
    if (trayUsed(s.dice) + 6 > D.trayCapacity) return Infinity;
    return (D.diceCost[n] || Infinity) * chalReward(s, 'diceCost');
  }
  function costForge(s) { return D.forge.cost0 * Math.pow(D.forge.costK, s.forges) * chalReward(s, 'forgeCost'); }
  function forgeUnlocked(s) { return !chalRule(s, 'noForge') && (s.dice.length >= D.forge.unlock || s.forges > 0); }
  function trayUsed(dice) { var t = 0; dice.forEach(function (d) { t += d.faces.length; }); return t; }

  function spend(s, c) { if (!(s.dust >= c) || !isFinite(c)) return false; s.dust -= c; return true; }
  function buyPower(s) { if (!spend(s, costPower(s))) return false; s.lv.power++; invalidate(); return true; }
  function buyWind(s) { if (!spend(s, costWind(s))) return false; s.lv.wind++; invalidate(); return true; }
  function buyDie(s) {
    var c = costDie(s);
    var shape = 'd6';
    if (trayUsed(s.dice) + 6 > D.trayCapacity) return false;
    if (!spend(s, c)) return false;
    s.dice.push(newDie(shape)); invalidate(); return true;
  }
  // 면 하나 ±1
  function forge(s, di, fi, delta) {
    if (!forgeUnlocked(s)) return false;
    var die = s.dice[di]; if (!die) return false;
    var nv = die.faces[fi] + delta;
    if (nv < 1 || nv > Math.max(maxFace(s), die.shape === 'd12' ? 12 : 0, die.shape === 'd8' ? 8 : 0)) return false;
    if (!spend(s, costForge(s))) return false;
    die.faces[fi] = nv; s.forges++; invalidate(); return true;
  }
  function costRefine(s) { return D.refine.cost0 * Math.pow(D.refine.costK, s.lv.refine || 0); }
  function costCompress(s) { return D.compress.cost0 * Math.pow(D.compress.costK, s.lv.compress || 0); }
  function buyRefine(s) { var c = costRefine(s); if (!(s.cores >= c)) return false; s.cores -= c; s.lv.refine = (s.lv.refine || 0) + 1; invalidate(); return true; }
  function buyCompress(s) { var c = costCompress(s); if (!(s.sing >= c)) return false; s.sing -= c; s.lv.compress = (s.lv.compress || 0) + 1; invalidate(); return true; }
  function upgradeVisible(s, u) { return s.dustRun >= u.req || s.up[u.id]; }
  function buyUpgrade(s, id) {
    var u = G.UPGRADES.filter(function (x) { return x.id === id; })[0];
    if (!u || s.up[id] || !upgradeVisible(s, u)) return false;
    if (!spend(s, u.cost)) return false;
    s.up[id] = 1; invalidate(); return true;
  }
  function autoBuy(s) {
    var guard = 0;
    while (guard++ < 50) {
      var cp = costPower(s), cw = costWind(s);
      if (s.dust >= cw && cw <= cp && derive(s).interval > D.wind.intMin) buyWind(s);
      else if (s.dust >= cp) buyPower(s);
      else break;
    }
    if (s.dust >= costDie(s) && s.dice.length < maxDice(s)) buyDie(s);
  }
  function autoUpgrade(s) {
    G.UPGRADES.forEach(function (u) { if (!s.up[u.id] && upgradeVisible(s, u) && s.dust >= u.cost) buyUpgrade(s, u.id); });
  }
  function researchAvail(s, r) {
    if (s.research[r.id]) return false;
    var same = G.RESEARCH.filter(function (x) { return x.br === r.br; });
    var i = same.indexOf(r);
    return i === 0 || !!s.research[same[i - 1].id];
  }
  function buyResearch(s, id) {
    var r = G.RESEARCH.filter(function (x) { return x.id === id; })[0];
    if (!r || !researchAvail(s, r) || s.cores < r.cost) return false;
    s.cores -= r.cost; s.research[id] = 1; invalidate();
    if (r.eff === 'startWind' && s.lv.wind < r.v) s.lv.wind = r.v;
    if (r.eff === 'startDice' && !chalRule(s, 'twoDice')) while (s.dice.length < r.v) s.dice.push(newDie());
    return true;
  }
  function sresAvail(s, r) {
    if (s.sres[r.id]) return false;
    var i = G.SRESEARCH.indexOf(r);
    return i === 0 || !!s.sres[G.SRESEARCH[i - 1].id] || i % 2 === 1 && !!s.sres[G.SRESEARCH[Math.max(0, i - 2)].id];
  }
  function buySres(s, id) {
    var r = G.SRESEARCH.filter(function (x) { return x.id === id; })[0];
    if (!r || !sresAvail(s, r) || s.sing < r.cost) return false;
    if (r.eff === 'ending' && Object.keys(s.chalDone).length < G.CHALLENGES.length) return false;
    s.sing -= r.cost; s.sres[id] = 1; invalidate();
    if (r.eff === 'shape') s.shapes[r.v] = true;
    if (r.eff === 'ending') { s.ended = true; }
    return true;
  }
  // 주사위 모양 바꾸기 (특이점 연구 후)
  function setShape(s, di, shape) {
    if (!s.shapes[shape] || !s.dice[di]) return false;
    var nd = s.dice.slice(); nd[di] = newDie(shape);
    if (trayUsed(nd) > D.trayCapacity) return false;
    s.dice[di] = nd[di]; invalidate(); return true;
  }

  // ── 초신성 ──────────────────────────────────────
  function maxTier(s) { var m = 0; Object.keys(s.bodies).forEach(function (k) { m = Math.max(m, s.bodies[k].t); }); return m; }
  function totalMass(s) { var m = 0; Object.keys(s.bodies).forEach(function (k) { m += s.bodies[k].m; }); return m; }
  function canNova(s) { return maxTier(s) >= D.novaTier; }
  function novaGain(s) {
    if (!canNova(s)) return 0;
    var d = derive(s);
    var thK = d.th[0] / D.tierTable[0];
    var g = D.coreGain.k * Math.pow(totalMass(s) / (D.coreGain.div * thK), D.coreGain.exp);
    return Math.floor(g * d.coreMult);
  }
  // 다음 별핵 1개까지 필요한 총질량
  function novaNext(s) {
    var d = derive(s), thK = d.th[0] / D.tierTable[0];
    var g = novaGain(s) + 1;
    return Math.pow(g / (D.coreGain.k * d.coreMult), 1 / D.coreGain.exp) * D.coreGain.div * thK;
  }
  function resetRun(s) {
    var keepFaces = res(s, 'r4');
    var oldDice = s.dice;
    s.dust = 0; s.dustRun = 0; s.bodies = {}; s.up = {}; s.autoT = 0;
    s.lv = { power: 0, wind: res(s, 'r1') ? 6 : 0, refine: s.lv.refine || 0, compress: s.lv.compress || 0 };
    var nd = res(s, 'r2') ? 3 : 2;
    if (chalRule(s, 'twoDice')) nd = 2;
    s.dice = [];
    for (var i = 0; i < nd; i++) {
      var od = oldDice[i];
      var shape = od ? od.shape : 'd6';
      if (!s.shapes[shape]) shape = 'd6';
      s.dice.push(keepFaces && od && od.shape === shape && !chalRule(s, 'noForge') ? { shape: shape, faces: od.faces.slice() } : newDie(shape));
    }
    if (!keepFaces) s.forges = 0;
    s.ev.buffs = {}; s.ev.cur = null;
    s.last = [];
    s.stats.runStart = s.t;
    invalidate();
    // 시작 천체 (g3: 모든 표준 궤도에 미행성)
    if (res(s, 'g3')) {
      var d = derive(s);
      d.orbits.forEach(function (sum) { addMass(s, d, sum, d.th[0], null); });
    }
  }
  function nova(s) {
    if (!canNova(s)) return null;
    var g = novaGain(s);
    var info = { gain: g, chalDone: null, time: s.t - s.stats.runStart };
    s.cores += g; s.coresLayer += g; s.coresAll += g; s.novas++; invalidate();
    if (!s.stats.fastestNova || info.time < s.stats.fastestNova) s.stats.fastestNova = info.time;
    resetRun(s);
    checkAch(s);
    return info;
  }
  function chalGoal(id) { var i = G.CHALLENGES.map(function (c) { return c.id; }).indexOf(id); return i >= 3 ? 10 : D.chalTier; }
  function chalUnlocked(s, c) { return s.novas >= c.req || s.collapses > 0; }
  function startChallenge(s, id) {
    var c = G.CHALLENGES.filter(function (x) { return x.id === id; })[0];
    if (!c || !chalUnlocked(s, c)) return false;
    s.chal = id; resetRun(s); return true;
  }
  function quitChallenge(s) { if (!s.chal) return false; s.chal = null; resetRun(s); return true; }

  // ── 중력 붕괴 ───────────────────────────────────
  function canCollapse(s) { return maxTier(s) >= D.collapseTier && !s.chal; }
  function collapseGain(s) {
    if (!canCollapse(s)) return 0;
    var runMin = (s.t - (s.layerStart || 0)) / 60;
    return Math.floor(D.singGain.k * Math.pow((s.coresLayer + novaGain(s)) / D.singGain.div, D.singGain.exp) * Math.min(1, 0.4 + runMin / 50));
  }
  function collapse(s) {
    if (!canCollapse(s)) return null;
    var g = Math.max(1, collapseGain(s));
    s.sing += g; s.singAll += g; s.collapses++; s.forges = 0; s.layerStart = s.t;
    var keep = sresV(s, 'keepResearch', 'sum') > 0;
    s.cores = 0; s.coresLayer = 0; s.lv.refine = 0;
    if (!keep) s.research = {};
    else { s.cores = 0; }
    resetRun(s);
    checkAch(s);
    return { gain: g };
  }

  // ── 오프라인 ────────────────────────────────────
  function offline(s, secs) {
    var capH = sres(s, 'q7') ? 72 : D.offlineCapH, cap = capH * 3600;
    var capped = secs > cap;
    secs = Math.max(0, Math.min(+secs || 0, cap));
    if (secs < 30) return null;
    var d0 = s.dustAll, r0 = s.stats.rolls, tu0 = s.stats.tierUps, ev0 = s.stats.events, n0 = s.novas, c0 = s.collapses;
    var steps = Math.min(600, Math.max(20, Math.floor(secs / 30)));
    var dt = secs / steps;
    for (var i = 0; i < steps; i++) tick(s, dt, { offline: true });
    return { secs: secs, dust: s.dustAll - d0, rolls: s.stats.rolls - r0, tierUps: s.stats.tierUps - tu0, events: s.stats.events - ev0, eff: offlineEff(s), capped: capped, capH: capH, novas: s.novas - n0, cols: s.collapses - c0 };
  }

  // ── 업적 ────────────────────────────────────────
  function bodiesN(s) { return Object.keys(s.bodies).length; }
  G.ACH = [
    ['roll1', function (s) { return s.stats.rolls >= 1; }],
    ['roll100', function (s) { return s.stats.rolls >= 100; }],
    ['roll1k', function (s) { return s.stats.rolls >= 1000; }],
    ['roll10k', function (s) { return s.stats.rolls >= 1e4; }],
    ['roll1m', function (s) { return s.stats.rolls >= 1e6; }],
    ['align1', function (s) { return s.stats.aligns >= 1; }],
    ['align50', function (s) { return s.stats.aligns >= 50; }],
    ['align4', function (s) { return (s.stats.alignDice || 0) >= 4; }],
    ['align6', function (s) { return (s.stats.alignDice || 0) >= 6; }],
    ['tier2', function (s) { return s.stats.bestTier >= 2; }],
    ['tier4', function (s) { return s.stats.bestTier >= 4; }],
    ['tier6', function (s) { return s.stats.bestTier >= 6; }],
    ['tier8', function (s) { return s.stats.bestTier >= 8; }],
    ['tier9', function (s) { return s.stats.bestTier >= 9; }],
    ['tier10', function (s) { return s.stats.bestTier >= 10; }],
    ['dice3', function (s) { return s.dice.length >= 3; }],
    ['dice5', function (s) { return s.dice.length >= 5; }],
    ['dice6', function (s) { return s.dice.length >= 6; }],
    ['forge1', function (s) { return s.forges >= 1; }],
    ['face9', function (s) { return s.dice.some(function (d) { return d.shape === 'd6' && d.faces.indexOf(9) >= 0; }); }],
    ['dust6', function (s) { return s.stats.maxDust >= 1e6; }],
    ['dust12', function (s) { return s.stats.maxDust >= 1e12; }],
    ['dust24', function (s) { return s.stats.maxDust >= 1e18; }],
    ['dust48', function (s) { return s.stats.maxDust >= 1e21; }],
    ['ev1', function (s) { return s.stats.events >= 1; }],
    ['ev25', function (s) { return s.stats.events >= 25; }],
    ['evAll', function (s) { return Object.keys(s.ev.seen).length >= 8; }],
    ['nova1', function (s) { return s.novas >= 1; }],
    ['nova10', function (s) { return s.novas >= 10; }],
    ['nova50', function (s) { return s.novas >= 50; }],
    ['chal1', function (s) { return Object.keys(s.chalDone).length >= 1; }],
    ['chalAll', function (s) { return Object.keys(s.chalDone).length >= 6; }],
    ['col1', function (s) { return s.collapses >= 1; }],
    ['col5', function (s) { return s.collapses >= 5; }],
    ['resAll', function (s) { return Object.keys(s.research).length >= 18; }],
    ['harm5', function (s) { return harmony(s, derive(s)) >= 5; }],
    ['bodies20', function (s) { return bodiesN(s) >= 20; }],
    ['rare50', function (s) { return s.stats.bestRarity >= 50; }],
    ['streak5', function (s) { return s.stats.streak >= 5; }],
    ['ending', function (s) { return s.ended; }]
  ];
  var achQueue = [], chalQueue = [];
  function checkAch(s) {
    for (var i = 0; i < G.ACH.length; i++) {
      var a = G.ACH[i];
      if (s.ach[a[0]] === undefined && a[1](s)) { s.ach[a[0]] = Math.floor(s.t); achQueue.push(a[0]); }
    }
  }

  G.core = {
    newState: newState, derive: derive, invalidate: invalidate, tick: tick, rollOnce: rollOnce, manualRoll: manualRoll, rollBatch: rollBatch,
    production: production, bodyRate: bodyRate, harmony: harmony, tierOf: tierOf,
    costPower: costPower, costWind: costWind, costDie: costDie, costForge: costForge, maxDice: maxDice, forgeUnlocked: forgeUnlocked, maxFace: maxFace,
    buyPower: buyPower, buyWind: buyWind, buyDie: buyDie, forge: forge, buyUpgrade: buyUpgrade, upgradeVisible: upgradeVisible,
    buyResearch: buyResearch, costRefine: costRefine, costCompress: costCompress, buyRefine: buyRefine, buyCompress: buyCompress, researchAvail: researchAvail, buySres: buySres, sresAvail: sresAvail, setShape: setShape, trayUsed: trayUsed,
    canNova: canNova, novaGain: novaGain, novaNext: novaNext, nova: nova, maxTier: maxTier, totalMass: totalMass,
    chalUnlocked: chalUnlocked, chalGoal: chalGoal, startChallenge: startChallenge, quitChallenge: quitChallenge, chalRule: chalRule,
    canCollapse: canCollapse, collapseGain: collapseGain, collapse: collapse,
    spawnEvent: spawnEvent, catchEvent: catchEvent, offline: offline, checkAch: checkAch,
    achQueue: achQueue, chalQueue: chalQueue, setRng: setRng, capAll: capAll, newDie: newDie, SHAPE_FACES: SHAPE_FACES, res: res, sres: sres
  };
})();
if (typeof module !== 'undefined') module.exports = G;

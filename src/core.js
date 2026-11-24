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
      lv: { power: 0, wind: 0 }, fate: { c: 0, n: 0 }, pairPref: {},
      box: 0, coll: {}, dex: {}, con: { cur: null, wait: D.contract.first, rcd: 0 }, story: {},
      up: {},
      autoT: 0, manualCd: 0,
      cores: 0, coresLayer: 0, coresAll: 0, novas: 0, research: {},
      sing: 0, singAll: 0, collapses: 0, sres: {},
      chal: null, chalDone: {},
      ach: {},
      ev: { next: 30, cur: null, buffs: {}, seen: {} },
      stats: { cons: 0, boxes: 0, rolls: 0, manual: 0, aligns: 0, events: 0, bestTier: 0, bestHit: 0, bestRarity: 1, streak: 0, lastSum: 0, maxDust: 0, tierUps: 0, runStart: 0, fastestNova: 0 },
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
  function chalStage(s, id) { return +s.chalDone[id] || 0; }
  // 과제 보상: 단계마다 쌓인다. 곱(mult) 또는 합(sum)
  function chalReward(s, reward) { var v = 1; G.CHALLENGES.forEach(function (c) { if (c.reward === reward) v *= Math.pow(c.v, chalStage(s, c.id)); }); return v; }
  function chalRewardSum(s, reward) { var v = 0; G.CHALLENGES.forEach(function (c) { if (c.reward === reward) v += c.v * chalStage(s, c.id); }); return v; }
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

  // 면 수가 많을수록 유리: 주사위마다 굴림 질량·정렬 배율
  function shapeMassK(dice) { var k = 1; dice.forEach(function (x) { k *= D.shapeMass[x.shape] || 1; }); return k; }
  function shapeAlignK(dice) { var k = 1; dice.forEach(function (x) { k *= Math.pow(SHAPE_FACES[x.shape] / 6, D.shapeAlignExp); }); return k; }
  function activeDice(s) {
    var d = s.dice.slice();
    if (s.ev.buffs.rogue > 0) d.push(newDie('d6'));
    return d;
  }
  function outerCap(s) { var c = D.outerCap; G.SRESEARCH.forEach(function (r) { if (r.outer && s.sres[r.id]) c = Math.max(c, r.outer); }); return c; }

  // ── 특수 주사위 ─────────────────────────────────
  function spById(id) { for (var i = 0; i < G.SPDICE.length; i++) if (G.SPDICE[i].id === id) return G.SPDICE[i]; return null; }
  // 장착한 특수 주사위의 효과 크기 (별 반영)
  function spVal(s, id) { var sp = spById(id), lv = s.coll[id] || 0; if (!sp || !lv) return 0; return sp.v * (1 + D.starStep * (lv - 1)); }
  function spEquipped(s) { var o = []; s.dice.forEach(function (d) { if (d.sp && s.coll[d.sp]) o.push(d.sp); }); return o; }
  function spSum(s, eff) { var v = 0; spEquipped(s).forEach(function (id) { if (spById(id).eff === eff) v += spVal(s, id); }); return v; }

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
    for (var v = 0; v <= 12; v++) {
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
    d.outerCap = outerCap(s);
    var keys = Object.keys(d.std).map(Number);
    d.stdMin = Math.min.apply(null, keys); d.stdMax = Math.max.apply(null, keys);
    // 희소도: 지금(깎은) 분포 기준. 표준 범위를 넘는 바깥 궤도는 칸마다 추가 배율.
    var pmax = 0; Object.keys(d.dist).forEach(function (k) { pmax = Math.max(pmax, d.dist[k]); });
    var rexp = D.rarityExp + upSum(s, 'rarity');
    d.rarity = function (sum) {
      var p = d.dist[sum] || d.std[sum];
      var r = p ? Math.pow(pmax / p, rexp) : 1;
      if (sum > d.stdMax) r *= Math.min(d.outerCap, Math.pow(D.outerRarityStep, sum - d.stdMax));
      else if (sum < d.stdMin) r *= Math.min(d.outerCap, Math.pow(D.outerRarityStep, d.stdMin - sum));
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
    d.massMult *= (1 + spSum(s, 'mass')) * (1 + spSum(s, 'massX'));
    d.massMult *= Math.pow(D.perDieMass + chalRewardSum(s, 'perDie'), dice.length) * shapeMassK(dice) * Math.pow(D.refine.v, s.lv.refine || 0) * Math.pow(D.compress.v, s.lv.compress || 0);
    d.power *= d.massMult;
    // 태엽 간격
    var lw = s.lv.wind;
    var iv = lw > 0 ? D.wind.int0 * Math.pow(D.wind.intK, lw - 1) : 0;
    iv *= upProd(s, 'interval') * resV(s, 'interval') * chalReward(s, 'interval') * Math.max(0.5, 1 - spSum(s, 'interval'));
    if (chalRule(s, 'slowWind') && lw > 0) iv = 3;
    if (s.ev.buffs.pulsar > 0) iv /= 3;
    d.interval = lw > 0 ? Math.max(D.wind.intMin * (s.ev.buffs.pulsar > 0 ? 0.34 : 1), iv) : 0;
    d.rollsPerSec = d.interval ? 1 / d.interval : 0;
    d.twin = upSum(s, 'twin') + resV(s, 'twin', 'sum') + spSum(s, 'twin');
    d.alignMult = Math.max(1.5, (D.alignBase + dice.length) * upProd(s, 'align') * resV(s, 'align') * (1 + spSum(s, 'align')) * shapeAlignK(dice));
    d.manualMult = (d.interval > 0 && d.interval < 0.5) ? 1 : D.manualMult + upSum(s, 'manual');
    // 단계
    var thK = upProd(s, 'threshold') * chalReward(s, 'threshold') * Math.max(0.5, 1 - spSum(s, 'threshold')) * (chalRule(s, 'heavySky') ? 10 : 1) * Math.pow(D.collapseHeavy, Math.min(s.collapses, D.collapseHeavyN)) * Math.pow(D.collapseHeavyLate, Math.max(0, s.collapses - D.collapseHeavyN));
    d.th = [];
    for (var t = 2; t <= 10; t++) d.th.push(D.tierTable[Math.min(t, 8) - 2] * Math.pow(D.tierFactorHigh, Math.max(0, t - 8)) * thK);
    d.tierMult = D.tierMultBase + upSum(s, 'tierMult') + resV(s, 'tierMult', 'sum') + sresV(s, 'tierMult', 'sum');
    // 생산 배율
    var gm = upProd(s, 'prod') * resV(s, 'prod') * chalReward(s, 'prod') * sresV(s, 'prod') * (1 + spSum(s, 'prod')) * (1 + dexCount(s) * dexPer(s));
    if (s.ev.buffs.flare > 0) gm *= 4;
    d.globalMult = gm;
    d.harmonyPer = chalRule(s, 'noHarmony') ? 0 : (D.harmonyPerTier + upSum(s, 'harmony') + resV(s, 'harmony', 'sum')) * (1 + chalRewardSum(s, 'harmonyX')) * (1 + spSum(s, 'harmony'));
    d.oddProd = chalReward(s, 'oddProd');
    d.neighbor = upSum(s, 'neighbor');
    d.outerLens = upProd(s, 'outerLens'); d.innerLens = upProd(s, 'innerLens');
    d.eventMult = upProd(s, 'event') * (1 + spSum(s, 'event'));
    d.debris = upSum(s, 'debris');
    d.alignSpread = upSum(s, 'alignSpread');
    d.coreMult = sresV(s, 'coreX');
    // 합에 따른 질량 배율 (산호·청금석·유리), 주사위 눈에 따른 배율 (은·블랙홀)
    var odd = spSum(s, 'oddMass'), even = spSum(s, 'evenMass'), rareM = spSum(s, 'rareMass');
    d.hitMult = function (sum) { var k = sum % 2 ? 1 + odd : 1 + even; if (rareM && d.rarity(sum) >= 4) k *= 1 + rareM; return k; };
    d.dieFx = dice.map(function (dd) { var sp = dd.sp && s.coll[dd.sp] ? spById(dd.sp) : null; return sp && (sp.eff === 'topFace' || sp.eff === 'oneFace') ? { eff: sp.eff, v: spVal(s, sp.id) } : null; });
    d.batchDieMult = 1; dice.forEach(function (dd, i) { if (d.dieFx[i]) d.batchDieMult *= 1 + d.dieFx[i].v / dd.faces.length; });
    d.alignFate = spSum(s, 'alignFate');
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
    if (sum % 2 === 1) r *= d.oddProd;
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

  // ── 천체 도감 ───────────────────────────────────
  function dexCount(s) { return Object.keys(s.dex || {}).length; }
  function dexPer(s) { return D.dexPer * resV(s, 'dexX'); }
  // 궤도 갈래: 0 뜨거운(가운데), 1 온화한, 2 차가운(바깥)
  function orbitClass(d, sum) { var r = d.rarity(sum); return r < 2 ? 0 : (r >= 4 ? 2 : 1); }
  var dexQueue = [];
  function dexMark(s, d, sum, t) {
    var key = t + '_' + orbitClass(d, sum);
    if (!s.dex[key]) { s.dex[key] = 1; dexQueue.push(key); invalidate(); }
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
      dexMark(s, d, sum, nt);
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
  function applyRoll(s, d, idx, vals, manual, mult) {
    var sum = 0; vals.forEach(function (v) { sum += v; });
    var align = vals.length >= 2 && vals.every(function (v) { return v === vals[0]; });
    var B = s.ev.buffs;
    var noCommon = false;
    if (!align && B.align > 0) { // 행성 정렬 이벤트: 모든 주사위에 같은 눈이 있으면 정렬로 바꿈
      var common = d.dice[0].faces.filter(function (v) { return d.dice.every(function (dd) { return dd.faces.indexOf(v) >= 0; }); });
      var v0 = common.length ? common[Math.floor(rng() * common.length)] : null;
      noCommon = v0 === null;
      if (v0 !== null) {
        vals = vals.map(function () { return v0; });
        idx = d.dice.map(function (dd) { return dd.faces.indexOf(v0); });
        sum = v0 * vals.length; align = true;
      }
    }
    if (B.align > 0 && (align || noCommon)) B.align--;
    var m = d.power * d.rarity(sum) * d.hitMult(sum);
    var dieK = 1;
    d.dieFx.forEach(function (fx, i) { if (!fx) return; var v = vals[i]; if (fx.eff === 'oneFace' ? v === 1 : v === Math.max.apply(null, d.dice[i].faces)) dieK *= 1 + fx.v; });
    m *= dieK;
    if (align) m *= d.alignMult;
    if (align && d.alignFate && fateUnlocked(s)) { s.fate.c += fateNeed(s) * d.alignFate; fateCharge(s, 0); }
    if (manual) m *= d.manualMult;
    if (mult) m *= mult;
    if (B.shower > 0) { m *= 3; B.shower--; }
    var out = { idx: idx, vals: vals, sum: sum, align: align, mass: m, manual: !!manual, rarity: d.rarity(sum), dieK: dieK };
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
  // 푸아송 추첨 (묶음 굴림의 희귀 결과)
  function poisson(lam) {
    if (lam <= 0) return 0;
    if (lam < 30) { var L = Math.exp(-lam), k = 0, p = 1; do { k++; p *= rng(); } while (p > L); return k - 1; }
    var u = Math.max(1e-12, rng()), v = rng();
    return Math.max(0, Math.round(lam + Math.sqrt(lam) * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)));
  }
  // 여러 번 굴림을 묶어 처리 (빠른 태엽·오프라인). 흔한 결과는 기대값, 희귀한 결과(정렬·드문 궤도)는 실제로 추첨한다.
  function rollBatch(s, k) {
    var d = derive(s);
    var out = { tierUps: [], jackpot: null };
    var sums = Object.keys(d.dist).map(Number);
    var B = s.ev.buffs;
    var showerK = Math.min(k, B.shower || 0);
    var aligns = 0;
    sums.forEach(function (sum) {
      var p = d.dist[sum], pa = d.al[sum] || 0, rar = d.rarity(sum);
      var rare = rar >= D.rareMin;
      var hits = rare ? poisson(k * (p - pa)) : k * (p - pa);
      var na = pa > 0 ? poisson(k * pa) : 0;
      aligns += na;
      if (!(hits > 0) && !na) return;
      var unit = d.power * rar * (1 + (showerK / k) * 2) * d.hitMult(sum) * d.batchDieMult;
      var m = unit * (hits + na * d.alignMult);
      addMass(s, d, sum, m, out);
      if (d.alignSpread && na) { addMass(s, d, sum - 1, na * unit * d.alignMult * d.alignSpread, out); addMass(s, d, sum + 1, na * unit * d.alignMult * d.alignSpread, out); }
      if ((na || (rare && hits >= 1)) && (!out.jackpot || m > out.jackpot.mass)) out.jackpot = { sum: sum, align: na > 0, n: na || hits, mass: m, rarity: rar };
    });
    if (B.shower) B.shower = Math.max(0, B.shower - k);
    if (B.align) B.align = Math.max(0, B.align - k);
    if (B.moons) B.moons = Math.max(0, B.moons - k);
    s.stats.rolls += k;
    s.stats.aligns += aligns;
    if (aligns && d.alignFate && fateUnlocked(s)) { s.fate.c += fateNeed(s) * d.alignFate * aligns; fateCharge(s, 0); }
    return out;
  }

  // ── 운명 굴림 ───────────────────────────────────
  function fateUnlocked(s) { return s.lv.wind > 0; }
  function fateNeed(s) {
    var d = derive(s), raw = Math.max(D.fate.min, (d.rollsPerSec || 0.33) * D.fate.sec);
    var e = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), f = raw / e;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e / (resV(s, 'fateRate') * (1 + spSum(s, 'fate')));
  }
  function fateCharge(s, n) {
    if (!fateUnlocked(s)) return;
    var F = s.fate; F.c += n;
    var need = fateNeed(s);
    while (F.c >= need && F.n < D.fate.max) { F.c -= need; F.n++; }
    if (F.n >= D.fate.max) F.c = Math.min(F.c, need);
  }
  // 손으로 굴리는 큰 굴림: 나온 합의 궤도에 약 massSec초치 태엽 굴림 질량을 바로 더한다
  function fateRoll(s) {
    if (!(s.fate.n >= 1) || chalRule(s, 'noManual')) return null;
    s.fate.n--;
    var d = derive(s);
    var idx = d.dice.map(function (dd) { return Math.floor(rng() * dd.faces.length); });
    var vals = idx.map(function (f, i) { return d.dice[i].faces[f]; });
    // 평균 굴림 대비 희소도의 제곱근만큼 더 크게 (한 번에 판이 끝나지 않게)
    var er = 0; Object.keys(d.dist).forEach(function (k) { er += d.dist[k] * d.rarity(+k); });
    var sum = 0; vals.forEach(function (v) { sum += v; });
    var rr = d.rarity(sum);
    var mult = Math.max(1, d.rollsPerSec) * D.fate.massSec * er / rr * Math.sqrt(rr / er) * (1 + chalRewardSum(s, 'fateMass'));
    // 지금 가장 큰 천체보다 한 단계 위까지만 (운 한 번에 판이 끝나지 않게)
    var mt = maxTier(s), capM = d.th[Math.min(d.th.length - 1, Math.max(0, mt - 1))];
    var b0 = s.bodies[sum] ? s.bodies[sum].m : 0, unit = d.power * rr * d.hitMult(sum);
    var allow = Math.max(capM * 1.001 - b0, unit * mult * 0.05);
    if (unit * mult > allow) mult = allow / unit;
    var r = applyRoll(s, d, idx, vals, false, mult);
    r.fate = true; r.fateX = mult;
    s.stats.fates = (s.stats.fates || 0) + 1;
    checkAch(s);
    return r;
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
    var rolled = [], B0 = s.ev.buffs;
    if (d.interval > 0) {
      s.autoT += dt * eff;
      var n = Math.floor(s.autoT / d.interval);
      if (n > 0) {
        s.autoT -= n * d.interval;
        var extra = 0;
        if (d.twin > 0) { if (n <= 8) { for (var i = 0; i < n; i++) if (rng() < d.twin) extra++; } else extra = Math.round(n * Math.min(1, d.twin)); }
        var tot = n + extra;
        fateCharge(s, tot);
        while (tot > 0 && ((B0.align || 0) > 0 || (B0.moons || 0) > 0) && tot > 6) { rollOnce(s, false); tot--; }
        if (tot <= 6 && !opts.offline) { for (var j = 0; j < tot; j++) rolled.push(rollOnce(s, false)); }
        else if (tot > 0) {
          var shown = opts.offline ? 0 : 1;
          var bo = rollBatch(s, tot - shown);
          if (shown) { var r1 = rollOnce(s, false); r1.batch = tot; r1.batchTierUps = bo.tierUps; r1.jackpot = bo.jackpot; rolled.push(r1); }
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
    conTick(s, dt);
    // 자동화
    if (s.chal && chalMet(s)) { s.chalDone[s.chal] = chalStage(s, s.chal) + 1; chalQueue.push(s.chal); s.chal = null; invalidate(); }
    if (res(s, 's5')) autoBuy(s);
    if (res(s, 's4')) autoUpgrade(s);
    if (res(s, 's6') && s.settings.autoNova && canNova(s) && novaGain(s) >= autoNovaNeed(s)) nova(s);
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
    if (s.manualCd > 0 || chalRule(s, 'noManual')) return null;
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
    if (s.dice.length >= (sres(s, 'q6') ? 6 : 5) || chalRule(s, 'twoDice') || s.dice.length + 1 > chalMinOrbit(s)) types = types.filter(function (t) { return t !== 'rogue'; });
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
    if (rng() < D.box.eventChance) { s.box++; info.box = 1; }
    s.ev.seen[e.type] = 1;
    invalidate();
    return info;
  }

  // ── 구매 ────────────────────────────────────────
  function costPower(s) { return D.power.cost0 * Math.pow(D.power.costK, s.lv.power); }
  function costWind(s) { return D.wind.cost0 * Math.pow(D.wind.costK, s.lv.wind); }
  function maxDice(s) { return chalRule(s, 'twoDice') ? 2 : (sres(s, 'q6') ? 6 : 5); }
  // 과제 중: 아직 못 채운 목표 궤도 중 가장 작은 번호 (주사위가 그보다 많으면 그 궤도는 나올 수 없음)
  function chalMinOrbit(s) {
    var g = s.chal ? chalGoal(s, s.chal) : null; if (!g) return Infinity;
    var m = Infinity; g.forEach(function (q) { var b = s.bodies[q[0]]; if (!(b && b.t >= q[1])) m = Math.min(m, q[0]); });
    return m;
  }
  function costDie(s) {
    var n = s.dice.length + 1;
    if (n > maxDice(s)) return Infinity;
    if (n > chalMinOrbit(s)) return Infinity; // 목표 궤도를 막는 주사위는 사지 않음 (자동 구매 포함)
    return (D.diceCost[n] || Infinity) * chalReward(s, 'diceCost');
  }
  // 지금 주사위 면 수: 주형 연구로 d6 → d8 → d12
  function dieShape(s) { return s.sres.q5 ? 'd12' : (s.sres.q3 ? 'd8' : 'd6'); }
  function trayUsed(dice) { var t = 0; dice.forEach(function (d) { t += d.faces.length; }); return t; }

  function spend(s, c) { if (!(s.dust >= c) || !isFinite(c)) return false; s.dust -= c; return true; }
  function buyPower(s) { if (!spend(s, costPower(s))) return false; s.lv.power++; invalidate(); return true; }
  function buyWind(s) { if (!spend(s, costWind(s))) return false; s.lv.wind++; invalidate(); return true; }
  function buyDie(s) {
    var c = costDie(s);
    var shape = dieShape(s);
    if (!spend(s, c)) return false;
    s.dice.push(newDie(shape)); invalidate(); return true;
  }
  // 굴림 1번의 가치 (자동 플레이·시뮬레이터용): 기대 질량 × 궤도 수 가산
  function rollValue(s) {
    var d = derive(s), e = 0;
    Object.keys(d.dist).forEach(function (k) { var p = d.dist[k], pa = d.al[k] || 0; e += d.rarity(+k) * ((p - pa) + pa * d.alignMult); });
    return e * (1 + 0.02 * Object.keys(d.dist).length);
  }
  // 과제 목표 궤도가 잘 나오는 정도
  function goalValue(s) {
    var g = chalGoal(s, s.chal); if (!g) return rollValue(s);
    var d = derive(s), v = 0;
    g.forEach(function (q) { var b = s.bodies[q[0]]; if (b && b.t >= q[1]) return; v += Math.log(1e-9 + (d.dist[q[0]] || 0) * d.rarity(q[0])); });
    return v;
  }
  function costRefine(s) { return D.refine.cost0 * Math.pow(D.refine.costK, s.lv.refine || 0); }
  function costCompress(s) { return D.compress.cost0 * Math.pow(D.compress.costK, s.lv.compress || 0); }
  function buyRefine(s) { var c = costRefine(s); if (!(s.cores >= c)) return false; s.cores -= c; s.lv.refine = (s.lv.refine || 0) + 1; invalidate(); return true; }
  function buyCompress(s) { var c = costCompress(s); if (!(s.sing >= c)) return false; s.sing -= c; s.lv.compress = (s.lv.compress || 0) + 1; invalidate(); return true; }
  function upgradeVisible(s, u) { return s.dustRun >= u.req || s.up[u.id]; }
  function pairOf(u) { return u.pair ? G.UPGRADES.filter(function (x) { return x.pair === u.pair && x.id !== u.id; })[0] : null; }
  function pairBlocked(s, u) { var o = pairOf(u); return !!(o && s.up[o.id]); }
  function buyUpgrade(s, id) {
    var u = G.UPGRADES.filter(function (x) { return x.id === id; })[0];
    if (!u || s.up[id] || !upgradeVisible(s, u) || pairBlocked(s, u)) return false;
    if (!spend(s, u.cost)) return false;
    s.up[id] = 1; if (u.pair) s.pairPref[u.pair] = id; invalidate(); return true;
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
    G.UPGRADES.forEach(function (u) {
      if (u.pair) { var pref = s.pairPref[u.pair]; if (pref ? pref !== u.id : pairOf(u) && G.UPGRADES.indexOf(pairOf(u)) < G.UPGRADES.indexOf(u)) return; }
      if (!s.up[u.id] && upgradeVisible(s, u) && s.dust >= u.cost) buyUpgrade(s, u.id);
    });
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
    if (r.eff === 'ending' && !endingReady(s)) return false;
    s.sing -= r.cost; s.sres[id] = 1; invalidate();
    if (r.eff === 'shape') { s.shapes[r.v] = true; upgradeDice(s); }
    if (r.eff === 'ending') { s.ended = true; }
    return true;
  }
  // 면 수 업그레이드: 모든 주사위를 지금 면 수로 (끼운 특수 주사위는 그대로)
  function upgradeDice(s) {
    var sh = dieShape(s);
    s.dice.forEach(function (d, i) { if (d.shape !== sh) { var nd = newDie(sh); if (d.sp) nd.sp = d.sp; s.dice[i] = nd; } });
    invalidate();
  }
  function setShape() { return false; }

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
  // 자동 초신성 기준: 얻을 별핵이 지난 붕괴 뒤 모은 별핵의 25% 이상 (최소 1)
  function autoNovaNeed(s) { return Math.max(1, Math.floor(s.coresLayer * (s.settings.autoNovaPct || D.autoNovaFrac * 100) / 100)); }
  function resetRun(s) {
    var oldDice = s.dice;
    s.dust = 0; s.dustRun = 0; s.bodies = {}; s.up = {}; s.autoT = 0;
    s.lv = { power: 0, wind: res(s, 'r1') ? 6 : 0, refine: s.lv.refine || 0, compress: s.lv.compress || 0 };
    var nd = res(s, 'r2') ? 3 : 2;
    if (chalRule(s, 'twoDice')) nd = 2;
    nd = Math.max(2, Math.min(nd, chalMinOrbit(s)));
    s.dice = [];
    for (var i = 0; i < nd; i++) {
      var od = oldDice[i];
      var shape = dieShape(s);
      var nd2 = newDie(shape); if (od && od.sp) nd2.sp = od.sp;
      s.dice.push(nd2);
    }
    s.con.cur = null; s.con.wait = Math.min(s.con.wait || D.contract.gap, D.contract.gap);
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
    if (info.time >= D.box.novaMinRun || s.novas === 1) s.box += D.box.novaBox; // 5분 넘게 키운 판만 상자
    if (s.novas === 1) s.boxEpic = 1;
    if (!s.stats.fastestNova || info.time < s.stats.fastestNova) s.stats.fastestNova = info.time;
    resetRun(s);
    checkAch(s);
    return info;
  }
  function chalById(id) { return G.CHALLENGES.filter(function (x) { return x.id === id; })[0]; }
  // 지금 단계의 목표 [[궤도, 단계]...] (모두 끝났으면 null)
  function chalGoal(s, id) { var c = chalById(id), k = chalStage(s, id); return c && k < c.goals.length ? c.goals[k] : null; }
  function chalMet(s) {
    var g = chalGoal(s, s.chal); if (!g) return false;
    return g.every(function (q) { var b = s.bodies[q[0]]; return b && b.t >= q[1]; });
  }
  function chalUnlocked(s, c) {
    var k = chalStage(s, c.id);
    if (k >= c.goals.length) return false;
    if (k >= 2) return s.collapses > 0;
    return s.novas >= c.req || s.collapses > 0;
  }
  function endingReady(s) { return G.CHALLENGES.every(function (c) { return chalStage(s, c.id) >= D.endChalStage; }); }
  function startChallenge(s, id) {
    var c = chalById(id);
    if (!c || !chalUnlocked(s, c) || s.chal) return false;
    s.chal = id; resetRun(s); return true;
  }
  function quitChallenge(s) { if (!s.chal) return false; s.chal = null; resetRun(s); return true; }

  // ── 주사위 상자·보관함 ──────────────────────────
  function openBox(s) {
    if (!(s.box >= 1)) return null;
    s.box--; s.stats.boxes = (s.stats.boxes || 0) + 1;
    var r = rng(), rar = 0, acc = 0;
    for (var i = 0; i < D.box.odds.length; i++) { acc += D.box.odds[i]; if (r < acc) { rar = i; break; } rar = i; }
    if (!s.novas && !s.collapses) rar = Math.min(rar, 1); // 첫 초신성 전에는 보통·드묾만
    if (s.boxEpic) { rar = Math.max(rar, 2); s.boxEpic = 0; }
    var pool = G.SPDICE.filter(function (x) { return x.rar === rar; });
    var sp = pool[Math.floor(rng() * pool.length)];
    var lv = s.coll[sp.id] || 0, out = { id: sp.id, rar: rar, isNew: !lv };
    if (lv >= D.starMax) { var g = production(s) * 300 + 100; s.dust += g; s.dustRun += g; s.dustAll += g; out.dust = g; out.lv = lv; }
    else { s.coll[sp.id] = lv + 1; out.lv = lv + 1; }
    if (!lv && s.dice.some(function (d) { return !d.sp; })) { var free = s.dice.filter(function (d) { return !d.sp; })[0]; free.sp = sp.id; out.auto = true; }
    invalidate(); checkAch(s);
    return out;
  }
  function equip(s, slot, id) {
    var die = s.dice[slot]; if (!die) return false;
    if (id && !s.coll[id]) return false;
    if (id) s.dice.forEach(function (d) { if (d.sp === id) delete d.sp; });
    if (id) die.sp = id; else delete die.sp;
    invalidate(); return true;
  }
  // 굴림 가치·생산을 함께 보는 점수 (좋은 순서로 끼우기)
  function loadoutScore(s) {
    var d = derive(s);
    var bodies = Object.keys(s.bodies).length ? production(s) : 1;
    return Math.log(Math.max(1e-9, bodies)) + Math.log(Math.max(1e-9, rollValue(s) * d.power * d.batchDieMult * Math.max(0.33, d.rollsPerSec)));
  }
  function autoEquip(s) {
    var owned = Object.keys(s.coll).filter(function (k) { return s.coll[k] > 0; });
    s.dice.forEach(function (d) { delete d.sp; });
    invalidate();
    for (var i = 0; i < s.dice.length; i++) {
      var best = null, bv = loadoutScore(s);
      owned.forEach(function (id) {
        if (s.dice.some(function (d) { return d.sp === id; })) return;
        s.dice[i].sp = id; invalidate();
        var v = loadoutScore(s);
        if (v > bv + 1e-9) { bv = v; best = id; }
        delete s.dice[i].sp; invalidate();
      });
      if (best) s.dice[i].sp = best;
      invalidate();
    }
    return true;
  }

  // ── 관측 의뢰 ───────────────────────────────────
  // 지금 쟁반 주사위로 이 합이 나올 수 있는지 (떠돌이 주사위 같은 잠깐의 변화는 빼고)
  function orbitPossible(s, sum) { var lo = 0, hi = 0; s.dice.forEach(function (d) { lo += Math.min.apply(null, d.faces); hi += Math.max.apply(null, d.faces); }); return sum >= lo && sum <= hi; }
  function conUnlocked(s) { return s.lv.wind > 0 || s.novas > 0 || s.collapses > 0; }
  // 한 궤도가 목표 단계까지 걸리는 예상 시간(초)
  function orbitEta(s, d, sum, target) {
    var b = s.bodies[sum], need = d.th[target - 2] - (b ? b.m : 0);
    if (need <= 0) return 0;
    var rps = d.rollsPerSec || 1.2;
    var per = rps * (d.dist[sum] || 0) * d.power * d.rarity(sum) * d.hitMult(sum) * d.batchDieMult;
    return per > 0 ? need / per : Infinity;
  }
  function newContract(s) {
    var d = derive(s), mt = Math.max(2, maxTier(s));
    var cands = [];
    d.orbits.forEach(function (sum) {
      if (!(d.dist[sum] > 0)) return;
      if (sum <= s.dice.length && s.dice.length < maxDice(s)) return; // 주사위를 더 사면 사라질 궤도는 피함
      var ct = s.bodies[sum] ? s.bodies[sum].t : 0;
      for (var t = Math.max(2, ct + 1); t <= Math.min(mt, ct + 3, 10); t++) {
        var eta = orbitEta(s, d, sum, t);
        if (eta >= D.contract.etaMin && eta <= D.contract.etaMax) cands.push({ type: 'orbit', sum: sum, tier: t, time: D.contract.time });
      }
    });
    var opts = [];
    if (cands.length) { opts.push(cands[Math.floor(rng() * cands.length)]); opts.push(cands[Math.floor(rng() * cands.length)]); }
    var pa = 0; Object.keys(d.al).forEach(function (k) { pa += d.al[k]; });
    var expA = 240 * (d.rollsPerSec || 1) * pa;
    if (expA >= 2) opts.push({ type: 'align', n: Math.max(1, Math.min(60, Math.round(expA * 0.55))), time: 240 });
    if (s.dustAll > 200 && !res(s, 's2')) opts.push({ type: 'event', n: 1, time: 300 });
    var pr = production(s);
    if (pr > 0) opts.push({ type: 'dust', n: pr * 170, time: 240 });
    if (!opts.length) return null;
    var c = opts[Math.floor(rng() * opts.length)];
    c.left = c.time;
    c.base = c.type === 'align' ? s.stats.aligns : c.type === 'event' ? s.stats.events : c.type === 'dust' ? s.dustAll : 0;
    return c;
  }
  function conProgress(s, c) {
    if (!c) return 0;
    if (c.type === 'orbit') { var b = s.bodies[c.sum]; if (!b) return 0; if (b.t >= c.tier) return 1; var d = derive(s), lo = c.tier > 2 ? d.th[c.tier - 3] : 0; return Math.max(0, Math.min(0.99, Math.log(1 + b.m) / Math.log(1 + d.th[c.tier - 2]))); }
    var have = c.type === 'align' ? s.stats.aligns : c.type === 'event' ? s.stats.events : s.dustAll;
    return Math.max(0, Math.min(1, (have - c.base) / c.n));
  }
  var conQueue = [];
  function conTick(s, dt) {
    if (!conUnlocked(s)) return;
    var K = s.con;
    K.rcd = Math.max(0, (K.rcd || 0) - dt);
    if (!K.cur) { K.wait -= dt; if (K.wait <= 0) { K.cur = newContract(s); K.wait = D.contract.gap; if (K.cur) conQueue.push({ kind: 'new', c: K.cur }); } return; }
    var c = K.cur;
    // 주사위가 늘어 목표 궤도가 더는 안 나오면 (합의 최솟값 = 주사위 수) 의뢰를 새로 바꿔 준다
    if (c.type === 'orbit' && !orbitPossible(s, c.sum) && !(conProgress(s, c) >= 1)) {
      var nc = newContract(s); conQueue.push({ kind: 'swap', c: nc }); K.cur = nc; if (!nc) K.wait = D.contract.gap; return;
    }
    if (conProgress(s, c) >= 1) {
      s.box++; s.stats.cons = (s.stats.cons || 0) + 1;
      var fate = c.type === 'align' || c.type === 'event';
      if (fate && fateUnlocked(s) && s.fate.n < D.fate.max) s.fate.n++;
      conQueue.push({ kind: 'ok', c: c, fate: fate });
      K.cur = null; K.wait = D.contract.gap; checkAch(s); return;
    }
    c.left -= dt;
    if (c.left <= 0) { conQueue.push({ kind: 'fail', c: c }); K.cur = null; K.wait = D.contract.gap; }
  }
  function rerollContract(s) {
    if (!conUnlocked(s) || (s.con.rcd || 0) > 0) return false;
    var c = newContract(s); if (!c) return false;
    s.con.cur = c; s.con.rcd = D.contract.reroll; return true;
  }

  // ── 중력 붕괴 ───────────────────────────────────
  function canCollapse(s) { return maxTier(s) >= D.collapseTier && !s.chal; }
  function collapseGain(s) {
    if (!canCollapse(s)) return 0;
    var runMin = (s.t - (s.layerStart || 0)) / 60;
    return Math.floor(D.singGain.k * Math.pow((s.coresLayer + novaGain(s)) / D.singGain.div, D.singGain.exp) * Math.min(1, 0.4 + runMin / 50));
  }
  function layerBonus(s) { return Math.min(1, 0.4 + (s.t - (s.layerStart || 0)) / 60 / 50); }
  function collapse(s) {
    if (!canCollapse(s)) return null;
    var g = Math.max(1, collapseGain(s));
    s.sing += g; s.singAll += g; s.collapses++; s.layerStart = s.t; s.box += D.box.colBox;
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
    ['box1', function (s) { return (s.stats.boxes || 0) >= 1; }],
    ['star5', function (s) { return Object.keys(s.coll).some(function (k) { return s.coll[k] >= 5; }); }],
    ['legend', function (s) { return G.SPDICE.some(function (x) { return x.rar === 3 && s.coll[x.id]; }); }],
    ['con10', function (s) { return (s.stats.cons || 0) >= 10; }],
    ['con50', function (s) { return (s.stats.cons || 0) >= 50; }],
    ['dex15', function (s) { return dexCount(s) >= 15; }],
    ['dex30', function (s) { return dexCount(s) >= 30; }],
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
    ['chal1', function (s) { return G.CHALLENGES.some(function (c) { return chalStage(s, c.id) >= 1; }); }],
    ['chalAll', function (s) { return endingReady(s); }],
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
    costPower: costPower, costWind: costWind, costDie: costDie, maxDice: maxDice, rollValue: rollValue, goalValue: goalValue,
    spById: spById, spVal: spVal, openBox: openBox, equip: equip, autoEquip: autoEquip, conUnlocked: conUnlocked, conProgress: conProgress, rerollContract: rerollContract, newContract: newContract, conQueue: conQueue, dexQueue: dexQueue, dexCount: dexCount, dexPer: dexPer, orbitClass: orbitClass,
    buyPower: buyPower, buyWind: buyWind, buyDie: buyDie, buyUpgrade: buyUpgrade, upgradeVisible: upgradeVisible, pairOf: pairOf, pairBlocked: pairBlocked,
    buyResearch: buyResearch, costRefine: costRefine, costCompress: costCompress, buyRefine: buyRefine, buyCompress: buyCompress, researchAvail: researchAvail, buySres: buySres, sresAvail: sresAvail, setShape: setShape, trayUsed: trayUsed,
    autoNovaNeed: autoNovaNeed, orbitPossible: orbitPossible, dieShape: dieShape, chalMinOrbit: chalMinOrbit, upgradeDice: upgradeDice, canNova: canNova, novaGain: novaGain, novaNext: novaNext, nova: nova, maxTier: maxTier, totalMass: totalMass,
    chalUnlocked: chalUnlocked, chalGoal: chalGoal, chalStage: chalStage, chalMet: chalMet, endingReady: endingReady, outerCap: outerCap,
    fateUnlocked: fateUnlocked, fateNeed: fateNeed, fateRoll: fateRoll, poisson: poisson, startChallenge: startChallenge, quitChallenge: quitChallenge, chalRule: chalRule,
    canCollapse: canCollapse, layerBonus: layerBonus, collapseGain: collapseGain, collapse: collapse,
    spawnEvent: spawnEvent, catchEvent: catchEvent, offline: offline, checkAch: checkAch,
    achQueue: achQueue, chalQueue: chalQueue, setRng: setRng, capAll: capAll, newDie: newDie, SHAPE_FACES: SHAPE_FACES, res: res, sres: sres
  };
})();
if (typeof module !== 'undefined') module.exports = G;

// 자동 플레이 시뮬레이터: 실제 게임 로직(src/core.js)을 그대로 돌린다.
// 사용: node tools/sim.js [전략:opt|normal|random|all] [시드 수] [최대 시간(시)]
const G = require('../src/core.js');
const C = G.core;
const strat = process.argv[2] || 'all';
const SEEDS = +(process.argv[3] || 5);
const MAXH = +(process.argv[4] || 30);

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

function expMass(s) { return C.rollValue(s); }
// 쌍 개량: opt는 두 쪽을 실제로 사 보고 생산×굴림 가치가 큰 쪽, normal은 무작위
function pickPair(s, u, kind, R) {
  const o = C.pairOf(u); if (!o) return u;
  if (kind === 'opt') {
    const val = (x) => { s.up[x.id] = 1; C.invalidate(); const v = C.production(s) * C.rollValue(s) * C.derive(s).power * (C.derive(s).rollsPerSec || 1); delete s.up[x.id]; C.invalidate(); return v; };
    return val(u) >= val(o) ? u : o;
  }
  if (s._pairPick === undefined) s._pairPick = {};
  if (!s._pairPick[u.pair + s.novas]) s._pairPick[u.pair + s.novas] = R() < 0.5 ? u.id : o.id;
  return s._pairPick[u.pair + s.novas] === u.id ? u : o;
}
const PAIRS = {};
const MS = ['firstBuy', 'wind', 'lens1', 'dice3', 'forge', 'tier4', 'tier6', 'dice4', 'nova1', 'nova2', 'nova5', 'chal1', 'dice5', 'tier9', 'chalAll', 'collapse1', 'collapse3', 'ending'];

function run(kind, seed) {
  const R = mulberry(seed * 9973 + kind.length);
  C.setRng(R);
  const s = C.newState();
  C.invalidate();
  const ms = {};
  const mark = (k) => { if (ms[k] === undefined) ms[k] = s.t; };
  let lastBuyT = 0, maxGap = 0, maxGapAt = 0;
  const gapEnd = 3600 * 30;
  const dt = 0.5;
  const P = { opt: { click: 3, clickUntil: 3600, catch: 1, react: 1 }, normal: { click: 1, clickUntil: 600, catch: 0.6, react: 8 }, random: { click: 0.5, clickUntil: 120, catch: 0.3, react: 20 }, idle: { click: 1, clickUntil: 60, catch: 0, react: 30 }, noforge: { click: 1, clickUntil: 600, catch: 0.6, react: 8 } }[kind];
  let nextAct = 0; const runs = []; const cols = []; const CH = { start: 0, quit: [], done: [] };
  const bought = () => { if (s.t > 30) { const g = s.t - lastBuyT; if (g > maxGap && s.t < 3600 * 6) { maxGap = g; maxGapAt = s.t; if (process.env.GAPDBG) console.log('gap', Math.round(g), (s.t/3600).toFixed(2), 'runT', Math.round((s.t - s.stats.runStart)/60), 'tier', C.maxTier(s), 'dust', s.dust.toExponential(2), 'cp', C.costPower(s).toExponential(2), 'prod', C.production(s).toExponential(2), 'cores', s.cores, 'col', s.collapses, 'chal', s.chal); } } lastBuyT = s.t; };
  while (s.t < MAXH * 3600) {
    // 손 굴림
    if (s.t < P.clickUntil || C.derive(s).interval === 0) {
      const n = P.click * dt;
      for (let i = 0; i < Math.floor(Math.min(n, dt / G.DATA.manualCooldown) + R()); i++) { s.manualCd = 0; C.manualRoll(s); }
    }
    C.tick(s, dt, {});
    if (s.ev.cur && s.ev.cur.life < 10) { if (R() < P.catch) C.catchEvent(s); else s.ev.cur = null; }
    if (s.fate.n >= 1 && kind !== 'idle' && (kind === 'opt' || R() < 0.02)) C.fateRoll(s);
    if (kind === 'idle' && s.fate.n >= 3 && R() < 0.001) C.fateRoll(s);
    if (s.t < nextAct) continue;
    nextAct = s.t + P.react * (0.5 + R());
    // 결정
    let did = true, guard = 0;
    while (did && guard++ < 40) {
      did = false;
      if (kind === 'random') {
        const opts = [];
        if (s.dust >= C.costPower(s)) opts.push(() => C.buyPower(s));
        if (s.dust >= C.costWind(s)) opts.push(() => C.buyWind(s));
        if (s.dust >= C.costDie(s)) opts.push(() => C.buyDie(s));
        G.UPGRADES.forEach(u => { if (!s.up[u.id] && C.upgradeVisible(s, u) && s.dust >= u.cost) opts.push(() => C.buyUpgrade(s, u.id)); });
        if (C.forgeUnlocked(s) && s.moves >= 1) opts.push(() => { const di = Math.floor(R() * s.dice.length), n = s.dice[di].faces.length; return C.movePip(s, di, Math.floor(R() * n), Math.floor(R() * n)); });
        if (opts.length && R() < 0.85) { did = opts[Math.floor(R() * opts.length)](); if (did) bought(); }
      } else {
        // 개량: 싼 것부터
        const ups = G.UPGRADES.filter(u => !s.up[u.id] && !C.pairBlocked(s, u) && C.upgradeVisible(s, u) && s.dust >= u.cost).sort((a, b) => a.cost - b.cost);
        if (ups.length) { const pu = pickPair(s, ups[0], kind, R); if (s.dust >= pu.cost && C.buyUpgrade(s, pu.id)) { if (pu.pair) PAIRS[pu.id] = (PAIRS[pu.id] || 0) + 1; did = true; bought(); continue; } }
        if (s.dust >= C.costDie(s)) { C.buyDie(s); did = true; bought(); continue; }
        // 다음 주사위를 위해 저축 (opt): 주사위 값의 20% 이하 지출만
        const save = kind === 'opt' && isFinite(C.costDie(s)) && C.costDie(s) < s.dust * 8 ? 0.25 : 1e9;
        if (kind !== 'noforge' && C.forgeUnlocked(s) && s.moves >= 1 && (kind !== 'idle' || s.t - (s._mvT || 0) > 600)) {
          const b = C.bestMove(s);
          if (b && C.movePip(s, b.di, b.from, b.to)) { s._mvT = s.t; did = true; continue; }
        }
        const cp = C.costPower(s), cw = C.costWind(s);
        const windUseful = C.derive(s).interval === 0 || C.derive(s).interval > 0.06;
        if (windUseful && s.dust >= cw && cw <= cp * 1.5) { C.buyWind(s); did = true; bought(); continue; }
        if (s.dust >= cp) { C.buyPower(s); did = true; bought(); continue; }
      }
    }
    // 연구
    if (s.cores > 0) {
      let g = 0;
      while (g++ < 20 && G.RESEARCH.every(r => s.research[r.id] || !C.researchAvail(s, r) || s.cores < r.cost) && s.cores >= C.costRefine(s) * (G.RESEARCH.every(r => s.research[r.id]) ? 1 : 3)) C.buyRefine(s);
      g = 0;
      while (g++ < 20) {
        const av = G.RESEARCH.filter(r => C.researchAvail(s, r) && s.cores >= r.cost).sort((a, b) => a.cost - b.cost);
        if (!av.length) break; C.buyResearch(s, av[0].id);
      }
    }
    if (s.sing > 0) {
      let g = 0;
      while (g++ < 20) {
        const av = G.SRESEARCH.filter(r => C.sresAvail(s, r) && s.sing >= r.cost && (r.eff !== 'ending' || C.endingReady(s))).sort((a, b) => a.cost - b.cost);
        if (!av.length) break; C.buySres(s, av[0].id);
      }
      g = 0; const nextS = G.SRESEARCH.find(r => !s.sres[r.id]);
      while (g++ < 20 && s.sing >= C.costCompress(s) && (!nextS || C.costCompress(s) < s.sing * 0.3)) C.buyCompress(s);
    }
    // 주사위 모양 고르기 (해금된 모양으로 기대 질량 최대)
    if (Object.keys(s.shapes).length > 1 && s.t - (s._shapeT || 0) > 600 && kind !== 'random') {
      s._shapeT = s.t;
      for (let di = 0; di < s.dice.length; di++) {
        let best = s.dice[di].shape, be = expMass(s);
        for (const sh of Object.keys(s.shapes)) {
          const old = s.dice[di];
          if (!C.setShape(s, di, sh)) continue;
          const e = expMass(s); s.dice[di] = old; C.invalidate();
          if (e > be * 1.05) { be = e; best = sh; }
        }
        if (best !== s.dice[di].shape) C.setShape(s, di, best);
      }
      if (s.dice.length < C.maxDice(s) && C.trayUsed(s.dice) + 4 <= 36 && s.shapes.d4 && s.dust >= C.costDie(s)) { C.buyDie(s); }
    }
    if (s.ended) { mark('ending'); break; }
    // 마일스톤
    if (s.stats.rolls > 0 && Object.keys(s.up).length + s.lv.power + s.lv.wind > 0) mark('firstBuy');
    if (s.lv.wind > 0) mark('wind');
    if (s.up.lens1) mark('lens1');
    if (s.dice.length >= 3) mark('dice3');
    if (s.forges > 0) mark('forge');
    if (C.maxTier(s) >= 4) mark('tier4');
    if (C.maxTier(s) >= 6) mark('tier6');
    if (s.dice.length >= 4) mark('dice4');
    if (s.dice.length >= 5) mark('dice5');
    if (C.maxTier(s) >= 9) mark('tier9');
    // 초신성 판단
    const runT = s.t - s.stats.runStart;
    if (C.canNova(s)) {
      const g = C.novaGain(s);
      const want = s.chal ? false : kind === 'opt' ? (g >= Math.max(1, s.coresLayer * 0.6) || runT > 1800) : (kind === 'normal' || kind === 'idle' || kind === 'noforge') ? (g >= Math.max(1, s.coresLayer * 0.35) || runT > 2400) : (R() < 0.05);
      const colWait = C.canCollapse(s) && (C.collapseGain(s) >= Math.max(1, s.singAll * (kind === 'opt' ? 0.6 : 0.4)));
      if (want && !colWait) {
        bought(); runs.push(Math.round(runT/60)+'m+'+C.novaGain(s)+(s.chal?'c':'')); C.nova(s); mark('nova1'); if (s.novas >= 2) mark('nova2'); if (s.novas >= 5) mark('nova5');
        if (G.CHALLENGES.some(c => C.chalStage(s, c.id) >= 1)) mark('chal1');
        if (C.endingReady(s)) mark('chalAll');
        // 과제 시작
        const nextC = G.CHALLENGES.filter(c => C.chalUnlocked(s, c)).sort((a, b) => C.chalStage(s, a.id) - C.chalStage(s, b.id))[0];
        if (nextC && s.novas >= (kind === 'opt' ? 3 : 5) && (s.novas % 2 === 0) && R() < (kind === 'random' ? 0.2 : 1)) { C.startChallenge(s, nextC.id); CH.start++; }
      }
    }
    if (s.chal && runT > 3600 * (kind === 'opt' ? 1 : 1.5)) { CH.quit.push(s.chal + C.chalStage(s, s.chal)); C.quitChallenge(s); }
    if (s._chalLast !== JSON.stringify(s.chalDone)) { s._chalLast = JSON.stringify(s.chalDone); CH.done.push((s.t / 3600).toFixed(1) + 'h:' + Object.keys(s.chalDone).map(k => k + '=' + s.chalDone[k]).join(',')); }
    if (C.canCollapse(s) && (kind === 'random' ? R() < 0.1 : (C.collapseGain(s) >= Math.max(1, s.singAll * (kind === 'opt' ? 0.6 : 0.4)) || s.t - (s._lastCol || 0) > 5400))) { s._lastCol = s.t; cols.push((s.t/3600).toFixed(1)+'h+'+C.collapseGain(s)); C.collapse(s); mark('collapse1'); if (s.collapses >= 3) mark('collapse3'); }
  }
  return { ms, CH, maxGap, maxGapAt, runs, cols, final: { t: s.t, novas: s.novas, col: s.collapses, chal: Object.keys(s.chalDone).length, tier: C.maxTier(s), dust: s.dust } };
}

function fmt(t) { if (t === undefined) return '   -   '; if (t < 3600) return (t / 60).toFixed(1).padStart(5) + 'm'; return (t / 3600).toFixed(2).padStart(5) + 'h'; }
const kinds = strat === 'all' ? ['opt', 'normal', 'idle', 'random'] : strat.split(',');
for (const k of kinds) {
  const rs = []; for (let i = 0; i < SEEDS; i++) rs.push(run(k, i + 1));
  console.log('== ' + k + ' (' + SEEDS + ' seeds)');
  for (const m of MS) {
    const v = rs.map(r => r.ms[m]).filter(x => x !== undefined);
    if (!v.length) { console.log(m.padEnd(10), '    도달 못함'); continue; }
    v.sort((a, b) => a - b);
    console.log(m.padEnd(10), 'min', fmt(v[0]), 'med', fmt(v[Math.floor(v.length / 2)]), 'max', fmt(v[v.length - 1]), v.length < SEEDS ? '(' + v.length + '/' + SEEDS + ')' : '');
  }
  console.log('maxGap(6h내 구매 간격 최대)', rs.map(r => Math.round(r.maxGap) + 's@' + fmt(r.maxGapAt).trim()).join(' '));
  console.log('runs', rs.map(r => r.runs.slice(0,30).join(',')).join(' | '));
  console.log('cols', rs.map(r => r.cols.join(',')).join(' | '));
  console.log('final', rs.map(r => JSON.stringify(r.final)).join('\n      '));
  console.log('chal', rs.map(r => 'start ' + r.CH.start + ' quit ' + r.CH.quit.join(',') + ' | ' + r.CH.done.slice(-1).join('')).join('\n      '));
  console.log('pairs', JSON.stringify(PAIRS)); for (const k in PAIRS) delete PAIRS[k];
}

// 저장·불러오기·내보내기·가져오기. 불러온 값은 모두 범위를 확인해 고친다.
(function () {
  var KEY = 'diceOrrery.save.v1';
  var disabled = false;
  var myRev = 0;
  function merge(def, got) {
    if (got === null || got === undefined) return def;
    if (typeof def !== 'object' || def === null || Array.isArray(def)) return typeof got === typeof def || def === null ? got : def;
    if (typeof got !== 'object' || Array.isArray(got)) return def;
    var o = {};
    for (var k in def) o[k] = merge(def[k], got[k]);
    for (var k2 in got) if (!(k2 in o)) o[k2] = got[k2];
    return o;
  }
  function num(v, lo, hi, def) { v = +v; if (!isFinite(v)) return v === Infinity ? hi : def; return Math.max(lo, Math.min(hi, v)); }
  function int(v, lo, hi, def) { return Math.floor(num(v, lo, hi, def)); }
  function valid(s) { if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.v !== 'number' || !isFinite(+s.dust)) return false; if (!Array.isArray(s.dice)) s.dice = []; return true; }
  function idSet(list) { var o = {}; list.forEach(function (x) { o[x.id || x[0]] = 1; }); return o; }
  function sanitize(s) {
    var CAP = 1e300;
    ['dust', 'dustRun', 'dustAll', 'cores', 'coresLayer', 'coresAll', 'sing', 'singAll', 't'].forEach(function (k) { s[k] = num(s[k], 0, CAP, 0); });
    ['novas', 'collapses', 'box'].forEach(function (k) { s[k] = int(s[k], 0, 1e9, 0); });
    s.lv = { power: int(s.lv && s.lv.power, 0, 3000, 0), wind: int(s.lv && s.lv.wind, 0, 2000, 0), refine: int(s.lv && s.lv.refine, 0, 500, 0), compress: int(s.lv && s.lv.compress, 0, 500, 0) };
    s.lastSave = num(s.lastSave, 0, 1e15, Date.now());
    s.autoT = num(s.autoT, 0, 100, 0); s.manualCd = 0;
    // 주사위
    var SF = G.core.SHAPE_FACES;
    var dice = s.dice.filter(function (d) { return d && typeof d === 'object'; }).slice(0, 6).map(function (d) {
      var shape = SF[d.shape] ? d.shape : 'd6';
      var n = SF[shape], base = G.core.newDie(shape).faces;
      // 눈은 언제나 표준값 (옛 저장의 옮긴 눈은 되돌림)
      var o = { shape: shape, faces: base };
      if (typeof d.sp === 'string' && G.core.spById(d.sp)) o.sp = d.sp;
      return o;
    });
    while (dice.length < 2) dice.push(G.core.newDie('d6'));
    var maxD = s.sres && s.sres.q6 ? 6 : 5;
    dice = dice.slice(0, maxD);
    s.dice = dice;
    delete s.moves; delete s.runTiers; delete s.forges;
    // 보관함·도감·의뢰
    var co = {}; G.SPDICE.forEach(function (x) { var v = s.coll && s.coll[x.id]; if (v) co[x.id] = int(v, 0, G.DATA.starMax, 0); }); s.coll = co;
    var seenSp = {}; s.dice.forEach(function (d) { if (d.sp && (!co[d.sp] || seenSp[d.sp])) delete d.sp; else if (d.sp) seenSp[d.sp] = 1; });
    var dx = {}; Object.keys(s.dex || {}).forEach(function (k) { if (/^(10|[1-9])_[012]$/.test(k)) dx[k] = 1; }); s.dex = dx;
    var K = s.con || {}; s.con = { cur: null, wait: num(K.wait, 0, 60, G.DATA.contract.first), rcd: num(K.rcd, 0, 60, 0) };
    if (K.cur && typeof K.cur === 'object' && ['orbit', 'align', 'event', 'dust'].indexOf(K.cur.type) >= 0) {
      var c = K.cur; s.con.cur = { type: c.type, sum: int(c.sum, 0, 80, 7), tier: int(c.tier, 2, 10, 2), n: num(c.n, 0, CAP, 1), time: num(c.time, 1, 600, 180), left: num(c.left, 0, 600, 0), base: num(c.base, 0, CAP, 0) };
    }
    var so = {}; Object.keys(s.story || {}).forEach(function (k) { if (/^[a-z0-9_]{1,20}$/.test(k)) so[k] = 1; }); s.story = so;
    s.boxEpic = s.boxEpic ? 1 : 0;
    var fa = s.fate || {}; s.fate = { c: num(fa.c, 0, 1e15, 0), n: int(fa.n, 0, G.DATA.fate.max, 0) };
    var pp = {}; Object.keys(s.pairPref || {}).forEach(function (k) { var id = s.pairPref[k]; if (G.UPGRADES.some(function (u) { return u.id === id && u.pair === k; })) pp[k] = id; }); s.pairPref = pp;
    // 천체
    var nb = {};
    Object.keys(s.bodies || {}).forEach(function (k) {
      var b = s.bodies[k], key = /^\d{1,2}$/.test(k) ? int(k, 0, 80, -1) : -1;
      if (key < 0 || !b || typeof b !== 'object') return;
      var m = num(b.m, 0, CAP, 0); if (m <= 0) return;
      nb[key] = { m: m, t: int(b.t, 1, 10, 1), seed: int(b.seed, 0, 1e6, key), a0: num(b.a0, -1e6, 1e6, 0) };
    });
    s.bodies = nb;
    // 구매 기록: 알려진 id만
    function clean(obj, ids) { var o = {}; Object.keys(obj || {}).forEach(function (k) { if (ids[k] && obj[k]) o[k] = 1; }); return o; }
    s.up = clean(s.up, idSet(G.UPGRADES)); s.research = clean(s.research, idSet(G.RESEARCH)); s.sres = clean(s.sres, idSet(G.SRESEARCH));
    var cd = {}; G.CHALLENGES.forEach(function (c) { var v = s.chalDone && s.chalDone[c.id]; if (v) cd[c.id] = int(v, 0, c.goals.length, 0); }); s.chalDone = cd;
    if (s.chal && (!idSet(G.CHALLENGES)[s.chal] || (s.chalDone[s.chal] || 0) >= 5)) s.chal = null;
    // 구매한 개량 중 같은 쌍 둘 다 가진 경우 뒤쪽을 뺀다
    G.UPGRADES.forEach(function (u) { if (u.pair && s.up[u.id]) { var o = G.core.pairOf(u); if (o && s.up[o.id] && G.UPGRADES.indexOf(o) > G.UPGRADES.indexOf(u)) delete s.up[o.id]; } });
    var ach = {}; Object.keys(s.ach || {}).forEach(function (k) { if (idSet(G.ACH)[k]) ach[k] = int(s.ach[k], 0, 1e12, 0); }); s.ach = ach;
    s.shapes = { d6: true }; ['d8', 'd12'].forEach(function (sh) { G.SRESEARCH.forEach(function (r) { if (r.v === sh && s.sres[r.id]) s.shapes[sh] = true; }); });
    var dsh = s.sres.q5 ? 'd12' : (s.sres.q3 ? 'd8' : 'd6');
    s.dice.forEach(function (d) { if (d.shape !== dsh) { d.shape = dsh; d.faces = G.core.newDie(dsh).faces; } });
    // 이벤트·버프
    var B = (s.ev && s.ev.buffs) || {};
    s.ev = { next: num(s.ev && s.ev.next, 0, 400, 60), cur: null, buffs: { flare: num(B.flare, 0, 60, 0), pulsar: num(B.pulsar, 0, 60, 0), rogue: num(B.rogue, 0, 60, 0), shower: int(B.shower, 0, 200, 0), align: int(B.align, 0, 20, 0), moons: int(B.moons, 0, 100, 0) }, seen: (function () { var o = {}, sv = (s.ev && s.ev.seen) || {}; G.EVENTS.forEach(function (e) { if (sv[e]) o[e] = 1; }); return o; })(), seenFirst: !!(s.ev && s.ev.seenFirst) };
    // 통계
    var st = s.stats || {};
    Object.keys(st).forEach(function (k) { if (typeof st[k] === 'number' || typeof st[k] === 'string') st[k] = num(st[k], 0, CAP, 0); });
    s.last = Array.isArray(s.last) ? s.last.filter(function (x) { return isFinite(+x); }).slice(0, 8).map(Number) : [];
    // 설정
    var se = s.settings || {};
    s.settings = { sfx: num(se.sfx, 0, 1, 0.7), bgm: num(se.bgm, 0, 1, 0.5), muted: se.muted !== false, notation: ['ko', 'en', 'sci', 'eng'].indexOf(se.notation) >= 0 ? se.notation : 'ko', reduce: !!se.reduce, lang: se.lang === 'en' ? 'en' : 'ko', autoNova: !!se.autoNova, autoNovaPct: [10, 25, 50, 100].indexOf(+se.autoNovaPct) >= 0 ? +se.autoNovaPct : 25, autoCollapse: !!se.autoCollapse };
    s.seenTabs = (s.seenTabs && typeof s.seenTabs === 'object' && !Array.isArray(s.seenTabs)) ? s.seenTabs : { machine: 1, rec: 1, n_upg: 1, n_dice: 1, n_nova: 1, n_col: 1, n_chal: 1 };
    s.layerStart = num(s.layerStart, 0, s.t, 0);
    s.ended = !!s.ended && !!s.sres.q12;
    s.sres.q12 = s.sres.q12;  s.endSeen = !!s.endSeen && s.ended;
    // 과제 중인데 주사위가 목표 궤도보다 많아 목표를 못 채우는 저장: 남는 주사위를 뺀다
    if (s.chal) { var mo = G.core.chalDiceCap(s); if (s.dice.length > mo) s.dice.length = mo; }
    if (st.alignDice > s.dice.length) st.alignDice = 0;
    return s;
  }
  function serialize(s) { G.core.capAll(s); s.lastSave = Date.now(); return JSON.stringify(s); }
  function save(s) {
    if (disabled) return false;
    try {
      var cur = 0; try { var raw = localStorage.getItem(KEY); if (raw) cur = (JSON.parse(raw).rev) || 0; } catch (e2) { }
      if (cur > myRev) return 'locked'; // 다른 창이 더 새로 저장함
      myRev = cur + 1; s.rev = myRev;
      localStorage.setItem(KEY, serialize(s)); return true;
    } catch (e) { return false; }
  }
  function parse(raw) {
    try {
      var got = JSON.parse(raw); if (!valid(got)) return null;
      return sanitize(merge(G.core.newState(), got));
    } catch (e) { return null; }
  }
  // 반환: 상태 | null(저장 없음) | 'broken'
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!raw) return null;
    var s = parse(raw);
    if (!s) { try { localStorage.setItem(KEY + '.broken', raw); } catch (e) { } return 'broken'; }
    myRev = s.rev || 0;
    return s;
  }
  function has() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) { } }
  function toCode(s) { var j = serialize(s); return 'DO1:' + btoa(unescape(encodeURIComponent(j))); }
  function fromCode(code) {
    try {
      code = String(code || '').trim();
      if (code.indexOf('DO1:') !== 0) return null;
      return parse(decodeURIComponent(escape(atob(code.slice(4)))));
    } catch (e) { return null; }
  }
  G.save = { save: save, load: load, has: has, wipe: wipe, toCode: toCode, fromCode: fromCode, KEY: KEY, disable: function () { disabled = true; }, release: function () { }, adopt: function (s) { var cur = 0; try { var raw = localStorage.getItem(KEY); if (raw) cur = (JSON.parse(raw).rev) || 0; } catch (e) { } myRev = cur; s.rev = cur; } };
})();

// 저장·불러오기·내보내기·가져오기. 불러온 값은 모두 범위를 확인해 고친다.
(function () {
  var KEY = 'diceOrrery.save.v1';
  var disabled = false;
  var TAB = Math.random().toString(36).slice(2), OWN = KEY + '.owner';
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
  function valid(s) { if (!s || typeof s !== 'object' || Array.isArray(s) || typeof s.v !== 'number' || typeof s.dust !== 'number') return false; if (!Array.isArray(s.dice)) s.dice = []; return true; }
  function idSet(list) { var o = {}; list.forEach(function (x) { o[x.id || x[0]] = 1; }); return o; }
  function sanitize(s) {
    var CAP = 1e300;
    ['dust', 'dustRun', 'dustAll', 'cores', 'coresLayer', 'coresAll', 'sing', 'singAll', 't'].forEach(function (k) { s[k] = num(s[k], 0, CAP, 0); });
    ['novas', 'collapses', 'forges'].forEach(function (k) { s[k] = int(s[k], 0, 1e9, 0); });
    s.lv = { power: int(s.lv && s.lv.power, 0, 5000, 0), wind: int(s.lv && s.lv.wind, 0, 5000, 0), refine: int(s.lv && s.lv.refine, 0, 500, 0), compress: int(s.lv && s.lv.compress, 0, 500, 0) };
    s.lastSave = num(s.lastSave, 0, 1e15, Date.now());
    s.autoT = num(s.autoT, 0, 100, 0); s.manualCd = 0;
    // 주사위
    var SF = G.core.SHAPE_FACES;
    var dice = s.dice.filter(function (d) { return d && typeof d === 'object'; }).slice(0, 6).map(function (d) {
      var shape = SF[d.shape] ? d.shape : 'd6';
      var n = SF[shape], base = G.core.newDie(shape).faces;
      var faces = Array.isArray(d.faces) && d.faces.length === n ? d.faces.map(function (f, i) { return int(f, 1, Math.max(9, n), base[i]); }) : base;
      return { shape: shape, faces: faces };
    });
    while (dice.length < 2) dice.push(G.core.newDie('d6'));
    var used = 0; dice = dice.filter(function (d) { used += d.faces.length; return used <= G.DATA.trayCapacity; });
    var maxD = s.sres && s.sres.q6 ? 6 : 5, maxF = s.research && s.research.g6 ? 9 : 6;
    dice = dice.slice(0, maxD);
    dice.forEach(function (d) { if (d.shape === 'd6') d.faces = d.faces.map(function (f) { return Math.min(f, maxF); }); });
    s.dice = dice;
    // 천체
    var nb = {};
    Object.keys(s.bodies || {}).forEach(function (k) {
      var b = s.bodies[k], key = int(k, 1, 80, -1);
      if (key < 1 || !b || typeof b !== 'object') return;
      var m = num(b.m, 0, CAP, 0); if (m <= 0) return;
      nb[key] = { m: m, t: int(b.t, 1, 10, 1), seed: int(b.seed, 0, 1e6, key), a0: num(b.a0, -1e6, 1e6, 0) };
    });
    s.bodies = nb;
    // 구매 기록: 알려진 id만
    function clean(obj, ids) { var o = {}; Object.keys(obj || {}).forEach(function (k) { if (ids[k] && obj[k]) o[k] = 1; }); return o; }
    s.up = clean(s.up, idSet(G.UPGRADES)); s.research = clean(s.research, idSet(G.RESEARCH)); s.sres = clean(s.sres, idSet(G.SRESEARCH));
    s.chalDone = clean(s.chalDone, idSet(G.CHALLENGES));
    if (s.chal && (!idSet(G.CHALLENGES)[s.chal] || s.chalDone[s.chal])) s.chal = null;
    var ach = {}; Object.keys(s.ach || {}).forEach(function (k) { if (idSet(G.ACH)[k]) ach[k] = int(s.ach[k], 0, 1e12, 0); }); s.ach = ach;
    s.shapes = { d6: true }; ['d4', 'd8', 'd12'].forEach(function (sh) { G.SRESEARCH.forEach(function (r) { if (r.v === sh && s.sres[r.id]) s.shapes[sh] = true; }); });
    s.dice.forEach(function (d) { if (!s.shapes[d.shape]) { d.shape = 'd6'; d.faces = G.core.newDie('d6').faces; } });
    // 이벤트·버프
    var B = (s.ev && s.ev.buffs) || {};
    s.ev = { next: num(s.ev && s.ev.next, 0, 400, 60), cur: null, buffs: { flare: num(B.flare, 0, 60, 0), pulsar: num(B.pulsar, 0, 60, 0), rogue: num(B.rogue, 0, 60, 0), shower: int(B.shower, 0, 200, 0), align: int(B.align, 0, 20, 0), moons: int(B.moons, 0, 100, 0) }, seen: (function () { var o = {}, sv = (s.ev && s.ev.seen) || {}; G.EVENTS.forEach(function (e) { if (sv[e]) o[e] = 1; }); return o; })(), seenFirst: !!(s.ev && s.ev.seenFirst) };
    // 통계
    var st = s.stats || {};
    Object.keys(st).forEach(function (k) { if (typeof st[k] === 'number' || typeof st[k] === 'string') st[k] = num(st[k], 0, CAP, 0); });
    s.last = Array.isArray(s.last) ? s.last.filter(function (x) { return isFinite(+x); }).slice(0, 8).map(Number) : [];
    // 설정
    var se = s.settings || {};
    s.settings = { sfx: num(se.sfx, 0, 1, 0.7), bgm: num(se.bgm, 0, 1, 0.5), muted: se.muted !== false, notation: ['ko', 'en', 'sci', 'eng'].indexOf(se.notation) >= 0 ? se.notation : 'ko', reduce: !!se.reduce, lang: se.lang === 'en' ? 'en' : 'ko', autoNova: !!se.autoNova, autoCollapse: !!se.autoCollapse };
    s.ended = !!s.ended && !!s.sres.q12; s.endSeen = !!s.endSeen && s.ended;
    if (st.alignDice > s.dice.length) st.alignDice = 0;
    return s;
  }
  function serialize(s) { G.core.capAll(s); s.lastSave = Date.now(); return JSON.stringify(s); }
  function save(s) {
    if (disabled) return false;
    try {
      var o = JSON.parse(localStorage.getItem(OWN) || 'null');
      if (o && o.id !== TAB && Date.now() - o.t < 40000) return 'locked';
      localStorage.setItem(OWN, JSON.stringify({ id: TAB, t: Date.now() }));
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
  G.save = { save: save, load: load, has: has, wipe: wipe, toCode: toCode, fromCode: fromCode, KEY: KEY, disable: function () { disabled = true; }, release: function () { try { var o = JSON.parse(localStorage.getItem(OWN) || 'null'); if (o && o.id === TAB) localStorage.removeItem(OWN); } catch (e) { } } };
})();

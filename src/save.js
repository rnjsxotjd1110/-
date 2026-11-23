// 저장·불러오기·내보내기·가져오기
(function () {
  var KEY = 'diceOrrery.save.v1';
  function merge(def, got) {
    if (got === null || got === undefined) return def;
    if (typeof def !== 'object' || def === null || Array.isArray(def)) return got;
    var o = {};
    for (var k in def) o[k] = merge(def[k], got[k]);
    for (var k2 in got) if (!(k2 in o)) o[k2] = got[k2];
    return o;
  }
  function valid(s) {
    return s && typeof s === 'object' && typeof s.dust === 'number' && isFinite(s.dust) && Array.isArray(s.dice) && s.dice.length >= 1 &&
      s.dice.every(function (d) { return d && Array.isArray(d.faces) && d.faces.every(function (f) { return typeof f === 'number' && f >= 1 && f <= 12; }); });
  }
  function sanitize(s) {
    ['dust', 'dustRun', 'dustAll', 'cores', 'coresLayer', 'coresAll', 'sing', 'singAll'].forEach(function (k) { if (!isFinite(s[k]) || s[k] < 0) s[k] = 0; });
    Object.keys(s.bodies).forEach(function (k) { var b = s.bodies[k]; if (!b || !isFinite(b.m) || b.m <= 0) delete s.bodies[k]; });
    return s;
  }
  function serialize(s) { s.lastSave = Date.now(); return JSON.stringify(s); }
  function save(s) { try { localStorage.setItem(KEY, serialize(s)); return true; } catch (e) { return false; } }
  function load() {
    try {
      var raw = localStorage.getItem(KEY); if (!raw) return null;
      var got = JSON.parse(raw); if (!valid(got)) return null;
      return sanitize(merge(G.core.newState(), got));
    } catch (e) { return null; }
  }
  function has() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
  function wipe() { try { localStorage.removeItem(KEY); } catch (e) { } }
  function toCode(s) { var j = serialize(s); return 'DO1:' + btoa(unescape(encodeURIComponent(j))); }
  function fromCode(code) {
    try {
      code = String(code || '').trim();
      if (code.indexOf('DO1:') !== 0) return null;
      var j = decodeURIComponent(escape(atob(code.slice(4))));
      var got = JSON.parse(j); if (!valid(got)) return null;
      return sanitize(merge(G.core.newState(), got));
    } catch (e) { return null; }
  }
  G.save = { save: save, load: load, has: has, wipe: wipe, toCode: toCode, fromCode: fromCode, KEY: KEY };
})();

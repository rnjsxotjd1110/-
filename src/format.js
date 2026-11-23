// 큰 수 표기 4종
(function () {
  var KO_U = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극', '항하사', '아승기', '나유타', '불가사의', '무량대수'];
  var EN_U = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];
  var mode = 'ko';
  function comma(n) { return String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function sig(x, d) { // 유효숫자 3자리
    var s = x >= 100 ? x.toFixed(0) : x >= 10 ? x.toFixed(1) : x.toFixed(2);
    if (d === 0) s = x.toFixed(0);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s || '0';
  }
  function sci(n) {
    var e = Math.floor(Math.log10(n)); var m = n / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e++; }
    return m.toFixed(2) + 'e' + e;
  }
  function eng(n) {
    var e = Math.floor(Math.log10(n)); var e3 = Math.floor(e / 3) * 3; var m = n / Math.pow(10, e3);
    if (m >= 999.5) { m /= 1000; e3 += 3; }
    return sig(m) + 'e' + e3;
  }
  function fmt(n, small) {
    if (n === undefined || n === null || isNaN(n)) return '0';
    if (!isFinite(n)) return 'MAX';
    var neg = n < 0; n = Math.abs(n);
    var out;
    if (n < 10000) {
      if (small && n < 10 && n % 1) { out = n.toFixed(n < 1 ? 2 : 1); if (out.indexOf('.') >= 0) out = out.replace(/0+$/, '').replace(/\.$/, ''); }
      else out = comma(n);
    } else if (mode === 'sci') out = sci(n);
    else if (mode === 'eng') out = eng(n);
    else if (mode === 'en') {
      var i = Math.floor(Math.log10(n) / 3);
      var ve = n / Math.pow(1000, i); if (ve >= 999.5) { ve /= 1000; i++; }
      if (i < EN_U.length) out = sig(ve) + EN_U[i]; else out = sci(n);
    } else {
      var j = Math.floor(Math.log10(n) / 4);
      if (j < KO_U.length) {
        var v = n / Math.pow(10000, j);
        if (v >= 9999.5) { v /= 10000; j++; }
        if (j >= KO_U.length) return (neg ? '-' : '') + sci(n);
        var sv = sig(v);
        out = (+sv >= 1000 ? comma(Math.round(v)) : sv) + KO_U[j];
      } else out = sci(n);
    }
    return (neg ? '-' : '') + out;
  }
  function time(sec) {
    sec = Math.max(0, Math.floor(+sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    var ko = G.getLang && G.getLang() !== 'en';
    if (h >= 48) { var dd = Math.floor(h / 24); return ko ? dd + '일 ' + (h % 24) + '시간' : dd + 'd ' + (h % 24) + 'h'; }
    if (h > 0) return ko ? h + '시간 ' + m + '분' : h + 'h ' + m + 'm';
    if (m > 0) return ko ? m + '분 ' + s + '초' : m + 'm ' + s + 's';
    return ko ? s + '초' : s + 's';
  }
  G.pct = function (p) { var v = p * 100; if (v > 0 && v < 0.01) return '<0.01%'; return (v >= 1 ? v.toFixed(1) : v.toFixed(2)) + '%'; };
  G.fmt = fmt; G.fmtTime = time; G.setNotation = function (m) { mode = m; };
})();

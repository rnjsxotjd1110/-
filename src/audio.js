// 코드로 합성한 소리. 짧은 시작·짧은 감쇠, 잡음 없음, 끝은 부드럽게 줄어듦.
(function () {
  var ctx = null, master, sfxG, bgmG, comp;
  var settings = { sfx: 0.7, bgm: 0.5, muted: true };
  var lastPlay = {}, active = 0;
  function unlock() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 4;
    master = ctx.createGain(); sfxG = ctx.createGain(); bgmG = ctx.createGain();
    sfxG.connect(master); bgmG.connect(master); master.connect(comp); comp.connect(ctx.destination);
    apply();
  }
  function apply() {
    if (!ctx) return;
    var m = settings.muted ? 0 : 1;
    master.gain.setTargetAtTime(0.5 * m, ctx.currentTime, 0.05);
    sfxG.gain.setTargetAtTime(settings.sfx, ctx.currentTime, 0.05);
    bgmG.gain.setTargetAtTime(settings.bgm * 0.35, ctx.currentTime, 0.2);
  }
  // 음 하나: 사인/삼각파 + 짧은 엔벨로프 + 저역 통과
  function tone(f, t0, dur, vol, type, dest, f2, attack) {
    var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t0);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
    lp.type = 'lowpass'; lp.frequency.value = Math.min(9000, f * 6);
    var a = attack || 0.004;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(lp); lp.connect(g); g.connect(dest || sfxG);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function bell(f, t0, dur, vol, dest) { tone(f, t0, dur, vol, 'sine', dest); tone(f * 2.01, t0, dur * 0.5, vol * 0.25, 'sine', dest); }
  var NOTE = function (n) { return 440 * Math.pow(2, (n - 69) / 12); };
  var SFX = {
    tap: function (t) { tone(1046, t, 0.05, 0.08, 'triangle'); },
    tab: function (t) { tone(784, t, 0.04, 0.06, 'triangle'); },
    land: function (t, o) { var p = (o && o.pitch) || 1; tone(260 * p, t, 0.07, 0.12, 'sine', null, 170 * p); tone(1300 * p, t, 0.015, 0.03, 'triangle'); },
    roll: function (t) { for (var i = 0; i < 3; i++) tone(500 + i * 90, t + i * 0.045, 0.03, 0.035, 'triangle'); },
    align: function (t) { [72, 76, 79, 84].forEach(function (n, i) { bell(NOTE(n), t + i * 0.07, 0.35, 0.09); }); },
    tierup: function (t, o) { var b = 67 + ((o && o.tier) || 0); bell(NOTE(b), t, 0.3, 0.08); bell(NOTE(b + 7), t + 0.09, 0.4, 0.08); },
    buy: function (t) { tone(1318, t, 0.06, 0.07, 'sine'); tone(1760, t + 0.04, 0.09, 0.06, 'sine'); },
    deny: function (t) { tone(196, t, 0.09, 0.07, 'sine', null, 165); },
    unlock: function (t) { [67, 71, 74].forEach(function (n, i) { tone(NOTE(n), t + i * 0.06, 0.18, 0.07, 'triangle'); }); },
    evspawn: function (t) { bell(NOTE(91), t, 0.45, 0.05); },
    evcatch: function (t) { [79, 83, 86, 91].forEach(function (n, i) { tone(NOTE(n), t + i * 0.04, 0.14, 0.06, 'sine'); }); },
    nova: function (t) { tone(110, t, 1.4, 0.16, 'sine', null, 55, 0.25); [60, 64, 67, 72].forEach(function (n, i) { bell(NOTE(n), t + 0.5 + i * 0.05, 1.2, 0.06); }); },
    collapse: function (t) { tone(330, t, 1.6, 0.12, 'sine', null, 45, 0.3); [57, 60, 64].forEach(function (n, i) { bell(NOTE(n), t + 1.2 + i * 0.08, 1.0, 0.05); }); },
    ach: function (t) { bell(NOTE(84), t, 0.3, 0.06); bell(NOTE(88), t + 0.1, 0.4, 0.06); },
    forge: function (t) { tone(2093, t, 0.1, 0.05, 'sine'); tone(3136, t + 0.01, 0.07, 0.03, 'sine'); },
    chal: function (t) { [72, 76, 79].forEach(function (n, i) { bell(NOTE(n), t + i * 0.12, 0.5, 0.07); }); },
    ending: function (t) { [48, 55, 60, 64, 67, 72].forEach(function (n, i) { bell(NOTE(n), t + i * 0.25, 2.5, 0.05); }); },
    lever: function (t) { tone(392, t, 0.06, 0.06, 'triangle', null, 330); },
    fate: function (t) { [55, 62, 67, 74].forEach(function (n, i) { bell(NOTE(n), t + i * 0.09, 0.6, 0.07); }); },
    fateready: function (t) { bell(NOTE(86), t, 0.3, 0.04); bell(NOTE(91), t + 0.08, 0.35, 0.035); }
  };
  function play(name, opt) {
    if (!ctx || settings.muted || !SFX[name]) return;
    var now = ctx.currentTime;
    if (lastPlay[name] && now - lastPlay[name] < 0.045) return;
    if (active >= 8) return;
    lastPlay[name] = now; active++;
    setTimeout(function () { active--; }, 250);
    SFX[name](now + 0.005, opt);
  }
  // 배경음: 오르골 아르페지오 + 부드러운 화음. 조용하게.
  var bgmOn = false, bgmTrack = 0, nextT = 0, step = 0, timer = null;
  var TRACKS = [
    { bpm: 66, chords: [[48, 55, 64], [45, 52, 60], [41, 48, 57], [43, 50, 59]], scale: [72, 74, 76, 79, 81, 84] },
    { bpm: 56, chords: [[45, 52, 60], [41, 48, 57], [38, 45, 53], [40, 47, 55]], scale: [69, 71, 72, 76, 79, 81] }
  ];
  var pattern = [0, 2, 4, 2, 5, 4, 2, 1];
  function schedule() {
    if (!ctx || !bgmOn) return;
    var tr = TRACKS[bgmTrack];
    var spb = 60 / tr.bpm / 2;
    if (nextT < ctx.currentTime - 0.05) nextT = ctx.currentTime + 0.05;
    if (settings.muted || settings.bgm <= 0) { nextT = ctx.currentTime + 0.2; return; }
    while (nextT < ctx.currentTime + 0.4) {
      var bar = Math.floor(step / 8) % tr.chords.length, ch = tr.chords[bar];
      if (step % 8 === 0) ch.forEach(function (n) { tone(NOTE(n), nextT, spb * 8, 0.03, 'sine', bgmG, null, 0.6); });
      var pi = pattern[step % 8];
      if (step % 16 !== 7 && step % 16 !== 15) {
        var n = tr.scale[(pi + bar) % tr.scale.length];
        tone(NOTE(n), nextT, spb * 2.2, 0.035, 'triangle', bgmG);
      }
      nextT += spb; step++;
    }
  }
  function startBgm(track) {
    unlock(); if (!ctx) return;
    if (bgmOn && track === bgmTrack) return;
    bgmTrack = track || 0; bgmOn = true;
    nextT = ctx.currentTime + 0.2; step = 0;
    if (!timer) timer = setInterval(schedule, 120);
  }
  function set(o) { for (var k in o) settings[k] = o[k]; apply(); }
  G.audio = { unlock: unlock, play: play, set: set, startBgm: startBgm, settings: settings, ready: function () { return !!ctx; } };
})();

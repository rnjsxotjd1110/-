// 직접 찍은 픽셀 스프라이트. 글자 하나 = 픽셀 하나. '.' = 투명.
(function () {
  // 공통 범례
  var L = {
    '.': 255, k: 12, K: 13, H: 3, b: 2, d: 11, r: 18, w: 4, p: 8, c: 9, m: 14, g: 15,
    o: 7, s: 5, B: 10, R: 17, D: 20, e: 22, x: 23, M: 21, t: 19, T: 16, q: 6, n: 1, N: 0
  };
  function parse(rows, legend) {
    legend = legend || L;
    var h = rows.length, w = rows[0].length;
    var s = G.gfx.makeSprite(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var ch = rows[y][x];
      var v = legend[ch];
      s.d[y * w + x] = v === undefined ? 255 : v;
    }
    return s;
  }
  var S = {};

  // ── 아이콘 16x16 ───────────────────────────────
  // 굴림 힘: 놋쇠 추
  S.icPower = parse([
    '................',
    '......kkkk......',
    '.....kHwHbk.....',
    '.....kHk.dk.....',
    '......kkkk......',
    '.....kkkkkk.....',
    '....kHHHHbbk....',
    '...kHwHbbbbdk...',
    '...kHHbbbbbdk...',
    '..kHHbbbbbbddk..',
    '..kHbbbbbbbddk..',
    '.kHbbbbbbbbbddk.',
    '.kHbbbbbbbbdddk.',
    '.kbdddddddddrrk.',
    '..kkkkkkkkkkkk..',
    '................']);
  // 태엽 열쇠
  S.icWind = parse([
    '................',
    '..kkkk....kkkk..',
    '.kHwHbk..kHHbdk.',
    '.kHHbbdkkHbbbdk.',
    '.kHbbbdHHbbbddk.',
    '..kbbddbbbdddk..',
    '...kkkdbbbdkk...',
    '......kHbdk.....',
    '......kHbdk.....',
    '......kHbdk.....',
    '......kHbdk.....',
    '......kHbdkkk...',
    '......kHbbbbdk..',
    '......kHbdkkk...',
    '......kHbbdk....',
    '.......kkkk.....']);
  // 주사위 추가
  S.icDie = parse([
    '................',
    '....kkkkkkk.....',
    '...kwwwwwwpk....',
    '..kwwwwwwwppk...',
    '.kkkkkkkkkpk....',
    '.kwwwwwwwkppk...',
    '.kwDwwwwwkpck...',
    '.kwwwwwwwkcpk...',
    '.kwwwDwwwkpck...',
    '.kwwwwwwwkcck...',
    '.kwwwwwDwkck....',
    '.kpppppppkk.....',
    '.kkkkkkkkk......',
    '................',
    '................',
    '................']);
  // 눈 새기기: 끌과 면
  S.icChisel = parse([
    '................',
    '...........kk...',
    '..........kgmk..',
    '.........kgmk...',
    '........kgmk....',
    '.......kgmk.....',
    '......kHbk......',
    '.....kHbdk......',
    '.kkkkkHddkkkk...',
    '.kwwwkddkwwwpk..',
    '.kwwwwkkwwwwpk..',
    '.kwwwwwwwDwwpk..',
    '.kwwDwwwwwwwpk..',
    '.kwwwwwwwwwwck..',
    '.kpppppppppcck..',
    '..kkkkkkkkkkk...']);
  // 별가루: 네 갈래 반짝이
  S.icDust = parse([
    '....k....',
    '...kwk...',
    '...kHk...',
    '.kkHwHkk.',
    'kwHwwwHdk',
    '.kkbHbkk.',
    '...kbk...',
    '...kdk...',
    '....k....']);
  // 별핵
  S.icCore = parse([
    '...kkk...',
    '..kpwpk..',
    '.kpoooBk.',
    'kpoosssBk',
    'kooossBBk',
    'kossssBBk',
    '.kssBBBk.',
    '..kBBBk..',
    '...kkk...']);
  // 특이점
  S.icSing = parse([
    '...kkk...',
    '..ktttk..',
    '.ktkkkTk.',
    'ktkNNNkTk',
    'ktkNNNkTk',
    'ktkNNNkqk',
    '.kTkkkqk.',
    '..kTqqk..',
    '...kkk...']);
  // 톱니(설정)
  S.icGear = parse([
    '...k.k...',
    '..kgkgk..',
    '.kgmmmgk.',
    'kgmkkkmgk',
    '.gmk.kmg.',
    'kgmkkkmgk',
    '.kgmmmgk.',
    '..kgkgk..',
    '...k.k...']);
  S.icSoundOn = parse([
    '...k.....',
    '..kgk..g.',
    'kkgmk.g..',
    'kgmmk..g.',
    'kgmmk.g..',
    'kkgmk..g.',
    '..kgk....',
    '...k.....',
    '.........']);
  S.icSoundOff = parse([
    '...k.....',
    '..kgk....',
    'kkgmk.R.R',
    'kgmmk..R.',
    'kgmmk.R.R',
    'kkgmk....',
    '..kgk....',
    '...k.....',
    '.........']);
  S.icLock = parse([
    '..kkkk...',
    '.kgkkgk..',
    '.kgk.kgk.',
    'kkkkkkkk.',
    'kHHHHbdk.',
    'kHbkkbdk.',
    'kHbbbbdk.',
    'kbddddrk.',
    '.kkkkkk..']);
  S.icHarm = parse([
    '..kkkkk..',
    '.kHk.kbk.',
    'kHk...kdk',
    'kbk.k.kdk',
    'kbkkHkkdk',
    'kbk.k.kdk',
    'kdk...kdk',
    '.kdk.kdk.',
    '..kkkkk..']);
  // 반짝이는 별 3프레임 (7x7)
  S.twinkle = [
    parse(['.......', '.......', '...w...', '..wHw..', '...w...', '.......', '.......']),
    parse(['.......', '...p...', '...w...', '.pwwwp.', '...w...', '...p...', '.......']),
    parse(['...p...', '...p...', '..pwp..', 'ppwwwpp', '..pwp..', '...p...', '...p...'])
  ];
  // 혜성 머리 (이벤트) 9x9
  // 운명 굴림 보석 자리 (빈 자리 / 찬 보석)
  S.fateEmpty = parse([
    '...kkkkk...',
    '.kkbHHHbkk.',
    '.kbxxxxxdk.',
    'kbxNNNNNxdk',
    'kHxNNNNNxdk',
    'kHxNNNNNxdk',
    'kHxNNNNNxdk',
    'kbxNNNNNxdk',
    '.kdxxxxxdk.',
    '.kkdddddkk.',
    '...kkkkk...']);
  S.fateGem = parse([
    '...kkkkk...',
    '.kkbHHHbkk.',
    '.kbxxwxxdk.',
    'kbxxwpoxxdk',
    'kHxwppoRxdk',
    'kHwwpooRRdk',
    'kHxpooRRxdk',
    'kbxxoRRxxdk',
    '.kdxxRxxdk.',
    '.kkdddddkk.',
    '...kkkkk...']);
  S.comet = parse([
    '....kkk..',
    '...kwwpk.',
    '..kwwwppk',
    '..kwwppck',
    '..kpppcck',
    '...kccck.',
    '....kkk..',
    '.........',
    '.........']);
  // 메뉴 선택 표시: 작은 주사위 7x7
  S.menuDie = parse([
    '.kkkkk.',
    'kwwwwpk',
    'kwDwwpk',
    'kwwDwpk',
    'kwwwDck',
    'kppcccK',
    '.kkkkk.']);
  S.knobBig = parse([
    '....kkkkkk....',
    '...kpwwwwpk...',
    '..kpwwwwoosk..',
    '.kowwwwooossk.',
    'kooowwoooosssk',
    'koooooooosssBk',
    'koooooossssBBk',
    'kosoossssssBBk',
    'kssssssssBBBBk',
    'kssssssBBBBBMk',
    '.kBsBBBBBBBMk.',
    '..kBBBBBBMMk..',
    '...kMMMMMMk...',
    '....kkkkkk....']);
  // 레버 손잡이(굴리기) 공 10x10
  S.knob = parse([
    '...kkkk...',
    '..kpwwpk..',
    '.kowwwoBk.',
    'kowwooosBk',
    'koooossBBk',
    'kossssBBBk',
    'kssssBBBMk',
    '.kBBBBBMk.',
    '..kMMMMk..',
    '...kkkk...']);


  // ── 개량 분류 아이콘 14x14 ─────────────────────
  S.cat = {};
  S.cat.lens = parse([
    '....kkkkk.....',
    '...kgmmmgk....',
    '..kgtTTqmgk...',
    '.kgtwtTTqmk...',
    '.kgTtTTqqmk...',
    '.kgTTTqqqmk...',
    '.kgqTqqqNmk...',
    '..kgqqqNmk....',
    '...kggmmkk....',
    '....kkkkHbk...',
    '.........kHbk.',
    '..........kHbk',
    '...........kdk',
    '............k.']);
  S.cat.ring = parse([
    '..............',
    '....kkkkkk....',
    '..kkHHHHHbkk..',
    '.kHHkkkkkkbdk.',
    'kHbk......kddk',
    'kHk........kdk',
    'kbk...kk...kdk',
    'kbk..kwpk..kdk',
    'kdk..kpck..krk',
    'kddk..kk..krrk',
    '.kddkkkkkkrrk.',
    '..kkdddrrrkk..',
    '....kkkkkk....',
    '..............']);
  S.cat.gear = parse([
    '.....kkkk.....',
    '..kk.kHbk.kk..',
    '.kHbkkHbkkbdk.',
    '.kbHHHbbbbddk.',
    '..kHbbkkbbdk..',
    'kkHbbk..kbddkk',
    'kHHbk....kbdrk',
    'kHbbk....kddrk',
    'kkbbdk..kddrkk',
    '..kbddkkddrk..',
    '.kbddddddrrrk.',
    '.kddkkddkkrrk.',
    '..kk.kdrk.kk..',
    '.....kkkk.....']);
  S.cat.harp = parse([
    '..kkk.........',
    '.kHbdk........',
    '.kbkkdk.......',
    '.kbk.kdkk.....',
    '.kbkg.kddkk...',
    '.kbkg.g.kddk..',
    '.kbkg.g.gkdk..',
    '.kbkg.g.g.kdk.',
    '.kbkg.g.g.kdk.',
    '.kbkg.g.g.kdk.',
    '.kbkg.g.g.kdk.',
    '.kbkkkkkkkkdk.',
    '.kbHHHbbbbddk.',
    '..kkkkkkkkkk..']);
  S.cat.orbit = parse([
    '..............',
    '.....kkkk.....',
    '...kk....kk...',
    '..k..........k',
    '.k....kk....k.',
    'k....kwHk...k.',
    'k...kHbdk..k..',
    'k...kbddk.kpk.',
    '.k...kkk.kwck.',
    '..k.......kk..',
    '...kk...kk....',
    '.....kkk......',
    '..............',
    '..............']);
  S.cat.comet = parse([
    '..........kkk.',
    '.........kwwpk',
    '........kwwppk',
    '.......kpwpcck',
    '......kgpcck..',
    '.....kggckk...',
    '....kgmmk.....',
    '...kgmmk......',
    '..kgmmk.......',
    '.kgmk.........',
    'kgmk..........',
    'kmk...........',
    'kk............',
    '..............']);
  S.cat.scope = parse([
    '..........kk..',
    '.........kHbk.',
    '........kHbbdk',
    '.......kHbbdk.',
    '......kHbbdk..',
    '.....kHbbdk...',
    '....kHbbdk....',
    '...kwHbdk.....',
    '..kkkkdk......',
    '.....kk.......',
    '....kgk.......',
    '...kgkgk......',
    '..kgk.kgk.....',
    '..kk...kk.....']);
  S.cat.hand = parse([
    '..............',
    '...kkkkkkk....',
    '..kwwwwwwpk...',
    '..kwDwwwDpk...',
    '..kwwwDwwpk...',
    '..kwDwwwDck...',
    '..kpppppcck...',
    '...kkkkkkk....',
    '..............',
    '..kk..kk..kk..',
    '.kHbk.kHbkkHbk',
    '.kbdk.kbdkkbdk',
    '..kk..kk..kk..',
    '..............']);
  S.cat.weight = parse([
    '.....kkkk.....',
    '....kHkkdk....',
    '....kbk.dk....',
    '...kkkkkkkk...',
    '..kHHHHbbbdk..',
    '..kHwHbbbbdk..',
    '.kHHbbbbbbddk.',
    '.kHbbkkkbbddk.',
    '.kHbbkkkbbddk.',
    'kHbbbbbbbbdddk',
    'kHbbbbbbbbdddk',
    'kbdddddddddrrk',
    '.kkkkkkkkkkkk.',
    '..............']);
  S.cat.dice = parse([
    '..............',
    '.kkkkkk.......',
    'kwwwwwpk......',
    'kwDwwwpk......',
    'kwwDwwpkkkkk..',
    'kwwwDkkwwwwpk.',
    'kppppkwDwwDpk.',
    '.kkkkkwwwwwpk.',
    '.....kwDwwDpk.',
    '.....kwwwwwck.',
    '.....kpppppck.',
    '......kkkkkk..',
    '..............',
    '..............']);
  // 메달 (업적) 12x14
  S.medal = parse([
    '..kRk..kRk..',
    '..kRDkkDRk..',
    '...kRDDRk...',
    '....kkkk....',
    '...kHHbbk...',
    '..kHwHbbdk..',
    '.kHHbbbbddk.',
    '.kHbbkkbddk.',
    '.kHbbkkbddk.',
    '.kbbbbbbddk.',
    '..kbbbbddk..',
    '...kddddk...',
    '....kkkk....',
    '............']);
  S.medalOff = parse([
    '..kmk..kmk..',
    '..kmKkkKmk..',
    '...kmKKmk...',
    '....kkkk....',
    '...kKKKKk...',
    '..kKmKKKKk..',
    '.kKKKKKKKKk.',
    '.kKKKkkKKKk.',
    '.kKKKkkKKKk.',
    '.kKKKKKKKKk.',
    '..kKKKKKKk..',
    '...kKKKKk...',
    '....kkkk....',
    '............']);
  // 연구 별 (7x7): 산 것, 살 수 있음, 잠김
  S.starOn = parse(['...w...', '...H...', '.wHwHw.', 'wHwwwHw', '.wHwHw.', '...H...', '...w...']);
  S.starAvail = parse(['...b...', '..kbk..', '.kbHbk.', 'bbHwHbb', '.kbHbk.', '..kbk..', '...b...']);
  S.starOff = parse(['.......', '...m...', '..mKm..', '.mKKKm.', '..mKm..', '...m...', '.......']);
  S.sresOn = parse(['...t...', '..ttt..', '.tt4tt.', 'tt444tt', '.tt4tt.', '..ttt..', '...t...'].map(function (r) { return r.replace(/4/g, 'w'); }));
  S.sresAvail = parse(['...T...', '..kTk..', '.kTtTk.', 'TTtwtTT', '.kTtTk.', '..kTk..', '...T...']);
  // 상단 바 아이콘 11x11
  S.icGear11 = parse([
    '....k.k....',
    '..kkgkgkk..',
    '.kgggggggk.',
    '.kggmmmggk.',
    'kggmkkkmggk',
    '.gmk...kmg.',
    'kggmkkkmggk',
    '.kggmmmggk.',
    '.kgggggggk.',
    '..kkgkgkk..',
    '....k.k....']);
  S.icSnd11 = parse([
    '.....k.....',
    '....kgk..g.',
    'kkkkgmk.g..',
    'kgggmmk..g.',
    'kgmmmmk...g',
    'kgmmmmk..g.',
    'kgggmmk.g..',
    'kkkkgmk..g.',
    '....kgk....',
    '.....k.....',
    '...........']);
  S.icMute11 = parse([
    '.....k.....',
    '....kgk....',
    'kkkkgmk....',
    'kgggmmk.m.m',
    'kgmmmmk..m.',
    'kgmmmmk.m.m',
    'kgggmmk....',
    'kkkkgmk....',
    '....kgk....',
    '.....k.....',
    '...........']);


  // ── 손으로 찍은 로고 글자 14x14 (굵기 2px) ─────────
  var LOGO = {
    '주': ['.############.', '.############.', '......##......', '.....####.....', '...###..###...', '.###......###.', '..............', '##############', '##############', '......##......', '......##......', '......##......', '......##......', '..............'],
    '사': ['...##.....##..', '...##.....##..', '...##.....##..', '..####....##..', '..####....##..', '.##..##...####', '.##..##...####', '##....##..##..', '##....##..##..', '#......##.##..', '.......##.##..', '..........##..', '..........##..', '..............'],
    '위': ['..######...##.', '.##....##..##.', '.##....##..##.', '..######...##.', '...........##.', '#########..##.', '#########..##.', '....##.....##.', '....##.....##.', '....##.....##.', '....##.....##.', '...........##.', '...........##.', '..............'],
    '성': ['..##.......##.', '..##.......##.', '.####......##.', '.####...#####.', '##..##..#####.', '##..##.....##.', '#....##....##.', '......#....##.', '..............', '...########...', '..##......##..', '..##......##..', '...########...', '..............'],
    '계': ['#######..##.##', '#######..##.##', '.....##..##.##', '.....##.###.##', '.....##.###.##', '....##...##.##', '....##...##.##', '...##...###.##', '..##....###.##', '.##......##.##', '##.......##.##', '.........##.##', '.........##.##', '..............']
  };
  FONTDATA.logo = { asc: 14, g: {} };
  Object.keys(LOGO).forEach(function (ch) {
    var hex = LOGO[ch].map(function (r) { var v = 0; for (var i = 0; i < 16; i++) v = v * 2 + (r[i] === '#' ? 1 : 0); return ('0000' + v.toString(16)).slice(-4); }).join('');
    FONTDATA.logo.g[ch.charCodeAt(0)] = [16, 14, 14, 0, 0, hex, 4];
  });
  FONTDATA.logo.g[32] = [8, 1, 1, 0, 0, '0000', 4];

  // ── 9-slice 프레임 ─────────────────────────────
  // 놋쇠 판(두꺼운 테두리 6px). 모서리 금속 리벳은 직접 찍음.
  function bevelFrame(size, outer, layersTL, layersBR, fill, rivets) {
    var n = size * 2 + 4, s = G.gfx.makeSprite(n, n);
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var lt = Math.min(x, y), rb = Math.min(n - 1 - x, n - 1 - y);
      var c;
      var dL = x, dT = y, dR = n - 1 - x, dB = n - 1 - y;
      var m = Math.min(dL, dT, dR, dB);
      if (m >= size) { c = fill; }
      else {
        // 왼쪽 위 vs 오른쪽 아래: 대각선에서는 왼쪽 위가 바깥쪽 절반을 가짐
        var tl = Math.min(dL, dT), br = Math.min(dR, dB);
        if (tl < br || (tl === br && x + y < n - 1)) c = layersTL[tl];
        else c = layersBR[br];
        if (m === 0) c = outer;
      }
      s.d[y * n + x] = c;
    }
    // 바깥 모서리 깎기
    [[0, 0], [n - 1, 0], [0, n - 1], [n - 1, n - 1]].forEach(function (p) { s.d[p[1] * n + p[0]] = 255; });
    if (rivets) {
      var R = rivets;
      [[2, 2], [n - 4, 2], [2, n - 4], [n - 4, n - 4]].forEach(function (p) {
        s.d[p[1] * n + p[0]] = R[0]; s.d[p[1] * n + p[0] + 1] = R[1];
        s.d[(p[1] + 1) * n + p[0]] = R[1]; s.d[(p[1] + 1) * n + p[0] + 1] = R[2];
      });
    }
    s.cut = size + 1;
    return s;
  }
  // 바깥 -> 안쪽 순서
  S.panel = bevelFrame(5, 12, [12, 3, 2, 2, 11, 18], [12, 11, 2, 2, 2, 18], 13, [4, 3, 11]);
  S.panelThin = bevelFrame(3, 12, [12, 3, 2, 18], [12, 11, 2, 18], 13, null);
  S.inset = bevelFrame(2, 18, [18, 12, 21], [18, 11, 21], 21, null);
  S.insetDark = bevelFrame(2, 13, [13, 12, 23], [13, 18, 23], 23, null);
  S.paper = bevelFrame(2, 12, [12, 4, 4], [12, 9, 8], 4, null);
  S.btn = bevelFrame(2, 12, [12, 3, 2], [12, 18, 11], 2, null);
  S.btnHover = bevelFrame(2, 12, [12, 4, 3], [12, 11, 2], 3, null);
  S.btnDown = bevelFrame(2, 12, [12, 11, 11], [12, 2, 11], 11, null);
  S.btnOff = bevelFrame(2, 12, [12, 11, 13], [12, 18, 13], 13, null);
  S.tile = bevelFrame(1, 18, [18, 21], [18, 13], 21, null);
  S.tileHot = bevelFrame(1, 3, [3, 21], [3, 13], 21, null);
  S.tileOwn = bevelFrame(1, 11, [11, 2], [11, 18], 13, null);
  S.btnCore = bevelFrame(2, 12, [12, 8, 7], [12, 10, 5], 7, null);
  S.btnCoreHover = bevelFrame(2, 12, [12, 4, 8], [12, 5, 8], 8, null);
  S.btnTeal = bevelFrame(2, 12, [12, 19, 16], [12, 6, 16], 16, null);

  // 9-slice 그리기 (가운데 채움 색이 13이면 가죽 결 무늬를 얹음)
  function nine(s, x, y, w, h) {
    var c = s.cut, n = s.w, gx = G.gfx;
    var mid = n - 2 * c;
    for (var j = 0; j < h; j++) {
      var sy = j < c ? j : (j >= h - c ? n - (h - j) : c + ((j - c) % mid));
      for (var i = 0; i < w; i++) {
        var sx = i < c ? i : (i >= w - c ? n - (w - i) : c + ((i - c) % mid));
        var v = s.d[sy * n + sx];
        if (v !== 255) gx.pset(x + i, y + j, v);
      }
    }
  }

  // 새겨진 큰 글자: 원본 글자 비트 하나를 k×k 블록으로, 블록 안에 1px 베벨을 찍는다.
  function embossText(str, x, y, k, ramp, font, outline) {
    font = font || 'g11b';
    var gx = G.gfx;
    var asc = FONTDATA[font].asc, px = x;
    str = String(str);
    // 1) 비트맵 합성
    var cells = [];
    for (var i = 0; i < str.length; i++) {
      var g = G.font.glyph(font, str.charCodeAt(i));
      if (!g) { px += 6 * k; continue; }
      var top = asc - (g.h + g.yo);
      for (var r = 0; r < g.h; r++) for (var c = 0; c < g.w; c++) if (g.bits[r * g.w + c]) cells.push([(px - x) / k + g.xo + c, top + r]);
      px += g.dw * k;
    }
    var set = {};
    cells.forEach(function (p) { set[p[0] + ',' + p[1]] = 1; });
    function has(a, b) { return !!set[a + ',' + b]; }
    // 2) 외곽선(1px)
    if (outline !== undefined) {
      cells.forEach(function (p) {
        for (var yy = -1; yy <= k; yy++) for (var xx = -1; xx <= k; xx++) gx.pset(x + p[0] * k + xx, y + p[1] * k + yy + 1, outline);
      });
    }
    // 3) 블록 베벨
    cells.forEach(function (p) {
      var bx = x + p[0] * k, by = y + p[1] * k;
      var up = has(p[0], p[1] - 1), dn = has(p[0], p[1] + 1), lf = has(p[0] - 1, p[1]), rt = has(p[0] + 1, p[1]);
      for (var yy = 0; yy < k; yy++) for (var xx = 0; xx < k; xx++) {
        var c = ramp[1];
        if ((yy === 0 && !up) || (xx === 0 && !lf)) c = ramp[0];
        if ((yy === k - 1 && !dn) || (xx === k - 1 && !rt)) c = ramp[2];
        if (yy === k - 1 && !dn && xx === 0 && !lf) c = ramp[1];
        gx.pset(bx + xx, by + yy, c);
      }
    });
    return px - x;
  }
  function embossMeasure(str, k, font) { return G.font.measure(str, font || 'g11b') * k; }

  S.parse = parse;
  G.spr = S;
  G.nine = nine;
  G.embossText = embossText;
  G.embossMeasure = embossMeasure;
})();

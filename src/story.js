// 관측소 사람들의 일지 한 줄. 진행 이정표마다 한 번씩. [id, 화자, 조건, 한국어, 영어]
// 화자: kwan 한 관장(~지요), do 정비공 도담(~요·~거든요), seo 기록원 서하(~네요·~어요!)
(function () {
  var C = function () { return G.core; };
  function up(s) { return Object.keys(s.up).length; }
  function chalAny(s) { return G.CHALLENGES.some(function (c) { return C().chalUnlocked(s, c); }); }
  function chalDone(s) { return G.CHALLENGES.some(function (c) { return C().chalStage(s, c.id) >= 1; }); }
  function hasRar(s, r) { return G.SPDICE.some(function (x) { return x.rar >= r && s.coll[x.id]; }); }
  var L = [
    ['hello', 'kwan', function (s) { return s.stats.rolls >= 1; }, '오셨네요. 이 오러리를 다시 돌려 볼 야간 관측원이 꼭 필요했지요.', 'You came. We needed a night observer to get this orrery turning again.'],
    ['rule', 'do', function (s) { return s.stats.rolls >= 6; }, '레버를 당기면 주사위가 굴러요. 나온 합이 곧 궤도 번호거든요.', 'Pull the lever and the dice roll. The sum is the orbit number.'],
    ['t2', 'seo', function (s) { return s.stats.bestTier >= 2; }, '미행성이 생겼어요! 도감 첫 장에 사진 붙여 둘게요.', 'A planetesimal! I am taping its photo to the first catalog page.'],
    ['pow', 'do', function (s) { return s.lv.power >= 4; }, '굴림 질량 손잡이에 기름칠해 뒀어요. 한 번에 더 많이 붙을 거예요.', 'I oiled the roll mass handle. Each roll should stick more now.'],
    ['wind', 'do', function (s) { return s.lv.wind >= 1; }, '태엽 감아 놨어요. 이제 손 안 대도 혼자 굴러요. 저는 야식 먹으러 갈게요.', 'The roller is wound. It rolls on its own now. I am off for a late snack.'],
    ['con', 'seo', function (s) { return !!s.con.cur || (s.stats.cons || 0) > 0; }, '관측 의뢰가 들어왔어요. 시간 안에 끝내면 창고에서 주사위 상자를 꺼내 드려요.', 'A request came in. Finish it in time and I will fetch a dice box from storage.'],
    ['box', 'do', function (s) { return (s.stats.boxes || 0) >= 1; }, '창고에 굴러다니던 특수 주사위예요. 쟁반 칸에 끼우면 성질이 붙어요.', 'A special die from storage. Put it in a tray slot and its trait kicks in.'],
    ['t4', 'seo', function (s) { return s.stats.bestTier >= 4; }, '바다 행성이에요! 논문 표지로 쓰고 싶네요.', 'An ocean world! I want it on the cover of my thesis.'],
    ['d3', 'kwan', function (s) { return s.dice.length >= 3; }, '주사위가 셋이면 궤도가 열여섯 개지요. 옛날에는 이걸 손으로 다 셌어요.', 'Three dice make sixteen orbits. We used to count them all by hand.'],
    ['dex5', 'seo', function (s) { return C().dexCount(s) >= 5; }, '도감이 다섯 칸 찼어요. 칸이 찰수록 지원금도 늘어요.', 'Five catalog entries. Every new page brings in a little more funding.'],
    ['up5', 'do', function (s) { return up(s) >= 5; }, '부품 다섯 개 끼웠어요. 렌치가 하나 더 있으면 좋겠네요.', 'Five parts fitted. I could use another wrench.'],
    ['ev', 'seo', function (s) { return s.stats.events >= 1; }, '방금 지나간 거 보셨어요? 눌러서 잡으면 한동안 성계가 빨라져요.', 'Did you see that pass by? Catch one and the system speeds up for a while.'],
    ['t6', 'kwan', function (s) { return s.stats.bestTier >= 6; }, '가스 거성이군요. 이사회에 보낼 사진으로 딱 좋겠네요.', 'A gas giant. That photo will do nicely for the board.'],
    ['al', 'do', function (s) { return s.stats.aligns >= 1; }, '주사위 눈이 다 같으면 정렬이에요. 그때는 질량이 몇 배로 붙거든요.', 'When every die shows the same face, that is an alignment. The mass multiplies.'],
    ['fate', 'do', function (s) { return s.fate.n >= 1 || (s.stats.fates || 0) > 0; }, '왼쪽 칸에 보석이 찼어요. 누르면 운명 굴림이에요. 크게 한 번 붙어요.', 'A gem filled the left slot. Click it for a fate roll. One big hit.'],
    ['t7', 'seo', function (s) { return s.stats.bestTier >= 7; }, '갈색 왜성이에요. 별이 되기 직전이라 살짝 따뜻해요.', 'A brown dwarf. It is almost a star, so it is a little warm.'],
    ['d4n', 'kwan', function (s) { return s.dice.length >= 4; }, '쟁반이 꽤 무거워졌지요. 받침대를 하나 더 대야겠네요.', 'The tray has grown heavy. We should add another brace.'],
    ['con5', 'kwan', function (s) { return (s.stats.cons || 0) >= 5; }, '의뢰를 다섯 건 끝냈으니 이번 달 보고서는 걱정 없겠네요.', 'Five requests done. This month\'s report writes itself.'],
    ['t8', 'kwan', function (s) { return s.stats.bestTier >= 8; }, '두 번째 해가 떴네요. 초신성을 일으키면 성계는 사라져도 별핵이 남지요.', 'A second sun. A supernova clears the system, but the cores remain.'],
    ['nova', 'seo', function (s) { return s.novas >= 1; }, '터졌어요! 별핵 사진 찍었어요. 이걸로 연구를 할 수 있어요.', 'It blew! I got a photo of the cores. They pay for research.'],
    ['res', 'do', function (s) { return Object.keys(s.research).length >= 1; }, '연구한 건 초신성 뒤에도 남아요. 기계에 새겨 두는 거라서요.', 'Research stays after a supernova. It is carved into the machine.'],
    ['epic', 'do', function (s) { return hasRar(s, 2); }, '이건 귀한 주사위네요. 창고 맨 안쪽 상자에 있던 거예요.', 'That one is rare. It was in the box at the very back of storage.'],
    ['nova3', 'kwan', function (s) { return s.novas >= 3; }, '세 번째 폭발이네요. 천문대 이름이 지역 신문에 났어요.', 'Third blast. The observatory made the local paper.'],
    ['chal', 'seo', function (s) { return chalAny(s); }, '관측 과제가 열렸어요. 조건이 붙은 판이라 어렵지만 영구 보상이 있어요.', 'Trials are open. Each run has a rule, but the rewards are permanent.'],
    ['chal1', 'kwan', function (s) { return chalDone(s); }, '과제 첫 단계를 끝냈지요. 일지에 굵게 적어 두겠어요.', 'First trial stage done. I will write it in bold in the journal.'],
    ['dex15', 'seo', function (s) { return C().dexCount(s) >= 15; }, '도감 절반이에요! 커피 한 잔 살게요.', 'Half the catalog! Coffee is on me.'],
    ['t9', 'seo', function (s) { return s.stats.bestTier >= 9; }, '백색 왜성이에요. 작은데 엄청 무거워요.', 'A white dwarf. Tiny, and terribly heavy.'],
    ['t10', 'do', function (s) { return s.stats.bestTier >= 10; }, '중성자별이 생겼어요. 기계가 덜덜 떨리는데 이게 맞는 거죠?', 'A neutron star. The whole machine is shaking. That is normal, right?'],
    ['col', 'kwan', function (s) { return s.collapses >= 1; }, '별핵은 사라졌어도 특이점이 남았지요. 우주가 무거워진 만큼 더 큰 걸 만들 수 있어요.', 'The cores are gone, but the singularity stays. A heavier universe builds bigger things.'],
    ['sres', 'do', function (s) { return Object.keys(s.sres).length >= 1; }, '특이점 연구를 하나 달았어요. 이건 붕괴해도 안 없어져요.', 'One singularity study fitted. That one survives collapses.'],
    ['sd8', 'do', function (s) { return !!s.shapes.d8; }, '주사위를 전부 팔면체로 바꿨어요. 궤도가 더 바깥까지 나가요.', 'Every die is eight-sided now. The orbits reach farther out.'],
    ['sd12', 'do', function (s) { return !!s.shapes.d12; }, '이번엔 전부 십이면체예요. 무거워서 한 번 굴릴 때 질량이 많이 붙어요.', 'All twelve-sided now. They are heavy, so each roll lands a lot of mass.'],
    ['legend', 'seo', function (s) { return hasRar(s, 3); }, '전설 주사위예요! 사진 백 장 찍어 둘게요.', 'A legendary die! I am taking a hundred photos.'],
    ['star5', 'do', function (s) { return Object.keys(s.coll).some(function (k) { return s.coll[k] >= 5; }); }, '같은 주사위를 다섯 번 받았네요. 별이 꽉 찼어요.', 'Five copies of the same die. Its stars are full.'],
    ['con50', 'kwan', function (s) { return (s.stats.cons || 0) >= 50; }, '의뢰 쉰 건을 끝냈지요. 이사회가 이제 폐관 이야기를 꺼내지 않더군요.', 'Fifty requests. The board has stopped talking about closing us.'],
    ['col3', 'seo', function (s) { return s.collapses >= 3; }, '세 번째 붕괴예요. 하늘 색이 또 바뀌었네요.', 'Third collapse. The sky changed color again.'],
    ['endr', 'kwan', function (s) { return C().endingReady(s); }, '과제를 모두 끝냈지요. 이제 천구 완성 장치를 달 수 있겠네요.', 'Every trial is done. We can fit the completion device now.'],
    ['dex30', 'seo', function (s) { return C().dexCount(s) >= 30; }, '도감 서른 칸을 다 채웠어요! 논문 제목은 제가 정할게요.', 'All thirty entries! I get to name the thesis.'],
    ['end', 'kwan', function (s) { return s.ended; }, '모든 궤도가 한 줄로 섰지요. 이 천문대는 문을 닫지 않을 거예요.', 'Every orbit stands in line. This observatory will stay open.'],
    ['after', 'do', function (s) { return s.endSeen; }, '기계는 계속 돌아가요. 저는 야식 먹고 올게요.', 'The machine keeps turning. I am getting a snack.']
  ];
  var COL = { kwan: 7, do: 19, seo: 3 };
  // 새로 맞은 줄 하나를 돌려준다 (한 번에 하나)
  function check(s) {
    if (!s.story) s.story = {};
    for (var i = 0; i < L.length; i++) {
      var l = L[i];
      if (s.story[l[0]]) continue;
      var ok = false; try { ok = l[2](s); } catch (e) { ok = false; }
      if (ok) { s.story[l[0]] = 1; return l; }
    }
    return null;
  }
  // 불러온 저장: 이미 지난 이정표는 조용히 일지에만 남긴다
  function prime(s) { if (!s.story) s.story = {}; L.forEach(function (l) { var ok = false; try { ok = l[2](s); } catch (e) { } if (ok) s.story[l[0]] = 1; }); }
  function seen(s) { return L.filter(function (l) { return s.story && s.story[l[0]]; }); }
  function text(l) { return G.getLang() === 'en' ? l[4] : l[3]; }
  function who(l) { return G.T('spk_' + l[1]); }
  G.story = { LINES: L, check: check, prime: prime, seen: seen, text: text, who: who, color: function (l) { return COL[l[1]]; } };
})();

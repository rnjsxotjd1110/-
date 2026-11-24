// 실제 화면을 눌러 보는 흐름 시험: 타이틀 → 새 게임 → 굴리기 → 구매 → 저장 → 다시 열기(오프라인 보상)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const S = 2;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 640 * S, height: 360 * S } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  const click = async (x, y) => { await page.mouse.click(x * S + 1, y * S + 1); await page.waitForTimeout(80); };
  const st = () => page.evaluate(() => { const s = G.app.s; return s ? { scene: G.app.scene, dust: s.dust, rolls: s.stats.rolls, power: s.lv.power, wind: s.lv.wind, bodies: Object.keys(s.bodies).length, tab: G.app.tab, overlay: G.app.overlay, muted: s.settings.muted } : { scene: G.app.scene }; });
  const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) process.exitCode = 1; };
  await page.goto(url); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForFunction(() => window.__ready);
  await page.waitForTimeout(300);
  // 빈 곳 클릭 → 새 게임
  await click(200, 300);
  await page.waitForTimeout(300);
  let s = await st();
  ok(s.scene === 'play', '빈 곳을 누르면 시작 (' + s.scene + ')');
  // 레버 10번
  for (let i = 0; i < 12; i++) { await click(376, 300); await page.waitForTimeout(450); }
  await page.waitForTimeout(1200);
  s = await st();
  ok(s.rolls >= 10, '레버로 굴림 ' + s.rolls + '번');
  ok(s.bodies >= 3, '천체 생김 ' + s.bodies + '개');
  // 스페이스
  const r0 = s.rolls;
  for (let i = 0; i < 5; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(450); }
  s = await st(); ok(s.rolls >= r0 + 4, '스페이스로 굴림');
  // 구매: 굴림 힘 버튼 (첫 판 왼쪽 위 버튼)
  await page.evaluate(() => { G.app.s.dust = 1000; });
  await click(474, 123);
  s = await st(); ok(s.power === 1, '굴림 힘 구매 Lv ' + s.power);
  await click(580, 123);
  s = await st(); ok(s.wind === 1, '태엽 구매 Lv ' + s.wind);
  // 부족할 때는 안 사짐
  await page.evaluate(() => { G.app.s.dust = 0; });
  await click(474, 123);
  s = await st(); ok(s.power === 1, '돈 없으면 구매 안 됨');
  // 소리 켜기 토글
  await click(605, 9); s = await st(); ok(s.muted === false, '소리 켜짐 토글');
  await click(605, 9); s = await st(); ok(s.muted === true, '소리 꺼짐 토글');
  // 설정 열고 닫기
  await click(626, 9); s = await st(); ok(s.overlay === 'settings', '설정 열림');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100); s = await st(); ok(s.overlay === null, 'Esc로 설정 닫힘');
  // 자동 진행 10초
  const d0 = (await st()).rolls; await page.waitForTimeout(3500); s = await st(); ok(s.rolls > d0, '태엽 자동 굴림 ' + (s.rolls - d0));
  // 주사위 상자: 보관함 탭에서 '상자 열기' 버튼을 눌러 연다
  await page.evaluate(() => { const s = G.app.s; s.box = 2; G.app.tab = 'dice'; G.app.overlay = null; });
  await page.waitForTimeout(150);
  await click(530, 245);
  await page.waitForTimeout(200);
  const bx = await page.evaluate(() => ({ ov: G.app.overlay, box: G.app.s.box, n: Object.keys(G.app.s.coll).length, eq: G.app.s.dice.filter(d => d.sp).length }));
  ok(bx.ov === 'box' && bx.box === 1 && bx.n === 1, '상자 열기 (남은 ' + bx.box + ', 보관함 ' + bx.n + ')');
  ok(bx.eq === 1, '새 주사위는 빈 칸에 자동으로 끼움');
  await page.waitForTimeout(1400);
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  ok(await page.evaluate(() => G.app.overlay === null), '상자 창 닫힘');
  // 모두 열기 + 연출 중에는 보관함에 결과가 미리 보이지 않음
  await page.evaluate(() => { const s = G.app.s; s.box = 5; G.app.tab = 'dice'; });
  await page.waitForTimeout(120);
  const before = await page.evaluate(() => JSON.stringify(G.app.s.coll));
  await click(595, 245); await page.waitForTimeout(250);
  const mid = await page.evaluate(() => ({ ov: G.app.overlay, box: G.app.s.box, hidden: JSON.stringify(G.app.boxPrev && G.app.boxPrev.coll), rev: G.app.boxRevealed, n: G.app.boxList && G.app.boxList.n }));
  ok(mid.ov === 'box' && mid.box === 0 && mid.n === 5 && mid.hidden === before && !mid.rev, '모두 열기 5개, 연출 중엔 열기 전 보관함 표시');
  await page.waitForTimeout(2600);
  ok(await page.evaluate(() => G.app.boxRevealed === true), '연출 뒤 결과 공개');
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  // 끼우기·빼기: 같은 주사위는 한 칸에만
  const eqt = await page.evaluate(() => { const s = G.app.s, C = G.core; const id = Object.keys(s.coll)[0]; C.equip(s, 1, id); const one = s.dice.filter(d => d.sp === id).length === 1 && s.dice[1].sp === id; C.equip(s, 1, null); return one && !s.dice[1].sp; });
  ok(eqt, '끼우기·빼기');
  // 특수 주사위 효과가 실제로 반영됨 (성운 주사위: 질량 ×1.5)
  const fx = await page.evaluate(() => { const s = G.app.s, C = G.core; s.dice.forEach(d => delete d.sp); C.invalidate(); const p0 = C.derive(s).power; s.coll.nebula = 1; C.equip(s, 0, 'nebula'); const p1 = C.derive(s).power; return Math.abs(p1 / p0 - 1.5) < 1e-6; });
  ok(fx, '성운 주사위 질량 ×1.5');
  // 관측 의뢰: 목표를 채우면 상자 +1
  const con = await page.evaluate(() => { const s = G.app.s, C = G.core; const b0 = s.box; s.con.cur = { type: 'dust', n: 10, base: s.dustAll, time: 100, left: 100 }; s.dustAll += 20; C.tick(s, 0.1, {}); return s.box === b0 + 1 && !s.con.cur; });
  ok(con, '의뢰 성공 → 상자 +1');
  // 천체 도감: 새 단계 천체가 생기면 기록
  const dex = await page.evaluate(() => { const s = G.app.s, C = G.core; const n0 = C.dexCount(s); s.manualCd = 0; for (let i = 0; i < 50; i++) { s.manualCd = 0; C.manualRoll(s); } return C.dexCount(s) >= Math.max(1, n0); });
  ok(dex, '천체 도감 기록');
  // 눈은 언제나 표준값 (옛 저장의 옮긴 눈은 되돌림)
  const std = await page.evaluate(() => { const raw = JSON.parse(JSON.stringify(G.app.s)); raw.dice[0].faces = [9, 9, 9, 0, 0, 0]; raw.moves = 4; const s2 = G.save.fromCode('DO1:' + btoa(unescape(encodeURIComponent(JSON.stringify(raw))))); return s2 && s2.dice[0].faces.slice().sort().join() === '1,2,3,4,5,6' && s2.moves === undefined; });
  ok(std, '옛 저장의 옮긴 눈을 표준값으로 되돌림');
  // 운명 굴림: 쟁반 왼쪽 칸 클릭
  await page.evaluate(() => { const s = G.app.s; s.fate.n = 1; G.app.tab = 'machine'; });
  await page.waitForTimeout(1200);
  const fr0 = await page.evaluate(() => G.app.s.stats.rolls);
  await click(22, 300);
  const fr = await page.evaluate(() => ({ n: G.app.s.fate.n, f: G.app.s.stats.fates || 0 }));
  ok(fr.n === 0 && fr.f === 1, '운명 굴림 (남은 ' + fr.n + ')');
  // 개량 쌍: 하나를 사면 다른 쪽은 못 삼
  const pr = await page.evaluate(() => { const s = G.app.s, C = G.core; s.dustRun = 1e5; s.dust = 1e5; const a = C.buyUpgrade(s, 'reson'); const b = C.buyUpgrade(s, 'net'); return a && !b && C.pairBlocked(s, G.UPGRADES.find(u => u.id === 'net')); });
  ok(pr, '개량 쌍: 이웃 궤도 공명기를 사면 이벤트 보상 그물은 막힘');
  // 관측 과제: 궤도 목표를 채우면 단계가 오름
  const ch = await page.evaluate(() => { const s = G.app.s, C = G.core; s.novas = 3; C.startChallenge(s, 'c1'); const g = C.chalGoal(s, 'c1'); g.forEach(q => { s.bodies[q[0]] = { m: 1e12, t: q[1], seed: 1, a0: 0 }; }); C.tick(s, 0.1, {}); const r = C.chalStage(s, 'c1') === 1 && !s.chal; s.novas = 0; return r; });
  ok(ch, '관측 과제 1단계 완료');
  // 과제 중에는 목표 궤도를 막는 주사위를 사지 않음 (자동 구매 포함)
  const cb = await page.evaluate(() => { const s = G.app.s, C = G.core; const keep = JSON.stringify(s); s.novas = 10; s.collapses = 1; s.chalDone = { c5: 4 }; s.chal = null; C.startChallenge(s, 'c5'); s.dust = 1e30; s.research.s5 = 1; C.tick(s, 0.1, {}); const r = s.dice.length === Math.min(3, C.chalMinOrbit(s)) && !C.buyDie(s); Object.assign(s, JSON.parse(keep)); C.invalidate(); return r; });
  ok(cb, '과제 목표 궤도 3: 주사위가 3개를 넘지 않음');
  // 관측 의뢰: 주사위가 늘어 목표 궤도가 안 나오면 의뢰를 바꿔 줌
  const sw = await page.evaluate(() => { const s = G.app.s, C = G.core; const keep = JSON.stringify(s); s.dice = [C.newDie(), C.newDie()]; s.lv.wind = Math.max(1, s.lv.wind); s.con.cur = { type: 'orbit', sum: 2, tier: 9, time: 300, left: 300, base: 0 }; s.dice.push(C.newDie()); C.invalidate(); C.tick(s, 0.1, {}); const r = !(s.con.cur && s.con.cur.type === 'orbit' && s.con.cur.sum === 2); Object.assign(s, JSON.parse(keep)); C.invalidate(); return r; });
  ok(sw, '안 나오는 궤도 의뢰는 새 의뢰로 바뀜');
  // 일지: 첫 굴림 뒤 관장의 첫 줄이 나옴
  ok(await page.evaluate(() => !!G.app.s.story.hello), '관측소 일지 첫 줄');
  // 저장 후 마지막 저장 시각을 2시간 전으로 바꿔 다시 열기
  await page.evaluate(() => { G.save.save(G.app.s); G.app.scene = 'title'; const raw = JSON.parse(localStorage.getItem(G.save.KEY)); raw.lastSave = Date.now() - 2 * 3600 * 1000; localStorage.setItem(G.save.KEY, JSON.stringify(raw)); });
  const dustBefore = await page.evaluate(() => JSON.parse(localStorage.getItem(G.save.KEY)).dust);
  await page.reload(); await page.waitForFunction(() => window.__ready); await page.waitForTimeout(300);
  await click(200, 300); await page.waitForTimeout(400);
  s = await st();
  ok(s.scene === 'play' && s.overlay === 'away', '이어하기 + 복귀 리포트 (' + s.overlay + ')');
  ok(s.dust > dustBefore, '오프라인 보상 별가루 ' + Math.round(dustBefore) + ' → ' + Math.round(s.dust));
  await page.screenshot({ path: '/tmp/claude-0/-home-user--/421f79ef-88cb-5289-a077-a3d2ce8a4eb9/scratchpad/pt_away.png' });
  await page.keyboard.press('Enter'); await page.waitForTimeout(100); s = await st(); ok(s.overlay === null, '받기로 닫힘');
  // 내보내기/가져오기 코드 왕복
  const rt = await page.evaluate(() => { const c = G.save.toCode(G.app.s); const s2 = G.save.fromCode(c); return !!s2 && Math.abs(s2.dust - G.app.s.dust) < 1e-6; });
  ok(rt, '저장 코드 왕복');
  const bad = await page.evaluate(() => G.save.fromCode('DO1:garbage') === null && G.save.fromCode('') === null && G.save.fromCode('DO1:' + btoa('{"dust":"x"}')) === null);
  ok(bad, '잘못된 저장 코드 거부');
  ok(errs.length === 0, '오류 없음 ' + errs.join(' | '));
  await browser.close();
})();

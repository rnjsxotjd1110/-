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
  // 눈 옮기기: 주사위 탭에서 면 두 번 클릭
  await page.evaluate(() => { const s = G.app.s; while (s.dice.length < 3) s.dice.push(G.core.newDie('d6')); s.moves = 3; G.core.invalidate(); G.app.tab = 'dice'; G.app.selFace = null; });
  await page.waitForTimeout(100);
  const f0 = await page.evaluate(() => G.app.s.dice[0].faces.slice());
  await click(446 + 2 * 15 + 6, 52 + 6); // 세 번째 칸(눈 3)
  await click(446 + 3 * 15 + 6, 52 + 6); // 네 번째 칸(눈 4)
  const mv = await page.evaluate(() => ({ faces: G.app.s.dice[0].faces.slice(), moves: G.app.s.moves }));
  const tot = (a) => a.reduce((x, y) => x + y, 0);
  ok(mv.moves === 2 && tot(mv.faces) === tot(f0) && JSON.stringify(mv.faces) !== JSON.stringify(f0), '눈 옮기기 ' + JSON.stringify(f0) + ' → ' + JSON.stringify(mv.faces));
  // 빈 면 만들기 + 가득 찬 면에는 못 넣음
  const lim = await page.evaluate(() => { const s = G.app.s, C = G.core; s.dice[0].faces = [1, 6, 2, 6, 3, 3]; s.moves = 5; C.invalidate(); const a = C.movePip(s, 0, 0, 2); const b = C.movePip(s, 0, 2, 1); return a && !b && s.dice[0].faces[0] === 0; });
  ok(lim, '빈 면 허용, 6을 넘게는 못 넣음');
  // 운명 굴림: 쟁반 왼쪽 칸 클릭
  await page.evaluate(() => { const s = G.app.s; s.fate.n = 1; G.app.tab = 'machine'; });
  await page.waitForTimeout(1200);
  const fr0 = await page.evaluate(() => G.app.s.stats.rolls);
  await click(22, 300);
  const fr = await page.evaluate(() => ({ n: G.app.s.fate.n, f: G.app.s.stats.fates || 0 }));
  ok(fr.n === 0 && fr.f === 1, '운명 굴림 (남은 ' + fr.n + ')');
  // 개량 쌍: 하나를 사면 다른 쪽은 못 삼
  const pr = await page.evaluate(() => { const s = G.app.s, C = G.core; s.dustRun = 1e5; s.dust = 1e5; const a = C.buyUpgrade(s, 'reson'); const b = C.buyUpgrade(s, 'net'); return a && !b && C.pairBlocked(s, G.UPGRADES.find(u => u.id === 'net')); });
  ok(pr, '개량 쌍: 공명 궤도를 사면 혜성 그물은 막힘');
  // 관측 과제: 궤도 목표를 채우면 단계가 오름
  const ch = await page.evaluate(() => { const s = G.app.s, C = G.core; s.novas = 3; C.startChallenge(s, 'c1'); const g = C.chalGoal(s, 'c1'); g.forEach(q => { s.bodies[q[0]] = { m: 1e12, t: q[1], seed: 1, a0: 0 }; }); C.tick(s, 0.1, {}); const r = C.chalStage(s, 'c1') === 1 && !s.chal; s.novas = 0; return r; });
  ok(ch, '관측 과제 1단계 완료');
  // 옛 저장(새긴 눈): 총합을 표준으로 맞춤
  const mig = await page.evaluate(() => { const raw = JSON.parse(G.save.toCode(G.app.s).slice(4) ? decodeURIComponent(escape(atob(G.save.toCode(G.app.s).slice(4)))) : '{}'); raw.dice[0].faces = [9, 9, 9, 6, 6, 6]; raw.chalDone = { c1: 1 }; const s2 = G.save.fromCode('DO1:' + btoa(unescape(encodeURIComponent(JSON.stringify(raw))))); return s2 && s2.dice[0].faces.reduce((a, b) => a + b, 0) === 21 && s2.chalDone.c1 === 1; });
  ok(mig, '옛 저장의 새긴 주사위를 총합 21로 고침');
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

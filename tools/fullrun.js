// 실제 브라우저에서 처음부터 엔딩까지 통과 확인 (시간 배속 + 화면 안 자동 조작)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const url = 'file://' + path.resolve(__dirname, '..', 'index.html');
  await page.goto(url); await page.waitForFunction(() => window.__ready);
  await page.evaluate(() => localStorage.clear());
  await page.goto(url + '?speed=' + (process.argv[2] || 300)); await page.waitForFunction(() => window.__ready);
  await page.mouse.click(400, 600); // 빈 곳 → 새 게임
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const A = G.app, C = G.core;
    window.__log = [];
    setInterval(() => {
      const s = A.s; if (!s || A.scene !== 'play' || A.cut || A.overlay) { if (A.overlay === 'away') A.overlay = null; return; }
      if (s.ev.cur) C.catchEvent(s);
      if (C.derive(s).interval === 0) { s.manualCd = 0; A.doManualRoll(); }
      let g = 0;
      while (g++ < 40) {
        const ups = G.UPGRADES.filter(u => !s.up[u.id] && C.upgradeVisible(s, u) && s.dust >= u.cost);
        if (ups.length) { C.buyUpgrade(s, ups[0].id); continue; }
        if (s.dust >= C.costDie(s)) { C.buyDie(s); continue; }
        if (C.forgeUnlocked(s) && s.dust >= C.costForge(s) * 3) { // 가장 큰 합을 노리는 단순 새기기
          let best = null; s.dice.forEach((d, di) => d.faces.forEach((v, fi) => { if (v < C.maxFace(s) && (!best || v < best.v)) best = { di, fi, v }; }));
          if (best && C.forge(s, best.di, best.fi, 1)) continue;
        }
        const cw = C.costWind(s), cp = C.costPower(s);
        if (s.dust >= cw && cw <= cp * 1.5 && (C.derive(s).interval === 0 || C.derive(s).interval > 0.06)) { C.buyWind(s); continue; }
        if (s.dust >= cp) { C.buyPower(s); continue; }
        break;
      }
      G.RESEARCH.filter(r => C.researchAvail(s, r) && s.cores >= r.cost).slice(0, 1).forEach(r => C.buyResearch(s, r.id));
      G.SRESEARCH.filter(r => C.sresAvail(s, r) && s.sing >= r.cost && (r.eff !== 'ending' || Object.keys(s.chalDone).length >= 6)).slice(0, 1).forEach(r => C.buySres(s, r.id));
      if (Object.keys(s.shapes).length > 1 && s.shapes.d12 && s.dice[0].shape !== 'd12') { C.setShape(s, 0, 'd12'); }
      const runT = s.t - s.stats.runStart;
      if (C.canCollapse(s) && (C.collapseGain(s) >= Math.max(1, s.singAll * 0.4) || runT > 5400)) { window.__log.push('collapse ' + (s.t / 3600).toFixed(2)); A.startCollapse(); return; }
      if (C.canNova(s) && !C.canCollapse(s) && (C.novaGain(s) >= Math.max(1, s.coresLayer * 0.35) || runT > 2400)) {
        window.__log.push('nova ' + (s.t / 3600).toFixed(2));
        A.startNova();
        setTimeout(() => { const nc = G.CHALLENGES.find(c => !s.chalDone[c.id] && C.chalUnlocked(s, c)); if (nc && s.novas >= 5 && s.novas % 2 === 0 && !s.chal) C.startChallenge(s, nc.id); }, 4000);
        return;
      }
      if (s.chal && runT > 5400) C.quitChallenge(s);
    }, 50);
  });
  const t0 = Date.now();
  let last = '';
  while (Date.now() - t0 < 25 * 60 * 1000) {
    await page.waitForTimeout(5000);
    const st = await page.evaluate(() => ({ scene: G.app.scene, t: G.app.s && G.app.s.t, novas: G.app.s && G.app.s.novas, col: G.app.s && G.app.s.collapses, chal: G.app.s && Object.keys(G.app.s.chalDone).length, sing: G.app.s && G.app.s.sing, ended: G.app.s && G.app.s.ended }));
    const line = `${((Date.now() - t0) / 1000).toFixed(0)}s game ${(st.t / 3600).toFixed(2)}h novas ${st.novas} col ${st.col} chal ${st.chal} sing ${Math.floor(st.sing)} scene ${st.scene}`;
    if (line !== last) console.log(line); last = line;
    if (st.scene === 'ending') {
      await page.evaluate(() => { window.__timeScale = 1; });
      await page.waitForTimeout(16000);
      await page.screenshot({ path: process.argv[3] || '/tmp/ending.png' });
      await page.mouse.click(2 * 485 + 1, 2 * 284 + 1); await page.waitForTimeout(500);
      const sc = await page.evaluate(() => G.app.scene);
      console.log('엔딩 도달, 계속하기 후 장면:', sc);
      break;
    }
  }
  console.log('errors', errs.length, errs.slice(0, 5).join(' | '));
  await browser.close();
})();

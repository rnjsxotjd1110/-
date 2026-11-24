// 사용: node tools/perf.js "<query>" [초] [CPU 감속배수] — 실제 크롬에서 프레임당 스크립트 시간·메모리 측정
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const q = process.argv[2] || ''; const secs = +(process.argv[3] || 6); const thr = +(process.argv[4] || 1);
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => console.log('pageerror:', e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'index.html') + q);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const cdp = await page.context().newCDPSession(page);
  if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
  await cdp.send('Performance.enable');
  const g = (m, n) => (m.metrics.find(x => x.name === n) || {}).value || 0;
  const m0 = await cdp.send('Performance.getMetrics');
  const r = await page.evaluate(async (secs) => {
    let n = 0; const st = performance.now();
    await new Promise(res => { function f(t) { n++; if (t - st < secs * 1000) requestAnimationFrame(f); else res(); } requestAnimationFrame(f); });
    return { frames: n, fps: (n / ((performance.now() - st) / 1000)).toFixed(1), heapMB: (performance.memory.usedJSHeapSize / 1e6).toFixed(1) };
  }, secs);
  const m1 = await cdp.send('Performance.getMetrics');
  const ms = (g(m1, 'ScriptDuration') - g(m0, 'ScriptDuration')) * 1000 / r.frames;
  console.log((q || '(title)').padEnd(14), 'x' + thr, 'fps', r.fps, 'script/frame', ms.toFixed(2) + 'ms', 'heap', r.heapMB + 'MB');
  await browser.close();
})();

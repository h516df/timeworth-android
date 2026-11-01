/* Real Chromium checks for the isolated TimeWorth 2.0 preview. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const target = path.resolve(root, '.' + pathname);
  if (!target.startsWith(root + path.sep)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(target, (error, content) => {
    if (error) { response.writeHead(404).end(); return; }
    response.writeHead(200, { 'Content-Type': (mime[path.extname(target)] || 'application/octet-stream') + '; charset=utf-8' });
    response.end(content);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const artifacts = process.env.ARTIFACT_DIR || path.join(os.tmpdir(), 'timeworth2-browser');
  fs.mkdirSync(artifacts, { recursive: true });
  let browser;
  const errors = [];
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
    const page = await browser.newPage({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    page.setDefaultTimeout(10000);
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/timeworth2.html');
    await page.waitForFunction(() => !!window.__timeworth2);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => !!window.__timeworth2);

    assert.deepEqual(await page.locator('#tab-bar .tab').allTextContents(), ['首页', '算一算', '未来']);
    assert.match(await page.locator('#app-content').innerText(), /估算可安排金额/);
    assert.match(await page.locator('#app-content').innerText(), /非账户余额/);
    assert.doesNotMatch(await page.locator('#app-content').innerText(), /最近的日常|消费流水/);
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-home-360.png') });

    await page.locator('#tab-bar [data-tab="ledger"]').click();
    await page.locator('#tw2-calc-price').fill('1200');
    assert.match(await page.locator('#tw2-calc-result').innerText(), /需要工作/);
    await page.locator('[data-tw2-mode="installment"]').click();
    await page.locator('#tw2-payment').fill('220');
    assert.match(await page.locator('#tw2-calc-result').innerText(), /1,320.00/);
    assert.match(await page.locator('#app-content').innerText(), /默认不保存/);
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-calculator-360.png') });

    const beforeComparisons = await page.evaluate(() => JSON.stringify(TW.state));
    await page.locator('[data-action="tw2-scenario"]').click();
    assert.match(await page.locator('#sheet').innerText(), /比较一种选择/);
    await page.locator('[data-tw2-scenario="income"]').fill('800');
    await page.locator('[data-tw2-scenario="cost"]').fill('200');
    await page.locator('[data-tw2-scenario="hours"]').fill('10');
    assert.match(await page.locator('#tw2-scenario-result').innerText(), /合计对比参考/);
    assert.doesNotMatch(await page.locator('#tw2-scenario-result').innerText(), /无法完整估算/);
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-scenario-360.png') });
    await page.locator('#sheet [data-action="close"]').click();
    assert.equal(await page.evaluate(() => JSON.stringify(TW.state)), beforeComparisons, 'Scenarios stay transient');

    await page.locator('#tab-bar [data-tab="plan"]').click();
    assert.match(await page.locator('#app-content').innerText(), /还款时间线/);
    await page.locator('[data-tw2-step="1"]').click();
    assert.match(await page.locator('#app-content').innerText(), /目标/);

    await page.locator('[data-action="tw2-ocr"]').click();
    assert.match(await page.locator('#sheet').innerText(), /截图识别确认/);
    const initialDebts = await page.evaluate(() => TW.state.debts.length);
    const initialTransactions = await page.evaluate(() => JSON.stringify(TW.state.transactions));
    await page.evaluate(() => window.__timeworth2OcrReceive({ status: 'done', images: [
      { source: '截图 1', text: `花呗\n${M.month()}-25\n本期应还 ¥620.50` },
      { source: '截图 2', error: '图片读取失败' }
    ] }));
    assert.match(await page.locator('#sheet').innerText(), /图片读取失败/);
    assert.equal(await page.locator('[data-tw2-ocr-field="amount"]').inputValue(), '620.5');
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-ocr-review-360.png') });
    await page.locator('#sheet [data-action="tw2-ocr-save"]').click();
    assert.match(await page.locator('#sheet').innerText(), /新增 1 条/);
    assert.equal(await page.evaluate(() => TW.state.debts.length), initialDebts + 1);
    assert.equal(await page.evaluate(() => JSON.stringify(TW.state.transactions)), initialTransactions);
    await page.locator('#sheet [data-action="tw2-ocr-undo"]').click();
    assert.equal(await page.evaluate(() => TW.state.debts.length), initialDebts, 'Undo restores repayments');

    await page.locator('[data-action="tw2-ocr"]').click();
    await page.locator('#sheet [data-action="tw2-ocr-add"]').click();
    assert.match(await page.locator('#sheet').innerText(), /手动补充/);
    await page.locator('#sheet [data-action="tw2-ocr-save"]').click();
    assert.match(await page.locator('#toast').innerText(), /日期/);
    assert.equal(await page.evaluate(() => TW.state.debts.length), initialDebts, 'Invalid date does not save');
    await page.locator('#sheet [data-action="close"]').click();

    await page.locator('[data-action="tw2-settings"]').click();
    assert.match(await page.locator('#sheet').innerText(), /旧账本历史/);
    assert.match(await page.locator('#sheet').innerText(), /恢复旧版备份/);
    await page.locator('#sheet [data-action="close"]').click();

    const entry = await browser.newPage({ viewport: { width: 360, height: 780 } });
    await entry.goto('http://127.0.0.1:' + server.address().port + '/index.html');
    await entry.waitForFunction(() => !!window.__timeworth2);
    assert.deepEqual(await entry.locator('#tab-bar .tab').allTextContents(), ['首页', '算一算', '未来'], 'Android default entry loads 2.0');
    await entry.close();

    await page.evaluate(() => { TW.state.dark = true; render(false); });
    assert.equal(await page.evaluate(() => document.body.classList.contains('dark')), true);
    const navStyle = await page.evaluate(() => {
      const bar = document.querySelector('#tab-bar'), style = getComputedStyle(bar);
      const indicator = getComputedStyle(bar, '::before');
      return { background: style.backgroundColor, width: bar.clientWidth, indicator: parseFloat(indicator.width) };
    });
    assert.equal(navStyle.background, 'rgb(27, 29, 35)', 'Dark mode keeps the navigation bar dark');
    assert.ok(Math.abs(navStyle.indicator - (navStyle.width - 12) / 3) <= 2, 'Active indicator spans exactly one of three destinations');
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-future-dark-360.png') });
    await page.setViewportSize({ width: 320, height: 680 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '20px'; render(false); });
    const bounds = await page.evaluate(() => ({
      viewport: window.innerWidth,
      shell: document.querySelector('#app-shell').getBoundingClientRect().width,
      document: document.documentElement.scrollWidth
    }));
    assert.ok(bounds.document <= bounds.viewport + 1, '320px viewport should not horizontally scroll: ' + JSON.stringify(bounds));
    await page.screenshot({ path: path.join(artifacts, 'timeworth2-future-dark-320-large-text.png') });
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    console.log('TimeWorth 2.0 Chromium checks passed (360px / 320px, calculator, settings, future, dark, large text).');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

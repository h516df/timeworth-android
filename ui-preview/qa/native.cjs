const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const product = path.resolve(__dirname, '../dist');
const origin = 'https://appassets.androidplatform.net';
const artifacts = process.env.ARTIFACT_DIR || '/tmp/timeworth-native-qa';
fs.mkdirSync(artifacts, { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true,
    recordVideo: { dir: artifacts, size: { width: 390, height: 844 } } });
  await context.route(origin + '/**', async route => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    const relative = pathname.replace(/^\/assets\/product\//, '');
    const file = path.resolve(product, relative);
    if (!file.startsWith(product + path.sep) || !fs.existsSync(file)) return route.abort();
    await route.fulfill({ path: file });
  });
  await context.addInitScript(() => {
    window.bridgeCalls = [];
    window.TimeWorthHost = { postMessage(message) { window.bridgeCalls.push(JSON.parse(message)); } };
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(10000);
  await page.goto(origin + '/assets/product/index.html');
  const dialog = page.getByRole('dialog');
  assert.equal(await page.locator('#native-setup').count(), 1);
  let state = await page.evaluate(() => __timeworthPreview.getState());
  assert.equal(state.transactions.length + state.debts.length + state.wishes.length + state.goals.length, 0);
  assert.equal(state.v3.cash.incomes.length, 0);
  await page.screenshot({ path: path.join(artifacts, 'first-run.png') });
  await page.getByRole('spinbutton', { name: '每月到手工资', exact: true }).fill('3000');
  await page.getByRole('spinbutton', { name: '每月工作天数', exact: true }).fill('26');
  await page.getByRole('spinbutton', { name: '每天工作小时', exact: true }).fill('8');
  await page.getByRole('button', { name: '开始使用', exact: true }).click();
  assert.match(await page.locator('#app-content').innerText(), /14\.42/);
  state = await page.evaluate(() => __timeworthPreview.getState());
  assert.equal(state.nativeSetup, true);
  assert.equal(state.v3.cash.incomes[0].received, false);
  assert.equal(state.transactions.length, 0);
  await page.getByRole('button', { name: '工资到账', exact: true }).click();
  await dialog.getByRole('button', { name: /^(确认这笔到账|保存修改)$/ }).click();
  assert.equal(await page.evaluate(() => __timeworthPreview.salarySummary().received), 3000);
  await page.locator('#app-content').getByRole('button', { name: /买它花多少时间/ }).click();
  await dialog.getByRole('spinbutton', { name: '商品原价', exact: true }).fill('100');
  assert.match(await page.locator('#calc-results').innerText(), /6小时\s*56分钟/);
  await page.screenshot({ path: path.join(artifacts, 'time-cost.png') });
  assert.equal(await page.evaluate(() => __timeworthNative.back()), true);
  await page.locator('#tab-bar').getByRole('button', { name: '设置', exact: true }).click();
  await page.getByRole('button', { name: /导出数据备份/ }).click();
  const exported = await page.evaluate(() => bridgeCalls.find(call => call.type === 'save'));
  assert.equal(exported.mime, 'application/json');
  assert.equal(JSON.parse(exported.contents).data.work.salary, 3000);
  await page.getByRole('button', { name: /检查新版本/ }).click();
  assert.equal(await page.evaluate(() => bridgeCalls.some(call => call.type === 'update')), true);
  await page.reload();
  assert.equal(await page.locator('#native-setup').count(), 0);
  assert.equal(await page.evaluate(() => __timeworthPreview.salarySummary().received), 3000);
  await page.evaluate(() => __timeworthPreview.navigate('profile'));
  const restoreFile = async contents => {
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /恢复备份/ }).click();
    await (await chooser).setFiles({ name: 'timeworth-backup.json', mimeType: 'application/json', buffer: Buffer.from(contents) });
  };
  const bad = JSON.parse(exported.contents); bad.data.v3.cash.incomes[0].amount = -42;
  await restoreFile(JSON.stringify(bad));
  await page.getByRole('status').filter({ hasText: /现金流数据无效|备份中的工资到账记录不正确/ }).waitFor();
  assert.equal(await page.evaluate(() => __timeworthPreview.salarySummary().received), 3000);
  // The browser's existing v2 export has no native marker. It must migrate without demo data.
  const previousBrowser = JSON.parse(exported.contents); delete previousBrowser.data.nativeSetup;
  previousBrowser.data.work.salary = 4200; previousBrowser.data.v3.cash.incomes[0].amount = 4200;
  await restoreFile(JSON.stringify(previousBrowser));
  await dialog.getByRole('button', { name: '恢复备份', exact: true }).click();
  assert.equal(await page.evaluate(() => __timeworthPreview.salarySummary().received), 4200);
  await page.reload();
  assert.equal(await page.evaluate(() => __timeworthPreview.getState().work.salary), 4200);
  for (const width of [360, 430, 800]) {
    await page.setViewportSize({ width, height: 844 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: path.join(artifacts, 'salary-' + width + '.png') });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.locator('#app-content').getByRole('button', { name: /买它花多少时间/ }).click();
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  await page.evaluate(() => __timeworthNative.back());
  // Large text must not hide the main action or cause horizontal scrolling.
  await page.addStyleTag({ content: 'html{font-size:125%}' });
  await page.setViewportSize({ width: 360, height: 720 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  assert.deepEqual(errors, []);
  const video = page.video();
  await context.close();
  await video.saveAs(path.join(artifacts, 'phone-flow.webm'));
  await browser.close();
  console.log('PASS Android product: empty first run, salary/time conversion, receipt, reload, native backup/update messages, rejected corrupt backup, v2 migration, small/tablet screens, reduced motion.');
})().catch(error => { console.error(error); process.exit(1); });

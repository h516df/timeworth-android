const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(8000);
  await page.addInitScript(() => {
    const OriginalDate = Date;
    class FixtureDate extends OriginalDate {
      constructor(...args) { super(...(args.length ? args : ['2026-10-21T12:00:00Z'])); }
      static now() { return new OriginalDate('2026-10-21T12:00:00Z').getTime(); }
    }
    window.Date = FixtureDate;
  });
  await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4173');
  const content = page.locator('#app-content');
  const dialog = page.getByRole('dialog');
  const state = () => page.evaluate(() => __timeworthPreview.getState());
  const selectMonth = async label => {
    await content.getByRole('button', { name: '选择工资月份' }).click();
    await dialog.getByRole('button', { name: label, exact: true }).click();
  };
  const home = async () => {
    await page.locator('#tab-bar').getByRole('button', { name: '工资', exact: true }).click();
  };
  const artifactDir = process.env.ARTIFACT_DIR || path.join(require('node:os').tmpdir(), 'timeworth-ui-qa');
  fs.mkdirSync(artifactDir, { recursive: true });
  const screenshot = async name => {
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().map(animation => animation.finished.catch(() => {})));
    });
    await page.screenshot({ path: path.join(artifactDir, name), style: '#toast{visibility:hidden}' });
  };

  await selectMonth('2026年09月');
  await content.getByRole('button', { name: '修改这个月工资' }).click();
  assert.match(await dialog.innerText(), /2026年9月/);
  await dialog.getByRole('spinbutton', { name: '到账金额' }).fill('9000');
  await dialog.getByRole('button', { name: '确认这笔到账', exact: true }).click();
  assert.match(await content.innerText(), /9,000/);
  await content.getByRole('button', { name: '修改这个月工资' }).click();
  await dialog.getByRole('spinbutton', { name: '到账金额' }).fill('9500');
  await dialog.getByRole('button', { name: '保存修改', exact: true }).click();
  let data = await state();
  assert.equal(data.v3.cash.incomes.filter(row => row.date.startsWith('2026-09')).length, 1);
  assert.equal(data.work.salary, 10000);
  assert.equal(data.v3.cash.incomes.find(row => row.id === 'salary-2026-10').amount, 10000);

  await content.getByRole('button', { name: '修改这个月工资' }).click();
  await dialog.getByRole('button', { name: '这个月工资不止一次？再加一笔', exact: true }).click();
  await dialog.getByRole('spinbutton', { name: '到账金额' }).fill('500');
  await dialog.getByRole('button', { name: '确认这笔到账', exact: true }).click();
  assert.match(await content.innerText(), /10,000/);
  await page.locator('#tab-bar').getByRole('button', { name: '流向', exact: true }).click();
  await content.getByRole('button', { name: '查一笔明细', exact: true }).click();
  await content.getByRole('button').filter({ hasText: '¥500.00' }).click();
  assert.match(await dialog.innerText(), /9月工资/);
  assert.doesNotMatch(await dialog.innerText(), /工资以外的收入/);
  await dialog.getByRole('spinbutton', { name: '到账金额' }).fill('550');
  await dialog.getByRole('button', { name: '保存修改', exact: true }).click();
  await home();
  assert.match(await content.innerText(), /10,050/);
  await screenshot('v5-history.png');

  // Synthetic imported payroll fixture: editing must reuse this record, not add cash income.
  await page.evaluate(() => {
    TW.state.transactions.push({ id: 'imported-august-payroll', type: 'income', name: '工资到账',
      salary: true, amount: 7000, date: '2026-08-05', category: '日常', account: '银行卡' });
    TW.save();
  });
  await selectMonth('2026年08月');
  await content.getByRole('button', { name: '修改这个月工资' }).click();
  assert.equal(await dialog.getByRole('spinbutton', { name: '到账金额' }).inputValue(), '7000');
  await dialog.getByRole('spinbutton', { name: '到账金额' }).fill('7200');
  await dialog.getByRole('button', { name: '保存修改', exact: true }).click();
  data = await state();
  assert.equal(data.transactions.find(row => row.id === 'imported-august-payroll').amount, 7200);
  assert.equal(data.v3.cash.incomes.filter(row => row.date.startsWith('2026-08')).length, 0);

  await selectMonth('2026年10月');
  const before = await page.evaluate(() => __timeworthPreview.salarySummary().forecast);
  await content.getByRole('button', { name: /买它花多少时间/ }).click();
  await dialog.getByRole('spinbutton', { name: '商品原价' }).fill('6000');
  await dialog.getByRole('button', { name: '12期', exact: true }).click();
  await page.locator('#quoted-total').fill('6240');
  await dialog.getByRole('button', { name: '下月', exact: true }).click();
  assert.match(await page.locator('#calc-results').innerText(), /本月无需还这笔/);
  await dialog.getByRole('button', { name: '按这个总金额，加入应还', exact: true }).click();
  data = await state();
  assert.equal(data.debts[0].schedule[0].date, '2026-11-25');
  assert.equal(await page.evaluate(() => __timeworthPreview.salarySummary().forecast), before);

  await content.getByRole('button', { name: /买它花多少时间/ }).click();
  await dialog.getByRole('spinbutton', { name: '商品原价' }).fill('6000');
  await dialog.getByRole('button', { name: '12期', exact: true }).click();
  await dialog.getByRole('button', { name: '知道每期金额', exact: true }).click();
  await page.locator('#quoted-payment').fill('520');
  await dialog.getByText('其他期数、还款日与单独费用', { exact: true }).click();
  await dialog.getByRole('spinbutton', { name: '另付的首期费用', exact: true }).fill('100');
  assert.match(await page.locator('#calc-results').innerText(), /6,340.00/);
  assert.match(await page.locator('#calc-results').innerText(), /620.00/);
  await screenshot('v5-installment.png');
  await dialog.getByRole('button', { name: '按这个总金额，加入应还', exact: true }).click();
  data = await state();
  assert.equal(data.debts[0].schedule[0].total, 620);
  assert.equal(data.debts[0].schedule[1].total, 520);
  assert.equal(data.debts[0].aggregateCost, 340);
  await screenshot('v5-home.png');
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('PASS v5 monthly experience: historical salary edit/idempotence; multiple payroll receipts; salary classification; imported payroll reuse; next-month timing; separately charged first-period fee.');
})().catch(error => { console.error(error); process.exit(1); });

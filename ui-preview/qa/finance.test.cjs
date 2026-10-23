const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const rules = require('../dist/finance.js');

// Exercise the existing rate/calendar engine, without copying its implementation.
const sandbox = { window: {}, localStorage: { getItem: () => null, setItem: () => {} },
  crypto: require('node:crypto').webcrypto };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/model.js'), 'utf8'), sandbox);
const model = sandbox.window.TW;
const summary = changes => rules.salarySummary({ month: '2026-10', today: '2026-10-31',
  incomes: [{ id: 'salary-2026-10', name: '工资', amount: 10000, date: '2026-10-05', received: true }],
  ...changes });

test('month-end salary excludes savings, other income and own savings transfers', () => {
  const result = summary({ opening: 50000, incomes: [
    { id: 'salary-2026-10', name: '工资', amount: 10000, date: '2026-10-05', received: true },
    { id: 'gift', name: '其他收入', amount: 800, date: '2026-10-08', received: true }],
    transactions: [{ name: '生活消费', date: '2026-10-10', type: 'expense', amount: 3000, category: '日常' }],
    goals: [{ entries: [{ amount: 2000, date: '2026-10-11' }] }] });
  assert.equal(result.now, 7000);
  assert.equal(result.forecast, 7000);
  assert.equal(result.otherIncome, 800);
  assert.equal(result.allocated, 2000);
});

test('future receipts and future-marked repayments are not actual cash movements', () => {
  const result = summary({ today: '2026-10-21',
    transactions: [{ name: '其他收入', date: '2026-10-29', type: 'income', amount: 500 }],
    debts: [{ id: 'card', name: '信用卡', schedule: [
      { total: 1000, date: '2026-10-25', paid: true, paidDate: '2026-10-28' }] }] });
  assert.equal(result.now, 10000);
  assert.equal(result.paid, 0);
  assert.equal(result.unpaid, 1000);
  assert.equal(result.forecast, 9000);
  assert.equal(result.otherIncome, 0);
});

test('repayment counts in its actual payment month, and asset-funded spending stays separate', () => {
  const debt = { id: 'card', name: '信用卡', schedule: [
    { total: 1000, date: '2026-09-25', paid: true, paidDate: '2026-10-02' }] };
  const result = summary({ debts: [debt], transactions: [
    { name: '旧存款买的东西', date: '2026-10-10', type: 'expense', amount: 5000, funding: 'assets' }] });
  assert.equal(result.now, 9000);
  const september = summary({ month: '2026-09', debts: [debt], incomes: [
    { id: 'salary-2026-09', amount: 9000, date: '2026-09-05', received: true }] });
  assert.equal(september.forecast, 9000);
  assert.equal(september.futureDaily, 0);
});

test('a future-dated transaction does not hide an outstanding fixed bill', () => {
  const result = summary({ today: '2026-10-21', fixed: [{ name: '房租', amount: 2500, day: 29 }],
    transactions: [{ name: '房租', type: 'expense', date: '2026-10-29', amount: 2500 }] });
  assert.equal(result.spent, 0);
  assert.equal(result.futureFixed, 2500);
  assert.equal(result.forecast, 7500);
});

test('all-in monthly payments keep a separate first-period fee on the first period', () => {
  const draft = { name: '电脑', price: 6000, terms: 12, entry: 'payment', quotedPayment: 520,
    quotedUpfront: 100, firstMonth: '2026-11', day: 31 };
  const quote = rules.quoteInstallments(draft, model.finance);
  assert.equal(quote.total, 6340);
  assert.equal(quote.cost, 340);
  assert.equal(quote.rows[0].total, 620);
  assert.equal(quote.rows[1].total, 520);
  const debt = rules.quotedDebt(draft, quote, model);
  assert.equal(debt.schedule[0].date, '2026-11-30');
  assert.equal(debt.schedule[3].date, '2027-02-28');
  assert.equal(rules.round(debt.schedule.reduce((sum, row) => sum + row.total, 0)), 6340);
});

test('quoted schedules conserve cents, including discounts and very small amounts', () => {
  for (const [price, total, terms] of [[6000, 6240, 12], [2999.99, 3222.22, 3], [.01, .02, 12], [6000, 5800, 12]]) {
    const draft = { price, quotedTotal: total, terms, entry: 'total', day: 25, firstMonth: '2026-10' };
    const quote = rules.quoteInstallments(draft, model.finance);
    const debt = rules.quotedDebt(draft, quote, model);
    assert.equal(rules.round(debt.schedule.reduce((sum, row) => sum + row.total, 0)), total);
    assert.equal(rules.round(debt.schedule.reduce((sum, row) => sum + row.principal, 0)), Math.min(price, total));
    for (const row of debt.schedule) {
      assert.ok(row.fee >= 0);
      assert.equal(rules.round(row.principal + row.fee), row.total);
    }
  }
});

test('time cost is concrete and payroll labels respect explicit attribution', () => {
  const equivalent = rules.timeEquivalent(6240, { salary: 10000, days: 22, hours: 8,
    commuteMinutes: 60, workCost: 600, basis: 'work' });
  assert.match(equivalent.primary, /13个工作日/);
  assert.equal(equivalent.naturalDays.toFixed(1), '19.0');
  assert.equal(rules.isSalary({ name: '工资', salary: false }), false);
  assert.equal(rules.isSalary({ name: '奖金', salary: true }), true);
  assert.equal(rules.isSalary({ name: '其他收入到账' }), false);
});

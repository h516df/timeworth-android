'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const O = require('../dist/ocr.js');

let sequence = 0;
const uid = () => 'ocr-id-' + (++sequence);

test('Chinese repayment lines extract only stated dates and amounts', () => {
  const rows = O.parseText('花呗\n2026年11月25日\n本期应还 ¥720.30\n已还款 100.00', '花呗-1.png');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].date, '2026-11-25');
  assert.equal(rows[0].amount, 720.30);
  assert.equal(rows[0].platform, '花呗');
  assert.equal(rows[0].source, '花呗-1.png');
});

test('a month/day without a year is not silently assigned a year', () => {
  const [row] = O.parseText('京东白条\n11月8日\n待还 ¥ 1,260.00');
  assert.equal(row.date, '');
  assert.match(row.dateHint, /请补年份/);
  assert.equal(row.amount, 1260);
  assert.equal(O.valid(row), false);
});

test('invalid evidence does not create a financial schedule', () => {
  assert.deepEqual(O.parseText('花呗\n权益优惠 200\n还款成功'), []);
  assert.equal(O.validDate('2026-02-30'), false);
  assert.equal(O.amount('0.001'), null);
  assert.throws(() => O.applyConfirmed([], [{ platform: '花呗', date: '', amount: 500 }], uid), /日期/);
});

test('confirmed screenshot makes a repayment plan, never an expense ledger', () => {
  const old = [{ id: 'legacy', name: '其他负担', schedule: [] }];
  const item = { platform: '京东白条', date: '2026-12-01', amount: 520, source: '白条.png' };
  const result = O.applyConfirmed(old, [item], uid);
  assert.equal(old.length, 1);
  assert.equal(result.debts.length, 2);
  assert.equal(result.debts[1].schedule[0].total, 520);
  assert.equal(result.debts[1].compositionUnknown, true);
  assert.equal(result.debts[1].ocrImported, true);
  assert.equal(result.changed[0].action, 'created');
});

test('re-import of identical amount deduplicates; changed amount requires explicit update', () => {
  const item = { platform: '花呗', date: '2026-11-25', amount: 700 };
  const first = O.applyConfirmed([], [item], uid);
  const exact = O.applyConfirmed(first.debts, [item], uid);
  assert.equal(exact.debts.length, 1);
  assert.equal(exact.changed[0].action, 'duplicate');
  const changed = { ...item, amount: 725 };
  assert.throws(() => O.applyConfirmed(first.debts, [changed], uid), /明确选择更新/);
  const updated = O.applyConfirmed(first.debts, [{ ...changed, updateId: first.debts[0].id }], uid);
  assert.equal(updated.debts[0].schedule[0].total, 725);
  assert.equal(first.debts[0].schedule[0].total, 700);
  first.debts[0].schedule[0].paid = true;
  assert.throws(() => O.applyConfirmed(first.debts, [{ ...changed, updateId: first.debts[0].id }], uid), /已标记还清/);
});

test('two ambiguous same-day rows are blocked, no partial commit', () => {
  const rows = [400, 450].map(amount => ({ platform: '花呗', date: '2026-11-25', amount }));
  assert.throws(() => O.applyConfirmed([], rows, uid), /同一平台同一天/);
});

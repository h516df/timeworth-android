/* Lightweight integration checks of the new view against the legacy v2 state. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

function createHarness() {
  const records = [{ id: 'old-1', name: '旧消费', amount: 160, type: 'expense', account: '支付宝', date: '2026-11-01' }];
  const state = {
    work: { salary: 3000, days: 20, hours: 8, commuteMinutes: 60, workCost: 100, basis: 'work' },
    transactions: records, debts: [
      { id: 'loan', name: '借款', schedule: [{ id: 'period-1', total: 500, date: '2026-11-15', paid: false }] }
    ],
    goals: [], wishes: [], timeworth2: { livingReserve: 700 }
  };
  const handlers = {};
  const resultNode = { innerHTML: '' };
  const doc = {
    body: { classList: { add() {} } },
    addEventListener(type, callback) { (handlers[type] ||= []).push(callback); },
    querySelector(selector) { return selector === '#tw2-calc-result' ? resultNode : null; }
  };
  const context = {
    document: doc, window: { TW_NATIVE: false },
    state: () => state,
    M: {
      month: () => '2026-11',
      shiftMonth: (month, n) => `${2026}-${String(Number(month.slice(5)) + n).padStart(2, '0')}`,
      due: () => 500, installments: () => [{ debtId: 'loan', name: '借款', date: '2026-11-15', total: 500, paid: false }],
      balance: () => 0, round: v => Math.round((v + Number.EPSILON) * 100) / 100
    },
    navs: [['home', '工资'], ['ledger', '账本'], ['plan', '计划'], ['profile', '设置']],
    render: () => {}, renderSheet: () => {}, persist: () => {}, toast: () => {}, validateBackup: () => {},
    home: () => '', ledger: () => '', plan: () => '', open: () => {}, close: () => {},
    action: (name, label, cls = '', extra = '') => `<button data-action="${name}" class="${cls}" ${extra}>${label}</button>`,
    h: input => String(input).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;'),
    icon: name => `<i data-icon="${name}"></i>`,
    chevron: () => '›',
    sheetChrome: (title, body) => title + body,
    section: name => '<h2>' + name + '</h2>',
    group: body => body, note: body => body, row: () => '',
    numericValue: () => 300, newEntity: () => ({}), $
      : selector => selector === '#tw2-calc-result' ? resultNode : null
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../dist/timeworth2.js'), 'utf8'), context);
  return { state, context, handlers, resultNode };
}

test('TimeWorth 2.0 has exactly three main destinations and hides ledger without deleting data', () => {
  const h = createHarness();
  assert.deepEqual(Array.from(h.context.navs, x => x[1]), ['首页', '算一算', '未来']);
  const html = h.context.home();
  assert.match(html, /估算可安排金额/);
  assert.match(html, /非账户余额/);
  assert.doesNotMatch(html, /本月净支出|记一笔日常/);
  assert.equal(h.state.transactions.length, 1);
  assert.equal(h.state.transactions[0].name, '旧消费');
});

test('estimated available funds use known obligations and optional reserve, never transactions', () => {
  const h = createHarness();
  assert.equal(h.context.window.__timeworth2.available().total, 1700);
  h.state.transactions.push({ id: 'old-2', amount: 9999 });
  assert.equal(h.context.window.__timeworth2.available().total, 1700);
  h.state.work.salary = 0;
  assert.equal(h.context.window.__timeworth2.available(), null);
  assert.match(h.context.home(), /尚未计算/);
});

test('purchase calculator is transient and refuses to fabricate a result with missing work data', () => {
  const h = createHarness();
  assert.match(h.context.ledger(), /本次计算默认不保存/);
  h.handlers.input[0]({ target: { id: 'tw2-calc-price', value: '1299' } });
  assert.match(h.resultNode.innerHTML, /需要工作/);
  assert.match(h.resultNode.innerHTML, /非账户余额/);
  assert.equal(h.state.transactions.length, 1);
  h.state.work.hours = 0;
  h.handlers.input[0]({ target: { id: 'tw2-calc-price', value: '1299' } });
  assert.match(h.resultNode.innerHTML, /需要先设置有效的工资/);
});

test('month plan only displays confirmed scheduled obligations', () => {
  const h = createHarness();
  assert.match(h.context.plan(), /还款时间线/);
  assert.match(h.context.plan(), /借款/);
  assert.match(h.context.plan(), /不推测实际付款/);
});

test('optional reserve survives valid backups and invalid values are rejected', () => {
  const h = createHarness();
  assert.doesNotThrow(() => h.context.validateBackup({ data: { timeworth2: { livingReserve: 500 } } }));
  assert.throws(() => h.context.validateBackup({ data: { timeworth2: { livingReserve: '500' } } }), /生活费预留/);
  assert.throws(() => h.context.validateBackup({ data: { timeworth2: { livingReserve: -5 } } }), /生活费预留/);
});

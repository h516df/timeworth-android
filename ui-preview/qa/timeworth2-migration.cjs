'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../dist/model.js'), 'utf8');
const key = 'timeworth-ui-v2';

function load(stored, native = true) {
  const local = new Map(Object.entries(stored));
  const context = {
    window: { TW_NATIVE: native },
    crypto: { randomUUID: () => 'generated' },
    localStorage: {
      getItem: name => local.get(name) || null,
      setItem: (name, value) => local.set(name, value)
    },
    Date, Math, Intl
  };
  vm.runInNewContext(source, context);
  return { model: context.window.TW, local };
}

test('0.1.0 local-storage v2 retains all historical records on 2.0 startup', () => {
  const oldState = {
    version: 2, nativeSetup: true,
    work: { salary: 3800, days: 22, hours: 8, commuteMinutes: 30, workCost: 100, basis: 'real' },
    transactions: [{ id: 'old-expense', name: '原账本记录', amount: 48, type: 'expense', date: '2026-10-20' }],
    debts: [{ id: 'old-debt', name: '旧版分期', schedule: [{ id: 'p1', date: '2026-11-12', total: 120, paid: false }] }],
    wishes: [{ id: 'wish', name: '旧心愿', price: 800 }],
    goals: [{ id: 'goal', name: '旧目标', target: 1000, monthly: 100, entries: [] }],
    imports: ['old-import-fingerprint'], dark: false
  };
  const { model, local } = load({ [key]: JSON.stringify(oldState) });
  assert.equal(model.state.transactions[0].name, '原账本记录');
  assert.equal(model.state.debts[0].id, 'old-debt');
  assert.equal(model.state.wishes[0].name, '旧心愿');
  assert.equal(model.state.goals[0].name, '旧目标');
  assert.deepEqual(Array.from(model.state.imports), ['old-import-fingerprint']);
  assert.equal(model.state.nativeSetup, true);
  assert.equal(model.save(), true);
  assert.equal(JSON.parse(local.get(key)).transactions[0].id, 'old-expense');
});

test('already-saved zero-salary state is never silently reset', () => {
  const existing = {
    version: 2, nativeSetup: false,
    work: { salary: 0, days: 22, hours: 8, commuteMinutes: 0, workCost: 0, basis: 'work' },
    transactions: [{ id: 'keep-me' }],
    debts: [{ id: 'planned' }], goals: [], wishes: [{ id: 'wish' }]
  };
  const { model } = load({ [key]: JSON.stringify(existing) });
  assert.equal(model.state.work.salary, 0);
  assert.equal(model.state.debts[0].id, 'planned');
  assert.equal(model.state.transactions[0].id, 'keep-me');
});

test('old v1 savings migrate without crashing or fabricating a goal', () => {
  const old = { salary: 2400, days: 20, hours: 8, saved: 900, wishes: [], transactions: [] };
  const { model } = load({ 'timeworth-ui-v1': JSON.stringify(old) });
  assert.equal(model.state.work.salary, 2400);
  assert.equal(model.state.legacySavingsBalance, 900);
  assert.equal(model.state.goals.length, 0);
});

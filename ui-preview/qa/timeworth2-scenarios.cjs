'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../dist/scenarios.js');

test('job change includes explicit salary, costs, time and one-off expense', () => {
  const result = S.compare({ income: '800', cost: '200', hours: '-10', upfront: '2400' }, 40);
  assert.equal(result.cashDelta, 600);
  assert.equal(result.timeValue, -400);
  assert.equal(result.combined, 200);
  assert.equal(result.payback, 12);
});

test('absent data is unknown, not secretly zero', () => {
  const result = S.compare({ income: '600', cost: '', hours: '', upfront: '' }, 35);
  assert.equal(result.cashDelta, null);
  assert.equal(result.timeValue, null);
  assert.equal(result.combined, null);
  assert.equal(result.payback, null);
});

test('no meaningful wage data means no monetized time', () => {
  const result = S.compare({ income: '0', cost: '200', hours: '12', upfront: '1000' }, null);
  assert.equal(result.cashDelta, -200);
  assert.equal(result.timeValue, null);
  assert.equal(result.combined, null);
});

test('invalid, negative one-time expense and over-limit fields are rejected', () => {
  const result = S.compare({ income: '100000000', cost: '-4', hours: '1.234', upfront: '-100' }, 30);
  assert.equal(result.cashDelta, null);
  assert.equal(result.timeValue, null);
  assert.equal(result.upfront, null);
});

test('payback is never invented for nonpositive monthly advantage', () => {
  const result = S.compare({ income: '0', cost: '300', hours: '0', upfront: '1000' }, 40);
  assert.equal(result.combined, -300);
  assert.equal(result.payback, null);
});

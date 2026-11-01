/* Conservative device OCR interpretation. Nothing is saved until a human confirms. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TimeWorthOcr = api;
})(typeof window === 'undefined' ? null : window, () => {
  const MAX_AMOUNT = 9999999;
  const pad = n => String(n).padStart(2, '0');
  const validDate = value => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [y, m, d] = value.split('-').map(Number);
    return y >= 2000 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 &&
      d <= new Date(y, m, 0).getDate();
  };
  const amount = value => {
    const n = typeof value === 'string' && /^\d{1,7}(?:\.\d{1,2})?$/.test(value.replace(/,/g, '').trim())
      ? Number(value.replace(/,/g, '').trim()) : typeof value === 'number' ? value : NaN;
    return Number.isFinite(n) && n >= .01 && n <= MAX_AMOUNT && Math.round(n * 100) / 100 === n ? n : null;
  };
  const platform = text => /京东白条|白条/.test(text) ? '京东白条' : /花呗/.test(text) ? '花呗' : '其他分期';
  const scanDate = text => {
    const full = text.match(/(20\d{2})[年.\/-]\s*(\d{1,2})[月.\/-]\s*(\d{1,2})日?/);
    if (full) {
      const value = `${full[1]}-${pad(full[2])}-${pad(full[3])}`;
      return { date: validDate(value) ? value : '', hint: full[0] };
    }
    const partial = text.match(/(?:^|\D)(\d{1,2})月\s*(\d{1,2})日/);
    return { date: '', hint: partial ? `${partial[1]}月${partial[2]}日（请补年份）` : '' };
  };
  function parseText(text, source = '') {
    const normalized = String(text || '').replace(/[，]/g, ',').replace(/[：]/g, ':').replace(/[￥]/g, '¥');
    const lines = normalized.split(/\r?\n/).map(line => line.trim()).filter(Boolean).slice(0, 500);
    const found = [], seen = new Set(), origin = platform(normalized);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/已还清|已还款|还款成功|已结清|已支付/.test(line)) continue;
      const nearby = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join(' ');
      if (!/应还|待还|需还|本期还款|还款金额|账单金额/.test(nearby)) continue;
      const values = [...line.matchAll(/(?:[¥]\s*|(?:应还|待还|需还|本期还款|还款金额|账单金额)\s*[:：]?\s*)(\d{1,7}(?:,\d{3})*(?:\.\d{1,2})?)/g)];
      for (const match of values) {
        const value = amount(match[1]);
        if (value === null) continue;
        const dateInfo = scanDate(nearby);
        const key = `${origin}|${dateInfo.date}|${dateInfo.hint}|${value}`;
        if (seen.has(key)) continue;
        seen.add(key);
        found.push({ platform: origin, date: dateInfo.date, dateHint: dateInfo.hint,
          amount: value, source: String(source).slice(0, 100), evidence: nearby.slice(0, 250) });
        if (found.length >= 30) return found;
      }
    }
    return found;
  }
  const valid = item => item && typeof item.platform === 'string' &&
    item.platform.trim().length > 0 && item.platform.length <= 40 && validDate(item.date) &&
    amount(item.amount) !== null;
  const matches = (debts, item) => {
    const related = debts.filter(d => d.ocrImported === true && d.name === item.platform &&
      d.schedule?.length === 1 && d.schedule[0].date === item.date);
    return { exact: related.find(d => d.schedule[0].total === amount(item.amount)) || null,
      possibleUpdates: related.filter(d => d.schedule[0].total !== amount(item.amount)) };
  };
  function makeDebt(item, uid) {
    if (!valid(item)) throw new Error('请确认平台、完整日期和准确应还金额');
    const id = uid(), period = uid(), total = amount(item.amount);
    return { id, name: item.platform, principal: total, terms: 1, firstMonth: item.date.slice(0, 7),
      day: Number(item.date.slice(8)), mode: 'zero', rate: 0, upfront: 0,
      ocrImported: true, unknownBreakdown: true, compositionUnknown: true,
      ocrSource: (item.source || '').slice(0, 100),
      schedule: [{ id: period, date: item.date, principal: total, interest: 0, fee: 0,
        total, paid: false }] };
  }
  function applyConfirmed(debts, rows, uid) {
    if (!Array.isArray(rows) || !rows.length || rows.length > 50) throw new Error('请至少确认一条，单次最多 50 条');
    const next = JSON.parse(JSON.stringify(debts)), changed = [], selected = new Set();
    for (const item of rows) {
      if (!valid(item)) throw new Error('有条目的日期、平台或金额未确认');
      const key = `${item.platform}|${item.date}`;
      if (selected.has(key)) throw new Error('同一平台同一天出现多条，请分开核对后再导入');
      selected.add(key);
      const related = matches(next, item);
      if (related.exact) { changed.push({ action: 'duplicate', id: related.exact.id }); continue; }
      if (related.possibleUpdates.length && !item.updateId)
        throw new Error('发现同平台同日期的旧计划，请明确选择更新');
      if (item.updateId) {
        const target = related.possibleUpdates.find(d => d.id === item.updateId);
        if (!target || target.schedule[0].paid) throw new Error('待更新的计划不存在或已标记还清');
        const total = amount(item.amount);
        target.principal = total; target.schedule[0].principal = total;
        target.schedule[0].total = total; target.ocrSource = (item.source || '').slice(0, 100);
        changed.push({ action: 'updated', id: target.id });
      } else {
        const debt = makeDebt(item, uid);
        next.push(debt); changed.push({ action: 'created', id: debt.id });
      }
    }
    return { debts: next, changed };
  }
  return { parseText, amount, validDate, valid, matches, makeDebt, applyConfirmed };
});

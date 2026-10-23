/* Pure financial rules shared by the UI and cloud checks. No storage or DOM access. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TimeWorthFinance = api;
})(typeof window === 'undefined' ? null : window, function () {
  'use strict';

  const round = value => Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  const sum = (rows, get = row => row.amount) => round(rows.reduce((total, row) => total + get(row), 0));
  const belongs = (date, month) => typeof date === 'string' && date.startsWith(month + '-');
  const isSalary = row => row.salary === false ? false : row.salary === true || row.kind === 'salary' ||
    /^salary-/.test(row.id || '') || /工资|薪资|薪酬|年终奖|绩效奖金/.test(row.name || '');

  function salarySummary(input) {
    const { month, today, transactions = [], incomes = [], debts = [], goals = [],
      fixed = [], sources = [], opening = 0 } = input;
    const currentMonth = today.slice(0, 7);
    const current = month === currentMonth, past = month < currentMonth;
    const [year, number] = month.split('-').map(Number);
    const days = new Date(year, number, 0).getDate();
    const cutoff = past ? `${month}-${String(days).padStart(2, '0')}` : today;
    const elapsed = past ? days : current ? Number(today.slice(8)) : 0;
    const left = past ? 0 : days - elapsed;
    const tx = transactions.filter(row => belongs(row.date, month));
    const wages = incomes.filter(row => belongs(row.date, month) && isSalary(row));
    const salaryTransactions = tx.filter(row => row.type === 'income' && isSalary(row));
    const received = round(sum(wages.filter(row => row.received && row.date <= cutoff)) +
      sum(salaryTransactions.filter(row => row.date <= cutoff)));
    const expected = past ? 0 : sum(wages.filter(row => !row.received && row.date >= cutoff));
    const isCredit = row => !!row.credit || sources.some(source => source.kind === 'credit' && source.name === row.account);
    const signed = row => row.type === 'refund' ? -row.amount : row.amount;
    const counted = tx.filter(row => row.date <= cutoff && row.funding !== 'assets' && !isCredit(row) &&
      ['expense', 'refund'].includes(row.type));
    const spent = sum(counted, signed);
    const periods = debts.flatMap(debt => debt.schedule.map(row => ({ ...row, name: debt.name, debtId: debt.id })));
    const paid = sum(periods.filter(row => row.paid && row.funding !== 'assets' &&
      belongs(row.paidDate || row.date, month) && (row.paidDate || row.date) <= cutoff), row => row.total);
    const unpaid = past ? 0 : sum(periods.filter(row => (!row.paid || (row.paidDate || row.date) > cutoff) && row.funding !== 'assets' &&
      belongs(row.date, month)), row => row.total);
    const outstandingFixed = fixed.filter(item => !tx.some(row => row.type === 'expense' &&
      row.date <= cutoff && row.name.includes(item.name)));
    const futureFixed = past ? 0 : sum(outstandingFixed);
    const variable = counted.filter(row => !/房租|房贷|水电|保险|年费/.test(row.name) &&
      !fixed.some(item => row.name.includes(item.name)));
    const daily = Math.max(0, sum(variable, signed)) / Math.max(1, elapsed);
    const futureDaily = past ? 0 : round(daily * left);
    const now = round(received - spent - paid);
    const forecast = round(now + expected - unpaid - futureFixed - futureDaily);
    const salaryTotal = round(received + expected);
    const otherIncome = round(sum(incomes.filter(row => belongs(row.date, month) && row.received &&
      row.date <= cutoff && !isSalary(row))) + sum(tx.filter(row => row.type === 'income' &&
      row.date <= cutoff && !isSalary(row))));
    const categories = ['日常', '购物', '居住'].map(name => ({ name,
      value: sum(counted.filter(row => row.category === name), signed) }));
    return { month, current, past, received, expected, salaryTotal, spent, cashSpent: spent,
      paid, unpaid, futureFixed, futureDaily, daily, left, now, forecast,
      retention: salaryTotal > 0 ? forecast / salaryTotal * 100 : 0,
      otherIncome, categories, count: counted.length, sample: variable.length,
      allocated: sum(goals.flatMap(goal => goal.entries).filter(row => belongs(row.date, month) && row.date <= cutoff)),
      historyAssets: opening };
  }

  function timeEquivalent(amount, work) {
    const dayHours = work.hours + (work.basis === 'real' ? work.commuteMinutes / 60 : 0);
    const earnings = work.basis === 'real' ? work.salary - work.workCost : work.salary;
    const hourly = Math.max(0, earnings) / (work.days * dayHours);
    const hours = hourly > 0 ? Math.max(0, amount) / hourly : 0;
    const days = hours / dayHours, months = days / work.days;
    const roundedMinutes = Math.round(hours * 60), dayMinutes = Math.max(1, Math.round(dayHours * 60));
    const fullDays = Math.floor(roundedMinutes / dayMinutes), remaining = roundedMinutes % dayMinutes;
    const wholeHours = Math.floor(remaining / 60), minutes = remaining % 60;
    const primary = hourly <= 0 ? '当前口径无法折算' : fullDays ?
      `${fullDays}个工作日${wholeHours ? ` ${wholeHours}小时` : ''}${minutes ? ` ${minutes}分钟` : ''}` :
      wholeHours ? `${wholeHours}小时${minutes ? ` ${minutes}分钟` : ''}` : `${minutes}分钟`;
    return { hours, days, months, naturalDays: months * 30.44, primary };
  }

  function quoteInstallments(draft, finance) {
    const terms = draft.terms || 1;
    if (terms === 1) return { ready: true, total: draft.price, cost: 0,
      rows: finance(draft.price, 1, 'zero', 0, 0).rows };
    if (draft.entry === 'rate') return { ...finance(draft.price, terms, draft.mode, draft.rate, draft.upfront), ready: true };
    if (draft.entry === 'payment' && draft.quotedUpfront === null) return { ready: false, total: 0, cost: 0, rows: [], reason: '请检查另付的首期费用，金额应在 0 至 999999 元之间。' };
    const payment = round(draft.quotedPayment || 0), extra = round(draft.quotedUpfront || 0);
    const total = draft.entry === 'payment' ? round(payment * terms + extra) : round(draft.quotedTotal || 0);
    if (!(total > 0) || (draft.entry === 'payment' && !(payment > 0))) {
      return { ready: false, total: 0, cost: 0, rows: [] };
    }
    const rows = draft.entry === 'payment' ? Array.from({ length: terms }, (_, index) => ({
      principal: payment, interest: 0, fee: index === 0 ? extra : 0,
      total: round(payment + (index === 0 ? extra : 0))
    })) : finance(total, terms, 'zero', 0, 0).rows;
    return { ready: true, total, cost: round(total - draft.price), rows };
  }

  function quotedDebt(draft, quote, calendar) {
    const principalCents = Math.round(Math.min(draft.price, quote.total) * 100);
    const totalCents = Math.round(quote.total * 100);
    let accumulated = 0, previousPrincipal = 0;
    const firstMonth = draft.firstMonth || calendar.month();
    const schedule = quote.rows.map((row, index) => {
      const rowCents = Math.round(row.total * 100);
      accumulated += rowCents;
      const cumulativePrincipal = Math.round(accumulated * principalCents / totalCents);
      const principal = cumulativePrincipal - previousPrincipal;
      previousPrincipal = cumulativePrincipal;
      return { id: calendar.uid(), date: calendar.dueDate(calendar.shiftMonth(firstMonth, index), draft.day),
        paid: false, principal: principal / 100, interest: 0, fee: (rowCents - principal) / 100, total: row.total };
    });
    return { id: calendar.uid(), name: draft.name, principal: principalCents / 100,
      originalPrice: draft.price, statedTotal: quote.total, aggregateCost: quote.cost, terms: draft.terms,
      firstMonth, day: draft.day, mode: 'statement', rate: 0, upfront: 0,
      unknownBreakdown: true, quotedCostKnown: true, schedule };
  }

  return { round, isSalary, salarySummary, timeEquivalent, quoteInstallments, quotedDebt };
});

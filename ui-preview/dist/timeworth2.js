/* TimeWorth 2.0 — non-ledger interface. The v2 store stays intact for safe upgrades. */
(() => {
  'use strict';

  const oldRenderSheet = renderSheet;
  const money2 = value => Number(value).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amount2 = value => '¥' + money2(value);
  const configuredWork = () => {
    const w = state().work;
    const ready = Number.isFinite(w.salary) && w.salary > 0 && w.days > 0 && w.hours > 0;
    const detailed = w.basis === 'real';
    const hours = w.days * (w.hours + (detailed ? w.commuteMinutes / 60 : 0));
    const earnings = w.salary - (detailed ? w.workCost : 0);
    const rate = ready && hours > 0 && earnings > 0 ? earnings / hours : null;
    return { rate, detailed, ready };
  };
  const reserveAmount = () => {
    const value = state().timeworth2?.livingReserve ?? 0;
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 9999999 ? value : 0;
  };
  const available2 = () => {
    const w = state().work;
    if (!(w.salary > 0) || !Number.isFinite(w.salary)) return null;
    const due = M.due(M.month(), true);
    const reserve = reserveAmount();
    const cost = Math.max(0, Number(w.workCost) || 0);
    return { salary: w.salary, due, reserve, cost, total: M.round(w.salary - due - reserve - cost) };
  };
  const safeMoney = value => Number.isFinite(value) ? amount2(value) : '—';
  const validMoneyInput = (raw, min = .01) => {
    if (typeof raw !== 'string' || !/^\d{1,7}(?:\.\d{1,2})?$/.test(raw.trim())) return null;
    const amount = Number(raw);
    return Number.isFinite(amount) && amount >= min && amount <= 9999999 ? amount : null;
  };
  let calcPrice = '', calcMode = 'once', calcTerms = 6, calcPayment = '', calcExtra = '';
  let futureMonth = M.month();

  const pageHeader = (title, subtitle = '') => `<header class="tw2-header">
    <div class="tw2-top"><span class="tw2-wordmark">TimeWorth</span>
      ${action('tw2-settings', '⚙', 'tw2-tool', 'aria-label="设置"')}</div>
    <h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</header>`;

  const insight = (label, value, detail, css = '') => `<section class="tw2-insight ${css}">
    <div class="tw2-eyebrow">${label}</div><div class="tw2-value">${value}</div>
    <div class="tw2-insight-detail">${detail}</div></section>`;

  home = function timeworth2Home() {
    const work = configuredWork(), estimate = available2(), next = state().debts
      .flatMap(d => d.schedule.filter(p => !p.paid).map(p => ({ ...p, name: d.name })))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return pageHeader('时间，值得', '让时间看得见，让选择更从容。') +
      insight(work.detailed ? '真实时薪' : '基础时薪',
        work.rate === null ? '尚未计算' : `<span class="tw2-blue">${amount2(work.rate)}</span><small> / 小时</small>`,
        work.rate === null
          ? action('tw2-work', '设置工资与工作时间 →', 'tw2-text-action')
          : `${work.detailed ? '已纳入通勤和工作成本' : '仅按工资和工作时间折算'} · ${action('rate', '计算口径 →', 'tw2-inline')}`,
        'tw2-hourly') +
      action('tw2-calculate', '算一算花多少钱的时间  →', 'tw2-primary') +
      `<section class="tw2-available">
        <div class="tw2-line-head"><h2>估算可安排金额</h2>${action('tw2-reserve', '调整预留 →', 'tw2-inline')}</div>
        <div class="tw2-main-amount">${estimate ? safeMoney(estimate.total) : '—'}</div>
        <p>${estimate ? `已扣待还 ${amount2(estimate.due)}、工作成本及生活费预留` : '设置工资后才可估算'}</p>
        <span class="tw2-caveat">按已填资料估算 · 非账户余额</span>
      </section>
      <section class="tw2-lines">
        <div class="tw2-line-head"><h2>近期还款</h2>${action('tw2-future', '查看计划 →', 'tw2-inline')}</div>
        ${next ? action('tw2-future', `<span class="tw2-repay-date">${h(next.date.slice(5).replace('-', '月'))}日</span><span>${h(next.name)}</span><strong>${amount2(next.total)}</strong>`, 'tw2-next-repay')
          : `<p class="tw2-empty-line">还没有还款计划。</p>${action('new-debt', '＋ 添加固定负担', 'tw2-subtle-button')}`}
      </section>
      <p class="tw2-note">无需每天记账，工作和还款有变化时再调整即可。</p>`;
  };

  function calculationResult() {
    if (calcPrice === '') {
      return '<p class="tw2-placeholder">输入价格后，立即换算成工作时间。</p>';
    }
    const price = validMoneyInput(calcPrice), work = configuredWork();
    if (price === null) return '<p class="tw2-input-note">请输入 0.01 至 9,999,999 元的价格，最多保留两位小数。</p>';
    if (work.rate === null) {
      return `<p class="tw2-placeholder">需要先设置有效的工资和工作时间。</p>${action('tw2-work', '完善工作资料', 'tw2-subtle-button')}`;
    }
    const hours = price / work.rate;
    const dayHours = state().work.hours + (work.detailed ? state().work.commuteMinutes / 60 : 0);
    const days = hours / dayHours;
    const renderTime = `<div class="tw2-result-label">需要工作</div>
      <div class="tw2-hours">约 <strong>${money2(hours)}</strong> 小时</div>
      <p>约 ${money2(days)} 个工作日 · 按当前${work.detailed ? '真实' : '基础'}时薪</p>`;
    if (calcMode !== 'installment') {
      const available = available2();
      return renderTime + (available ? `<div class="tw2-impact"><span>如果本月一次付清</span><strong>${amount2(M.round(available.total - price))}</strong>
        <small>支付后的估算可安排金额，非账户余额</small></div>` : '');
    }
    if (calcPayment === '') {
      return renderTime + '<p class="tw2-input-note">填写每期实际应还，才能比较总息费。不会假设一定免息。</p>';
    }
    const payment = validMoneyInput(calcPayment), extra = calcExtra === '' ? 0 : validMoneyInput(calcExtra, 0);
    if (payment === null || extra === null) {
      return renderTime + '<p class="tw2-input-note">请核对每期金额和首期费用（0 至 9,999,999 元，最多两位小数）。</p>';
    }
    const total = M.round(payment * calcTerms + extra), difference = M.round(total - price);
    if (!Number.isFinite(total) || total > 99999999) return renderTime + '<p class="tw2-input-note">总还款超出计算范围，请核对金额。</p>';
    return renderTime + `<div class="tw2-impact"><span>${calcTerms} 期合计应还</span><strong>${amount2(total)}</strong>
      <small>${difference >= 0 ? '比一次付清多付' : '比一次付清少付'} ${amount2(Math.abs(difference))} · 按输入的含费金额计算</small>
      <small>按当前时薪，分期总还款约需 ${money2(total / work.rate)} 小时的工作时间</small></div>`;
  }

  ledger = function timeworth2Calculator() {
    return pageHeader('算一算', '买一件东西，需要付出多少时间？') +
      `<div class="tw2-calculator">
        <label class="tw2-input-label" for="tw2-calc-price">购买价格</label>
        <div class="tw2-price-field"><span>¥</span><input id="tw2-calc-price" type="number" min="0.01"
          max="9999999" inputmode="decimal" step=".01" value="${h(calcPrice)}" placeholder="0.00"></div>
        <div class="tw2-segment" role="group" aria-label="付款方式">
          <button data-tw2-mode="once" aria-pressed="${calcMode === 'once'}" class="${calcMode === 'once' ? 'active' : ''}">一次付清</button>
          <button data-tw2-mode="installment" aria-pressed="${calcMode === 'installment'}" class="${calcMode === 'installment' ? 'active' : ''}">分期购买</button>
        </div>
        ${calcMode === 'installment' ? `<div class="tw2-installment-fields">
          <label>分期期数<select id="tw2-terms">${[3, 6, 12, 24, 36].map(n => `<option value="${n}" ${n === calcTerms ? 'selected' : ''}>${n} 期</option>`).join('')}</select></label>
          <label>每期实际应还（含费用）<input id="tw2-payment" type="number" min=".01" inputmode="decimal" placeholder="例如 220.00" value="${h(calcPayment)}"></label>
          <label>另付首期费用（可选）<input id="tw2-extra" type="number" min="0" inputmode="decimal" placeholder="0.00" value="${h(calcExtra)}"></label>
        </div>` : ''}
        <div id="tw2-calc-result" class="tw2-results" aria-live="polite">${calculationResult()}</div>
      </div>
      <div class="tw2-bottom-actions"><span>本次计算默认不保存</span>
        ${action('tw2-add-wish', '♡ 加入心愿', 'tw2-wish-action')}</div>`;
  };

  plan = function timeworth2Future() {
    const rows = M.installments(futureMonth).sort((a, b) => a.date.localeCompare(b.date));
    const months = [-1, 0, 1].map(n => M.shiftMonth(futureMonth, n));
    return pageHeader('未来', '看清计划，慢慢靠近。') +
      `<section class="tw2-future-section">
        <div class="tw2-line-head"><h2>还款时间线</h2>${action('new-debt', '＋ 添加', 'tw2-inline')}</div>
        <div class="tw2-months">
          <button class="tw2-month-step" data-tw2-step="-1" aria-label="上一月">‹</button>
          ${months.map(m => `<button data-tw2-month="${m}" aria-pressed="${futureMonth === m}" class="${futureMonth === m ? 'active' : ''}">${Number(m.slice(5))}月${m.slice(0,4) !== futureMonth.slice(0,4) ? `<small>${m.slice(0,4)}</small>` : ''}</button>`).join('')}
          <button class="tw2-month-step" data-tw2-step="1" aria-label="下一月">›</button>
        </div>
        <div class="tw2-timeline">${rows.length ? rows.map(p =>
          action('debt', `<span class="tw2-dot"></span><span class="tw2-date">${Number(p.date.slice(-2))}日</span>
          <span class="tw2-repay-name">${h(p.name)}<small>${p.paid ? '已处理' : '待还款'}</small></span>
          <strong>${amount2(p.total)}</strong>`, 'tw2-timeline-row', `data-id="${h(p.debtId)}"`)).join('')
          : '<p class="tw2-empty-line">这个月没有已记录的还款。</p>'}</div>
        <p class="tw2-caveat">仅根据你已确认的计划展示，不推测实际付款。</p>
      </section>
      <section class="tw2-future-section">
        <div class="tw2-line-head"><h2>我的期待</h2>${action('new-goal', '＋ 添加目标', 'tw2-inline')}</div>
        ${state().goals.length ? state().goals.slice(0, 3).map(g => {
          const progress = M.balance(g), pct = Math.min(100, Math.max(0, progress / g.target * 100));
          const monthsLeft = g.monthly > 0 ? Math.ceil(Math.max(0, g.target - progress) / g.monthly) : null;
          const timing = progress >= g.target ? '已达到目标' : monthsLeft === null ? '未设置每月存入计划' : `按每月存入 ${amount2(g.monthly)}，预计还需 ${monthsLeft} 个月`;
          return action('goal', `<span class="tw2-goal-name">${h(g.name)}</span><strong>${Math.floor(pct)}%</strong>
            <span class="tw2-progress"><i style="width:${pct}%"></i></span>
            <small>${amount2(progress)} / ${amount2(g.target)} · ${timing}</small>`, 'tw2-goal', `data-id="${h(g.id)}"`);
        }).join('') : `<p class="tw2-empty-line">暂时没有存钱目标。</p>${action('new-goal', '＋ 添加一个目标', 'tw2-subtle-button')}`}
        <div class="tw2-wishes">${action('tw2-wishes', `心愿清单 <strong>${state().wishes.length} 件</strong> ${chevron()}`, 'tw2-next-repay')}</div>
      </section>`;
  };

  function settingsHtml() {
    const w = state().work;
    return sheetChrome('设置', `
      ${section('工作与时间')}
      ${group(row('每月到手工资', amount2(w.salary), 'work-field', 'data-key="salary"') +
        row('每月工作天数', w.days + ' 天', 'work-field', 'data-key="days"') +
        row('每天工作时间', w.hours + ' 小时', 'work-field', 'data-key="hours"') +
        row('往返通勤', w.commuteMinutes + ' 分钟', 'work-field', 'data-key="commuteMinutes"') +
        row('每月额外工作成本', amount2(w.workCost), 'work-field', 'data-key="workCost"') +
        row('时薪口径', w.basis === 'real' ? '真实时薪' : '基础时薪', 'rate'))}
      ${section('规划与外观')}
      ${group(row('生活费预留', amount2(reserveAmount()), 'tw2-reserve') +
        row('外观设置', '浅色 / 深色 / 主题', 'v3-themes'))}
      ${section('数据与安全')}
      ${group(row('导出本机数据', '包含旧版数据的 JSON 备份', 'export') +
        row('恢复旧版备份', '先验证，再确认覆盖', 'restore') +
        row('旧账本历史', state().transactions.length + ' 条 · 仅查看', 'tw2-history') +
        (window.TW_NATIVE ? row('检查新版本', '下载安装由系统确认', 'native-update') : ''))}
      ${note('所有数据保存在这台设备。导出文件包含私人财务信息，请妥善保存。')}
    `);
  }

  function historyHtml() {
    const history = state().transactions.slice().sort((a, b) => b.date.localeCompare(a.date));
    return sheetChrome('旧版历史记录', `<p class="sheet-subtitle">2.0 不再记账。以下记录只供查看或备份，不参与时薪与可安排金额计算。</p>
      ${history.length ? group(history.map(t => `<div class="tw2-legacy-row"><div><strong>${h(t.name)}</strong><small>${h(t.date)} · ${h(t.account || '未知来源')} · ${h(({ income: '收入', refund: '退款', expense: '支出', transfer: '转账' })[t.type] || '旧记录')}</small></div><span>${['income', 'refund'].includes(t.type) ? '+' : t.type === 'transfer' ? '' : '−'}${amount2(t.amount)}</span></div>`).join(''))
        : '<p class="tw2-empty-line">没有旧版消费记录。</p>'}
      ${action('export', '导出完整备份', 'primary full')}`);
  }

  renderSheet = function timeworth2Sheet() {
    if (!route || !['tw2-settings', 'tw2-reserve', 'tw2-history', 'tw2-wishes'].includes(route.type)) {
      oldRenderSheet(); return;
    }
    let html;
    if (route.type === 'tw2-settings') html = settingsHtml();
    else if (route.type === 'tw2-history') html = historyHtml();
    else if (route.type === 'tw2-wishes') html = sheetChrome('心愿清单', `${state().wishes.map(w =>
      action('wish', `<span class="row-label">${h(w.name)}</span><strong>${amount2(w.price)}</strong>${chevron()}`, 'list-row', `data-id="${h(w.id)}"`)).join('') || '<p class="tw2-empty-line">还没有收藏心愿。</p>'}
      ${action('new-wish', '＋ 添加心愿', 'secondary full')}`);
    else html = sheetChrome('生活费预留', `<p class="sheet-subtitle">这是你主动留给日常生活的估算金额，不需要记消费流水。</p>
      <label class="tw2-input-label" for="tw2-reserve-input">每月预留（元）</label>
      <input id="tw2-reserve-input" type="number" inputmode="decimal" min="0" max="9999999" step=".01" value="${reserveAmount()}">
      ${action('tw2-save-reserve', '保存预留', 'primary full')}
      ${note('这只影响估算可安排金额，不代表账户余额。')}`);
    sheet.innerHTML = html;
    sheet.hidden = false; backdrop.hidden = false; app.inert = true;
    $('#tab-bar').inert = true; $('#desktop-nav').inert = true;
    sheet.scrollTop = 0; sheet.focus({ preventScroll: true });
  };

  document.addEventListener('click', event => {
    const b = event.target.closest('button');
    if (!b) return;
    try {
      if (b.dataset.tw2Mode) { calcMode = b.dataset.tw2Mode; render(); return; }
      if (b.dataset.tw2Month) { futureMonth = b.dataset.tw2Month; render(); return; }
      if (b.dataset.tw2Step) { futureMonth = M.shiftMonth(futureMonth, Number(b.dataset.tw2Step)); render(); return; }
      switch (b.dataset.action) {
        case 'tw2-settings': open({ type: 'tw2-settings' }); break;
        case 'tw2-work': open(newEntity('work')); break;
        case 'tw2-reserve': open({ type: 'tw2-reserve' }); break;
        case 'tw2-history': open({ type: 'tw2-history' }); break;
        case 'tw2-future': navigate('plan'); break;
        case 'tw2-calculate': navigate('ledger'); break;
        case 'tw2-wishes': open({ type: 'tw2-wishes' }); break;
        case 'tw2-add-wish': {
          const price = Number(calcPrice);
          if (!(price > 0) || !Number.isFinite(price)) throw new Error('先输入有效的价格');
          const r = newEntity('wish'); r.draft.price = M.round(price); open(r); break;
        }
        case 'tw2-save-reserve': {
          const value = numericValue('#tw2-reserve-input', 0, 9999999), previous = state().timeworth2;
          state().timeworth2 = { ...(previous || {}), livingReserve: M.round(value) };
          if (!M.save()) { if (previous) state().timeworth2 = previous; else delete state().timeworth2; throw new Error('保存失败，请检查存储空间'); }
          close(); render(); toast('生活费预留已更新'); break;
        }
      }
    } catch (error) { toast(error.message || '操作失败'); }
  });

  document.addEventListener('input', event => {
    if (!['tw2-calc-price', 'tw2-payment', 'tw2-extra'].includes(event.target.id)) return;
    if (event.target.id === 'tw2-calc-price') calcPrice = event.target.value;
    if (event.target.id === 'tw2-payment') calcPayment = event.target.value;
    if (event.target.id === 'tw2-extra') calcExtra = event.target.value;
    const result = $('#tw2-calc-result');
    if (result) result.innerHTML = calculationResult();
  });
  document.addEventListener('change', event => {
    if (event.target.id === 'tw2-terms') {
      calcTerms = Number(event.target.value);
      const result = $('#tw2-calc-result'); if (result) result.innerHTML = calculationResult();
    }
  });

  const validateLegacyBackup = validateBackup;
  validateBackup = function timeworth2ValidateBackup(payload) {
    validateLegacyBackup(payload);
    const optional = payload.data?.timeworth2;
    if (optional !== undefined) {
      const value = optional?.livingReserve;
      if (typeof optional !== 'object' || optional === null || Array.isArray(optional) ||
        typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 9999999) {
        throw new Error('备份中的生活费预留数据不正确');
      }
    }
  };

  document.body.classList.add('tw2-ui');
  navs.splice(0, navs.length, ['home', '首页', 'home'], ['ledger', '算一算', 'calc'], ['plan', '未来', 'plan']);
  window.__timeworth2 = { configuredWork, available: available2, get calculation() { return { price: calcPrice, mode: calcMode }; } };
  render(false);
})();

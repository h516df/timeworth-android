/* TimeWorth 2.0 — non-ledger interface. The v2 store stays intact for safe upgrades. */
(() => {
  'use strict';

  const oldRenderSheet = renderSheet;
  const O = window.TimeWorthOcr;
  const Scenarios = window.TimeWorthScenarios;
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
  let ocrRows = [], ocrErrors = [], ocrBusy = false, ocrUndo = null;
  let scenario = { kind: 'job', income: '', cost: '', hours: '', upfront: '' };

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
        ${action('tw2-add-wish', '♡ 加入心愿', 'tw2-wish-action')}</div>
      ${action('tw2-scenario', '比较换工作、通勤、买车或租房 →', 'tw2-scenario-entry')}`;
  };

  plan = function timeworth2Future() {
    const rows = M.installments(futureMonth).sort((a, b) => a.date.localeCompare(b.date));
    const months = [-1, 0, 1].map(n => M.shiftMonth(futureMonth, n));
    return pageHeader('未来', '看清计划，慢慢靠近。') +
      `<section class="tw2-future-section">
        <div class="tw2-line-head"><h2>还款时间线</h2>${action('new-debt', '＋ 添加', 'tw2-inline')}</div>
        ${action('tw2-ocr', '从花呗、白条截图导入还款计划', 'tw2-ocr-entry')}
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
        row('截图识别还款', window.TW_NATIVE ? '本机中文识别，导入前逐条确认' : '仅 Android 应用支持', 'tw2-ocr') +
        row('旧账本历史', state().transactions.length + ' 条 · 仅查看', 'tw2-history') +
        (window.TW_NATIVE ? row('检查新版本', '下载安装由系统确认', 'native-update') : '') +
        row('关于与更新说明', '2.0 · 隐私与使用说明', 'tw2-about'))}
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

  function about2Html() {
    return sheetChrome('关于 TimeWorth 2.0', `<p class="sheet-subtitle">时间，值得。不记日常消费流水的时间价值与财务规划助手。</p>
      ${section('数据与隐私')}
      ${note('数据仅保存在本机，不需要账户。计算不会自动保存。截图识别在设备端进行，识别文字需确认才生成还款计划；截图本身不保存或上传。Google ML Kit 可能收集 SDK 运行指标。')}
      ${section('升级与恢复')}
      ${note('与 0.1.0 使用相同包名与原签名，正常覆盖安装会保留应用数据。升级或换机前建议先导出 JSON 备份；不得卸载旧版或清除数据来升级。')}
      ${window.TW_NATIVE ? action('native-update', '检查新版本及更新说明', 'primary full') : ''}
      <a class="tw2-release-link" href="https://github.com/h516df/app-releases/releases" target="_blank" rel="noopener noreferrer">查看公开版本与更新说明 ↗</a>
      ${note('采用 AndroidX WebKit、AndroidX Core（Apache-2.0）和 Google ML Kit 中文文字识别（Google API 服务条款）。应用内旧版历史只读保留。')}`);
  }

  function ocrReviewHtml() {
    const rows = ocrRows.map((item, i) => {
      const related = O.matches(state().debts, item);
      const update = related.possibleUpdates.length ? `<label>同日期已有导入计划，是否更新？
        <select data-tw2-ocr-update="${i}"><option value="">先选择原计划</option>
          ${related.possibleUpdates.map(d => `<option value="${h(d.id)}" ${item.updateId === d.id ? 'selected' : ''}>更新原计划 ${amount2(d.schedule[0].total)}</option>`).join('')}
        </select></label>` : '';
      return `<div class="tw2-ocr-row">
        <label class="tw2-ocr-check"><input type="checkbox" data-tw2-ocr-check="${i}" ${item.selected ? 'checked' : ''}>
          <span>第 ${i + 1} 条 · ${h(item.source || '手动补充')}</span></label>
        <div class="tw2-ocr-grid"><label>平台
          <input data-tw2-ocr-field="platform" data-index="${i}" value="${h(item.platform)}" maxlength="40"></label>
          <label>还款日期 ${item.dateHint ? `<small>${h(item.dateHint)}</small>` : ''}
          <input type="date" data-tw2-ocr-field="date" data-index="${i}" value="${h(item.date)}"></label>
          <label>应还总金额（元）
          <input type="number" step=".01" min=".01" max="9999999" data-tw2-ocr-field="amount" data-index="${i}" value="${h(String(item.amount || ''))}"></label></div>
        ${related.exact ? '<p class="tw2-ocr-notice">与已导入计划相同，保存时会跳过重复。</p>' : update}
        ${item.evidence ? `<details><summary>查看识别依据</summary><p>${h(item.evidence)}</p></details>` : ''}
      </div>`;
    }).join('');
    return sheetChrome('截图识别确认', `<p class="sheet-subtitle">先在设备上识别中文，再由你逐条确认日期与应还金额。只保存还款计划，不保存图片或消费流水。</p>
      ${ocrBusy ? '<p role="status" class="tw2-ocr-notice">正在逐张识别，请稍候…</p>' : ''}
      ${ocrErrors.map(t => `<p class="tw2-ocr-notice">${h(t)}</p>`).join('')}
      ${rows || '<p class="tw2-empty-line">尚无可确认的条目。可选多张截图，也可手动补充。</p>'}
      <div class="tw2-ocr-actions">${action('tw2-ocr-pick', window.TW_NATIVE ? '选择多张截图' : 'Android 端才能选图', 'secondary full')}
        ${action('tw2-ocr-add', '＋ 手动补充一条', 'secondary full')}
        ${action('tw2-ocr-save', '确认并加入还款计划', 'primary full', ocrRows.some(x => x.selected) ? '' : 'disabled')}</div>
      ${note('识别可能出错；含息费的应还总金额不能当作本金。ML Kit 在设备端处理截图，可能发送 SDK 运行指标。')}`);
  }

  const previousDebtView = debtView;
  debtView = function timeworth2DebtView(r) {
    const debt = state().debts.find(item => item.id === r.id);
    if (!debt?.compositionUnknown) return previousDebtView(r);
    const periods = debt.schedule;
    const unpaid = periods.filter(p => !p.paid);
    return sheetChrome(h(debt.name), `<div class="detail-hero"><span>剩余待还（截图确认）</span>
      <strong>${amount2(unpaid.reduce((sum, p) => sum + p.total, 0))}</strong>
      <small>${unpaid.length} 期待还 · 仅有应还总金额，本金与息费构成未知</small></div>
      ${note('截图不提供可靠的本金与利息拆分。点击期次可调整应还总额和日期；右侧可标记已还，或撤销已还。')}
      ${group(periods.map((p, i) => `<div class="period-row">
        ${action('period', `<span class="period-num">${i + 1}</span><span class="flex-copy"><strong>${h(p.date)}</strong><small>应还总额 · 息费构成未知</small></span><strong>${amount2(p.total)}</strong>`, 'period-open', `data-id="${h(debt.id)}" data-period="${h(p.id)}"`)}
        ${action('paid', p.paid ? icon('check') : '', `paid-check ${p.paid ? 'checked' : ''}`, `data-id="${h(debt.id)}" data-period="${h(p.id)}" aria-label="${p.paid ? '撤销已还' : '标记已还'}" aria-pressed="${p.paid}"`)}
      </div>`).join(''))}
      ${action('delete-debt', '删除这份计划', 'danger full', `data-id="${h(debt.id)}"`)}`);
  };

  function ocrSummaryHtml() {
    const result = ocrUndo?.result || [];
    return sheetChrome('还款计划已核对', `<p class="sheet-subtitle">新增 ${result.filter(x => x.action === 'created').length} 条，更新 ${result.filter(x => x.action === 'updated').length} 条，跳过重复 ${result.filter(x => x.action === 'duplicate').length} 条。</p>
      ${action('tw2-ocr-undo', '撤销本次导入', 'secondary full')}
      ${action('tw2-ocr-done', '查看还款时间线', 'primary full')}
      ${note('撤销只在本次操作后、其他还款计划尚未改变时有效。')}`);
  }

  function scenarioResultHtml() {
    const rate = configuredWork().rate;
    const r = Scenarios.compare(scenario, rate);
    const signed = value => value > 0 ? '+' + amount2(value) : value < 0 ? '−' + amount2(-value) : amount2(0);
    return `<div class="tw2-scenario-result">
      <div><span>每月现金变化</span><strong>${r.cashDelta === null ? '资料不足' : signed(r.cashDelta)}</strong></div>
      <div><span>时间价值参考（不是真实收入）</span><strong>${r.timeValue === null ? '资料不足' : signed(r.timeValue)}</strong></div>
      <div><span>合计对比参考</span><strong>${r.combined === null ? '无法完整估算' : signed(r.combined)}</strong></div>
      <p>${r.payback !== null ? `若额外一次投入 ${amount2(r.upfront)}，且每月差异不变，约 ${r.payback} 个月抵回投入。` : '没有可靠的正向月度优势时，不计算回本时间。'}</p>
      <small>各项变化均相对于现在；正数代表新方案更有利。未填资料不默认设为 0。时间价值并不是可兑现的收入，也不是账户余额。</small>
    </div>`;
  }

  function scenarioHtml() {
    return sheetChrome('比较一种选择', `<p class="sheet-subtitle">以当前状况为方案 A，填写新方案 B 与现在的差异。花钱与占用时间分开看，结果默认不保存。</p>
      <label class="tw2-input-label">想比较什么</label>
      <select id="tw2-scenario-kind" class="tw2-scenario-select">
        ${[['job','换工作'],['commute','改变通勤'],['car','买车或换交通方式'],['rent','租房或搬家']].map(([key,label]) => `<option value="${key}" ${scenario.kind === key ? 'selected' : ''}>${label}</option>`).join('')}
      </select>
      <div class="tw2-scenario-form">
        <label>新方案每月收入增加／减少（元）<input type="number" data-tw2-scenario="income" step=".01" placeholder="例如 +800 或 -300" value="${h(scenario.income)}"></label>
        <label>新方案每月新增费用（元）<input type="number" data-tw2-scenario="cost" min="0" step=".01" placeholder="交通、房租等；不重复填已计负担" value="${h(scenario.cost)}"></label>
        <label>每月节省的时间（小时，可填负数）<input type="number" data-tw2-scenario="hours" step=".01" placeholder="省下填正数，多耗填负数" value="${h(scenario.hours)}"></label>
        <label>一次性新增费用（元，可选）<input type="number" data-tw2-scenario="upfront" min="0" step=".01" placeholder="购车、搬家等一次投入" value="${h(scenario.upfront)}"></label>
      </div>
      <div id="tw2-scenario-result">${scenarioResultHtml()}</div>
      ${note('输入 0 表示确认没有变化；留空表示未知。未来变化仅为情景假设，不强迫你记录日常流水。')}`);
  }

  renderSheet = function timeworth2Sheet() {
    if (!route || !['tw2-settings', 'tw2-reserve', 'tw2-history', 'tw2-about', 'tw2-wishes', 'tw2-ocr', 'tw2-ocr-summary', 'tw2-scenario'].includes(route.type)) {
      oldRenderSheet(); return;
    }
    let html;
    if (route.type === 'tw2-settings') html = settingsHtml();
    else if (route.type === 'tw2-history') html = historyHtml();
    else if (route.type === 'tw2-about') html = about2Html();
    else if (route.type === 'tw2-ocr') html = ocrReviewHtml();
    else if (route.type === 'tw2-ocr-summary') html = ocrSummaryHtml();
    else if (route.type === 'tw2-scenario') html = scenarioHtml();
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
        case 'tw2-about': open({ type: 'tw2-about' }); break;
        case 'tw2-future': navigate('plan'); break;
        case 'tw2-calculate': navigate('ledger'); break;
        case 'tw2-scenario': open({ type: 'tw2-scenario' }); break;
        case 'tw2-ocr': open({ type: 'tw2-ocr' }); break;
        case 'tw2-ocr-pick': {
          if (!window.TW_NATIVE || !window.TimeWorthHost?.postMessage) throw new Error('请在 Android 应用中选择截图');
          if (ocrBusy) throw new Error('上一批截图仍在识别');
          ocrBusy = true; ocrErrors = [];
          window.TimeWorthHost.postMessage(JSON.stringify({ type: 'ocr-import' }));
          renderSheet(); break;
        }
        case 'tw2-ocr-add': {
          if (ocrRows.length >= 50) throw new Error('单批最多核对 50 条');
          ocrRows.push({ platform: '花呗', date: '', dateHint: '', amount: '', source: '手动补充', selected: true });
          renderSheet(); break;
        }
        case 'tw2-ocr-save': {
          const selected = ocrRows.filter(item => item.selected);
          if (!selected.length) throw new Error('请勾选至少一条还款');
          const previous = M.clone(state().debts);
          const { debts, changed } = O.applyConfirmed(previous, selected, M.uid);
          state().debts = debts;
          if (!M.save()) { state().debts = previous; throw new Error('本机存储失败，原还款计划未改变'); }
          ocrUndo = { before: previous, after: JSON.stringify(debts), result: changed };
          ocrRows = []; ocrErrors = [];
          open({ type: 'tw2-ocr-summary' }); render(); break;
        }
        case 'tw2-ocr-undo': {
          if (!ocrUndo || JSON.stringify(state().debts) !== ocrUndo.after)
            throw new Error('还款计划已被其他操作修改，不能整体撤销。请逐条核对');
          const current = state().debts;
          state().debts = ocrUndo.before;
          if (!M.save()) { state().debts = current; throw new Error('撤销保存失败，原数据未改变'); }
          ocrUndo = null; navigate('plan'); toast('已撤销本次导入'); break;
        }
        case 'tw2-ocr-done': navigate('plan'); break;
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
    if (event.target.id === 'tw2-scenario-kind') {
      scenario = { kind: event.target.value, income: '', cost: '', hours: '', upfront: '' };
      renderSheet(); return;
    }
    if (event.target.dataset?.tw2OcrCheck !== undefined) {
      const row = ocrRows[Number(event.target.dataset.tw2OcrCheck)];
      if (row) row.selected = event.target.checked;
      return;
    }
    if (event.target.dataset?.tw2OcrUpdate !== undefined) {
      const row = ocrRows[Number(event.target.dataset.tw2OcrUpdate)];
      if (row) row.updateId = event.target.value || undefined;
      return;
    }
    if (event.target.id === 'tw2-terms') {
      calcTerms = Number(event.target.value);
      const result = $('#tw2-calc-result'); if (result) result.innerHTML = calculationResult();
    }
  });

  document.addEventListener('input', event => {
    const scenarioKey = event.target.dataset?.tw2Scenario;
    if (scenarioKey && ['income', 'cost', 'hours', 'upfront'].includes(scenarioKey)) {
      scenario[scenarioKey] = event.target.value;
      const result = $('#tw2-scenario-result'); if (result) result.innerHTML = scenarioResultHtml();
      return;
    }
    const key = event.target.dataset?.tw2OcrField, index = Number(event.target.dataset?.index);
    if (!key || !ocrRows[index] || !['platform', 'date', 'amount'].includes(key)) return;
    ocrRows[index][key] = event.target.value;
  });

  window.__timeworth2OcrReceive = payload => {
    ocrBusy = false;
    if (!payload || payload.status === 'error' || payload.status === 'cancelled') {
      ocrErrors.push(payload?.message || '截图读取失败，原计划未改变');
    } else if (payload.status === 'done' && Array.isArray(payload.images)) {
      for (const image of payload.images.slice(0, 10)) {
        if (image.error) { ocrErrors.push(`${image.source || '截图'}：${image.error}`); continue; }
        const rows = O.parseText(image.text || '', image.source || '截图');
        if (!rows.length) ocrErrors.push(`${image.source || '截图'}：没有可靠的还款金额，可手动补充`);
        for (const item of rows) {
          if (ocrRows.length >= 50) break;
          if (ocrRows.some(old => old.platform === item.platform && old.date === item.date && old.amount === item.amount)) continue;
          ocrRows.push({ ...item, selected: true });
        }
      }
    } else ocrErrors.push('识别结果异常，请重新导入');
    if (route?.type === 'tw2-ocr') renderSheet();
    else toast('截图识别已结束，打开未来页继续确认');
  };

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

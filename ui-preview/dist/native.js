/* Android-specific entry, persistence and system operations. Uses the same product model. */
(() => {
  if (!window.TW_NATIVE) return;
  document.body.classList.add('native-app');
  let appVersion = '0.1.0', themeSent;
  const send = data => {
    if (!window.TimeWorthHost?.postMessage) throw new Error('系统接口暂不可用，请重新打开应用');
    window.TimeWorthHost.postMessage(JSON.stringify(data));
  };
  const baseHeader = header;
  header = (title, tools = '') => baseHeader(title, tools).replace(/(<span class="demo-dot">)[^<]*(<\/span>)/, '$1本机保存$2');
  const baseHome = home;
  home = () => baseHome().replace('</header>', `</header><button class="native-hourly card" data-action="rate"><span><small>${state().work.basis === 'real' ? '含通勤与工作成本' : '你的到手时薪'}</small><strong>${yuan(M.rate())}<em>/ 小时</em></strong></span><span class="native-hourly-end">工资与工时 ${chevron()}</span></button>`);
  const baseProfile = profile;
  profile = () => baseProfile()
    .replace('版本与参考', '关于 TimeWorth').replace('体验版 05', appVersion)
    .replace('重置体验', '清空本机数据')
    .replace('修改只保存在当前浏览器；换设备前可导出备份。', '数据仅保存在此手机。换手机或卸载前，请先导出备份。')
    + section('应用更新') + group(row('检查新版本', appVersion, 'native-update', '', 'upload'));
  aboutView = () => sheetChrome('关于 TimeWorth', `<div class="about-brand"><span class="brand-mark">t<span>·</span></span><h2>TimeWorth</h2><p>时间，值得。</p><span class="tiny-tag">安卓 ${h(appVersion)}</span></div>${group('<div class="info-copy"><h3>属于你自己的账本</h3><p>工资和工时、消费折算、分期应还、心愿与储蓄目标，离线就能使用。数据保存在这台手机，不上传账单，不连接支付账户，也不会自动扣款。</p><h3>备份与恢复</h3><p>在设置中导出 JSON 备份。原网页的第 2 版备份也可以导入；安装 App 不会自动读取浏览器账本。请在卸载或更换手机前导出备份。</p><h3>收录范围</h3><p>支持 CSV / Excel 文件与粘贴账单文字。通知自动采集、PDF、加密文件和截图识别尚未接通。月末结余依赖已收录数据，并非银行实时余额。</p><h3>更新</h3><p>主动检查公开版本，下载后校验大小、摘要、包名、版本和原签名，再由安卓系统确认。升级保留账本。</p><h3>开源组件</h3><p>AndroidX WebKit / Core 与 SheetJS Community Edition，Apache-2.0 许可。图片和原网页一致，随安装包离线保存。</p></div>')}${action('native-update', '检查新版本', 'primary full')}`);
  persist = () => {
    if (!M.save()) throw new Error('手机存储空间不足，未能保存。请先导出备份并释放空间');
    return true;
  };
  download = (contents, name, mime = 'application/json') => send({ type: 'save', contents, name, mime });
  const baseRender = render;
  function setupView() {
    app.innerHTML = `<div class="native-welcome"><span class="brand-mark">t<span>·</span></span><p class="eyebrow">TIMEWORTH</p><h1>一小时，<br>值多少。</h1><p class="native-intro">填下工资和工时。<br>下次想买一件东西，换一种方式看懂。</p><form id="native-setup" class="card native-setup"><label>每月到手工资<span class="native-input"><b>¥</b><input id="setup-salary" type="number" inputmode="decimal" min="1" max="9999999" step="0.01" required placeholder="填实际到手金额" aria-label="每月到手工资"></span></label><div class="native-work-grid"><label>每月工作天数<input id="setup-days" type="number" inputmode="numeric" min="1" max="31" step="1" required value="22" aria-label="每月工作天数"></label><label>每天工作小时<input id="setup-hours" type="number" inputmode="decimal" min="0.5" max="24" step="0.5" required value="8" aria-label="每天工作小时"></label></div><p class="footnote">按你的实际安排调整天数；通勤与工作成本稍后可选。</p><button type="submit" class="primary full">开始使用</button><p id="setup-error" role="alert"></p></form>${action('native-restore', '从网页或旧手机的备份恢复', 'text-button full')}<p class="native-privacy">免登录 · 离线可用 · 账单不上传</p></div>`;
    app.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      try {
        const salary = numericValue('#setup-salary', 1, 9999999), days = numericValue('#setup-days', 1, 31), hours = numericValue('#setup-hours', .5, 24);
        if (!Number.isInteger(days)) throw new Error('工作天数请使用整数');
        Object.assign(state().work, { salary, days, hours });
        state().nativeSetup = true;
        v3().cash.incomes = [{ id: 'salary-' + M.month(), name: '工资', salary: true, amount: salary, date: M.today(), received: false }];
        persist(); render(false); toast('已设置时薪。工资实际到账后，再确认这笔到账');
      } catch (error) { $('#setup-error').textContent = error.message; }
    });
  }
  render = (keep = true) => {
    baseRender(keep);
    const needsSetup = state().nativeSetup === false;
    document.body.classList.toggle('needs-setup', needsSetup);
    if (needsSetup) setupView();
    const dark = v3().theme === 'night';
    if (dark !== themeSent) {
      themeSent = dark;
      if (window.TimeWorthHost) send({ type: 'theme', dark });
    }
  };
  const checkBackup = validateBackup;
  validateBackup = payload => {
    checkBackup(payload);
    const data = payload.data, cash = data.v3?.cash;
    const finiteAmount = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 99999999;
    const validDate = d => typeof d === 'string' && /^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(d) && d === M.dueDate(d.slice(0, 7), Number(d.slice(8))) && Number(d.slice(8)) >= 1;
    if (data.v3 && (!cash || !Array.isArray(cash.incomes) || !Array.isArray(cash.fixed) || !Array.isArray(data.v3.sources))) throw new Error('备份中的工资或来源数据不完整');
    for (const entry of cash?.incomes || []) if (!finiteAmount(entry.amount) || !validDate(entry.date) || typeof entry.id !== 'string' || typeof entry.name !== 'string' || typeof entry.received !== 'boolean') throw new Error('备份中的工资到账记录不正确');
    for (const entry of cash?.fixed || []) if (!finiteAmount(entry.amount) || typeof entry.name !== 'string') throw new Error('备份中的固定支出不正确');
    for (const entry of data.v3?.sources || []) if (typeof entry.name !== 'string' || typeof entry.id !== 'string' || !['cash', 'credit'].includes(entry.kind)) throw new Error('备份中的资金来源不正确');
    if (cash?.incomes.length > 10000 || cash?.fixed.length > 10000 || data.v3?.sources.length > 1000) throw new Error('备份记录过多，请拆分后恢复');
  };
  async function restore() {
    chooseFile('.json,application/json', async file => {
      if (file.size > 5 * 1024 * 1024) throw new Error('备份文件需小于 5MB');
      const payload = JSON.parse(await file.text());
      validateBackup(payload);
      open({ type: 'confirm', title: '恢复这份备份？', message: '当前手机账本会被替换。建议先导出现有数据备份；网页原账本不会被删除。', label: '恢复备份', danger: false, operation: () => {
        const previous = M.clone(state());
        try {
          for (const key of Object.keys(state())) delete state()[key];
          Object.assign(state(), payload.data, { nativeSetup: true });
          initializeV3(); state().v4 ??= { density: 'comfortable', wallpaper: null };
          persist(); salaryMonth = M.month(); navigate('home'); render(false); toast('备份已恢复，账本保存在此手机');
        } catch (error) {
          for (const key of Object.keys(state())) delete state()[key];
          Object.assign(state(), previous); throw error;
        }
      }});
    });
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('button'), actionName = button?.dataset.action;
    if (!['native-update', 'native-restore', 'restore', 'reset'].includes(actionName)) return;
    event.preventDefault(); event.stopImmediatePropagation();
    try {
      if (actionName === 'native-update') send({ type: 'update' });
      else if (actionName === 'restore' || actionName === 'native-restore') restore();
      else open({ type: 'confirm', title: '清空这台手机的账本？', message: '工资、消费、应还、心愿和目标将全部清空。此操作无法撤销，请先在设置中导出备份。', label: '确认清空', operation: () => { M.reset(); navigate('home'); render(false); toast('本机账本已清空'); }});
    } catch (error) { toast(error.message); }
  }, true);
  window.__timeworthNative = {
    setVersion(version) { appVersion = version; if (tab === 'profile' && !route) render(); },
    back() {
      const menu = sheet.querySelector('.apple-choice-menu');
      if (menu) { menu.remove(); sheet.querySelector('[aria-expanded="true"]')?.setAttribute('aria-expanded', 'false'); return true; }
      if (route) { back(); return true; }
      if (tab !== 'home') { navigate('home'); return true; }
      return false;
    }
  };
  render(false);
})();

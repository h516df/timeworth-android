// Only bundled Android content gets a clean first-run experience. Browser demo is unchanged.
window.TW_NATIVE = location.origin === 'https://appassets.androidplatform.net';
if (window.TW_NATIVE) {
  try {
    // Some older Android releases keep a preinstalled WebView that cannot parse the product.
    new Function('let value; value ??= 1; return value?.toString();')();
    if (typeof ''.replaceAll !== 'function') throw new Error('Old engine');
  } catch (error) {
    document.body.innerHTML = '<main style="padding:36px 24px;font:17px/1.8 sans-serif"><h1 style="font-size:26px">请更新系统网页组件</h1><p>在手机应用商店更新 Android System WebView 或 Chrome 后，再打开 TimeWorth。</p><p>这不会删除已经保存的账本。</p></main>';
  }
}

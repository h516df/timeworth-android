package dev.h516.timeworth;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

/** Offline product with a narrowly scoped, origin-checked native message bridge. */
public final class MainActivity extends Activity {
    static final String ORIGIN = "https://appassets.androidplatform.net";
    static final String START = ORIGIN + "/assets/product/index.html";
    private static final int OPEN_FILE = 10, SAVE_FILE = 11;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;
    private byte[] pendingExport;
    private FrameLayout root;
    private UpdateManager updater;

    @Override public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(242, 244, 248));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
        setContentView(root);
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(242, 244, 248));
        root.addView(web, new FrameLayout.LayoutParams(-1, -1));
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true); // Android's user-selected document URI only.
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        final WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse asset = assets.shouldInterceptRequest(request.getUrl());
                if (asset != null) return asset;
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Offline content only",
                    java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (START.equals(uri.toString())) return false;
                if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (ActivityNotFoundException error) { message("没有找到可打开链接的浏览器"); }
                }
                return true;
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (START.equals(url)) {
                    view.evaluateJavascript("window.__timeworthNative?.setVersion(" + JSONObject.quote(BuildConfig.VERSION_NAME) + ")", null);
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                                        FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*");
                String[] types = params.getAcceptTypes();
                if (types.length == 1 && types[0].startsWith("image/")) intent.setType("image/*");
                try { startActivityForResult(intent, OPEN_FILE); }
                catch (ActivityNotFoundException error) {
                    fileCallback.onReceiveValue(null); fileCallback = null;
                    message("系统文件选择器不可用，请安装系统文件管理器后重试");
                }
                return true;
            }
        });
        updater = new UpdateManager(this);
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            new AlertDialog.Builder(this).setTitle("请更新 Android System WebView")
                .setMessage("TimeWorth 需要较新的系统网页组件。请在手机应用商店更新 Android System WebView 或 Chrome 后重新打开，现有数据会保留。")
                .setPositiveButton("知道了", (dialog, which) -> finish()).setCancelable(false).show();
            return;
        }
        WebViewCompat.addWebMessageListener(web, "TimeWorthHost", Collections.singleton(ORIGIN),
            (view, message, sourceOrigin, mainFrame, reply) -> {
                if (!mainFrame || !ORIGIN.equals(sourceOrigin.toString()) || !START.equals(view.getUrl())) return;
                try {
                    String raw = message.getData();
                    if (raw == null || raw.length() > 7 * 1024 * 1024) throw new IllegalArgumentException();
                    JSONObject data = new JSONObject(raw);
                    switch (data.getString("type")) {
                        case "save": saveDocument(data); break;
                        case "update": updater.check(); break;
                        case "theme": applySystemTheme(data.optBoolean("dark")); break;
                        case "exit": finish(); break;
                        default: break;
                    }
                } catch (Exception error) { message("操作未完成，请重试或先导出数据备份"); }
            });
        web.loadUrl(START);
    }

    private void saveDocument(JSONObject data) throws Exception {
        if (pendingExport != null) { message("请先完成或取消上一次保存"); return; }
        String name = data.getString("name");
        String mime = data.getString("mime").split(";")[0];
        if (!name.matches("timeworth-[a-zA-Z0-9_.-]+") ||
            !(mime.equals("application/json") || mime.equals("text/csv"))) throw new IllegalArgumentException();
        pendingExport = data.getString("contents").getBytes(StandardCharsets.UTF_8);
        if (pendingExport.length > 6 * 1024 * 1024) { pendingExport = null; throw new IllegalArgumentException(); }
        try {
            startActivityForResult(new Intent(Intent.ACTION_CREATE_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE).setType(mime).putExtra(Intent.EXTRA_TITLE, name), SAVE_FILE);
        } catch (ActivityNotFoundException error) {
            pendingExport = null; message("系统文件保存器不可用，未保存备份");
        }
    }

    private void applySystemTheme(boolean dark) {
        int background = dark ? Color.rgb(18, 20, 24) : Color.rgb(242, 244, 248);
        root.setBackgroundColor(background); web.setBackgroundColor(background);
        getWindow().setStatusBarColor(background); getWindow().setNavigationBarColor(background);
        getWindow().getDecorView().setSystemUiVisibility(dark ? 0 :
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == OPEN_FILE && fileCallback != null) {
            Uri uri = resultCode == RESULT_OK && data != null ? data.getData() : null;
            fileCallback.onReceiveValue(uri == null ? null : new Uri[]{uri}); fileCallback = null;
        } else if (requestCode == SAVE_FILE) {
            byte[] bytes = pendingExport; pendingExport = null;
            if (resultCode != RESULT_OK || data == null || data.getData() == null || bytes == null) {
                message("已取消保存，手机中的原数据仍保留"); return;
            }
            try (OutputStream output = getContentResolver().openOutputStream(data.getData(), "wt")) {
                if (output == null) throw new IllegalStateException();
                output.write(bytes); output.flush(); message("备份已保存到所选位置");
            } catch (Exception error) { message("文件未能保存，请重试。手机中的原数据仍保留"); }
        } else if (requestCode == UpdateManager.INSTALL_PERMISSION) updater.afterPermission();
    }

    @Override public void onBackPressed() {
        if (web != null) web.evaluateJavascript("window.__timeworthNative?.back()", result -> {
            if (!"true".equals(result)) super.onBackPressed();
        });
        else super.onBackPressed();
    }
    void message(String text) { runOnUiThread(() -> Toast.makeText(this, text, Toast.LENGTH_LONG).show()); }
    @Override protected void onDestroy() {
        if (fileCallback != null) fileCallback.onReceiveValue(null);
        pendingExport = null;
        if (updater != null) updater.close();
        if (web != null) { root.removeView(web); web.destroy(); }
        super.onDestroy();
    }
}

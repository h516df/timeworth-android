package dev.h516.timeworth;

import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import org.json.JSONArray;
import org.json.JSONObject;
import javax.net.ssl.HttpsURLConnection;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Set;
import java.util.Arrays;
import java.util.HashSet;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/** Public per-app catalog. No credentials, account login, or cross-app latest endpoint. */
final class UpdateManager {
    static final int INSTALL_PERMISSION = 12;
    private static final String MANIFEST = "https://api.github.com/repositories/1426495445/contents/apps/timeworth/stable.json?ref=main";
    private static final Set<String> HOSTS = new HashSet<>(Arrays.asList("api.github.com", "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com", "github-releases.githubusercontent.com"));
    private static final long MAX_APK = 60L * 1024 * 1024;
    private final MainActivity activity;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final AtomicBoolean cancelled = new AtomicBoolean();
    private boolean busy;
    private File verifiedApk;
    private HttpsURLConnection connection;

    UpdateManager(MainActivity activity) { this.activity = activity; }

    void check() {
        if (busy) { activity.message("正在检查或下载，请稍候"); return; }
        busy = true; cancelled.set(false);
        activity.message("正在检查 TimeWorth 新版本…");
        worker.execute(() -> {
            try {
                JSONObject catalog = new JSONObject(new String(read(MANIFEST, 1024 * 1024), java.nio.charset.StandardCharsets.UTF_8));
                if (catalog.getInt("schemaVersion") != 1 || catalog.getLong("repositoryId") != 1426495445L ||
                    !"timeworth".equals(catalog.getString("appId")) || !"stable".equals(catalog.getString("channel")))
                    throw new IllegalStateException("更新清单身份不匹配，已停止");
                if ("unavailable".equals(catalog.getString("status"))) { activity.message("暂无可用的新版本"); return; }
                if (!"published".equals(catalog.getString("status"))) throw new IllegalStateException("更新清单格式不受支持");
                if (!BuildConfig.APPLICATION_ID.equals(catalog.getString("applicationId"))) {
                    activity.message("当前为独立体验包。正式版发布后请导出备份，再安装正式版并恢复"); return;
                }
                JSONObject release = catalog.getJSONObject("release");
                if (release.getLong("versionCode") <= BuildConfig.VERSION_CODE) { activity.message("当前已是最新版本（" + BuildConfig.VERSION_NAME + "）"); return; }
                if (release.getInt("minSdk") > Build.VERSION.SDK_INT) throw new IllegalStateException("新版本需要更新的 Android 系统");
                JSONObject apk = release.getJSONObject("apk");
                if (!apk.getString("sha256").matches("[0-9a-f]{64}") ||
                    !release.getString("signingCertificateSha256").matches("[0-9a-f]{64}") ||
                    apk.getLong("size") <= 0 || apk.getLong("size") > MAX_APK) throw new IllegalStateException("安装包信息不完整");
                allowed(new URL(apk.getString("url")));
                StringBuilder notes = new StringBuilder("版本 ").append(release.getString("versionName")).append("\n\n");
                JSONObject text = release.optJSONObject("notes");
                if (text != null) for (String kind : new String[]{"新增", "改进", "修复", "说明"}) {
                    JSONArray lines = text.optJSONArray(kind);
                    if (lines != null) for (int i = 0; i < Math.min(lines.length(), 12); i++) notes.append(kind).append(" · ").append(lines.getString(i)).append('\n');
                }
                notes.append("\n下载后会核对完整性、包名、版本和原签名，再由系统确认安装。现有数据会保留。");
                activity.runOnUiThread(() -> {
                    if (activity.isFinishing()) return;
                    new AlertDialog.Builder(activity).setTitle("发现新版本").setMessage(notes.toString())
                        .setNegativeButton("以后再说", null)
                        .setPositiveButton("下载更新", (dialog, which) -> download(release)).show();
                });
            } catch (Exception error) { if (!cancelled.get()) activity.message(userError(error)); }
            finally { busy = false; }
        });
    }

    private void download(JSONObject release) {
        if (busy) return;
        busy = true; cancelled.set(false);
        AlertDialog progress = new AlertDialog.Builder(activity).setTitle("下载 TimeWorth")
            .setMessage("正在下载，完成后会验证安装包…")
            .setNegativeButton("取消下载", (dialog, which) -> cancelled.set(true)).create();
        progress.setOnCancelListener(dialog -> cancelled.set(true)); progress.show();
        worker.execute(() -> {
            File target = null;
            try {
                File directory = new File(activity.getCacheDir(), "updates");
                if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("手机空间不足");
                target = new File(directory, "timeworth-update.apk");
                JSONObject apk = release.getJSONObject("apk");
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                long count = 0, lastUpdate = 0, expected = apk.getLong("size");
                try (InputStream input = connect(apk.getString("url")).getInputStream(); FileOutputStream output = new FileOutputStream(target)) {
                    byte[] buffer = new byte[32768]; int length;
                    while ((length = input.read(buffer)) != -1) {
                        if (cancelled.get()) throw new InterruptedException();
                        count += length;
                        if (count > expected || count > MAX_APK) throw new IllegalStateException("下载大小与发布信息不符");
                        digest.update(buffer, 0, length); output.write(buffer, 0, length);
                        if (System.currentTimeMillis() - lastUpdate > 500) {
                            lastUpdate = System.currentTimeMillis();
                            final long percent = count * 100 / expected;
                            activity.runOnUiThread(() -> progress.setMessage("已下载 " + percent + "%\n完成后核对完整性与原签名"));
                        }
                    }
                }
                if (count != expected || !hex(digest.digest()).equals(apk.getString("sha256"))) throw new IllegalStateException("安装包校验失败，请重新下载");
                verify(target, release);
                if (cancelled.get()) throw new InterruptedException();
                verifiedApk = target;
                activity.runOnUiThread(this::install);
            } catch (Exception error) {
                if (target != null) target.delete();
                activity.message(cancelled.get() ? "已取消更新，原版本和数据仍保留" : userError(error));
            } finally {
                if (connection != null) connection.disconnect();
                busy = false; activity.runOnUiThread(progress::dismiss);
            }
        });
    }

    private void verify(File file, JSONObject release) throws Exception {
        PackageManager pm = activity.getPackageManager();
        int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
        PackageInfo archive = pm.getPackageArchiveInfo(file.getPath(), flags);
        PackageInfo installed = pm.getPackageInfo(activity.getPackageName(), flags);
        if (archive == null || !activity.getPackageName().equals(archive.packageName) ||
            archive.versionCode != release.getLong("versionCode") || archive.versionCode <= installed.versionCode ||
            !release.getString("versionName").equals(archive.versionName) ||
            archive.applicationInfo.minSdkVersion != release.getInt("minSdk")) throw new IllegalStateException("安装包身份或版本不匹配");
        String expected = release.getString("signingCertificateSha256");
        if (!expected.equals(certificate(archive)) || !expected.equals(certificate(installed))) throw new IllegalStateException("安装包不是当前应用的原签名，已停止");
    }

    private static String certificate(PackageInfo info) throws Exception {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28 ? info.signingInfo.getApkContentsSigners() : info.signatures;
        if (signatures == null || signatures.length != 1) throw new IllegalStateException("签名格式不受支持");
        return hex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()));
    }

    private void install() {
        if (verifiedApk == null || !verifiedApk.isFile() || activity.isFinishing()) return;
        if (!activity.getPackageManager().canRequestPackageInstalls()) {
            new AlertDialog.Builder(activity).setTitle("允许安装 TimeWorth 更新")
                .setMessage("接下来由系统请求允许此应用安装更新。允许后返回，就能继续安装。不会清除已有数据。")
                .setNegativeButton("稍后", null).setPositiveButton("前往系统设置", (dialog, which) -> {
                    try { activity.startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + activity.getPackageName())), INSTALL_PERMISSION); }
                    catch (Exception error) { activity.message("请在系统设置中允许 TimeWorth 安装应用后重试"); }
                }).show();
            return;
        }
        try {
            Uri uri = FileProvider.getUriForFile(activity, activity.getPackageName() + ".files", verifiedApk);
            activity.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
        } catch (Exception error) { activity.message("无法打开系统安装器，请稍后重试"); }
    }
    void afterPermission() {
        if (activity.getPackageManager().canRequestPackageInstalls()) install();
        else activity.message("未获得安装授权，原版本仍可继续使用");
    }
    private static void allowed(URL url) {
        if (!"https".equals(url.getProtocol()) || !HOSTS.contains(url.getHost()) ||
            (url.getPort() != -1 && url.getPort() != 443) || url.getUserInfo() != null)
            throw new IllegalArgumentException("更新地址不受信任");
    }
    private HttpsURLConnection connect(String address) throws Exception {
        URL url = new URL(address);
        for (int redirect = 0; redirect < 6; redirect++) {
            allowed(url);
            HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
            connection = conn;
            conn.setConnectTimeout(15000); conn.setReadTimeout(20000); conn.setInstanceFollowRedirects(false);
            conn.setRequestProperty("User-Agent", "TimeWorth-Android/" + BuildConfig.VERSION_NAME);
            conn.setRequestProperty("Accept", "application/vnd.github.raw+json");
            int status = conn.getResponseCode();
            if (status >= 300 && status < 400) { String location = conn.getHeaderField("Location"); conn.disconnect(); url = new URL(url, location); continue; }
            if (status == 403 || status == 429) { conn.disconnect(); throw new IllegalStateException("检查服务暂时限流，请稍后重试；手机数据不受影响"); }
            if (status != 200) { conn.disconnect(); throw new IllegalStateException("暂时无法连接更新服务，请稍后重试"); }
            return conn;
        }
        throw new IllegalStateException("更新地址跳转过多");
    }
    private byte[] read(String address, int max) throws Exception {
        try (InputStream input = connect(address).getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = input.read(buffer)) != -1) {
                if (cancelled.get() || output.size() + count > max) throw new IllegalStateException("更新清单过大或操作已取消");
                output.write(buffer, 0, count);
            }
            return output.toByteArray();
        } finally { if (connection != null) connection.disconnect(); }
    }
    private static String hex(byte[] bytes) { StringBuilder text = new StringBuilder(); for (byte b : bytes) text.append(String.format("%02x", b & 255)); return text.toString(); }
    private static String userError(Exception error) {
        return error instanceof IllegalStateException || error instanceof IllegalArgumentException ? error.getMessage() : "网络暂时不可用，请稍后重试。现有版本和数据仍可使用";
    }
    void close() { cancelled.set(true); if (connection != null) connection.disconnect(); worker.shutdownNow(); }
}

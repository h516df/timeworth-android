package dev.h516.timeworth;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.webkit.WebView;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.chinese.ChineseTextRecognizerOptions;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStream;
import java.util.ArrayList;

/** Screenshot recognition only. No server transmission, long-lived URI, or image storage. */
final class RepaymentOcr {
    static final int PICK_IMAGES = 13;
    private static final int MAX_IMAGES = 10;
    private static final long MAX_PIXELS = 20_000_000L;
    private final Activity activity;
    private final WebView web;
    private final TextRecognizer recognizer = TextRecognition.getClient(
        new ChineseTextRecognizerOptions.Builder().build());
    private boolean busy;

    RepaymentOcr(Activity activity, WebView web) { this.activity = activity; this.web = web; }

    void pick() {
        if (busy) { send("error", "正在识别上一批截图", null); return; }
        busy = true;
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT)
            .addCategory(Intent.CATEGORY_OPENABLE).setType("image/*")
            .putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
        try { activity.startActivityForResult(intent, PICK_IMAGES); }
        catch (ActivityNotFoundException error) {
            busy = false;
            send("error", "系统图片选择器不可用", null);
        }
    }

    void onPickerResult(int resultCode, Intent result) {
        if (!busy) return;
        if (resultCode != Activity.RESULT_OK || result == null) {
            busy = false; send("cancelled", "已取消选择，原计划未改变", null); return;
        }
        ArrayList<Uri> chosen = new ArrayList<>();
        ClipData clip = result.getClipData();
        if (clip != null) for (int i = 0; i < clip.getItemCount(); i++) {
            Uri uri = clip.getItemAt(i).getUri();
            if (uri != null && !chosen.contains(uri)) chosen.add(uri);
        }
        if (chosen.isEmpty() && result.getData() != null) chosen.add(result.getData());
        if (chosen.isEmpty() || chosen.size() > MAX_IMAGES) {
            busy = false; send("error", "请选择 1 至 10 张截图，可分批导入", null); return;
        }
        recognize(chosen, 0, new JSONArray());
    }

    private void recognize(ArrayList<Uri> uris, int position, JSONArray results) {
        if (position >= uris.size()) { busy = false; send("done", "", results); return; }
        Uri uri = uris.get(position);
        JSONObject entry = new JSONObject();
        try {
            entry.put("index", position + 1);
            entry.put("source", "截图 " + (position + 1));
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            try (InputStream input = activity.getContentResolver().openInputStream(uri)) {
                if (input == null) throw new IllegalArgumentException("图片无法读取");
                BitmapFactory.decodeStream(input, null, options);
            }
            if (options.outWidth <= 0 || options.outHeight <= 0 ||
                (long) options.outWidth * options.outHeight > MAX_PIXELS)
                throw new IllegalArgumentException("图片尺寸不受支持，请先裁剪截图");
            InputImage image = InputImage.fromFilePath(activity, uri);
            recognizer.process(image)
                .addOnSuccessListener(text -> {
                    try {
                        String value = text.getText();
                        entry.put("text", value.length() <= 20000 ? value : value.substring(0, 20000));
                    } catch (Exception ignored) { }
                    results.put(entry); recognize(uris, position + 1, results);
                })
                .addOnFailureListener(error -> {
                    try { entry.put("error", "文字识别失败，请重新导入或手动填写"); }
                    catch (Exception ignored) { }
                    results.put(entry); recognize(uris, position + 1, results);
                });
        } catch (Exception error) {
            try { entry.put("error", error.getMessage() == null ? "图片读取失败" : error.getMessage()); }
            catch (Exception ignored) { }
            results.put(entry); recognize(uris, position + 1, results);
        }
    }

    private void send(String status, String message, JSONArray rows) {
        try {
            JSONObject response = new JSONObject().put("status", status).put("message", message);
            if (rows != null) response.put("images", rows);
            activity.runOnUiThread(() -> {
                if (MainActivity.START.equals(web.getUrl()))
                    web.evaluateJavascript("window.__timeworth2OcrReceive?.(" + response.toString() + ")", null);
            });
        } catch (Exception ignored) { }
    }

    void close() { recognizer.close(); }
}

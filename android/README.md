# TimeWorth Android 0.1

An installable offline Android application using the existing product UI and financial rules, bundled into APK assets. It does not open the private preview website or require a server/login. Android 8.0+ and an up-to-date Android System WebView are required.

The shell supplies origin-scoped WebMessage operations, Android document selection/saving, system-back handling, system-bar theming and a public, per-app update client. Local files use AndroidX WebViewAssetLoader at the reserved HTTPS origin; arbitrary WebView network requests and file:// access are blocked. Backups and statement files remain local. No notification listener, bank login, OCR or payment service is connected.

## Cloud build

Use Java 21 and an Android SDK with platform/build-tools 35, then:

```bash
bash android/gradlew -p android :app:assembleDebug :app:assembleRelease :app:lintDebug
```

Debug uses the separate package `dev.h516.timeworth.preview`. It cannot cover-install the stable app. The unsigned release can be compiled without secrets; signed release requires `TIMEWORTH_KEYSTORE_FILE` and `TIMEWORTH_KEYSTORE_PASSWORD`, with alias `timeworth`, matching the original public certificate in `release/signing-identity.json`. No private signing material belongs in Git or artifacts.

The signed-build workflow only produces an artifact; it does not publish a release, change the stable manifest or upload keys. Original signature, recovery, artifact/source identity, download verification and phone coverage remain separate release gates.

```bash
node --test ui-preview/qa/finance.test.cjs
CHROMIUM_PATH=/usr/bin/chromium PLAYWRIGHT_MODULE=/absolute/path/to/ui-preview/node_modules/playwright python3 cloud/run-ui-checks.py
node ui-preview/qa/native.cjs
ANDROID_HOME=/path/to/sdk python3 tools/verify-apk.py /path/to/package.apk --expect-release
```

The native browser scenario uses the exact Android HTTPS origin and a simulated message endpoint; it is not an Android device test. It checks empty setup, receipt/conversion, persisted reload, JSON backup migration/rejection, update/export bridge messages, layouts and reduced motion. Native Android installation, document-provider behavior and system installation permissions require their own actual-device/emulator checks.

## References and reuse

- Existing TimeWorth product PR #3 and its version-2 backup format are retained. The APK takes its product assets from `ui-preview/dist` during each build; no second copy is maintained.
- AndroidX WebKit 1.13.0 and Core 1.15.0: Apache-2.0. [Official local-content guide](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content); [origin-scoped bridge](https://developer.android.com/reference/androidx/webkit/WebViewCompat#addWebMessageListener(android.webkit.WebView,java.lang.String,java.util.Set,androidx.webkit.WebViewCompat.WebMessageListener)).
- Android document access uses ACTION_OPEN_DOCUMENT / ACTION_CREATE_DOCUMENT; no broad storage permission is requested.
- Update contract from `h516df/app-releases` schema 1; verification behavior reviewed against existing `android-update-kit`. The private-auth Kotlin client is not copied into this public client. No runtime credentials are embedded.
- Bundled SheetJS and imagery retain the references and license from `ui-preview/README.md`.

Data is Android WebView local storage under the fixed appassets origin. First launch contains no demo transactions. Existing browser backup v2 can be restored with validation and confirmation; installation never silently transfers browser data. Preview-to-stable migration also uses export/restore because Android isolates those package IDs. Clearing/uninstalling an app removes its local data; a same-package/signature upgrade preserves it.

package com.iammagnanimousway.tv;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** The browser and Google login live on the TV. The relay sees only remote commands. */
public final class MainActivity extends Activity {
    private static final String HOME = "https://drive.google.com/drive/u/0/my-drive";
    private static final String API = BuildConfig.API_BASE_URL + "/api/tv-companion";
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final Handler ui = new Handler(Looper.getMainLooper());
    private WebView browser;
    private EditText addressInput;
    private TextView pairing, state;
    private FrameLayout fullScreen;
    private View fullScreenView;
    private WebChromeClient.CustomViewCallback fullScreenCallback;
    private String sessionId, tvToken;
    private long lastCommand = 0;
    private boolean closed = false;
    private volatile boolean pairedSession = false;
    private boolean creatingSession = false;

    private static final class HttpFailure extends Exception {
        final int status;
        HttpFailure(int status) { super("TV service HTTP " + status); this.status = status; }
    }

    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(3, 11, 24));
        setContentView(root);

        LinearLayout bar = new LinearLayout(this);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setPadding(18, 8, 18, 8);
        bar.setBackgroundColor(Color.rgb(10, 30, 51));
        root.addView(bar, new LinearLayout.LayoutParams(-1, -2));

        TextView brand = new TextView(this);
        brand.setText("I AM MAGNANIMOUS WAY™  |  TV BROWSER");
        brand.setTextColor(Color.rgb(245, 216, 151));
        brand.setTypeface(null, Typeface.BOLD);
        brand.setTextSize(15);
        bar.addView(brand);

        pairing = new TextView(this);
        pairing.setTextColor(Color.WHITE);
        pairing.setTextSize(17);
        pairing.setPadding(22, 0, 16, 0);
        pairing.setText("Pairing…");
        bar.addView(pairing, new LinearLayout.LayoutParams(0, -2, 1));

        Button newCode = new Button(this);
        newCode.setText("New code");
        newCode.setOnClickListener(view -> createSession());
        bar.addView(newCode);

        LinearLayout inputRow = new LinearLayout(this);
        inputRow.setPadding(16, 4, 16, 4);
        root.addView(inputRow, new LinearLayout.LayoutParams(-1, -2));
        addressInput = new EditText(this);
        addressInput.setSingleLine(true);
        addressInput.setTextSize(15);
        addressInput.setTextColor(Color.WHITE);
        addressInput.setHintTextColor(Color.LTGRAY);
        addressInput.setHint("HTTPS website address");
        addressInput.setText(HOME);
        inputRow.addView(addressInput, new LinearLayout.LayoutParams(0, -2, 1));
        Button go = new Button(this);
        go.setText("Open");
        go.setOnClickListener(view -> open(addressInput.getText().toString()));
        inputRow.addView(go);

        state = new TextView(this);
        state.setTextColor(Color.rgb(115, 220, 234));
        state.setTextSize(12);
        state.setText("Connect your iPhone at iammagnanimousway.com/tv-remote");
        state.setPadding(24, 0, 16, 4);
        root.addView(state);

        FrameLayout content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1));
        browser = new WebView(this);
        content.addView(browser, new FrameLayout.LayoutParams(-1, -1));
        WebSettings web = browser.getSettings();
        web.setJavaScriptEnabled(true);
        web.setDomStorageEnabled(true);
        web.setAllowFileAccess(false);
        web.setAllowContentAccess(false);
        web.setAllowFileAccessFromFileURLs(false);
        web.setAllowUniversalAccessFromFileURLs(false);
        web.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setSafeBrowsingEnabled(true);
        browser.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                if (!closed && url != null && url.startsWith("https://") && !addressInput.hasFocus()) {
                    addressInput.setText(url);
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                String host = target.getHost();
                if (!"https".equalsIgnoreCase(target.getScheme()) || localHost(host)) {
                    show("Blocked a non-HTTPS or local-network link.");
                    return true;
                }
                return false;
            }
        });
        CookieManager.getInstance().setAcceptCookie(true);
        browser.setWebChromeClient(new WebChromeClient() {
            @Override public void onShowCustomView(View view, CustomViewCallback callback) {
                if (fullScreenView != null) { callback.onCustomViewHidden(); return; }
                fullScreenView = view;
                fullScreenCallback = callback;
                fullScreen = new FrameLayout(MainActivity.this);
                fullScreen.setBackgroundColor(Color.BLACK);
                fullScreen.addView(view, new FrameLayout.LayoutParams(-1, -1));
                addContentView(fullScreen, new ViewGroup.LayoutParams(-1, -1));
            }
            @Override public void onHideCustomView() { closeFullscreen(); }
        });
        browser.loadUrl(HOME);
        createSession();
    }

    private void closeFullscreen() {
        if (fullScreenView == null) return;
        fullScreen.removeView(fullScreenView);
        ((ViewGroup) fullScreen.getParent()).removeView(fullScreen);
        fullScreenView = null;
        fullScreen = null;
        if (fullScreenCallback != null) fullScreenCallback.onCustomViewHidden();
        fullScreenCallback = null;
    }

    private void show(String text) { ui.post(() -> { if (!closed) state.setText(text); }); }
    private static String read(InputStream stream) throws Exception {
        if (stream == null) return "";
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            StringBuilder out = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) out.append(line);
            return out.toString();
        }
    }
    private JSONObject request(String method, String path, String token, JSONObject payload) throws Exception {
        HttpURLConnection connection = (HttpURLConnection) new URL(API + path).openConnection();
        connection.setRequestMethod(method);
        connection.setConnectTimeout(10000);
        connection.setReadTimeout(10000);
        connection.setRequestProperty("Accept", "application/json");
        if (token != null) connection.setRequestProperty("Authorization", "Bearer " + token);
        if (payload != null) {
            connection.setDoOutput(true);
            connection.setRequestProperty("Content-Type", "application/json");
            try (OutputStream output = connection.getOutputStream()) {
                output.write(payload.toString().getBytes(StandardCharsets.UTF_8));
            }
        }
        int status = connection.getResponseCode();
        String result = read(status < 400 ? connection.getInputStream() : connection.getErrorStream());
        connection.disconnect();
        if (status >= 400) throw new HttpFailure(status);
        return new JSONObject(result);
    }
    private void createSession() {
        if (closed || creatingSession) return;
        creatingSession = true;
        String previousId = sessionId, previousToken = tvToken;
        String previousLabel = pairing.getText().toString();
        pairing.setText(previousId == null ? "Pairing…" : "Replacing pairing…");
        network.execute(() -> {
            boolean oldSessionGone = previousId == null;
            try {
                if (previousId != null) {
                    try {
                        JSONObject result = request("POST", "/disconnect", previousToken,
                            new JSONObject().put("session_id", previousId));
                        if (!result.optBoolean("disconnected", false)) throw new Exception("Unconfirmed TV revocation");
                    } catch (HttpFailure failure) {
                        // An expired/revoked token is safe to replace; a 503 is not.
                        if (failure.status != 401) throw failure;
                    }
                    oldSessionGone = true;
                }
                JSONObject data = request("POST", "/session", null, new JSONObject());
                String id = data.getString("session_id");
                String secret = data.getString("tv_token");
                String code = data.getString("pairing_code");
                ui.post(() -> {
                    creatingSession = false;
                    if (!closed) {
                        sessionId = id;
                        tvToken = secret;
                        pairedSession = false;
                        lastCommand = 0;
                        pairing.setText("PAIR CODE: " + code);
                        state.setText("On your iPhone, open iammagnanimousway.com/tv-remote");
                        ui.postDelayed(() -> poll(id, secret), 1000);
                    }
                });
            } catch (Exception ex) {
                final boolean previouslyRevoked = oldSessionGone;
                ui.post(() -> {
                    creatingSession = false;
                    if (closed) return;
                    if (previouslyRevoked) {
                        // Never display an old credential as active after server revocation.
                        sessionId = null;
                        tvToken = null;
                        pairedSession = false;
                        lastCommand = 0;
                        pairing.setText("No active pairing");
                        state.setText(previousId == null
                            ? "Could not create a pairing code. Check internet and retry New code."
                            : "New code unavailable. Your previous pairing is inactive; retry New code.");
                    } else {
                        pairing.setText(previousLabel);
                        state.setText("Could not confirm old pairing was revoked. It may remain active; retry New code.");
                    }
                });
            }
        });
    }
    private void poll(String id, String secret) {
        if (closed || !id.equals(sessionId)) return;
        network.execute(() -> {
            try {
                JSONObject data = request("GET", "/poll?session_id=" + id + "&after=" + lastCommand, secret, null);
                JSONObject command = data.optJSONObject("command");
                boolean paired = data.optBoolean("paired");
                pairedSession = paired;
                ui.post(() -> {
                    if (closed || !id.equals(sessionId)) return;
                    if (paired) state.setText("iPhone connected • Remote active");
                    if (command != null) {
                        execute(command.optString("action"), command.optString("value"));
                        lastCommand = command.optLong("id", lastCommand);
                    }
                });
            } catch (Exception ex) { show("Waiting for secure TV remote service…"); }
            // Prefer a quiet interval before pairing to protect free Worker/D1 quotas.
            // Once paired, check more frequently so D-pad navigation feels responsive.
            ui.postDelayed(() -> poll(id, secret), pairedSession ? 2500 : 8000);
        });
    }

    private void open(String address) {
        try {
            URL url = new URL(address.trim());
            if (!"https".equalsIgnoreCase(url.getProtocol()) || url.getUserInfo() != null) throw new Exception();
            String host = url.getHost().toLowerCase();
            if (localHost(host)) throw new Exception();
            browser.loadUrl(url.toString());
        } catch (Exception ex) { state.setText("Only safe HTTPS website addresses are supported."); }
    }
    private boolean localHost(String host) {
        if (host == null) return true;
        // DNS permits terminal dots; printer.local. is still a LAN address.
        String normalized = host.toLowerCase(java.util.Locale.ROOT).replaceFirst("\\.+$", "");
        if (!normalized.contains(".") || normalized.endsWith(".localhost") ||
            normalized.endsWith(".local") || normalized.endsWith(".internal") || normalized.contains(":")) return true;
        return normalized.matches("[0-9]+(\\.[0-9]+){3}");
    }
    private void key(int keyCode) {
        browser.requestFocus();
        browser.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, keyCode));
        browser.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, keyCode));
    }
    private void javascript(String command) { browser.evaluateJavascript(command, null); }
    private void execute(String action, String value) {
        switch (action) {
            case "navigate": open(value); break;
            case "home": browser.loadUrl(HOME); break;
            case "back": if (browser.canGoBack()) browser.goBack(); break;
            case "forward": if (browser.canGoForward()) browser.goForward(); break;
            case "reload": browser.reload(); break;
            case "up": key(KeyEvent.KEYCODE_DPAD_UP); break;
            case "down": key(KeyEvent.KEYCODE_DPAD_DOWN); break;
            case "left": key(KeyEvent.KEYCODE_DPAD_LEFT); break;
            case "right": key(KeyEvent.KEYCODE_DPAD_RIGHT); break;
            case "select": key(KeyEvent.KEYCODE_DPAD_CENTER); break;
            case "playpause":
                javascript("(function(){const v=document.querySelector('video');if(v){if(v.paused)v.play();else v.pause()}})()");
                break;
            case "seek-back":
                javascript("(function(){const v=document.querySelector('video');if(v)v.currentTime=Math.max(0,v.currentTime-10)})()");
                break;
            case "seek-forward":
                javascript("(function(){const v=document.querySelector('video');if(v)v.currentTime+=10})()");
                break;
            case "fullscreen":
                if (fullScreenView != null) closeFullscreen();
                else javascript("(function(){const v=document.querySelector('video');if(v&&v.requestFullscreen)v.requestFullscreen()})()");
                break;
            case "volume-up": case "volume-down":
                AudioManager audio = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
                audio.adjustStreamVolume(AudioManager.STREAM_MUSIC,
                    action.equals("volume-up") ? AudioManager.ADJUST_RAISE : AudioManager.ADJUST_LOWER,
                    AudioManager.FLAG_SHOW_UI);
                break;
            default: break;
        }
    }
    @Override public void onBackPressed() {
        if (fullScreenView != null) closeFullscreen();
        else if (browser.canGoBack()) browser.goBack();
        else super.onBackPressed();
    }
    @Override protected void onDestroy() {
        closed = true;
        network.shutdownNow();
        if (browser != null) browser.destroy();
        super.onDestroy();
    }
}

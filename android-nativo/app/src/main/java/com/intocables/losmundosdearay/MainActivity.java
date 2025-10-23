package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import com.google.android.gms.ads.AdView;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private GameBridge gameBridge;
    private AdManager adManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Sin toolbar - pantalla completa

        // Configurar WebView
        webView = findViewById(R.id.webview);
        setupWebView();

        // Configurar AdMob
        Log.d("MainActivity", "Configurando AdMob...");
        adManager = new AdManager(this);
        AdView adView = findViewById(R.id.adView);
        Log.d("MainActivity", "AdView encontrado: " + (adView != null ? "SÍ" : "NO"));
        adManager.setupBannerAd(adView);

        // Crear bridge
        gameBridge = new GameBridge(this, adManager);
        webView.addJavascriptInterface(gameBridge, "GameBridge");
        
        Log.d("MainActivity", "GameBridge configurado y añadido a WebView");
    }

    private void setupWebView() {
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setSupportZoom(false);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setDisplayZoomControls(false);
        webSettings.setLayoutAlgorithm(WebSettings.LayoutAlgorithm.SINGLE_COLUMN);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                // Inyectar CSS para arreglar el viewport
                injectViewportFix();
                // Inyectar usuario si está logueado
                if (gameBridge.isUserLoggedIn()) {
                    injectUserData();
                }
            }
        });

        // Cargar el juego
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void injectViewportFix() {
        String css =
                "body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; } " +
                ".map-container { width: 100vw !important; height: 100vh !important; margin: 0 !important; padding: 0 !important; } " +
                ".map { width: 100% !important; height: calc(100% - 60px) !important; top: 60px !important; left: 0 !important; right: 0 !important; bottom: 0 !important; gap: 0 !important; grid-gap: 0 !important; column-gap: 0 !important; row-gap: 0 !important; margin: 0 !important; padding: 0 !important; border-spacing: 0 !important; } " +
                ".map-wrapper { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; } " +
                ".tile { margin: 0 !important; padding: 0 !important; border: none !important; outline: none !important; } " +
                ".tile img { margin: 0 !important; padding: 0 !important; border: none !important; outline: none !important; display: block !important; } " +
                ".avatar { position: absolute; } " +
                ".speech-bubble { max-width: 90vw; word-wrap: break-word; } " +
                ".hud-stats, .stat-item, .stat-icon, .stat-value { font-size: 14px !important; line-height: 1.4 !important; } " +
                ".game-header { position: fixed !important; top: 10px !important; left: 20px !important; right: 20px !important; z-index: 1000 !important; transform: scale(0.9) !important; transform-origin: top center !important; } " +
                ".guide-text, .guide-subtitle { font-size: 16px !important; top: 15px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1001 !important; } " +
                ".guide-subtitle { font-size: 12px !important; top: 35px !important; } " +
                "html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }";

        webView.evaluateJavascript(
                "var style = document.createElement('style'); " +
                "style.innerHTML = '" + css + "'; " +
                "document.head.appendChild(style);", null);
    }

    private void injectUserData() {
        String userData = gameBridge.getUserDataJson();
        webView.evaluateJavascript(
            "if (window.gameUser) { window.gameUser = " + userData + "; } else { window.gameUser = " + userData + "; }",
            null
        );
    }

    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        gameBridge.handleActivityResult(requestCode, resultCode, data);
    }

    public void showLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        startActivityForResult(intent, 1001);
    }

    public void showNickSetup() {
        Intent intent = new Intent(this, NickSetupActivity.class);
        startActivityForResult(intent, 1002);
    }

    public void showRanking() {
        // Verificar si hay sesión
        boolean isLoggedIn = gameBridge.isUserLoggedIn();
        Log.d("MainActivity", "showRanking() - isLoggedIn: " + isLoggedIn);
        
        if (isLoggedIn) {
            // Usuario logueado - mostrar ranking directamente
            Log.d("MainActivity", "Usuario logueado, abriendo RankingActivity...");
            Intent intent = new Intent(this, RankingActivity.class);
            startActivity(intent);
        } else {
            // Usuario no logueado - iniciar flujo de login
            Log.d("MainActivity", "Usuario no logueado, abriendo LoginActivity...");
            Intent intent = new Intent(this, LoginActivity.class);
            startActivityForResult(intent, 1001);
        }
    }
}

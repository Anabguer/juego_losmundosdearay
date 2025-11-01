package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.google.android.gms.ads.AdView;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private GameBridge gameBridge;
    private AdManager adManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Configurar modo inmersivo (pantalla completa)
        setupImmersiveMode();

        // Configurar WebView
        webView = findViewById(R.id.webview);
        setupWebView();

        // Configurar AdMob
        adManager = new AdManager(this);
        adManager.setWebView(webView); // Pasar WebView para pausar/reanudar juegos
        
        // Configurar el AdView
        AdView adView = findViewById(R.id.adView);
        if (adView != null) {
            adView.setVisibility(View.VISIBLE);
            
            // Forzar que sea visible y tenga tamaño estándar de banner (320x50dp)
            android.view.ViewGroup.LayoutParams params = adView.getLayoutParams();
            if (params != null) {
                float density = getResources().getDisplayMetrics().density;
                params.width = (int) (320 * density);
                params.height = (int) (50 * density);
                adView.setLayoutParams(params);
            }
            adView.requestLayout();
        }

        // Crear bridge
        gameBridge = new GameBridge(this, adManager);
        webView.addJavascriptInterface(gameBridge, "GameBridge");
        // MainActivity interface removida - no se usa desde JavaScript
    }

    private void setupImmersiveMode() {
        // Configurar para usar el nuevo sistema de insets
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        // Obtener el controlador de insets
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        
        // Configurar comportamiento de las barras del sistema
        controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        
        // Ocultar barras del sistema (barra de estado y navegación)
        controller.hide(WindowInsetsCompat.Type.systemBars());
        
        // Mantener la pantalla encendida
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Pausar música cuando la app se minimiza
        if (webView != null) {
            webView.evaluateJavascript(
                "if (window.stopBackgroundMusic) window.stopBackgroundMusic();",
                null
            );
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-aplicar modo inmersivo al volver a la actividad
        setupImmersiveMode();
        // Reanudar música cuando la app vuelve al primer plano (solo si estaba habilitada)
        if (webView != null) {
            webView.evaluateJavascript(
                "(function() { " +
                "  var musicEnabled = window.musicEnabled !== false && " +
                "    (localStorage.getItem('musicEnabled') !== 'false'); " +
                "  if (musicEnabled && window.playBackgroundMusic) { " +
                "    window.playBackgroundMusic(); " +
                "  } " +
                "})();",
                null
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-aplicar modo inmersivo cuando la ventana gana foco
            setupImmersiveMode();
            
            // Cargar el banner cuando la ventana tiene foco (actividad completamente visible)
            if (adManager != null) {
                AdView adView = findViewById(R.id.adView);
                if (adView != null) {
                    android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
                    handler.postDelayed(() -> {
                        adManager.setupBannerAd(adView);
                    }, 500);
                }
            }
        }
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
        
        // Configuraciones específicas para audio
        webSettings.setMediaPlaybackRequiresUserGesture(false);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);

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
        
        // El banner se cargará desde onWindowFocusChanged cuando la actividad esté completamente visible
    }

    private void injectViewportFix() {
        String css =
                "body { margin: 0 !important; padding: 0 !important; padding-bottom: 50px !important; overflow: hidden !important; } " +
                ".map-container { width: 100vw !important; height: calc(100vh - 50px) !important; margin: 0 !important; padding: 0 !important; } " +
                ".map { width: 100% !important; height: calc(100% - 60px) !important; top: 60px !important; left: 0 !important; right: 0 !important; bottom: 50px !important; gap: 0 !important; grid-gap: 0 !important; column-gap: 0 !important; row-gap: 0 !important; margin: 0 !important; padding: 0 !important; border-spacing: 0 !important; } " +
                ".map-wrapper { width: 100% !important; height: 100% !important; margin: 0 !important; padding: 0 !important; } " +
                ".tile { margin: 0 !important; padding: 0 !important; border: none !important; outline: none !important; } " +
                ".tile img { margin: 0 !important; padding: 0 !important; border: none !important; outline: none !important; display: block !important; } " +
                ".avatar { position: absolute; } " +
                ".speech-bubble { max-width: 90vw; word-wrap: break-word; } " +
                ".hud-stats, .stat-item, .stat-icon, .stat-value { font-size: 16px !important; line-height: 1.4 !important; } " +
                ".game-header { position: fixed !important; top: 15px !important; left: 20px !important; right: 20px !important; z-index: 1000 !important; transform: scale(0.9) !important; transform-origin: top center !important; } " +
                ".game-header-pueblo { top: 0 !important; } " +
                ".guide-text, .guide-subtitle { font-size: 16px !important; top: 15px !important; left: 50% !important; transform: translateX(-50%) !important; z-index: 1001 !important; } " +
                ".guide-subtitle { font-size: 12px !important; top: 35px !important; } " +
                "html, body { margin: 0 !important; padding: 0 !important; padding-bottom: 50px !important; width: 100% !important; height: 100vh !important; overflow-x: hidden !important; }";

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
        
        if (isLoggedIn) {
            // Usuario logueado - mostrar ranking directamente
            Intent intent = new Intent(this, RankingActivity.class);
            startActivity(intent);
        } else {
            // Usuario no logueado - iniciar flujo de login
            Intent intent = new Intent(this, LoginActivity.class);
            startActivityForResult(intent, 1001);
        }
    }
}

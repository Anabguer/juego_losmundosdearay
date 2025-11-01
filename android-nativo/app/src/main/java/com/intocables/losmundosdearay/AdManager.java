package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.AdListener;
import com.google.android.gms.ads.AdRequest;
import com.google.android.gms.ads.AdView;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.LoadAdError;
import com.google.android.gms.ads.MobileAds;
import com.google.android.gms.ads.OnUserEarnedRewardListener;
import com.google.android.gms.ads.initialization.InitializationStatus;
import com.google.android.gms.ads.initialization.OnInitializationCompleteListener;
import com.google.android.gms.ads.interstitial.InterstitialAd;
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback;
import com.google.android.gms.ads.rewarded.RewardItem;
import com.google.android.gms.ads.rewarded.RewardedAd;
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback;
import android.webkit.WebView;

public class AdManager {
    private static final String TAG = "AdManager";
    
    // IDs de AdMob - PRODUCCIÓN
    private static final String BANNER_AD_ID = "ca-app-pub-1338301235950360/1577253279"; // Banner producción
    private static final String INTERSTITIAL_AD_ID = "ca-app-pub-1338301235950360/3137746954"; // Intersticial producción
    private static final String REWARDED_AD_ID = "ca-app-pub-1338301235950360/2974095428"; // Rewarded producción
    
    private Context context;
    private WebView webView;
    private AdView bannerAd;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private int gameCount = 0;
    private boolean isAdMobInitialized = false;
    
    public AdManager(Context context) {
        this.context = context;
        initializeAds();
    }
    
    private void initializeAds() {
        Log.d(TAG, "Inicializando AdMob...");
        MobileAds.initialize(context, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                Log.d(TAG, "✅ AdMob inicializado correctamente");
                Log.d(TAG, "Estado de inicialización: " + initializationStatus.getAdapterStatusMap());
                isAdMobInitialized = true;
                
                // Inicializar banner si ya está configurado
                if (bannerAd != null) {
                    Log.d(TAG, "Banner ya configurado, cargando anuncio...");
                    loadBannerAd();
                }
                loadInterstitialAd();
                loadRewardedAd();
            }
        });
    }
    
    private void loadBannerAd() {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "🔵 INICIANDO loadBannerAd()");
        Log.d(TAG, "═══════════════════════════════════════");
        
        if (bannerAd == null) {
            Log.e(TAG, "❌ ERROR: Banner no está configurado para cargar");
            return;
        }
        
        Log.d(TAG, "✅ Banner AdView encontrado");
        
        // Verificar que AdMob esté inicializado
        if (!isAdMobInitialized) {
            Log.w(TAG, "⚠️ AdMob aún no inicializado, esperando...");
            android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
            handler.postDelayed(this::loadBannerAd, 500);
            return;
        }
        
        Log.d(TAG, "✅ AdMob inicializado");
        
        // Configurar listener para saber si se carga correctamente
        bannerAd.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                Log.d(TAG, "═══════════════════════════════════════");
                Log.d(TAG, "✅✅✅ BANNER CARGADO EXITOSAMENTE ✅✅✅");
                Log.d(TAG, "Banner visibility: " + bannerAd.getVisibility());
                Log.d(TAG, "Banner width: " + bannerAd.getWidth() + ", height: " + bannerAd.getHeight());
                Log.d(TAG, "═══════════════════════════════════════");
                bannerAd.setVisibility(android.view.View.VISIBLE);
                
                // Mostrar éxito también en consola del navegador
                if (context instanceof Activity) {
                    Activity activity = (Activity) context;
                    if (activity instanceof MainActivity) {
                        MainActivity mainActivity = (MainActivity) activity;
                        mainActivity.logToConsole("✅ BANNER CARGADO EXITOSAMENTE!");
                        mainActivity.logToConsole("   Width: " + bannerAd.getWidth() + "px, Height: " + bannerAd.getHeight() + "px");
                    }
                    
                    activity.runOnUiThread(() -> {
                        Toast.makeText(context, "✅ Banner cargado", Toast.LENGTH_SHORT).show();
                    });
                }
            }
            
            @Override
            public void onAdFailedToLoad(LoadAdError adError) {
                String errorDetails = 
                    "═══════════════════════════════════════\n" +
                    "❌❌❌ ERROR CARGANDO BANNER ❌❌❌\n" +
                    "Código: " + adError.getCode() + "\n" +
                    "Mensaje: " + adError.getMessage() + "\n" +
                    "Dominio: " + adError.getDomain() + "\n" +
                    "Width: " + bannerAd.getWidth() + "px\n" +
                    "Height: " + bannerAd.getHeight() + "px\n" +
                    "MeasuredWidth: " + bannerAd.getMeasuredWidth() + "px\n" +
                    "MeasuredHeight: " + bannerAd.getMeasuredHeight() + "px\n" +
                    "Visibility: " + bannerAd.getVisibility() + "\n" +
                    "IsAttachedToWindow: " + bannerAd.isAttachedToWindow() + "\n" +
                    "IsShown: " + bannerAd.isShown() + "\n" +
                    "═══════════════════════════════════════";
                
                Log.e(TAG, errorDetails);
                
                // Mostrar error también en consola del navegador
                if (context instanceof Activity) {
                    Activity activity = (Activity) context;
                    if (activity instanceof MainActivity) {
                        MainActivity mainActivity = (MainActivity) activity;
                        mainActivity.logToConsole("❌ ERROR BANNER: Código " + adError.getCode() + " - " + adError.getMessage());
                        mainActivity.logToConsole("   Width: " + bannerAd.getWidth() + "px, Height: " + bannerAd.getHeight() + "px");
                        mainActivity.logToConsole("   IsAttachedToWindow: " + bannerAd.isAttachedToWindow());
                    }
                    
                    activity.runOnUiThread(() -> {
                        Toast.makeText(context, "❌ Error: " + adError.getCode() + " - " + adError.getMessage(), Toast.LENGTH_LONG).show();
                    });
                }
            }
        });
        
        // Forzar dimensiones válidas usando el UI thread
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.post(() -> {
            Log.d(TAG, "🔵 Ejecutando en UI thread...");
            bannerAd.setVisibility(android.view.View.VISIBLE);
            bannerAd.bringToFront();
            
            // Forzar layout params con tamaño fijo estándar de banner (320x50dp)
            android.view.ViewGroup.LayoutParams params = bannerAd.getLayoutParams();
            
            // Usar tamaño en dp directamente (Android lo convertirá automáticamente)
            // Convertir dp a px manualmente para asegurar el tamaño correcto
            float density = context.getResources().getDisplayMetrics().density;
            int bannerWidthDp = 320;
            int bannerHeightDp = 50;
            int bannerWidthPx = (int) (bannerWidthDp * density);
            int bannerHeightPx = (int) (bannerHeightDp * density);
            
            Log.d(TAG, "📐 Density: " + density);
            Log.d(TAG, "📐 Dimensiones esperadas: " + bannerWidthDp + "dp x " + bannerHeightDp + "dp = " + bannerWidthPx + "px x " + bannerHeightPx + "px");
            
            if (params != null) {
                // Usar el cálculo directo de dp a px
                params.width = bannerWidthPx;
                params.height = bannerHeightPx;
                
                bannerAd.setLayoutParams(params);
                Log.d(TAG, "✅ LayoutParams establecidos: " + params.width + "x" + params.height + "px");
            } else {
                Log.e(TAG, "❌ LayoutParams es null!");
            }
            
            // Forzar layout después de establecer parámetros
            bannerAd.requestLayout();
            
            // Esperar dos frames para asegurar que el layout se aplicó completamente
            handler.postDelayed(() -> {
                // Obtener las dimensiones reales del banner
                int finalWidth = bannerAd.getWidth();
                int finalHeight = bannerAd.getHeight();
                
                // Si aún no tiene dimensiones, usar las medidas
                if (finalWidth <= 0 || finalHeight <= 0) {
                    bannerAd.measure(
                        android.view.View.MeasureSpec.makeMeasureSpec(bannerWidthPx, android.view.View.MeasureSpec.EXACTLY),
                        android.view.View.MeasureSpec.makeMeasureSpec(bannerHeightPx, android.view.View.MeasureSpec.EXACTLY)
                    );
                    finalWidth = bannerAd.getMeasuredWidth();
                    finalHeight = bannerAd.getMeasuredHeight();
                }
                
                Log.d(TAG, "═══════════════════════════════════════");
                Log.d(TAG, "🔄 ANTES DE CARGAR BANNER:");
                Log.d(TAG, "  - Final Width: " + finalWidth + "px");
                Log.d(TAG, "  - Final Height: " + finalHeight + "px");
                Log.d(TAG, "  - Banner ID: " + BANNER_AD_ID);
                Log.d(TAG, "  - Visibility: " + bannerAd.getVisibility());
                Log.d(TAG, "  - IsAttachedToWindow: " + bannerAd.isAttachedToWindow());
                Log.d(TAG, "  - IsShown: " + bannerAd.isShown());
                Log.d(TAG, "═══════════════════════════════════════");
                
                // Mostrar información en consola del navegador
                if (context instanceof Activity) {
                    Activity activity = (Activity) context;
                    if (activity instanceof MainActivity) {
                        MainActivity mainActivity = (MainActivity) activity;
                        mainActivity.logToConsole("🔄 Cargando banner...");
                        mainActivity.logToConsole("   Dimensiones: " + finalWidth + "x" + finalHeight + "px");
                        mainActivity.logToConsole("   IsAttachedToWindow: " + bannerAd.isAttachedToWindow());
                        mainActivity.logToConsole("   Banner ID: " + BANNER_AD_ID);
                    }
                }
                
                // Verificar que el banner esté visible y tenga dimensiones válidas
                if (!bannerAd.isAttachedToWindow()) {
                    Log.w(TAG, "⚠️ Banner no está adjunto a la ventana, esperando...");
                    handler.postDelayed(this::loadBannerAd, 500);
                    return;
                }
                
                if (finalWidth <= 0 || finalHeight <= 0) {
                    Log.w(TAG, "⚠️ Dimensiones aún inválidas (Width: " + finalWidth + ", Height: " + finalHeight + "), reintentando...");
                    handler.postDelayed(this::loadBannerAd, 500);
                    return;
                }
                
                // Usar las dimensiones mínimas estándar de banner si son muy pequeñas
                if (finalWidth < 250 || finalHeight < 30) {
                    Log.w(TAG, "⚠️ Dimensiones muy pequeñas, forzando tamaño mínimo estándar...");
                    params.width = bannerWidthPx;
                    params.height = bannerHeightPx;
                    bannerAd.setLayoutParams(params);
                    bannerAd.requestLayout();
                    handler.postDelayed(this::loadBannerAd, 300);
                    return;
                }
                
                AdRequest adRequest = new AdRequest.Builder().build();
                Log.d(TAG, "🚀 LLAMANDO A bannerAd.loadAd() con dimensiones: " + finalWidth + "x" + finalHeight + "px");
                bannerAd.loadAd(adRequest);
                Log.d(TAG, "✅ loadAd() llamado");
            }, 500); // Aumentar el delay para asegurar que el layout esté completo
        });
    }
    
    // ========== BANNER ==========
    public void setupBannerAd(AdView adView) {
        Log.d(TAG, "═══════════════════════════════════════");
        Log.d(TAG, "🔧 setupBannerAd() llamado");
        Log.d(TAG, "═══════════════════════════════════════");
        this.bannerAd = adView;
        
        if (bannerAd == null) {
            Log.e(TAG, "❌ ERROR: AdView es null!");
            return;
        }
        
        Log.d(TAG, "✅ AdView recibido");
        Log.d(TAG, "  - Width: " + bannerAd.getWidth());
        Log.d(TAG, "  - Height: " + bannerAd.getHeight());
        Log.d(TAG, "  - Visibility: " + bannerAd.getVisibility());
        Log.d(TAG, "  - IsAttachedToWindow: " + bannerAd.isAttachedToWindow());
        
        // Asegurar que el banner sea visible
        bannerAd.setVisibility(android.view.View.VISIBLE);
        bannerAd.bringToFront();
        
        Log.d(TAG, "✅ Banner configurado - iniciando carga...");
        
        // Cargar el banner directamente
        loadBannerAd();
    }
    
    // ========== INTERSTICIAL ==========
    private void loadInterstitialAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        
        InterstitialAd.load(context, INTERSTITIAL_AD_ID, adRequest,
                new InterstitialAdLoadCallback() {
                    @Override
                    public void onAdLoaded(InterstitialAd ad) {
                        interstitialAd = ad;
                        Log.d(TAG, "Intersticial cargado");
                        
                        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdShowedFullScreenContent() {
                                Log.d(TAG, "Intersticial mostrado - pausando juego");
                                pauseGame();
                            }
                            
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Intersticial cerrado - reanudando juego");
                                resumeGame();
                                interstitialAd = null;
                                loadInterstitialAd(); // Cargar siguiente
                            }
                            
                            @Override
                            public void onAdFailedToShowFullScreenContent(AdError adError) {
                                Log.e(TAG, "Error mostrando intersticial: " + adError.getMessage());
                                resumeGame(); // Asegurar que el juego se reanude incluso si falla
                                interstitialAd = null;
                                loadInterstitialAd(); // Cargar siguiente
                            }
                        });
                    }
                    
                    @Override
                    public void onAdFailedToLoad(LoadAdError adError) {
                        Log.e(TAG, "Error cargando intersticial: " + adError.getMessage());
                        interstitialAd = null;
                    }
                });
    }
    
    public void showInterstitialAd() {
        if (interstitialAd != null) {
            interstitialAd.show((Activity) context);
        } else {
            Log.w(TAG, "Intersticial no cargado");
        }
    }
    
    // ========== REWARDED ==========
    private void loadRewardedAd() {
        AdRequest adRequest = new AdRequest.Builder().build();
        
        RewardedAd.load(context, REWARDED_AD_ID, adRequest,
                new RewardedAdLoadCallback() {
                    @Override
                    public void onAdLoaded(RewardedAd ad) {
                        rewardedAd = ad;
                        Log.d(TAG, "Rewarded cargado");
                        
                        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdShowedFullScreenContent() {
                                Log.d(TAG, "Rewarded mostrado - pausando juego");
                                pauseGame();
                            }
                            
                            @Override
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Rewarded cerrado - reanudando juego");
                                resumeGame();
                                rewardedAd = null;
                                loadRewardedAd(); // Cargar siguiente
                            }
                            
                            @Override
                            public void onAdFailedToShowFullScreenContent(AdError adError) {
                                Log.e(TAG, "Error mostrando rewarded: " + adError.getMessage());
                                resumeGame(); // Asegurar que el juego se reanude incluso si falla
                                rewardedAd = null;
                                loadRewardedAd(); // Cargar siguiente
                            }
                        });
                    }
                    
                    @Override
                    public void onAdFailedToLoad(LoadAdError adError) {
                        Log.e(TAG, "Error cargando rewarded: " + adError.getMessage());
                        rewardedAd = null;
                    }
                });
    }
    
    public void showRewardedAd(RewardCallback callback) {
        if (rewardedAd != null) {
            rewardedAd.show((Activity) context, new OnUserEarnedRewardListener() {
                @Override
                public void onUserEarnedReward(RewardItem rewardItem) {
                    Log.d(TAG, "Usuario ganó recompensa: " + rewardItem.getAmount() + " " + rewardItem.getType());
                    if (callback != null) {
                        callback.onRewardEarned(rewardItem.getAmount());
                    }
                }
            });
        } else {
            Log.w(TAG, "Rewarded no cargado");
            Toast.makeText(context, "Anuncio no disponible", Toast.LENGTH_SHORT).show();
        }
    }
    
    // ========== LÓGICA DE JUEGOS ==========
    public void onGamePlayed() {
        gameCount++;
        Log.d(TAG, "Juego jugado. Total: " + gameCount);
        
        // Mostrar intersticial cada 2 juegos
        if (gameCount % 2 == 0) {
            Log.d(TAG, "Mostrando intersticial (cada 2 juegos)");
            showInterstitialAd();
        }
    }
    
    public void resetGameCount() {
        gameCount = 0;
        Log.d(TAG, "Contador de juegos resetado");
    }
    
    // ========== GESTIÓN DE JUEGO (PAUSA/RESUMEN) ==========
    public void setWebView(WebView webView) {
        this.webView = webView;
        Log.d(TAG, "WebView configurado en AdManager");
    }
    
    private void pauseGame() {
        Log.d(TAG, "⏸️ PAUSANDO JUEGO");
        if (webView != null && context instanceof Activity) {
            Activity activity = (Activity) context;
            activity.runOnUiThread(() -> {
                // Pausar WebView
                webView.onPause();
                
                // Inyectar JavaScript para pausar el juego
                String pauseScript = 
                    "window._isGamePaused = true; " +
                    "if (typeof window.gamePause === 'function') { window.gamePause(); } " +
                    "if (typeof cancelAnimationFrame !== 'undefined' && window.animationId !== undefined) { " +
                    "  cancelAnimationFrame(window.animationId); " +
                    "  window.animationId = null; " +
                    "} " +
                    "console.log('⏸️ Juego pausado desde Android');";
                
                webView.evaluateJavascript(pauseScript, null);
                Log.d(TAG, "✅ Script de pausa ejecutado");
            });
        } else {
            Log.w(TAG, "⚠️ No se puede pausar: webView o activity es null");
        }
    }
    
    private void resumeGame() {
        Log.d(TAG, "▶️ REANUDANDO JUEGO");
        if (webView != null && context instanceof Activity) {
            Activity activity = (Activity) context;
            activity.runOnUiThread(() -> {
                // Reanudar WebView
                webView.onResume();
                
                // Inyectar JavaScript para reanudar el juego
                String resumeScript = 
                    "window._isGamePaused = false; " +
                    "if (typeof window.gameResume === 'function') { window.gameResume(); } " +
                    "console.log('▶️ Juego reanudado desde Android');";
                
                webView.evaluateJavascript(resumeScript, null);
                Log.d(TAG, "✅ Script de reanudación ejecutado");
            });
        } else {
            Log.w(TAG, "⚠️ No se puede reanudar: webView o activity es null");
        }
    }
    
    // ========== INTERFACES ==========
    public interface RewardCallback {
        void onRewardEarned(int amount);
    }
}

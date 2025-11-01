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
        MobileAds.initialize(context, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                isAdMobInitialized = true;
                
                // Inicializar banner si ya está configurado
                if (bannerAd != null) {
                    loadBannerAd();
                }
                loadInterstitialAd();
                loadRewardedAd();
            }
        });
    }
    
    private void loadBannerAd() {
        if (bannerAd == null) {
            return;
        }
        
        // Verificar que AdMob esté inicializado
        if (!isAdMobInitialized) {
            android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
            handler.postDelayed(this::loadBannerAd, 500);
            return;
        }
        
        // Configurar listener
        bannerAd.setAdListener(new AdListener() {
            @Override
            public void onAdLoaded() {
                bannerAd.setVisibility(android.view.View.VISIBLE);
            }
            
            @Override
            public void onAdFailedToLoad(LoadAdError adError) {
                Log.e(TAG, "Error cargando banner: " + adError.getCode() + " - " + adError.getMessage());
            }
        });
        
        // Forzar dimensiones válidas usando el UI thread
        android.os.Handler handler = new android.os.Handler(android.os.Looper.getMainLooper());
        handler.post(() -> {
            bannerAd.setVisibility(android.view.View.VISIBLE);
            bannerAd.bringToFront();
            
            // Forzar layout params con tamaño fijo estándar de banner (320x50dp)
            android.view.ViewGroup.LayoutParams params = bannerAd.getLayoutParams();
            
            // Convertir dp a px manualmente para asegurar el tamaño correcto
            float density = context.getResources().getDisplayMetrics().density;
            int bannerWidthDp = 320;
            int bannerHeightDp = 50;
            int bannerWidthPx = (int) (bannerWidthDp * density);
            int bannerHeightPx = (int) (bannerHeightDp * density);
            
            if (params != null) {
                params.width = bannerWidthPx;
                params.height = bannerHeightPx;
                bannerAd.setLayoutParams(params);
            }
            
            // Forzar layout después de establecer parámetros
            bannerAd.requestLayout();
            
            // Esperar para asegurar que el layout se aplicó completamente
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
                
                // Verificar que el banner esté visible y tenga dimensiones válidas
                if (!bannerAd.isAttachedToWindow()) {
                    handler.postDelayed(this::loadBannerAd, 500);
                    return;
                }
                
                if (finalWidth <= 0 || finalHeight <= 0) {
                    handler.postDelayed(this::loadBannerAd, 500);
                    return;
                }
                
                // Usar las dimensiones mínimas estándar de banner si son muy pequeñas
                if (finalWidth < 250 || finalHeight < 30) {
                    params.width = bannerWidthPx;
                    params.height = bannerHeightPx;
                    bannerAd.setLayoutParams(params);
                    bannerAd.requestLayout();
                    handler.postDelayed(this::loadBannerAd, 300);
                    return;
                }
                
                AdRequest adRequest = new AdRequest.Builder().build();
                bannerAd.loadAd(adRequest);
            }, 500);
        });
    }
    
    // ========== BANNER ==========
    public void setupBannerAd(AdView adView) {
        this.bannerAd = adView;
        
        if (bannerAd == null) {
            return;
        }
        
        // Asegurar que el banner sea visible
        bannerAd.setVisibility(android.view.View.VISIBLE);
        bannerAd.bringToFront();
        
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
                        
                        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdShowedFullScreenContent() {
                                pauseGame();
                            }
                            
                            @Override
                            public void onAdDismissedFullScreenContent() {
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
                        
                        ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                            @Override
                            public void onAdShowedFullScreenContent() {
                                pauseGame();
                            }
                            
                            @Override
                            public void onAdDismissedFullScreenContent() {
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
                    if (callback != null) {
                        callback.onRewardEarned(rewardItem.getAmount());
                    }
                }
            });
        } else {
            Toast.makeText(context, "Anuncio no disponible", Toast.LENGTH_SHORT).show();
        }
    }
    
    // ========== LÓGICA DE JUEGOS ==========
    public void onGamePlayed() {
        gameCount++;
        
        // Mostrar intersticial cada 2 juegos
        if (gameCount % 2 == 0) {
            showInterstitialAd();
        }
    }
    
    public void resetGameCount() {
        gameCount = 0;
    }
    
    // ========== GESTIÓN DE JUEGO (PAUSA/RESUMEN) ==========
    public void setWebView(WebView webView) {
        this.webView = webView;
    }
    
    private void pauseGame() {
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
                    "}";
                
                webView.evaluateJavascript(pauseScript, null);
            });
        }
    }
    
    private void resumeGame() {
        if (webView != null && context instanceof Activity) {
            Activity activity = (Activity) context;
            activity.runOnUiThread(() -> {
                // Reanudar WebView
                webView.onResume();
                
                // Inyectar JavaScript para reanudar el juego
                String resumeScript = 
                    "window._isGamePaused = false; " +
                    "if (typeof window.gameResume === 'function') { window.gameResume(); }";
                
                webView.evaluateJavascript(resumeScript, null);
            });
        }
    }
    
    // ========== INTERFACES ==========
    public interface RewardCallback {
        void onRewardEarned(int amount);
    }
}

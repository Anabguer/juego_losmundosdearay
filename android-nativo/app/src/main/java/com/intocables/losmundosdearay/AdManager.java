package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Context;
import android.util.Log;
import android.widget.Toast;

import com.google.android.gms.ads.AdError;
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

public class AdManager {
    private static final String TAG = "AdManager";
    
    // IDs de AdMob - PRODUCCIÓN
    private static final String BANNER_AD_ID = "ca-app-pub-1338301235950360/1577253279"; // Banner producción
    private static final String INTERSTITIAL_AD_ID = "ca-app-pub-1338301235950360/3137746954"; // Intersticial producción
    private static final String REWARDED_AD_ID = "ca-app-pub-1338301235950360/2974095428"; // Rewarded producción
    
    private Context context;
    private AdView bannerAd;
    private InterstitialAd interstitialAd;
    private RewardedAd rewardedAd;
    private int gameCount = 0;
    
    public AdManager(Context context) {
        this.context = context;
        initializeAds();
    }
    
    private void initializeAds() {
        Log.d(TAG, "Inicializando AdMob...");
        MobileAds.initialize(context, new OnInitializationCompleteListener() {
            @Override
            public void onInitializationComplete(InitializationStatus initializationStatus) {
                Log.d(TAG, "AdMob inicializado correctamente");
                Log.d(TAG, "Estado de inicialización: " + initializationStatus.getAdapterStatusMap());
                loadInterstitialAd();
                loadRewardedAd();
            }
        });
    }
    
    // ========== BANNER ==========
    public void setupBannerAd(AdView adView) {
        Log.d(TAG, "Configurando banner AdMob...");
        this.bannerAd = adView;
        
        if (bannerAd == null) {
            Log.e(TAG, "ERROR: AdView es null!");
            return;
        }
        
        AdRequest adRequest = new AdRequest.Builder().build();
        Log.d(TAG, "Cargando banner con ID: " + BANNER_AD_ID);
        bannerAd.loadAd(adRequest);
        Log.d(TAG, "Banner cargado correctamente");
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
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Intersticial cerrado");
                                interstitialAd = null;
                                loadInterstitialAd(); // Cargar siguiente
                            }
                            
                            @Override
                            public void onAdFailedToShowFullScreenContent(AdError adError) {
                                Log.e(TAG, "Error mostrando intersticial: " + adError.getMessage());
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
                            public void onAdDismissedFullScreenContent() {
                                Log.d(TAG, "Rewarded cerrado");
                                rewardedAd = null;
                                loadRewardedAd(); // Cargar siguiente
                            }
                            
                            @Override
                            public void onAdFailedToShowFullScreenContent(AdError adError) {
                                Log.e(TAG, "Error mostrando rewarded: " + adError.getMessage());
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
    
    // ========== INTERFACES ==========
    public interface RewardCallback {
        void onRewardEarned(int amount);
    }
}

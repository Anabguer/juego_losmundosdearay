package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Intent;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldPath;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import com.google.firebase.firestore.QuerySnapshot;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.Transaction;
import com.google.firebase.firestore.WriteBatch;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class GameBridge {
    private static final String APP_ID = "aray"; // App ID para Aray
    private static final String WEB_CLIENT_ID = "989954746255-e6gfghahanjo4q8vggkuoafvk2iov6n0.apps.googleusercontent.com";
    
    private MainActivity activity;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private GoogleSignInClient googleSignInClient;
    private FirebaseUser currentUser;
    private AdManager adManager;
    private long cachedCandies = 0;
    private String cachedNick = null;
    private boolean cachedSoundEnabled = false;
    private boolean cachedMusicEnabled = false;

    public GameBridge(MainActivity activity, AdManager adManager) {
        this.activity = activity;
        this.adManager = adManager;
        this.mAuth = FirebaseAuth.getInstance();
        this.db = FirebaseFirestore.getInstance();
        
        Log.d("GameBridge", "🚀 GameBridge inicializado correctamente");
        
        // Configurar Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(WEB_CLIENT_ID)
                .requestEmail()
                .build();
        this.googleSignInClient = GoogleSignIn.getClient(activity, gso);
        
        // Configurar Firestore offline
        db.enableNetwork().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                // Firestore offline habilitado
                // Cargar datos iniciales del usuario si está logueado
                loadUserData();
            }
        });
    }

    @JavascriptInterface
    public String getUser() {
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            try {
                JSONObject user = new JSONObject();
                user.put("uid", currentUser.getUid());
                user.put("email", currentUser.getEmail());
                user.put("photoURL", currentUser.getPhotoUrl() != null ? currentUser.getPhotoUrl().toString() : null);
                
                // Intentar obtener nick del documento de Firestore
                String uid = currentUser.getUid();
                DocumentReference userRef = db
                    .collection("apps").document(APP_ID)
                    .collection("users").document(uid);
                
                userRef.get().addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult().exists()) {
                        DocumentSnapshot doc = task.getResult();
                        String nick = doc.getString("nick");
                        Long candiesTotal = doc.getLong("candiesTotal");
                        Object lastSeen = doc.get("lastSeen");
                        Object createdAt = doc.get("createdAt");
                        
                        // Actualizar cache con datos reales de Firestore
                        cachedNick = nick;
                        if (candiesTotal != null) cachedCandies = candiesTotal;
                        
                        Log.d("GameBridge", "📥 Datos completos cargados desde Firestore: nick=" + nick + ", candies=" + candiesTotal);
                    }
                });
                
                // Usar datos de cache (pueden ser temporales hasta que Firestore responda)
                user.put("nick", cachedNick != null ? cachedNick : "Usuario");
                user.put("candiesTotal", cachedCandies);
                user.put("soundEnabled", cachedSoundEnabled);
                user.put("musicEnabled", cachedMusicEnabled);
                
                Log.d("GameBridge", "getUser() devolviendo - uid: " + user.optString("uid") + ", nick: " + user.optString("nick") + ", candies: " + cachedCandies);
                return user.toString();
            } catch (JSONException e) {
                Log.e("GameBridge", "Error creando JSON en getUser(): " + e.getMessage());
                return "{}";
            }
        }
        Log.d("GameBridge", "getUser() - usuario no logueado");
        return "{}";
    }

    @JavascriptInterface
    public void addCandies(int total) {
        Log.d("GameBridge", "addCandies() llamado con valor absoluto: " + total);
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            Log.d("GameBridge", "Usuario logueado: " + uid);
            DocumentReference userRef = db
                .collection("apps").document(APP_ID)
                .collection("users").document(uid);
            
            // Establecer el valor absoluto en lugar de incrementar
            Map<String, Object> data = new HashMap<>();
            data.put("candiesTotal", (long) total);
            data.put("lastSeen", FieldValue.serverTimestamp());
            
            userRef.set(data, SetOptions.merge())
                .addOnSuccessListener(v -> {
                    Log.d("GameBridge", "✅ candies total = " + total);
                    cachedCandies = total;
                    activity.runOnUiThread(() -> {
                        WebView web = activity.findViewById(R.id.webview);
                        web.evaluateJavascript("if (window.updateHUD) { window.updateHUD(); }", null);
                    });
                })
                .addOnFailureListener(e -> Log.e("GameBridge", "❌ error actualizando candies", e));
        } else {
            Log.w("GameBridge", "Usuario no logueado, no se pueden añadir caramelos");
        }
    }

    @JavascriptInterface
    public void updateBestLevel(String gameId, int level) {
        Log.e("GameBridge", "🔥🔥🔥 updateBestLevel() LLAMADO - juego: " + gameId + ", nivel: " + level + " 🔥🔥🔥");
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DocumentReference progressRef = db
                .collection("apps").document(APP_ID)
                .collection("progress").document(uid + "_" + gameId);
            
            DocumentReference userRef = db
                .collection("apps").document(APP_ID)
                .collection("users").document(uid);
            
            // TRANSACCIÓN ATÓMICA: actualizar nivel Y caramelos
            db.runTransaction(transaction -> {
                DocumentSnapshot progressSnap = transaction.get(progressRef);
                long currentLevel = 0L;
                if (progressSnap.exists()) {
                    Long v = progressSnap.getLong("bestLevel");
                    currentLevel = (v != null) ? v : 0L;
                }
                
                if (level > currentLevel) {
                    // Actualizar nivel máximo
                    Map<String, Object> progressData = new HashMap<>();
                    progressData.put("uid", uid);
                    progressData.put("gameId", gameId);
                    progressData.put("bestLevel", (long) level);
                    progressData.put("updatedAt", FieldValue.serverTimestamp());
                    transaction.set(progressRef, progressData, SetOptions.merge());
                    
                    // NO añadir caramelos automáticamente - JavaScript se encarga de eso
                    transaction.update(userRef, "lastSeen", FieldValue.serverTimestamp());
                    
                    Log.e("GameBridge", "🔥🔥🔥 Nivel ↑ " + currentLevel + " → " + level + " ("+gameId+") (sin caramelos - JS los añade) 🔥🔥🔥");
                } else {
                    // Nivel igual o menor - solo actualizar lastSeen
                    transaction.update(userRef, "lastSeen", FieldValue.serverTimestamp());
                    Log.e("GameBridge", "🔥🔥🔥 Nivel sin cambio ("+gameId+"): " + currentLevel + " ≥ " + level + " 🔥🔥🔥");
                }
                return null;
            }).addOnSuccessListener(v -> {
                Log.d("GameBridge", "🎉 Transacción completada exitosamente para " + gameId);
            }).addOnFailureListener(e -> {
                Log.e("GameBridge", "❌ tx bestLevel falló", e);
            });
        } else {
            Log.w("GameBridge", "⚠️ Usuario no logueado, no se puede guardar progreso");
        }
    }

    @JavascriptInterface
    public void testAuth() {
        Log.d("GameBridge", "testAuth() llamado desde JavaScript");
        
        // Verificar autenticación real
        FirebaseUser realUser = mAuth.getCurrentUser();
        Log.d("GameBridge", "testAuth() - mAuth.getCurrentUser(): " + (realUser != null ? realUser.getUid() : "NULL"));
        
        // Verificar currentUser
        Log.d("GameBridge", "testAuth() - currentUser: " + (currentUser != null ? currentUser.getUid() : "NULL"));
        
        // Enviar resultado al WebView
        activity.runOnUiThread(() -> {
            WebView webView = activity.findViewById(R.id.webview);
            String result = realUser != null ? "AUTHENTICATED" : "NOT_AUTHENTICATED";
            webView.evaluateJavascript(
                "console.log('🔐 testAuth resultado: " + result + "');",
                null
            );
        });
    }

    @JavascriptInterface
    public void testDirectSet(String gameId, int level) {
        Log.d("GameBridge", "testDirectSet() llamado - juego: " + gameId + ", nivel: " + level);
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DocumentReference progressRef = db
                .collection("apps").document(APP_ID)
                .collection("progress").document(uid + "_" + gameId);
            
            Log.d("GameBridge", "testDirectSet() - Ruta: apps/" + APP_ID + "/progress/" + uid + "_" + gameId);
            
            // Usar set() directo en lugar de transacción
            Map<String, Object> data = new HashMap<>();
            data.put("uid", uid);
            data.put("gameId", gameId);
            data.put("bestLevel", (long) level);
            data.put("updatedAt", FieldValue.serverTimestamp());
            
            progressRef.set(data, SetOptions.merge())
                .addOnSuccessListener(v -> {
                    Log.d("GameBridge", "✅ testDirectSet EXITOSO - " + gameId + " nivel " + level);
                })
                .addOnFailureListener(e -> {
                    Log.e("GameBridge", "❌ testDirectSet FALLÓ - " + gameId, e);
                });
        } else {
            Log.w("GameBridge", "testDirectSet() - Usuario no logueado");
        }
    }

    @JavascriptInterface
    public void getBestLevel(String gameId) {
        Log.d("GameBridge", "getBestLevel() llamado para juego: " + gameId);
        try {
            currentUser = mAuth.getCurrentUser();
            if (currentUser != null) {
                String uid = currentUser.getUid();
                Log.d("GameBridge", "getBestLevel() - UID: " + uid);
                
                DocumentReference progressRef = db
                    .collection("apps").document(APP_ID)
                    .collection("progress").document(uid + "_" + gameId);
                
                Log.d("GameBridge", "getBestLevel() - Ruta: apps/" + APP_ID + "/progress/" + uid + "_" + gameId);
                
                progressRef.get().addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        DocumentSnapshot doc = task.getResult();
                        Log.d("GameBridge", "getBestLevel() - Documento existe: " + doc.exists());
                        
                        if (doc.exists()) {
                            Long bestLevel = doc.getLong("bestLevel");
                            int level = (bestLevel != null) ? bestLevel.intValue() : 0;
                            Log.d("GameBridge", "getBestLevel() - Nivel encontrado: " + level);
                            
                            // Enviar resultado al WebView
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onBestLevelReceived) { window.onBestLevelReceived('" + gameId + "', " + level + "); }";
                                Log.d("GameBridge", "📤 Enviando a JavaScript: " + jsCode);
                                webView.evaluateJavascript(jsCode, null);
                            });
                        } else {
                            Log.d("GameBridge", "getBestLevel() - Documento no existe, devolviendo 0");
                            // No hay progreso guardado
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onBestLevelReceived) { window.onBestLevelReceived('" + gameId + "', 0); }";
                                Log.d("GameBridge", "📤 Enviando a JavaScript (nivel 0): " + jsCode);
                                webView.evaluateJavascript(jsCode, null);
                            });
                        }
                    } else {
                        Log.e("GameBridge", "getBestLevel() - Error en la consulta", task.getException());
                    }
                });
            } else {
                Log.w("GameBridge", "getBestLevel() - Usuario no logueado");
            }
        } catch (Exception e) {
            Log.e("GameBridge", "Error inesperado en getBestLevel", e);
        }
    }

    @JavascriptInterface
    public void openRanking() {
        Log.d("GameBridge", "openRanking() llamado desde JavaScript");
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        Log.d("GameBridge", "openRanking() - currentUser: " + (currentUser != null ? currentUser.getUid() : "NULL"));
        
        if (currentUser == null) {
            // Usuario no logueado, iniciar flujo de login desde ranking
            Log.d("GameBridge", "openRanking() - Usuario no logueado, iniciando login...");
            activity.runOnUiThread(() -> activity.showRanking());
        } else {
            // Usuario logueado, mostrar ranking directamente
            Log.d("GameBridge", "openRanking() - Usuario logueado, mostrando ranking...");
            activity.runOnUiThread(() -> activity.showRanking());
        }
    }

    @JavascriptInterface
    public String getTop20() {
        // Siempre verificar el estado actual del usuario
        currentUser = mAuth.getCurrentUser();
        
        Log.d("GameBridge", "getTop20() - currentUser: " + (currentUser != null ? currentUser.getUid() : "NULL"));
        Log.d("GameBridge", "getTop20() - APP_ID: " + APP_ID);
        
        if (currentUser == null) {
            // Usuario no logueado, iniciar flujo de login desde ranking
            Log.d("GameBridge", "Usuario no logueado, iniciando login...");
            Log.d("GameBridge", "Llamando a activity.showRanking()...");
            activity.runOnUiThread(() -> {
                Log.d("GameBridge", "Ejecutando showRanking en UI thread...");
                activity.showRanking();
            });
            return "[]";
        }

        // Usuario logueado, cargar ranking
        Log.d("GameBridge", "Usuario logueado, cargando ranking...");
        loadRanking();
        return "[]"; // Retorno inmediato, el ranking llega via callback
    }
    
    private void loadRanking() {
        Query query = db
            .collection("apps").document(APP_ID)
            .collection("users")
            .orderBy("candiesTotal", Query.Direction.DESCENDING)
            .limit(20);
        
        query.get().addOnCompleteListener(task -> {
            if (task.isSuccessful()) {
                JSONArray ranking = new JSONArray();
                int position = 1;
                
                for (DocumentSnapshot document : task.getResult()) {
                    try {
                        JSONObject user = new JSONObject();
                        user.put("position", position++);
                        user.put("nick", document.getString("nick"));
                        user.put("candiesTotal", document.getLong("candiesTotal"));
                        ranking.put(user);
                    } catch (JSONException e) {
                        // Ignorar errores
                    }
                }
                
                // Enviar ranking al WebView
                final String rankingJson = ranking.toString();
                activity.runOnUiThread(() -> {
                    WebView webView = activity.findViewById(R.id.webview);
                    webView.evaluateJavascript(
                        "if (window.onRankingReceived) { window.onRankingReceived(" + rankingJson + "); }",
                        null
                    );
                });
            }
        });
    }

    @JavascriptInterface
    public void setNick(String nick) {
        try {
            if (currentUser == null) {
                currentUser = mAuth.getCurrentUser();
            }
            
            if (currentUser != null && nick != null && !nick.trim().isEmpty()) {
            String lowerNick = nick.toLowerCase().trim();
            String uid = currentUser.getUid();
            
            // Verificar si el nick ya existe
            DocumentReference nickRef = db.collection("apps").document(APP_ID).collection("nicks").document(lowerNick);
            nickRef.get().addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    DocumentSnapshot document = task.getResult();
                    if (document.exists()) {
                        // Nick ya existe
                        activity.runOnUiThread(() -> {
                            Toast.makeText(activity, "Nick en uso", Toast.LENGTH_SHORT).show();
                        });
                    } else {
                        // Nick disponible, crear
                        WriteBatch batch = db.batch();
                        
                        // Crear reserva de nick
                        Map<String, Object> nickData = new HashMap<>();
                        nickData.put("uid", uid);
                        nickData.put("nick", nick);
                        nickData.put("createdAt", System.currentTimeMillis());
                        batch.set(nickRef, nickData);
                        
                        // Actualizar usuario
                        DocumentReference userRef = db
                            .collection("apps").document(APP_ID)
                            .collection("users").document(uid);
                        Map<String, Object> userUpdate = new HashMap<>();
                        userUpdate.put("nick", nick);
                        userUpdate.put("lastSeen", FieldValue.serverTimestamp());
                        batch.update(userRef, userUpdate);
                        
                        batch.commit().addOnCompleteListener(batchTask -> {
                            if (batchTask.isSuccessful()) {
                                activity.runOnUiThread(() -> {
                                    Toast.makeText(activity, "Nick guardado: " + nick, Toast.LENGTH_SHORT).show();
                                });
                            }
                        });
                    }
                }
            });
            } else {
                activity.runOnUiThread(() -> {
                    Toast.makeText(activity, "Nick inválido", Toast.LENGTH_SHORT).show();
                });
            }
        } catch (Exception e) {
            activity.runOnUiThread(() -> {
                Toast.makeText(activity, "Error inesperado: " + e.getMessage(), Toast.LENGTH_LONG).show();
            });
        }
    }

    // ========== MÉTODOS DE ANUNCIOS ==========
    @JavascriptInterface
    public void onGamePlayed() {
        if (adManager != null) {
            adManager.onGamePlayed();
        }
    }

    @JavascriptInterface
    public void refreshUserData() {
        Log.d("GameBridge", "refreshUserData() llamado desde JavaScript");
        loadUserData();
    }
    
    @JavascriptInterface
    public String testGameBridge() {
        Log.d("GameBridge", "🧪 Test GameBridge llamado desde JavaScript");
        return "GameBridge funcionando correctamente";
    }

    @JavascriptInterface
    public void getCandiesAsync() {
        if (mAuth.getCurrentUser()==null) return;
        String uid = mAuth.getCurrentUser().getUid();
        db.collection("apps").document(APP_ID).collection("users").document(uid)
            .get().addOnSuccessListener(snap -> {
                long candies = (snap.exists() && snap.getLong("candiesTotal")!=null) ? snap.getLong("candiesTotal") : 0L;
                activity.runOnUiThread(() -> {
                    WebView web = activity.findViewById(R.id.webview);
                    web.evaluateJavascript("window.onCandies && window.onCandies("+candies+");", null);
                });
            });
    }

    @JavascriptInterface
    public void runDiagnosticTests() {
        Log.d("GameBridge", "🧪 Ejecutando tests de diagnóstico...");
        TestFirestore.runAllTests();
    }

    @JavascriptInterface
    public void resetProgress(String gameId) {
        Log.d("GameBridge", "resetProgress() llamado para juego: " + gameId);
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DocumentReference progressRef = db
                .collection("apps").document(APP_ID)
                .collection("progress").document(uid + "_" + gameId);
            
            Map<String, Object> updates = new HashMap<>();
            updates.put("bestLevel", 1L);
            updates.put("updatedAt", FieldValue.serverTimestamp());
            
            progressRef.set(updates).addOnSuccessListener(aVoid -> {
                Log.d("GameBridge", "✅ Progreso reseteado para " + gameId + " a nivel 1");
            }).addOnFailureListener(e -> {
                Log.e("GameBridge", "❌ Error reseteando progreso: " + e.getMessage());
            });
        }
    }
    

    @JavascriptInterface
    public boolean isUserLoggedIn() {
        Log.d("GameBridge", "🔍 isUserLoggedIn() llamado desde JavaScript");
        currentUser = mAuth.getCurrentUser();
        boolean isLoggedIn = currentUser != null;
        Log.d("GameBridge", "🔍 Usuario logueado: " + isLoggedIn + " (UID: " + (currentUser != null ? currentUser.getUid() : "null") + ")");
        return isLoggedIn;
    }

    public String getUserDataJson() {
        return getUser();
    }

    public void handleActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 1001) { // Login
            if (resultCode == Activity.RESULT_OK) {
                // Usuario logueado, actualizar currentUser y cargar datos
                Log.d("GameBridge", "handleActivityResult - Login exitoso");
                currentUser = mAuth.getCurrentUser();
                if (currentUser != null) {
                    Log.d("GameBridge", "handleActivityResult - Usuario logueado: " + currentUser.getUid());
                    loadUserData();
                }
                activity.runOnUiThread(() -> {
                    WebView webView = activity.findViewById(R.id.webview);
                    webView.reload();
                });
            }
        } else if (requestCode == 1002) { // Nick Setup
            if (resultCode == Activity.RESULT_OK) {
                // Nick configurado, recargar WebView
                Log.d("GameBridge", "handleActivityResult - Nick configurado");
                activity.runOnUiThread(() -> {
                    WebView webView = activity.findViewById(R.id.webview);
                    webView.reload();
                });
            }
        }
    }

    private String getNickFromCache() {
        if (cachedNick != null && !cachedNick.isEmpty()) {
            return cachedNick;
        }
        // Si no hay usuario logueado, devolver "Invitado"
        if (currentUser == null) {
            return "Invitado";
        }
        return "Usuario";
    }

    private long getCandiesFromCache() {
        // Implementar cache local si es necesario
        return 0;
    }
    
    private long getCandiesFromFirestore() {
        return cachedCandies;
    }
    
    private void loadUserData() {
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            Log.d("GameBridge", "loadUserData() - cargando datos para UID: " + uid);
            DocumentReference userRef = db
                .collection("apps").document(APP_ID)
                .collection("users").document(uid);
            
            userRef.get().addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    DocumentSnapshot document = task.getResult();
                    if (document.exists()) {
                        Long candies = document.getLong("candiesTotal");
                        cachedCandies = candies != null ? candies : 0L;
                        
                        String nick = document.getString("nick");
                        cachedNick = nick;
                        
                        // Cargar preferencias de audio (estructura original)
                        Boolean soundEnabled = document.getBoolean("soundEnabled");
                        Boolean musicEnabled = document.getBoolean("musicEnabled");
                        
                        // Si los campos no existen, crearlos con valores por defecto
                        if (soundEnabled == null || musicEnabled == null) {
                            Log.d("GameBridge", "🔧 Campos de audio no existen, creándolos con valores por defecto");
                            
                            Map<String, Object> audioDefaults = new HashMap<>();
                            if (soundEnabled == null) {
                                audioDefaults.put("soundEnabled", true);
                                cachedSoundEnabled = true;
                            } else {
                                cachedSoundEnabled = soundEnabled;
                            }
                            
                            if (musicEnabled == null) {
                                audioDefaults.put("musicEnabled", true);
                                cachedMusicEnabled = true;
                            } else {
                                cachedMusicEnabled = musicEnabled;
                            }
                            
                            // Actualizar el documento con los campos faltantes
                            userRef.update(audioDefaults)
                                .addOnSuccessListener(aVoid -> {
                                    Log.d("GameBridge", "✅ Campos de audio creados con valores por defecto");
                                })
                                .addOnFailureListener(e -> {
                                    Log.e("GameBridge", "❌ Error creando campos de audio: " + e.getMessage());
                                });
                        } else {
                            cachedSoundEnabled = soundEnabled;
                            cachedMusicEnabled = musicEnabled;
                        }
                        
                        Log.d("GameBridge", "✅ Datos de usuario cargados - caramelos: " + cachedCandies + ", nick: " + cachedNick);
                        Log.d("GameBridge", "🔊 Preferencias de audio - sonido: " + cachedSoundEnabled + ", música: " + cachedMusicEnabled);
                        Log.d("GameBridge", "📝 Nick cargado desde Firebase: " + (nick != null ? nick : "null"));
                        Log.d("GameBridge", "📝 cachedNick actualizado a: " + cachedNick);
                        
                        // Actualizar HUD inmediatamente después de cargar
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            webView.evaluateJavascript(
                                "if (window.updateHUD) { window.updateHUD(); }",
                                null
                            );
                            // Notificar que las preferencias de audio están listas
                            webView.evaluateJavascript(
                                "if (window.onAudioPreferencesLoaded) { window.onAudioPreferencesLoaded(); }",
                                null
                            );
                            // También notificar inmediatamente con los valores actuales
                            webView.evaluateJavascript(
                                "if (window.updateAudioToggles) { window.updateAudioToggles(); }",
                                null
                            );
                        });
                    } else {
                        Log.w("GameBridge", "⚠️ Documento de usuario no existe en Firestore");
                        cachedCandies = 0L;
                        cachedNick = null;
                    }
                } else {
                    Log.e("GameBridge", "❌ Error cargando datos de usuario: " + task.getException());
                    cachedCandies = 0L;
                    cachedNick = null;
                }
            });
        } else {
            Log.d("GameBridge", "loadUserData() - usuario no logueado");
            cachedCandies = 0L;
            cachedNick = null;
            cachedSoundEnabled = false;
            cachedMusicEnabled = false;
            
            // Notificar que las preferencias están listas (valores por defecto)
            activity.runOnUiThread(() -> {
                WebView webView = activity.findViewById(R.id.webview);
                webView.evaluateJavascript(
                    "if (window.onAudioPreferencesLoaded) { window.onAudioPreferencesLoaded(); }",
                    null
                );
            });
        }
    }

           @JavascriptInterface
           public void signInWithGoogle() {
               Log.d("GameBridge", "signInWithGoogle() llamado desde JavaScript");
               if (activity != null) {
                   activity.runOnUiThread(() -> {
                       // Abrir LoginActivity para autenticación
                       Intent intent = new Intent(activity, LoginActivity.class);
                       activity.startActivityForResult(intent, 1001);
                   });
               }
           }

    @JavascriptInterface
    public void openCandyRanking() {
        Log.d("GameBridge", "openCandyRanking() llamado desde JavaScript");
        if (activity != null) {
            activity.runOnUiThread(() -> {
                // Abrir RankingActivity para mostrar ranking de caramelos
                Intent intent = new Intent(activity, RankingActivity.class);
                activity.startActivity(intent);
            });
        }
    }


    @JavascriptInterface
    public void signOut() {
        Log.e("GameBridge", "🚪🚪🚪 signOut() llamado desde JavaScript 🚪🚪🚪");
        Log.e("GameBridge", "🚪 currentUser antes del signOut: " + (currentUser != null ? currentUser.getUid() : "null"));
        
        if (currentUser != null) {
            Log.e("GameBridge", "🚪 Ejecutando FirebaseAuth.getInstance().signOut()...");
            
            // Cerrar sesión de Firebase
            FirebaseAuth.getInstance().signOut();
            
            // Limpiar variables locales
            currentUser = null;
            cachedNick = null;
            
            // Forzar limpieza del cache de Firebase
            try {
                // Limpiar el cache de Firestore
                FirebaseFirestore.getInstance().clearPersistence();
                Log.e("GameBridge", "🚪 Cache de Firestore limpiado");
            } catch (Exception e) {
                Log.e("GameBridge", "🚪 Error limpiando cache de Firestore: " + e.getMessage());
            }
            
            // Verificar que realmente se cerró la sesión
            currentUser = mAuth.getCurrentUser();
            Log.e("GameBridge", "🚪 currentUser después del signOut: " + (currentUser != null ? currentUser.getUid() : "null"));
            
            Log.e("GameBridge", "🚪 Sesión cerrada exitosamente - variables y cache limpiados");
            
            // Notificar a JavaScript que la sesión se cerró
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    WebView webView = activity.findViewById(R.id.webview);
                    String jsCode = "if (window.onSignOutComplete) { window.onSignOutComplete(); }";
                    Log.e("GameBridge", "🚪 Enviando callback a JavaScript: " + jsCode);
                    webView.evaluateJavascript(jsCode, null);
                });
            } else {
                Log.e("GameBridge", "🚪 ERROR: activity es null, no se puede notificar a JavaScript");
            }
        } else {
            Log.e("GameBridge", "🚪 No hay sesión activa para cerrar");
        }
    }

           @JavascriptInterface
           public void getCandyRanking() {
               Log.e("GameBridge", "🚀🚀🚀 getCandyRanking() llamado desde JavaScript 🚀🚀🚀");
               
               if (currentUser == null) {
                   Log.w("GameBridge", "getCandyRanking: Usuario no autenticado. Devolviendo ranking vacío.");
                   activity.runOnUiThread(() -> {
                       WebView webView = activity.findViewById(R.id.webview);
                       String jsCode = "if (window.onCandyRankingReceived) { window.onCandyRankingReceived([]); }";
                       webView.evaluateJavascript(jsCode, null);
                   });
                   return;
               }

               // Primero intentar obtener todos los usuarios sin filtro
               Log.d("GameBridge", "🔍 Iniciando consulta simple a Firebase para ranking de caramelos...");
               db.collection("users")
                       .get()
                       .addOnCompleteListener(task -> {
                           if (task.isSuccessful()) {
                               Log.d("GameBridge", "✅ Consulta Firebase exitosa. Documentos encontrados: " + task.getResult().size());
                               JSONArray jsonRanking = new JSONArray();
                               
                               // Procesar todos los usuarios y filtrar los que tienen candiesTotal
                               for (QueryDocumentSnapshot document : task.getResult()) {
                                   try {
                                       String uid = document.getId();
                                       String nick = document.getString("nick");
                                       Long candiesTotal = document.getLong("candiesTotal");
                                       
                                       // Solo incluir usuarios que tienen candiesTotal > 0
                                       if (candiesTotal != null && candiesTotal > 0) {
                                           Log.d("GameBridge", "👤 Usuario válido: " + nick + " (UID: " + uid + ") - Caramelos: " + candiesTotal);
                                           
                                           JSONObject userJson = new JSONObject();
                                           userJson.put("uid", uid);
                                           userJson.put("nick", nick != null ? nick : "Usuario Anónimo");
                                           userJson.put("candiesTotal", candiesTotal);
                                           jsonRanking.put(userJson);
                                       } else {
                                           Log.d("GameBridge", "👤 Usuario sin caramelos: " + nick + " (UID: " + uid + ") - Caramelos: " + candiesTotal);
                                       }
                                   } catch (JSONException e) {
                                       Log.e("GameBridge", "Error al crear JSON para usuario en ranking de caramelos", e);
                                   }
                               }
                               
                               // Ordenar por candiesTotal (descendente)
                               Log.d("GameBridge", "📊 Total usuarios con caramelos: " + jsonRanking.length());
                               
                               // Enviar el ranking a JavaScript
                               activity.runOnUiThread(() -> {
                                   WebView webView = activity.findViewById(R.id.webview);
                                   String jsCode = "if (window.onCandyRankingReceived) { window.onCandyRankingReceived(" + jsonRanking.toString() + "); }";
                                   Log.d("GameBridge", "📤 Enviando ranking de caramelos: " + jsCode);
                                   webView.evaluateJavascript(jsCode, null);
                               });
                           } else {
                               Log.e("GameBridge", "❌ Error obteniendo ranking de caramelos", task.getException());
                               if (task.getException() != null) {
                                   Log.e("GameBridge", "Detalles del error: " + task.getException().getMessage());
                               }
                               activity.runOnUiThread(() -> {
                                   WebView webView = activity.findViewById(R.id.webview);
                                   String jsCode = "if (window.onCandyRankingReceived) { window.onCandyRankingReceived([]); }";
                                   webView.evaluateJavascript(jsCode, null);
                               });
                           }
                       });
           }

           @JavascriptInterface
           public void getYayosRanking() {
        Log.d("GameBridge", "getYayosRanking() llamado");
        
        // Obtener ranking de Yayos desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "yayos")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    List<Map<String, Object>> ranking = new ArrayList<>();
                    
                    for (QueryDocumentSnapshot doc : task.getResult()) {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("uid", doc.getString("uid"));
                        userData.put("bestLevel", doc.getLong("bestLevel"));
                        userData.put("updatedAt", doc.getTimestamp("updatedAt"));
                        ranking.add(userData);
                    }
                    
                    // Obtener información de usuarios (nick y caramelos)
                    if (!ranking.isEmpty()) {
                        List<String> uids = new ArrayList<>();
                        for (Map<String, Object> user : ranking) {
                            uids.add((String) user.get("uid"));
                        }
                        
                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), uids)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    Map<String, Map<String, Object>> userDataMap = new HashMap<>();
                                    
                                    for (QueryDocumentSnapshot userDoc : userTask.getResult()) {
                                        Map<String, Object> userInfo = new HashMap<>();
                                        userInfo.put("nick", userDoc.getString("nick"));
                                        userInfo.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                        userDataMap.put(userDoc.getId(), userInfo);
                                    }
                                    
                                    // Combinar datos de ranking con datos de usuario
                                    for (Map<String, Object> user : ranking) {
                                        String uid = (String) user.get("uid");
                                        Map<String, Object> userInfo = userDataMap.get(uid);
                                        if (userInfo != null) {
                                            user.put("nick", userInfo.get("nick"));
                                            user.put("candiesTotal", userInfo.get("candiesTotal"));
                                        }
                                    }
                                    
                                    // Enviar resultado al WebView
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        try {
                                            JSONArray jsonRanking = new JSONArray();
                                            for (Map<String, Object> user : ranking) {
                                                JSONObject userJson = new JSONObject();
                                                userJson.put("uid", user.get("uid"));
                                                userJson.put("nick", user.get("nick"));
                                                userJson.put("bestLevel", user.get("bestLevel"));
                                                userJson.put("candiesTotal", user.get("candiesTotal"));
                                                jsonRanking.put(userJson);
                                            }
                                            String jsCode = "if (window.onYayosRankingReceived) { window.onYayosRankingReceived(" + jsonRanking.toString() + "); }";
                                            Log.d("GameBridge", "📤 Enviando ranking de Yayos: " + jsCode);
                                            webView.evaluateJavascript(jsCode, null);
                                        } catch (JSONException e) {
                                            Log.e("GameBridge", "Error creando JSON del ranking", e);
                                        }
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onYayosRankingReceived) { window.onYayosRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Yayos", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getSkateRanking() {
        Log.d("GameBridge", "getSkateRanking() llamado");
        
        // Obtener ranking de Skate desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "skate")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    List<Map<String, Object>> ranking = new ArrayList<>();
                    
                    for (QueryDocumentSnapshot doc : task.getResult()) {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("uid", doc.getString("uid"));
                        userData.put("bestLevel", doc.getLong("bestLevel"));
                        userData.put("updatedAt", doc.getTimestamp("updatedAt"));
                        ranking.add(userData);
                    }
                    
                    // Obtener información de usuarios (nick y caramelos)
                    if (!ranking.isEmpty()) {
                        List<String> uids = new ArrayList<>();
                        for (Map<String, Object> user : ranking) {
                            uids.add((String) user.get("uid"));
                        }
                        
                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), uids)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    Map<String, Map<String, Object>> userDataMap = new HashMap<>();
                                    
                                    for (QueryDocumentSnapshot userDoc : userTask.getResult()) {
                                        Map<String, Object> userInfo = new HashMap<>();
                                        userInfo.put("nick", userDoc.getString("nick"));
                                        userInfo.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                        userDataMap.put(userDoc.getId(), userInfo);
                                    }
                                    
                                    // Combinar datos de ranking con datos de usuario
                                    for (Map<String, Object> user : ranking) {
                                        String uid = (String) user.get("uid");
                                        Map<String, Object> userInfo = userDataMap.get(uid);
                                        if (userInfo != null) {
                                            user.put("nick", userInfo.get("nick"));
                                            user.put("candiesTotal", userInfo.get("candiesTotal"));
                                        }
                                    }
                                    
                                    // Enviar resultado al WebView
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        try {
                                            JSONArray jsonRanking = new JSONArray();
                                            for (Map<String, Object> user : ranking) {
                                                JSONObject userJson = new JSONObject();
                                                userJson.put("uid", user.get("uid"));
                                                userJson.put("nick", user.get("nick"));
                                                userJson.put("bestLevel", user.get("bestLevel"));
                                                userJson.put("candiesTotal", user.get("candiesTotal"));
                                                jsonRanking.put(userJson);
                                            }
                                            String jsCode = "if (window.onSkateRankingReceived) { window.onSkateRankingReceived(" + jsonRanking.toString() + "); }";
                                            Log.d("GameBridge", "📤 Enviando ranking de Skate: " + jsCode);
                                            webView.evaluateJavascript(jsCode, null);
                                        } catch (JSONException e) {
                                            Log.e("GameBridge", "Error creando JSON del ranking", e);
                                        }
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onSkateRankingReceived) { window.onSkateRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Skate", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getColeRanking() {
        Log.d("GameBridge", "getColeRanking() llamado");
        
        // Obtener ranking de Cole desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "cole")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    List<Map<String, Object>> ranking = new ArrayList<>();
                    
                    for (QueryDocumentSnapshot doc : task.getResult()) {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("uid", doc.getString("uid"));
                        userData.put("bestLevel", doc.getLong("bestLevel"));
                        userData.put("updatedAt", doc.getTimestamp("updatedAt"));
                        ranking.add(userData);
                    }
                    
                    // Obtener información de usuarios (nick y caramelos)
                    if (!ranking.isEmpty()) {
                        List<String> uids = new ArrayList<>();
                        for (Map<String, Object> user : ranking) {
                            uids.add((String) user.get("uid"));
                        }
                        
                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), uids)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    Map<String, Map<String, Object>> userDataMap = new HashMap<>();
                                    
                                    for (QueryDocumentSnapshot userDoc : userTask.getResult()) {
                                        Map<String, Object> userInfo = new HashMap<>();
                                        userInfo.put("nick", userDoc.getString("nick"));
                                        userInfo.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                        userDataMap.put(userDoc.getId(), userInfo);
                                    }
                                    
                                    // Combinar datos de ranking con datos de usuario
                                    for (Map<String, Object> user : ranking) {
                                        String uid = (String) user.get("uid");
                                        Map<String, Object> userInfo = userDataMap.get(uid);
                                        if (userInfo != null) {
                                            user.put("nick", userInfo.get("nick"));
                                            user.put("candiesTotal", userInfo.get("candiesTotal"));
                                        }
                                    }
                                    
                                    // Enviar resultado al WebView
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        try {
                                            JSONArray jsonRanking = new JSONArray();
                                            for (Map<String, Object> user : ranking) {
                                                JSONObject userJson = new JSONObject();
                                                userJson.put("uid", user.get("uid"));
                                                userJson.put("nick", user.get("nick"));
                                                userJson.put("bestLevel", user.get("bestLevel"));
                                                userJson.put("candiesTotal", user.get("candiesTotal"));
                                                jsonRanking.put(userJson);
                                            }
                                            String jsCode = "if (window.onColeRankingReceived) { window.onColeRankingReceived(" + jsonRanking.toString() + "); }";
                                            Log.d("GameBridge", "📤 Enviando ranking de Cole: " + jsCode);
                                            webView.evaluateJavascript(jsCode, null);
                                        } catch (JSONException e) {
                                            Log.e("GameBridge", "Error creando JSON del ranking", e);
                                        }
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onColeRankingReceived) { window.onColeRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Cole", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getInformaticaRanking() {
        Log.d("GameBridge", "getInformaticaRanking() llamado");
        
        // Obtener ranking de Informática desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "informatica")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    List<Map<String, Object>> ranking = new ArrayList<>();
                    
                    for (QueryDocumentSnapshot doc : task.getResult()) {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("uid", doc.getString("uid"));
                        userData.put("bestLevel", doc.getLong("bestLevel"));
                        userData.put("updatedAt", doc.getTimestamp("updatedAt"));
                        ranking.add(userData);
                    }
                    
                    // Obtener información de usuarios (nick y caramelos)
                    if (!ranking.isEmpty()) {
                        List<String> uids = new ArrayList<>();
                        for (Map<String, Object> user : ranking) {
                            uids.add((String) user.get("uid"));
                        }
                        
                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), uids)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    Map<String, Map<String, Object>> userDataMap = new HashMap<>();
                                    
                                    for (QueryDocumentSnapshot userDoc : userTask.getResult()) {
                                        Map<String, Object> userInfo = new HashMap<>();
                                        userInfo.put("nick", userDoc.getString("nick"));
                                        userInfo.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                        userDataMap.put(userDoc.getId(), userInfo);
                                    }
                                    
                                    // Combinar datos de ranking con datos de usuario
                                    for (Map<String, Object> user : ranking) {
                                        String uid = (String) user.get("uid");
                                        Map<String, Object> userInfo = userDataMap.get(uid);
                                        if (userInfo != null) {
                                            user.put("nick", userInfo.get("nick"));
                                            user.put("candiesTotal", userInfo.get("candiesTotal"));
                                        }
                                    }
                                    
                                    // Enviar resultado al WebView
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        try {
                                            JSONArray jsonRanking = new JSONArray();
                                            for (Map<String, Object> user : ranking) {
                                                JSONObject userJson = new JSONObject();
                                                userJson.put("uid", user.get("uid"));
                                                userJson.put("nick", user.get("nick"));
                                                userJson.put("bestLevel", user.get("bestLevel"));
                                                userJson.put("candiesTotal", user.get("candiesTotal"));
                                                jsonRanking.put(userJson);
                                            }
                                            String jsCode = "if (window.onInformaticaRankingReceived) { window.onInformaticaRankingReceived(" + jsonRanking.toString() + "); }";
                                            Log.d("GameBridge", "📤 Enviando ranking de Informática: " + jsCode);
                                            webView.evaluateJavascript(jsCode, null);
                                        } catch (JSONException e) {
                                            Log.e("GameBridge", "Error creando JSON del ranking", e);
                                        }
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onInformaticaRankingReceived) { window.onInformaticaRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Informática", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getTiendaRanking() {
        Log.d("GameBridge", "getTiendaRanking() llamado");
        
        // Obtener ranking de Tienda desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "tienda")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    List<Map<String, Object>> ranking = new ArrayList<>();
                    
                    for (QueryDocumentSnapshot doc : task.getResult()) {
                        Map<String, Object> userData = new HashMap<>();
                        userData.put("uid", doc.getString("uid"));
                        userData.put("bestLevel", doc.getLong("bestLevel"));
                        userData.put("updatedAt", doc.getTimestamp("updatedAt"));
                        ranking.add(userData);
                    }
                    
                    // Obtener información de usuarios (nick y caramelos)
                    if (!ranking.isEmpty()) {
                        List<String> uids = new ArrayList<>();
                        for (Map<String, Object> user : ranking) {
                            uids.add((String) user.get("uid"));
                        }
                        
                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), uids)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    Map<String, Map<String, Object>> userDataMap = new HashMap<>();
                                    
                                    for (QueryDocumentSnapshot userDoc : userTask.getResult()) {
                                        Map<String, Object> userInfo = new HashMap<>();
                                        userInfo.put("nick", userDoc.getString("nick"));
                                        userInfo.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                        userDataMap.put(userDoc.getId(), userInfo);
                                    }
                                    
                                    // Combinar datos de ranking con datos de usuario
                                    for (Map<String, Object> user : ranking) {
                                        String uid = (String) user.get("uid");
                                        Map<String, Object> userInfo = userDataMap.get(uid);
                                        if (userInfo != null) {
                                            user.put("nick", userInfo.get("nick"));
                                            user.put("candiesTotal", userInfo.get("candiesTotal"));
                                        }
                                    }
                                    
                                    // Enviar resultado al WebView
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        try {
                                            JSONArray jsonRanking = new JSONArray();
                                            for (Map<String, Object> user : ranking) {
                                                JSONObject userJson = new JSONObject();
                                                userJson.put("uid", user.get("uid"));
                                                userJson.put("nick", user.get("nick"));
                                                userJson.put("bestLevel", user.get("bestLevel"));
                                                userJson.put("candiesTotal", user.get("candiesTotal"));
                                                jsonRanking.put(userJson);
                                            }
                                            String jsCode = "if (window.onTiendaRankingReceived) { window.onTiendaRankingReceived(" + jsonRanking.toString() + "); }";
                                            Log.d("GameBridge", "📤 Enviando ranking de Tienda: " + jsCode);
                                            webView.evaluateJavascript(jsCode, null);
                                        } catch (JSONException e) {
                                            Log.e("GameBridge", "Error creando JSON del ranking", e);
                                        }
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onTiendaRankingReceived) { window.onTiendaRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Tienda", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getEdificioRanking() {
        Log.d("GameBridge", "getEdificioRanking() llamado");
        
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "edificio")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    QuerySnapshot snapshot = task.getResult();
                    if (snapshot != null && !snapshot.isEmpty()) {
                        List<String> userIds = new ArrayList<>();
                        Map<String, DocumentSnapshot> progressDocs = new HashMap<>();

                        for (DocumentSnapshot doc : snapshot.getDocuments()) {
                            String userId = doc.getString("uid"); // Los progresos guardan 'uid'
                            if (userId != null && !userId.isEmpty()) {
                                userIds.add(userId);
                                progressDocs.put(userId, doc);
                            }
                        }

                        // Si no hay usuarios válidos
                        if (userIds.isEmpty()) {
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onEdificioRankingReceived) { window.onEdificioRankingReceived([]); }";
                                webView.evaluateJavascript(jsCode, null);
                            });
                            return;
                        }

                        // Firestore whereIn admite hasta 10 IDs → limitar
                        if (userIds.size() > 10) {
                            userIds = new ArrayList<>(userIds.subList(0, 10));
                        }

                        // Hacer inmutable para uso dentro de lambdas
                        final List<String> finalUserIds = new ArrayList<>(userIds);

                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), finalUserIds)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    QuerySnapshot userSnapshot = userTask.getResult();
                                    Map<String, DocumentSnapshot> userDocs = new HashMap<>();
                                    if (userSnapshot != null) {
                                        for (DocumentSnapshot userDoc : userSnapshot.getDocuments()) {
                                            userDocs.put(userDoc.getId(), userDoc);
                                        }
                                    }

                                    JSONArray jsonRanking = new JSONArray();
                                    for (String uid : finalUserIds) {
                                        DocumentSnapshot progressDoc = progressDocs.get(uid);
                                        DocumentSnapshot userDoc = userDocs.get(uid);
                                        if (progressDoc != null && userDoc != null) {
                                            try {
                                                JSONObject entry = new JSONObject();
                                                entry.put("nick", userDoc.getString("nick"));
                                                entry.put("bestLevel", progressDoc.getLong("bestLevel"));
                                                entry.put("photoURL", userDoc.getString("photoURL"));
                                                // Candies desde documento de usuario si existe
                                                Long candies = userDoc.getLong("candiesTotal");
                                                entry.put("candiesTotal", candies != null ? candies : 0);
                                                jsonRanking.put(entry);
                                            } catch (JSONException e) {
                                                Log.e("GameBridge", "Error creando entrada del ranking", e);
                                            }
                                        }
                                    }

                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        String jsCode = "if (window.onEdificioRankingReceived) { window.onEdificioRankingReceived(" + jsonRanking.toString() + "); }";
                                        Log.d("GameBridge", "📤 Enviando ranking de Edificio: " + jsCode);
                                        webView.evaluateJavascript(jsCode, null);
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        String jsCode = "if (window.onEdificioRankingReceived) { window.onEdificioRankingReceived([]); }";
                                        webView.evaluateJavascript(jsCode, null);
                                    });
                                }
                            });
                    } else {
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onEdificioRankingReceived) { window.onEdificioRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Edificio", task.getException());
                    activity.runOnUiThread(() -> {
                        WebView webView = activity.findViewById(R.id.webview);
                        String jsCode = "if (window.onEdificioRankingReceived) { window.onEdificioRankingReceived([]); }";
                        webView.evaluateJavascript(jsCode, null);
                    });
                }
            });
    }

    @JavascriptInterface
    public void updateAudioPreferences(boolean soundEnabled, boolean musicEnabled) {
        Log.e("GameBridge", "🔊🔊🔊 updateAudioPreferences() LLAMADO desde JavaScript 🔊🔊🔊");
        Log.e("GameBridge", "🔊 Valores recibidos - sonido: " + soundEnabled + ", música: " + musicEnabled);
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DocumentReference userRef = db
                .collection("apps").document(APP_ID)
                .collection("users").document(uid);
            
            Map<String, Object> data = new HashMap<>();
            data.put("soundEnabled", soundEnabled);
            data.put("musicEnabled", musicEnabled);
            data.put("lastSeen", FieldValue.serverTimestamp());
            
            userRef.update(data)
                .addOnSuccessListener(aVoid -> {
                    Log.e("GameBridge", "✅✅✅ Preferencias de audio actualizadas en Firebase ✅✅✅");
                    cachedSoundEnabled = soundEnabled;
                    cachedMusicEnabled = musicEnabled;
                    Log.e("GameBridge", "✅ Cache actualizado - soundEnabled: " + cachedSoundEnabled + ", musicEnabled: " + cachedMusicEnabled);
                    
                    // Notificar a JavaScript que las preferencias han cambiado
                    activity.runOnUiThread(() -> {
                        WebView webView = activity.findViewById(R.id.webview);
                        webView.evaluateJavascript(
                            "if (window.onAudioPreferencesUpdated) { window.onAudioPreferencesUpdated(" + soundEnabled + ", " + musicEnabled + "); }",
                            null
                        );
                    });
                })
                .addOnFailureListener(e -> {
                    Log.e("GameBridge", "❌❌❌ Error actualizando preferencias de audio: " + e.getMessage());
                });
        } else {
            Log.w("GameBridge", "⚠️ Usuario no logueado, no se pueden actualizar preferencias de audio");
        }
    }

    @JavascriptInterface
    public boolean getSoundEnabled() {
        return cachedSoundEnabled;
    }

    @JavascriptInterface
    public boolean getMusicEnabled() {
        return cachedMusicEnabled;
    }

    @JavascriptInterface
    public void getPabellonRanking() {
        Log.d("GameBridge", "getPabellonRanking() llamado");
        
        // Obtener ranking de Pabellón desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "pabellon")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    QuerySnapshot snapshot = task.getResult();
                    if (snapshot != null && !snapshot.isEmpty()) {
                        // Obtener datos de usuarios para cada entrada del ranking
                        List<String> userIds = new ArrayList<>();
                        Map<String, DocumentSnapshot> progressDocs = new HashMap<>();
                        
                        for (DocumentSnapshot doc : snapshot.getDocuments()) {
                            String userId = doc.getString("uid"); // Corrected from "userId" to "uid"
                            if (userId != null) {
                                userIds.add(userId);
                                progressDocs.put(userId, doc);
                            }
                        }
                        
                        // Limitar userIds a 10 para la consulta whereIn
                        List<String> finalUserIds = userIds.subList(0, Math.min(userIds.size(), 10));
                        
                        if (finalUserIds.isEmpty()) {
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onPabellonRankingReceived) { window.onPabellonRankingReceived([]); }";
                                webView.evaluateJavascript(jsCode, null);
                            });
                            return;
                        }

                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), finalUserIds)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    QuerySnapshot userSnapshot = userTask.getResult();
                                    Map<String, DocumentSnapshot> userDocs = new HashMap<>();
                                    
                                    if (userSnapshot != null) {
                                        for (DocumentSnapshot userDoc : userSnapshot.getDocuments()) {
                                            userDocs.put(userDoc.getId(), userDoc);
                                        }
                                    }
                                    
                                    // Crear ranking combinado
                                    JSONArray jsonRanking = new JSONArray();
                                    for (DocumentSnapshot progressDoc : progressDocs.values()) {
                                        String userId = progressDoc.getString("uid"); // Corrected from "userId" to "uid"
                                        DocumentSnapshot userDoc = userDocs.get(userId);
                                        
                                        if (userDoc != null) {
                                            try {
                                                JSONObject entry = new JSONObject();
                                                entry.put("nick", userDoc.getString("nick"));
                                                entry.put("bestLevel", progressDoc.getLong("bestLevel")); // Usar bestLevel para consistencia
                                                entry.put("photoURL", userDoc.getString("photoURL"));
                                                entry.put("candiesTotal", userDoc.getLong("candiesTotal")); // Added candiesTotal
                                                jsonRanking.put(entry);
                                            } catch (JSONException e) {
                                                Log.e("GameBridge", "Error creando entrada del ranking", e);
                                            }
                                        }
                                    }
                                    
                                    // Enviar ranking a JavaScript
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        String jsCode = "if (window.onPabellonRankingReceived) { window.onPabellonRankingReceived(" + jsonRanking.toString() + "); }";
                                        Log.d("GameBridge", "📤 Enviando ranking de Pabellón: " + jsCode);
                                        webView.evaluateJavascript(jsCode, null);
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onPabellonRankingReceived) { window.onPabellonRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Pabellón", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getRioRanking() {
        Log.d("GameBridge", "getRioRanking() llamado");
        
        // Obtener ranking de Río desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "rio")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    QuerySnapshot snapshot = task.getResult();
                    if (snapshot != null && !snapshot.isEmpty()) {
                        // Obtener datos de usuarios para cada entrada del ranking
                        List<String> userIds = new ArrayList<>();
                        Map<String, DocumentSnapshot> progressDocs = new HashMap<>();
                        
                        for (DocumentSnapshot doc : snapshot.getDocuments()) {
                            String userId = doc.getString("uid"); // Corrected from "userId" to "uid"
                            if (userId != null) {
                                userIds.add(userId);
                                progressDocs.put(userId, doc);
                            }
                        }
                        
                        // Limitar userIds a 10 para la consulta whereIn
                        List<String> finalUserIds = userIds.subList(0, Math.min(userIds.size(), 10));
                        
                        if (finalUserIds.isEmpty()) {
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onRioRankingReceived) { window.onRioRankingReceived([]); }";
                                webView.evaluateJavascript(jsCode, null);
                            });
                            return;
                        }

                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), finalUserIds)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    QuerySnapshot userSnapshot = userTask.getResult();
                                    Map<String, DocumentSnapshot> userDocs = new HashMap<>();
                                    
                                    if (userSnapshot != null) {
                                        for (DocumentSnapshot userDoc : userSnapshot.getDocuments()) {
                                            userDocs.put(userDoc.getId(), userDoc);
                                        }
                                    }
                                    
                                    // Crear ranking combinado
                                    JSONArray jsonRanking = new JSONArray();
                                    for (DocumentSnapshot progressDoc : progressDocs.values()) {
                                        String userId = progressDoc.getString("uid"); // Corrected from "userId" to "uid"
                                        DocumentSnapshot userDoc = userDocs.get(userId);
                                        
                                        if (userDoc != null) {
                                            try {
                                                JSONObject entry = new JSONObject();
                                                entry.put("nick", userDoc.getString("nick"));
                                                entry.put("bestLevel", progressDoc.getLong("bestLevel")); // Usar bestLevel para consistencia
                                                entry.put("photoURL", userDoc.getString("photoURL"));
                                                entry.put("candiesTotal", userDoc.getLong("candiesTotal")); // Added candiesTotal
                                                jsonRanking.put(entry);
                                            } catch (JSONException e) {
                                                Log.e("GameBridge", "Error creando entrada del ranking", e);
                                            }
                                        }
                                    }
                                    
                                    // Enviar ranking a JavaScript
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        String jsCode = "if (window.onRioRankingReceived) { window.onRioRankingReceived(" + jsonRanking.toString() + "); }";
                                        Log.d("GameBridge", "📤 Enviando ranking de Río: " + jsCode);
                                        webView.evaluateJavascript(jsCode, null);
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onRioRankingReceived) { window.onRioRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Río", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void getParqueRanking() {
        Log.d("GameBridge", "getParqueRanking() llamado");
        
        // Obtener ranking de Parque desde Firebase
        db.collection("apps").document(APP_ID)
            .collection("progress")
            .whereEqualTo("gameId", "parque")
            .orderBy("bestLevel", Query.Direction.DESCENDING)
            .limit(20)
            .get()
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    QuerySnapshot snapshot = task.getResult();
                    if (snapshot != null && !snapshot.isEmpty()) {
                        // Obtener datos de usuarios para cada entrada del ranking
                        List<String> userIds = new ArrayList<>();
                        Map<String, DocumentSnapshot> progressDocs = new HashMap<>();
                        
                        for (DocumentSnapshot doc : snapshot.getDocuments()) {
                            String userId = doc.getString("uid");
                            if (userId != null) {
                                userIds.add(userId);
                                progressDocs.put(userId, doc);
                            }
                        }
                        
                        // Limitar userIds a 10 para la consulta whereIn
                        List<String> finalUserIds = userIds.subList(0, Math.min(userIds.size(), 10));
                        
                        if (finalUserIds.isEmpty()) {
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                String jsCode = "if (window.onParqueRankingReceived) { window.onParqueRankingReceived([]); }";
                                webView.evaluateJavascript(jsCode, null);
                            });
                            return;
                        }

                        // Obtener datos de usuarios
                        db.collection("apps").document(APP_ID)
                            .collection("users")
                            .whereIn(FieldPath.documentId(), finalUserIds)
                            .get()
                            .addOnCompleteListener(userTask -> {
                                if (userTask.isSuccessful()) {
                                    QuerySnapshot userSnapshot = userTask.getResult();
                                    Map<String, DocumentSnapshot> userDocs = new HashMap<>();
                                    
                                    if (userSnapshot != null) {
                                        for (DocumentSnapshot userDoc : userSnapshot.getDocuments()) {
                                            userDocs.put(userDoc.getId(), userDoc);
                                        }
                                    }
                                    
                                    // Crear ranking combinado
                                    JSONArray jsonRanking = new JSONArray();
                                    for (DocumentSnapshot progressDoc : progressDocs.values()) {
                                        String userId = progressDoc.getString("uid");
                                        DocumentSnapshot userDoc = userDocs.get(userId);
                                        
                                        if (userDoc != null) {
                                            try {
                                                JSONObject entry = new JSONObject();
                                                entry.put("nick", userDoc.getString("nick"));
                                                entry.put("bestLevel", progressDoc.getLong("bestLevel"));
                                                entry.put("photoURL", userDoc.getString("photoURL"));
                                                entry.put("candiesTotal", userDoc.getLong("candiesTotal"));
                                                jsonRanking.put(entry);
                                            } catch (JSONException e) {
                                                Log.e("GameBridge", "Error creando entrada del ranking", e);
                                            }
                                        }
                                    }
                                    
                                    // Enviar ranking a JavaScript
                                    activity.runOnUiThread(() -> {
                                        WebView webView = activity.findViewById(R.id.webview);
                                        String jsCode = "if (window.onParqueRankingReceived) { window.onParqueRankingReceived(" + jsonRanking.toString() + "); }";
                                        Log.d("GameBridge", "📤 Enviando ranking de Parque: " + jsCode);
                                        webView.evaluateJavascript(jsCode, null);
                                    });
                                } else {
                                    Log.e("GameBridge", "Error obteniendo datos de usuarios", userTask.getException());
                                }
                            });
                    } else {
                        // No hay ranking, enviar lista vacía
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            String jsCode = "if (window.onParqueRankingReceived) { window.onParqueRankingReceived([]); }";
                            webView.evaluateJavascript(jsCode, null);
                        });
                    }
                } else {
                    Log.e("GameBridge", "Error obteniendo ranking de Parque", task.getException());
                }
            });
    }

    @JavascriptInterface
    public void testMethod() {
        Log.e("GameBridge", "🧪🧪🧪 testMethod() LLAMADO desde JavaScript 🧪🧪🧪");
    }

}

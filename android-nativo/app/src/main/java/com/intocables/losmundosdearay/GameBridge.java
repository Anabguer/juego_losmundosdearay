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
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.Transaction;
import com.google.firebase.firestore.WriteBatch;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

public class GameBridge {
    private static final String APP_ID = "aray"; // App ID para Aray
    private static final String WEB_CLIENT_ID = "989954746255-gpudi6ehmo4o7drku379b71kudr5t526.apps.googleusercontent.com";
    
    private MainActivity activity;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;
    private GoogleSignInClient googleSignInClient;
    private FirebaseUser currentUser;
    private AdManager adManager;
    private long cachedCandies = 0;

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
                user.put("nick", getNickFromCache());
                user.put("candiesTotal", cachedCandies);
                Log.d("GameBridge", "getUser() devolviendo candiesTotal: " + cachedCandies);
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
    public void addCandies(int delta) {
        Log.d("GameBridge", "addCandies() llamado con delta: " + delta);
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            Log.d("GameBridge", "Usuario logueado: " + uid);
            DocumentReference userRef = db
                .collection("apps").document(APP_ID)
                .collection("users").document(uid);
            
            db.runTransaction(transaction -> {
                DocumentSnapshot snap = transaction.get(userRef);
                long current = 0L;
                if (snap.exists()) {
                    Long v = snap.getLong("candiesTotal");
                    current = (v != null) ? v : 0L;
                }
                long next = current + delta;  // "solo sube" lo garantizan las rules; aquí sumamos
                Map<String, Object> data = new HashMap<>();
                data.put("candiesTotal", FieldValue.increment(delta));
                data.put("lastSeen", FieldValue.serverTimestamp());
                transaction.set(userRef, data, SetOptions.merge());
                cachedCandies = next;
                return null;
            }).addOnSuccessListener(v -> {
                Log.d("GameBridge", "✅ candies +=" + delta + " → cache=" + cachedCandies);
                activity.runOnUiThread(() -> {
                    WebView web = activity.findViewById(R.id.webview);
                    web.evaluateJavascript("if (window.updateHUD) { window.updateHUD(); }", null);
                });
            }).addOnFailureListener(e -> Log.e("GameBridge", "❌ tx candies", e));
        } else {
            Log.w("GameBridge", "Usuario no logueado, no se pueden añadir caramelos");
        }
    }

    @JavascriptInterface
    public void updateBestLevel(String gameId, int level) {
        Log.d("GameBridge", "updateBestLevel() llamado - juego: " + gameId + ", nivel: " + level);
        
        if (currentUser == null) {
            currentUser = mAuth.getCurrentUser();
        }
        
        if (currentUser != null) {
            String uid = currentUser.getUid();
            DocumentReference progressRef = db
                .collection("apps").document(APP_ID)
                .collection("progress").document(uid + "_" + gameId);
            
            // REEMPLAZA todo el get()/set() por una TRANSACCIÓN:
            db.runTransaction(transaction -> {
                DocumentSnapshot snap = transaction.get(progressRef);
                long current = 0L;
                if (snap.exists()) {
                    Long v = snap.getLong("bestLevel");
                    current = (v != null) ? v : 0L;
                }
                if (level > current) {
                    Map<String, Object> data = new HashMap<>();
                    data.put("uid", uid);
                    data.put("gameId", gameId);
                    data.put("bestLevel", (long) level);
                    data.put("updatedAt", FieldValue.serverTimestamp());
                    transaction.set(progressRef, data, SetOptions.merge());
                    Log.d("GameBridge", "✅ bestLevel ↑ " + current + " → " + level + " ("+gameId+")");
                } else {
                    Log.d("GameBridge", "📊 bestLevel sin cambio ("+gameId+"): " + current + " ≥ " + level);
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
                    .collection("users").document(uid)
                    .collection("progress").document(gameId);
                
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
                                webView.evaluateJavascript(
                                    "if (window.onBestLevelReceived) { window.onBestLevelReceived('" + gameId + "', " + level + "); }",
                                    null
                                );
                            });
                        } else {
                            Log.d("GameBridge", "getBestLevel() - Documento no existe, devolviendo 0");
                            // No hay progreso guardado
                            activity.runOnUiThread(() -> {
                                WebView webView = activity.findViewById(R.id.webview);
                                webView.evaluateJavascript(
                                    "if (window.onBestLevelReceived) { window.onBestLevelReceived('" + gameId + "', 0); }",
                                    null
                                );
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
    

    public boolean isUserLoggedIn() {
        currentUser = mAuth.getCurrentUser();
        return currentUser != null;
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
        // Implementar cache local si es necesario
        return null;
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
                        Log.d("GameBridge", "✅ Datos de usuario cargados - caramelos: " + cachedCandies);
                        
                        // Actualizar HUD inmediatamente después de cargar
                        activity.runOnUiThread(() -> {
                            WebView webView = activity.findViewById(R.id.webview);
                            webView.evaluateJavascript(
                                "if (window.updateHUD) { window.updateHUD(); }",
                                null
                            );
                        });
                    } else {
                        Log.w("GameBridge", "⚠️ Documento de usuario no existe en Firestore");
                        cachedCandies = 0L;
                    }
                } else {
                    Log.e("GameBridge", "❌ Error cargando datos de usuario: " + task.getException());
                    cachedCandies = 0L;
                }
            });
        } else {
            Log.d("GameBridge", "loadUserData() - usuario no logueado");
            cachedCandies = 0L;
        }
    }
}

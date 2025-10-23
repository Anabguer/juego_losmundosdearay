package com.intocables.losmundosdearay;

import android.util.Log;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class ProgressManager {
    private static final String TAG = "ProgressManager";
    private FirebaseFirestore db;
    private FirebaseAuth mAuth;

    public ProgressManager() {
        db = FirebaseFirestore.getInstance();
        mAuth = FirebaseAuth.getInstance();
    }

    /**
     * Actualiza el nivel máximo alcanzado en un juego
     * Solo actualiza si el nuevo nivel es mayor al actual
     */
    public void updateBestLevel(String gameId, int newLevel) {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null) {
            Log.w(TAG, "Usuario no logueado, no se puede guardar progreso");
            return;
        }

        String docId = user.getUid() + "_" + gameId;
        
        // Primero obtener el nivel actual
        db.collection("progress").document(docId)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        DocumentSnapshot document = task.getResult();
                        Long currentLevelLong = document.getLong("bestLevel");
                        long currentLevel = (currentLevelLong != null) ? currentLevelLong : 0L;

                        if (newLevel > currentLevel) {
                            // Nuevo récord - actualizar
                            Map<String, Object> progressData = new HashMap<>();
                            progressData.put("uid", user.getUid());
                            progressData.put("gameId", gameId);
                            progressData.put("bestLevel", (long) newLevel);
                            progressData.put("updatedAt", System.currentTimeMillis());

                            db.collection("progress").document(docId).set(progressData)
                                    .addOnSuccessListener(aVoid -> {
                                        Log.d(TAG, "Nivel máximo actualizado: " + gameId + " = " + newLevel);
                                    })
                                    .addOnFailureListener(e -> {
                                        Log.e(TAG, "Error actualizando nivel máximo", e);
                                    });
                        } else {
                            Log.d(TAG, "Nivel no mejorado: " + gameId + " (actual: " + currentLevel + ", nuevo: " + newLevel + ")");
                        }
                    } else {
                        Log.e(TAG, "Error obteniendo progreso actual", task.getException());
                    }
                });
    }

    /**
     * Obtiene el nivel máximo alcanzado en un juego
     */
    public void getBestLevel(String gameId, ProgressCallback callback) {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null) {
            callback.onResult(0);
            return;
        }

        String docId = user.getUid() + "_" + gameId;
        
        db.collection("progress").document(docId)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful() && task.getResult().exists()) {
                        Long bestLevel = task.getResult().getLong("bestLevel");
                        callback.onResult(bestLevel != null ? bestLevel.intValue() : 0);
                    } else {
                        callback.onResult(0);
                    }
                });
    }

    /**
     * Obtiene todos los niveles máximos del usuario
     */
    public void getAllBestLevels(AllProgressCallback callback) {
        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null) {
            callback.onResult(new HashMap<>());
            return;
        }

        db.collection("progress")
                .whereEqualTo("uid", user.getUid())
                .get()
                .addOnCompleteListener(task -> {
                    Map<String, Integer> levels = new HashMap<>();
                    if (task.isSuccessful()) {
                        for (DocumentSnapshot document : task.getResult()) {
                            String gameId = document.getString("gameId");
                            Long bestLevel = document.getLong("bestLevel");
                            if (gameId != null && bestLevel != null) {
                                levels.put(gameId, bestLevel.intValue());
                            }
                        }
                    }
                    callback.onResult(levels);
                });
    }

    public interface ProgressCallback {
        void onResult(int bestLevel);
    }

    public interface AllProgressCallback {
        void onResult(Map<String, Integer> allLevels);
    }
}




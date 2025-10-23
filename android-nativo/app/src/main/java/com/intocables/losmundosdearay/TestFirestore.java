package com.intocables.losmundosdearay;

import android.util.Log;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentReference;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FieldValue;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.SetOptions;
import com.google.firebase.firestore.Transaction;
import java.util.HashMap;
import java.util.Map;

public class TestFirestore {
    private static final String APP_ID = "aray";
    private static final String TAG = "TestFirestore";
    
    public static void runAllTests() {
        Log.d(TAG, "🧪 Iniciando tests de Firestore...");
        
        testUserCreation();
        testCandiesTransaction();
        testProgressTransaction();
        testRankingQuery();
    }
    
    private static void testUserCreation() {
        Log.d(TAG, "👤 Test: Creación de usuario");
        
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) {
            Log.w(TAG, "⚠️ No hay usuario logueado para el test");
            return;
        }
        
        String uid = user.getUid();
        DocumentReference userRef = FirebaseFirestore.getInstance()
            .collection("apps").document(APP_ID)
            .collection("users").document(uid);
        
        Map<String, Object> userData = new HashMap<>();
        userData.put("uid", uid);
        userData.put("nick", "TestUser");
        userData.put("candiesTotal", 0L);
        userData.put("lastSeen", FieldValue.serverTimestamp());
        
        userRef.set(userData, SetOptions.merge())
            .addOnSuccessListener(aVoid -> {
                Log.d(TAG, "✅ Usuario creado/actualizado correctamente");
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Error creando usuario: " + e.getMessage());
            });
    }
    
    private static void testCandiesTransaction() {
        Log.d(TAG, "🍬 Test: Transacción de caramelos");
        
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) {
            Log.w(TAG, "⚠️ No hay usuario logueado para el test");
            return;
        }
        
        String uid = user.getUid();
        DocumentReference userRef = FirebaseFirestore.getInstance()
            .collection("apps").document(APP_ID)
            .collection("users").document(uid);
        
        FirebaseFirestore.getInstance().runTransaction(transaction -> {
            DocumentSnapshot snap = transaction.get(userRef);
            long current = 0L;
            if (snap.exists()) {
                Long v = snap.getLong("candiesTotal");
                current = (v != null) ? v : 0L;
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("candiesTotal", FieldValue.increment(5));
            data.put("lastSeen", FieldValue.serverTimestamp());
            transaction.set(userRef, data, SetOptions.merge());
            
            Log.d(TAG, "✅ Transacción de caramelos ejecutada: " + current + " → " + (current + 5));
            return null;
        }).addOnSuccessListener(v -> {
            Log.d(TAG, "✅ Transacción de caramelos exitosa");
        }).addOnFailureListener(e -> {
            Log.e(TAG, "❌ Error en transacción de caramelos: " + e.getMessage());
        });
    }
    
    private static void testProgressTransaction() {
        Log.d(TAG, "📊 Test: Transacción de progreso");
        
        FirebaseUser user = FirebaseAuth.getInstance().getCurrentUser();
        if (user == null) {
            Log.w(TAG, "⚠️ No hay usuario logueado para el test");
            return;
        }
        
        String uid = user.getUid();
        DocumentReference progressRef = FirebaseFirestore.getInstance()
            .collection("apps").document(APP_ID)
            .collection("users").document(uid)
            .collection("progress").document("test");
        
        FirebaseFirestore.getInstance().runTransaction(transaction -> {
            DocumentSnapshot snap = transaction.get(progressRef);
            long current = 0L;
            if (snap.exists()) {
                Long v = snap.getLong("bestLevel");
                current = (v != null) ? v : 0L;
            }
            
            int newLevel = 3;
            if (newLevel > current) {
                Map<String, Object> data = new HashMap<>();
                data.put("uid", uid);
                data.put("gameId", "test");
                data.put("bestLevel", (long) newLevel);
                data.put("updatedAt", FieldValue.serverTimestamp());
                transaction.set(progressRef, data, SetOptions.merge());
                
                Log.d(TAG, "✅ Progreso actualizado: " + current + " → " + newLevel);
            } else {
                Log.d(TAG, "📊 Progreso sin cambio: " + current + " ≥ " + newLevel);
            }
            return null;
        }).addOnSuccessListener(v -> {
            Log.d(TAG, "✅ Transacción de progreso exitosa");
        }).addOnFailureListener(e -> {
            Log.e(TAG, "❌ Error en transacción de progreso: " + e.getMessage());
        });
    }
    
    private static void testRankingQuery() {
        Log.d(TAG, "🏆 Test: Query de ranking");
        
        FirebaseFirestore.getInstance()
            .collection("apps").document(APP_ID)
            .collection("users")
            .orderBy("candiesTotal", com.google.firebase.firestore.Query.Direction.DESCENDING)
            .limit(5)
            .get()
            .addOnSuccessListener(querySnapshot -> {
                Log.d(TAG, "✅ Query de ranking exitosa: " + querySnapshot.size() + " usuarios");
                for (DocumentSnapshot doc : querySnapshot) {
                    String nick = doc.getString("nick");
                    Long candies = doc.getLong("candiesTotal");
                    Log.d(TAG, "  - " + nick + ": " + candies + " caramelos");
                }
            })
            .addOnFailureListener(e -> {
                Log.e(TAG, "❌ Error en query de ranking: " + e.getMessage());
            });
    }
}



package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.firestore.DocumentSnapshot;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.WriteBatch;
import java.util.HashMap;
import java.util.Map;

public class NickSetupActivity extends AppCompatActivity {
    private static final String APP_ID = "aray"; // App ID para Aray
    
    private EditText nickInput;
    private Button saveButton;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_nick_setup);

        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        nickInput = findViewById(R.id.nick_input);
        saveButton = findViewById(R.id.save_nick_btn);

        saveButton.setOnClickListener(v -> saveNick());
    }

    private void saveNick() {
        String nick = nickInput.getText().toString().trim();
        
        if (nick.isEmpty()) {
            Toast.makeText(this, "Ingresa un nick", Toast.LENGTH_SHORT).show();
            return;
        }

        if (nick.length() > 20) {
            Toast.makeText(this, "Nick muy largo (máx 20 caracteres)", Toast.LENGTH_SHORT).show();
            return;
        }

        FirebaseUser user = mAuth.getCurrentUser();
        if (user == null) {
            Toast.makeText(this, "Usuario no autenticado", Toast.LENGTH_SHORT).show();
            return;
        }

        String lowerNick = nick.toLowerCase();
        String uid = user.getUid();

        // Verificar si el nick ya existe
        db.collection("apps").document(APP_ID).collection("nicks").document(lowerNick)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        DocumentSnapshot nickDoc = task.getResult();
                        if (nickDoc.exists() && !uid.equals(nickDoc.getString("uid"))) {
                            // Nick en uso por otro usuario
                            Toast.makeText(this, "Nick en uso", Toast.LENGTH_SHORT).show();
                        } else {
                            // Nick disponible o ya es nuestro - crear/actualizar
                            createNick(uid, nick, lowerNick);
                        }
                    } else {
                        Toast.makeText(this, "Error verificando nick", Toast.LENGTH_SHORT).show();
                    }
                });
    }

    private void createNick(String uid, String nick, String lowerNick) {
        try {
            WriteBatch batch = db.batch();

            // Crear reserva de nick
            Map<String, Object> nickData = new HashMap<>();
            nickData.put("uid", uid);
            nickData.put("nick", nick);
            nickData.put("createdAt", System.currentTimeMillis());
            batch.set(db.collection("apps").document(APP_ID).collection("nicks").document(lowerNick), nickData);

            // Actualizar usuario - asegurar que candiesTotal sea número
            Map<String, Object> userUpdate = new HashMap<>();
            userUpdate.put("nick", nick);
            userUpdate.put("candiesTotal", 0L); // Asegurar que sea Long, no String
            userUpdate.put("lastSeen", System.currentTimeMillis());
            batch.update(db.collection("apps").document(APP_ID).collection("users").document(uid), userUpdate);

            batch.commit()
                    .addOnSuccessListener(aVoid -> {
                        Toast.makeText(this, "Nick guardado: " + nick, Toast.LENGTH_SHORT).show();
                        // Solo navegar a Ranking en onSuccess
                        Intent rankingIntent = new Intent(this, RankingActivity.class);
                        startActivity(rankingIntent);
                        setResult(Activity.RESULT_OK);
                        finish();
                    })
                    .addOnFailureListener(e -> {
                        Toast.makeText(this, "Error guardando nick: " + e.getMessage(), Toast.LENGTH_LONG).show();
                        Log.e("NickSetup", "Error en batch commit", e);
                    });
        } catch (Exception e) {
            Toast.makeText(this, "Error inesperado: " + e.getMessage(), Toast.LENGTH_LONG).show();
            Log.e("NickSetup", "Error inesperado en createNick", e);
        }
    }
}

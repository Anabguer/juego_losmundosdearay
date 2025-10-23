package com.intocables.losmundosdearay;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;
import com.google.firebase.auth.AuthCredential;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.auth.GoogleAuthProvider;
import com.google.firebase.firestore.FirebaseFirestore;
import java.util.HashMap;
import java.util.Map;

public class LoginActivity extends AppCompatActivity {
    private static final String APP_ID = "aray"; // App ID para Aray
    private static final int RC_SIGN_IN = 1001;
    
    private GoogleSignInClient googleSignInClient;
    private FirebaseAuth mAuth;
    private FirebaseFirestore db;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        mAuth = FirebaseAuth.getInstance();
        db = FirebaseFirestore.getInstance();

        // Configurar Google Sign-In
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestIdToken(getString(R.string.default_web_client_id))
                .requestEmail()
                .build();
        googleSignInClient = GoogleSignIn.getClient(this, gso);

        // Iniciar login automáticamente
        signIn();
    }

    private void signIn() {
        Intent signInIntent = googleSignInClient.getSignInIntent();
        startActivityForResult(signInIntent, RC_SIGN_IN);
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                firebaseAuthWithGoogle(account.getIdToken());
            } catch (ApiException e) {
                Toast.makeText(this, "Error en login: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                setResult(Activity.RESULT_CANCELED);
                finish();
            }
        } else if (requestCode == 1002) { // NickSetupActivity
            if (resultCode == Activity.RESULT_OK) {
                // Nick configurado correctamente, ir a ranking
                Intent rankingIntent = new Intent(this, RankingActivity.class);
                startActivity(rankingIntent);
                setResult(Activity.RESULT_OK);
                finish();
            } else {
                // Error en nick setup
                setResult(Activity.RESULT_CANCELED);
                finish();
            }
        }
    }

    private void firebaseAuthWithGoogle(String idToken) {
        AuthCredential credential = GoogleAuthProvider.getCredential(idToken, null);
        mAuth.signInWithCredential(credential)
                .addOnCompleteListener(this, task -> {
                    if (task.isSuccessful()) {
                        FirebaseUser user = mAuth.getCurrentUser();
                        if (user != null) {
                            createOrUpdateUser(user);
                        }
                    } else {
                        Toast.makeText(this, "Error de autenticación", Toast.LENGTH_SHORT).show();
                        setResult(Activity.RESULT_CANCELED);
                        finish();
                    }
                });
    }

    private void createOrUpdateUser(FirebaseUser user) {
        String uid = user.getUid();
        Map<String, Object> userData = new HashMap<>();
        userData.put("nick", null);
        userData.put("candiesTotal", 0L); // Asegurar que sea Long, no int
        userData.put("lastSeen", System.currentTimeMillis());

        Log.d("LoginActivity", "Buscando usuario en: apps/" + APP_ID + "/users/" + uid);
        
        db.collection("apps").document(APP_ID).collection("users").document(uid)
                .get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        boolean exists = task.getResult().exists();
                        Log.d("LoginActivity", "Usuario existe en multi-app: " + exists);
                        
                        if (!exists) {
                            // Usuario nuevo - crear
                            userData.put("createdAt", System.currentTimeMillis());
                            db.collection("apps").document(APP_ID).collection("users").document(uid).set(userData)
                                    .addOnSuccessListener(aVoid -> {
                                        // Usuario nuevo - pedir nick
                                        Intent nickIntent = new Intent(this, NickSetupActivity.class);
                                        startActivityForResult(nickIntent, 1002);
                                    })
                                    .addOnFailureListener(e -> {
                                        Toast.makeText(this, "Error creando usuario", Toast.LENGTH_SHORT).show();
                                        setResult(Activity.RESULT_CANCELED);
                                        finish();
                                    });
                        } else {
                            // Usuario existente - verificar si tiene nick
                            String nick = (String) task.getResult().get("nick");
                            Log.d("LoginActivity", "Usuario existente - nick: '" + nick + "'");
                            
                            if (nick == null || nick.isEmpty()) {
                                // Usuario sin nick - pedir nick
                                Log.d("LoginActivity", "Usuario sin nick - pidiendo nick...");
                                Intent nickIntent = new Intent(this, NickSetupActivity.class);
                                startActivityForResult(nickIntent, 1002);
                            } else {
                                // Usuario completo - actualizar lastSeen y mostrar ranking
                                Log.d("LoginActivity", "Usuario con nick - yendo a ranking...");
                                Map<String, Object> updateData = new HashMap<>();
                                updateData.put("lastSeen", System.currentTimeMillis());
                                db.collection("apps").document(APP_ID).collection("users").document(uid).update(updateData)
                                        .addOnSuccessListener(aVoid -> {
                                            Intent rankingIntent = new Intent(this, RankingActivity.class);
                                            startActivity(rankingIntent);
                                            setResult(Activity.RESULT_OK);
                                            finish();
                                        })
                                        .addOnFailureListener(e -> {
                                            Toast.makeText(this, "Error actualizando usuario", Toast.LENGTH_SHORT).show();
                                            setResult(Activity.RESULT_CANCELED);
                                            finish();
                                        });
                            }
                        }
                    }
                });
    }

}

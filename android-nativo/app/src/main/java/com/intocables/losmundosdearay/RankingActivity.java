package com.intocables.losmundosdearay;

import android.os.Bundle;
import android.widget.Button;
import android.widget.ListView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.firestore.Query;
import com.google.firebase.firestore.QueryDocumentSnapshot;
import java.util.ArrayList;
import java.util.List;

public class RankingActivity extends AppCompatActivity {
    private static final String APP_ID = "aray"; // App ID para Aray
    
    private ListView rankingList;
    private Button closeButton;
    private FirebaseFirestore db;
    private RankingAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_ranking);

        db = FirebaseFirestore.getInstance();

        rankingList = findViewById(R.id.ranking_list);
        closeButton = findViewById(R.id.close_ranking_btn);

        adapter = new RankingAdapter(this, new ArrayList<>());
        rankingList.setAdapter(adapter);

        closeButton.setOnClickListener(v -> finish());

        loadRanking();
    }

    private void loadRanking() {
        Query query = db.collection("apps").document(APP_ID).collection("users")
                .orderBy("candiesTotal", Query.Direction.DESCENDING)
                .limit(20);

        query.get()
                .addOnCompleteListener(task -> {
                    if (task.isSuccessful()) {
                        List<RankingItem> items = new ArrayList<>();
                        int position = 1;

                        for (QueryDocumentSnapshot document : task.getResult()) {
                            String nick = document.getString("nick");
                            Long candiesTotal = document.getLong("candiesTotal");
                            
                            if (nick != null && candiesTotal != null) {
                                items.add(new RankingItem(position++, nick, candiesTotal.intValue()));
                            }
                        }

                        adapter.clear();
                        adapter.addAll(items);
                        adapter.notifyDataSetChanged();
                    } else {
                        Toast.makeText(this, "Error cargando ranking", Toast.LENGTH_SHORT).show();
                    }
                });
    }
}


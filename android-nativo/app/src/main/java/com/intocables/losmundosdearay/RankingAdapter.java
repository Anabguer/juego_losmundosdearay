package com.intocables.losmundosdearay;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;
import java.util.ArrayList;
import java.util.List;

public class RankingAdapter extends BaseAdapter {
    private Context context;
    private List<RankingItem> items;

    public RankingAdapter(Context context, List<RankingItem> items) {
        this.context = context;
        this.items = items != null ? items : new ArrayList<>();
    }

    @Override
    public int getCount() {
        return items.size();
    }

    @Override
    public Object getItem(int position) {
        return items.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        if (convertView == null) {
            LayoutInflater inflater = LayoutInflater.from(context);
            convertView = inflater.inflate(android.R.layout.simple_list_item_2, parent, false);
        }

        RankingItem item = items.get(position);

        TextView text1 = convertView.findViewById(android.R.id.text1);
        TextView text2 = convertView.findViewById(android.R.id.text2);

        text1.setText("#" + item.getPosition() + " " + item.getNick());
        text2.setText("🍬 " + item.getCandiesTotal() + " caramelos");

        return convertView;
    }

    public void addAll(List<RankingItem> newItems) {
        items.addAll(newItems);
    }

    public void clear() {
        items.clear();
    }
}





package com.intocables.losmundosdearay;

public class RankingItem {
    private int position;
    private String nick;
    private int candiesTotal;

    public RankingItem(int position, String nick, int candiesTotal) {
        this.position = position;
        this.nick = nick;
        this.candiesTotal = candiesTotal;
    }

    public int getPosition() {
        return position;
    }

    public String getNick() {
        return nick;
    }

    public int getCandiesTotal() {
        return candiesTotal;
    }
}





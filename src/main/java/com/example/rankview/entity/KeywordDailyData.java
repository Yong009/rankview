package com.example.rankview.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
public class KeywordDailyData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "keyword_id")
    private KeywordRank keywordRank;

    private LocalDate date;
    
    private Integer inflowCount = 0;
    
    private String dailyMemo;

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public KeywordRank getKeywordRank() {
        return keywordRank;
    }

    public void setKeywordRank(KeywordRank keywordRank) {
        this.keywordRank = keywordRank;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public Integer getInflowCount() {
        return inflowCount;
    }

    public void setInflowCount(Integer inflowCount) {
        this.inflowCount = inflowCount;
    }

    public String getDailyMemo() {
        return dailyMemo;
    }

    public void setDailyMemo(String dailyMemo) {
        this.dailyMemo = dailyMemo;
    }
}

package com.example.rankview.repository;

import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface KeywordDailyDataRepository extends JpaRepository<KeywordDailyData, Long> {
    List<KeywordDailyData> findByKeywordRankAndDateBetween(KeywordRank keywordRank, LocalDate startDate, LocalDate endDate);
    Optional<KeywordDailyData> findByKeywordRankAndDate(KeywordRank keywordRank, LocalDate date);
    void deleteByDateBefore(LocalDate date);
}

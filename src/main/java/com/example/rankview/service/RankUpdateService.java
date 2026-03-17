package com.example.rankview.service;

import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.KeywordDailyDataRepository;
import com.example.rankview.repository.KeywordRankRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class RankUpdateService {

    @Autowired
    private KeywordRankRepository keywordRankRepository;

    @Autowired
    private KeywordDailyDataRepository dailyDataRepository;

    @Autowired
    private ShoppingRankApiCaller shoppingRankApiCaller;

    public KeywordRank updateRank(Long id) {
        KeywordRank rank = keywordRankRepository.findById(id).orElse(null);
        if (rank == null)
            return null;

        // Perform real search via Naver Shopping API
        int newRankValue = shoppingRankApiCaller.getRank(rank.getKeyword(), rank.getMid(),
                rank.getCatalogMid(), rank.getStoreName());

        // Determine what to use as the baseline for "Yesterday Rank"
        // If lastUpdate was on a different day, move currentRank to yesterdayRank
        String lastKnownRank = rank.getCurrentRank() != null ? rank.getCurrentRank() : "-";
        LocalDateTime now = LocalDateTime.now();
        
        if (rank.getLastUpdate() == null || !rank.getLastUpdate().toLocalDate().equals(now.toLocalDate())) {
            // It's a new day (or first time), update the baseline
            if (!"-".equals(lastKnownRank)) {
                rank.setYesterdayRank(lastKnownRank);
            }
        }
        
        // This baseline stays the same for calculations during the same day
        String baselineRank = rank.getYesterdayRank() != null ? rank.getYesterdayRank() : "-";

        if (newRankValue == -1) {
            rank.setCurrentRank("순위 밖");
            // Calculate change against baseline
            if (!"-".equals(baselineRank)) {
                try {
                    int old;
                    if ("순위 밖".equals(baselineRank)) {
                        old = 1001;
                    } else {
                        old = Integer.parseInt(baselineRank);
                    }
                    // Current is -1 (1001), so old - 1001
                    rank.setRankChange(old - 1001);
                } catch (NumberFormatException e) {
                    rank.setRankChange(0);
                }
            } else {
                rank.setRankChange(0);
            }
        } else {
            rank.setCurrentRank(String.valueOf(newRankValue));

            // Calculate rank change against baseline
            if (!"-".equals(baselineRank)) {
                try {
                    int old;
                    if ("순위 밖".equals(baselineRank)) {
                        old = 1001;
                    } else {
                        old = Integer.parseInt(baselineRank);
                    }
                    rank.setRankChange(old - newRankValue);
                } catch (NumberFormatException e) {
                    rank.setRankChange(0);
                }
            } else {
                rank.setRankChange(0);
            }
        }

        // Update Daily Data for History
        updateDailyRankSnapshot(rank, now.toLocalDate(), newRankValue);

        rank.setLastUpdate(LocalDateTime.now());
        return keywordRankRepository.save(rank);
    }

    private void updateDailyRankSnapshot(KeywordRank keyword, LocalDate date, int rankValue) {
        KeywordDailyData dailyData = dailyDataRepository.findByKeywordRankAndDate(keyword, date)
                .orElseGet(() -> {
                    KeywordDailyData newData = new KeywordDailyData();
                    newData.setKeywordRank(keyword);
                    newData.setDate(date);
                    return newData;
                });
        // rankValue가 -1인 경우 '순위 밖'을 의미하므로 0 또는 특정값으로 저장할 수 있음
        // 여기서는 -1 그대로 저장하거나 0으로 저장
        dailyData.setRank(rankValue);
        dailyDataRepository.save(dailyData);
    }
}

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
        ShoppingRankApiCaller.RankResult result = shoppingRankApiCaller.getRank(rank.getKeyword(), rank.getMid(),
                rank.getCatalogMid(), rank.getStoreName());

        int newRankValue = result.getRank();
        
        // Always update from latest search result to keep info fresh
        if (result.getLink() != null) {
            rank.setLink(result.getLink());
        }
        if (result.getImage() != null) {
            rank.setImageUrl(result.getImage());
        }
        if (result.getPrice() > 0) {
            rank.setPrice(result.getPrice());
        }

        LocalDateTime now = LocalDateTime.now();

        // 1. Determine the baseline (yesterday's rank) for today's comparison
        // If it's a new day, we update the yesterdayRank baseline
        if (rank.getLastUpdate() == null || !rank.getLastUpdate().toLocalDate().equals(now.toLocalDate())) {
            String lastKnownRank = rank.getCurrentRank() != null ? rank.getCurrentRank() : "-";
            if (!"-".equals(lastKnownRank)) {
                rank.setYesterdayRank(lastKnownRank);
            }
        }

        String baselineStr = rank.getYesterdayRank() != null ? rank.getYesterdayRank() : "-";

        // 2. Set Current Rank display string
        if (newRankValue == -1) {
            rank.setCurrentRank("순위 밖");
        } else {
            rank.setCurrentRank(String.valueOf(newRankValue));
        }

        // 3. Calculate Rank Change against baseline
        if (!"-".equals(baselineStr)) {
            int oldRank = parseRankValue(baselineStr);
            int currentVal = (newRankValue == -1) ? 1001 : newRankValue;

            // Positive change means rank improved (e.g. 10 -> 5 = +5)
            rank.setRankChange(oldRank - currentVal);
        } else {
            rank.setRankChange(0);
        }

        // 4. Update Daily Data for History & Timestamp
        updateDailyRankSnapshot(rank, now.toLocalDate(), newRankValue);
        rank.setLastUpdate(now);

        return keywordRankRepository.save(rank);
    }

    private int parseRankValue(String rankStr) {
        if (rankStr == null || "-".equals(rankStr))
            return 1001;
        if ("순위 밖".equals(rankStr))
            return 1001;
        try {
            return Integer.parseInt(rankStr);
        } catch (NumberFormatException e) {
            return 1001;
        }
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

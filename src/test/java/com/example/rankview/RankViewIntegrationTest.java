package com.example.rankview;

import com.example.rankview.entity.Folder;
import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.FolderRepository;
import com.example.rankview.repository.KeywordDailyDataRepository;
import com.example.rankview.repository.KeywordRankRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional // 테스트 후 데이터 롤백
public class RankViewIntegrationTest {

    @Autowired
    private FolderRepository folderRepository;

    @Autowired
    private KeywordRankRepository keywordRepository;

    @Autowired
    private KeywordDailyDataRepository dailyDataRepository;

    @Test
    @DisplayName("전체 시스템 설계 흐름 테스트: 폴더 생성 -> 키워드 등록 -> 순위 데이터 기록")
    void fullSystemFlowTest() {
        // 1. 폴더 생성 테스트
        Folder folder = new Folder();
        folder.setName("테스트 폴더");
        folder.setUsername("testuser");
        Folder savedFolder = folderRepository.save(folder);
        
        assertThat(savedFolder.getId()).isNotNull();
        assertThat(savedFolder.getName()).isEqualTo("테스트 폴더");

        // 2. 키워드 등록 테스트 (폴더에 연결)
        KeywordRank keyword = new KeywordRank();
        keyword.setKeyword("테스트 키워드");
        keyword.setMid("123456789");
        keyword.setFolderId(savedFolder.getId());
        keyword.setUsername("testuser");
        keyword.setDataType("RANK");
        KeywordRank savedKeyword = keywordRepository.save(keyword);

        assertThat(savedKeyword.getId()).isNotNull();
        assertThat(savedKeyword.getFolderId()).isEqualTo(savedFolder.getId());

        // 3. 일별 순위 데이터 기록 테스트
        KeywordDailyData dailyData = new KeywordDailyData();
        dailyData.setKeywordId(savedKeyword.getId());
        dailyData.setRankValue(5);
        dailyData.setLogDate(LocalDate.now());
        KeywordDailyData savedDailyData = dailyDataRepository.save(dailyData);

        assertThat(savedDailyData.getId()).isNotNull();
        assertThat(savedDailyData.getRankValue()).isEqualTo(5);

        // 4. 조회 테스트
        List<KeywordRank> keywordsInFolder = keywordRepository.findByFolderIdAndDataType(savedFolder.getId(), "RANK");
        assertThat(keywordsInFolder).hasSize(1);
        assertThat(keywordsInFolder.get(0).getKeyword()).isEqualTo("테스트 키워드");
    }
}

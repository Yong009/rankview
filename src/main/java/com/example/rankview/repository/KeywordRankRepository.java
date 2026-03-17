package com.example.rankview.repository;

import com.example.rankview.entity.KeywordRank;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface KeywordRankRepository extends JpaRepository<KeywordRank, Long> {
    List<KeywordRank> findByFolderId(Long folderId);
    
    // Type필터링 추가
    List<KeywordRank> findByFolderIdAndDataType(Long folderId, String dataType);
    
    Optional<KeywordRank> findByKeyword(String keyword);
    Optional<KeywordRank> findByMid(String mid);
    Optional<KeywordRank> findByProductNumber(String productNumber);
    
    // Type과 함께 검색
    Optional<KeywordRank> findByProductNumberAndDataType(String productNumber, String dataType);
    Optional<KeywordRank> findByMidAndDataType(String mid, String dataType);
    Optional<KeywordRank> findByKeywordAndDataType(String keyword, String dataType);
}

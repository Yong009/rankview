package com.example.rankview.repository;

import com.example.rankview.entity.KeywordRank;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KeywordRankRepository extends JpaRepository<KeywordRank, Long> {
    List<KeywordRank> findByFolderId(Long folderId);
    java.util.Optional<KeywordRank> findByKeyword(String keyword);
}

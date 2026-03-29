package com.example.rankview.repository;

import com.example.rankview.entity.KeywordRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

import java.util.Optional;

public interface KeywordRankRepository extends JpaRepository<KeywordRank, Long> {
    List<KeywordRank> findByFolderId(Long folderId);
    List<KeywordRank> findByFolderIdAndDataType(Long folderId, String dataType);
    
    Optional<KeywordRank> findByKeyword(String keyword);
    Optional<KeywordRank> findByMid(String mid);
    Optional<KeywordRank> findByProductNumber(String productNumber);
    
    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f WHERE f.id = :folderId AND (k.username = :username OR f.username = :username)")
    List<KeywordRank> findByFolderIdAndUsername(@Param("folderId") Long folderId, @Param("username") String username);

    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f WHERE (k.username = :username OR f.username = :username)")
    List<KeywordRank> findByUsername(@Param("username") String username);
}

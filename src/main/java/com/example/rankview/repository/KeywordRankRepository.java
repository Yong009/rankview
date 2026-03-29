package com.example.rankview.repository;

import com.example.rankview.entity.KeywordRank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    
    // 이 타입에 해당하는 전체 데이터 조회
    List<KeywordRank> findByDataType(String dataType);
    
    // 특정 사용자 데이터 조회 (키워드의 username 필드 혹은 폴더의 username 필드 매칭)
    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f " +
           "WHERE k.dataType = :dataType " +
           "AND (k.username = :username OR (f IS NOT NULL AND f.username = :username))")
    List<KeywordRank> findDashboardByUsername(@Param("username") String username, @Param("dataType") String dataType);

    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f WHERE f.id = :folderId AND k.dataType = :dataType AND (k.username = :username OR f.username = :username)")
    List<KeywordRank> findByFolderIdAndUsernameAndDataType(@Param("folderId") Long folderId, @Param("username") String username, @Param("dataType") String dataType);

    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f WHERE f.id = :folderId AND (k.username = :username OR f.username = :username)")
    List<KeywordRank> findByFolderIdAndUsername(@Param("folderId") Long folderId, @Param("username") String username);

    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f " +
           "WHERE f.id IN :folderIds AND k.dataType = :dataType " +
           "AND (k.username = :username OR (f IS NOT NULL AND f.username = :username))")
    List<KeywordRank> findByFolderIdsAndUsername(@Param("folderIds") List<Long> folderIds, 
                                                 @Param("username") String username, 
                                                 @Param("dataType") String dataType);

    @Query("SELECT k FROM KeywordRank k LEFT JOIN k.folder f WHERE (k.username = :username OR f.username = :username)")
    List<KeywordRank> findByUsername(@Param("username") String username);
}





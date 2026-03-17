package com.example.rankview.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class KeywordRank {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String keyword;
    private String productName; // 대시보드 표시용 상품명
    private String mid;
    private String catalogMid;
    private String storeName;
    private String memo;
    private String link;

    private String productNumber; // 대시보드 식별용 상품번호
    
    /**
     * RANK: 순위 체크용 데이터
     * DASHBOARD: 대시보드 유입량 관리용 데이터
     */
    @Column(columnDefinition = "VARCHAR(20) DEFAULT 'RANK'")
    private String dataType = "RANK";

    private String currentRank;
    private String yesterdayRank;
    private int rankChange;
    private int price;
    private String imageUrl;
    private LocalDateTime lastUpdate;

    @ManyToOne
    @JoinColumn(name = "folder_id")
    private Folder folder;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKeyword() { return keyword; }
    public void setKeyword(String keyword) { this.keyword = keyword; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getMid() { return mid; }
    public void setMid(String mid) { this.mid = mid; }

    public String getProductNumber() { return productNumber; }
    public void setProductNumber(String productNumber) { this.productNumber = productNumber; }

    public String getDataType() { return dataType; }
    public void setDataType(String dataType) { this.dataType = dataType; }

    public String getCatalogMid() { return catalogMid; }
    public void setCatalogMid(String catalogMid) { this.catalogMid = catalogMid; }

    public String getStoreName() { return storeName; }
    public void setStoreName(String storeName) { this.storeName = storeName; }

    public String getMemo() { return memo; }
    public void setMemo(String someMemo) { this.memo = someMemo; }

    public String getLink() { return link; }
    public void setLink(String link) { this.link = link; }

    public String getCurrentRank() { return currentRank; }
    public void setCurrentRank(String currentRank) { this.currentRank = currentRank; }

    public String getYesterdayRank() { return yesterdayRank; }
    public void setYesterdayRank(String yesterdayRank) { this.yesterdayRank = yesterdayRank; }

    public int getRankChange() { return rankChange; }
    public void setRankChange(int rankChange) { this.rankChange = rankChange; }

    public LocalDateTime getLastUpdate() { return lastUpdate; }
    public void setLastUpdate(LocalDateTime lastUpdate) { this.lastUpdate = lastUpdate; }

    public int getPrice() { return price; }
    public void setPrice(int price) { this.price = price; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public Folder getFolder() { return folder; }
    public void setFolder(Folder folder) { this.folder = folder; }
}

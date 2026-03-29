package com.example.rankview.controller;

import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.KeywordRankRepository;
import com.example.rankview.service.PlaywrightService;
import com.example.rankview.service.RankUpdateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/keywords")
public class KeywordController {

    @Autowired
    private KeywordRankRepository keywordRepository;

    @Autowired
    private RankUpdateService rankUpdateService;

    @Autowired
    private PlaywrightService playwrightService;

    @GetMapping
    public List<KeywordRank> getKeywords(@RequestParam(required = false) Long folderId, jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (folderId != null) {
            return keywordRepository.findByFolderIdAndDataType(folderId, "RANK");
        }
        // If folderId is null, return all 'RANK' type keywords for this user
        return keywordRepository.findByUsername(username).stream()
                .filter(k -> "RANK".equals(k.getDataType()))
                .toList();
    }

    @GetMapping("/folder/{folderId}")
    public List<KeywordRank> getKeywordsByFolder(@PathVariable Long folderId) {
        return keywordRepository.findByFolderIdAndDataType(folderId, "RANK");
    }

    @GetMapping("/recursive")
    public List<KeywordRank> getKeywordsRecursive(@RequestParam(required = false) Long folderId, jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        if (folderId == null) {
            return keywordRepository.findByUsername(username).stream()
                    .filter(k -> "RANK".equals(k.getDataType()))
                    .toList();
        }
        
        // Simple implementation: for now, just return this folder's items. 
        // In a real scenario, we would traverse subfolders if folderId was provided.
        // But since current keywords are mostly in one folder or user-wide, we use this.
        return keywordRepository.findByFolderIdAndUsername(folderId, username).stream()
                .filter(k -> "RANK".equals(k.getDataType()))
                .toList();
    }

    @PostMapping
    public KeywordRank saveKeyword(@RequestBody KeywordRank keyword, jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        keyword.setUsername(username);
        return keywordRepository.save(keyword);
    }

    @DeleteMapping("/{id}")
    public void deleteKeyword(@PathVariable Long id) {
        keywordRepository.deleteById(id);
    }

    @PostMapping("/{id}/update")
    public KeywordRank updateRank(@PathVariable Long id) {
        return rankUpdateService.updateRank(id);
    }

    @PostMapping("/{id}/simulate")
    public void simulateSearch(@PathVariable Long id) {
        KeywordRank rank = keywordRepository.findById(id).orElse(null);
        if (rank != null) {
            new Thread(() -> {
                playwrightService.simulateNaverSearch(rank.getKeyword(), rank.getMid(), rank.getStoreName());
            }).start();
        }
    }
    @PutMapping("/{id}")
    public KeywordRank updateKeyword(@PathVariable Long id, @RequestBody KeywordRank keywordDetails) {
        KeywordRank rank = keywordRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Keyword not found: " + id));
        
        if (keywordDetails.getKeyword() != null) rank.setKeyword(keywordDetails.getKeyword());
        if (keywordDetails.getMid() != null) rank.setMid(keywordDetails.getMid());
        if (keywordDetails.getCatalogMid() != null) rank.setCatalogMid(keywordDetails.getCatalogMid());
        if (keywordDetails.getStoreName() != null) rank.setStoreName(keywordDetails.getStoreName());
        if (keywordDetails.getMemo() != null) rank.setMemo(keywordDetails.getMemo());
        if (keywordDetails.getLink() != null) rank.setLink(keywordDetails.getLink());
        
        return keywordRepository.save(rank);
    }
}

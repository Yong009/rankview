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
    public List<KeywordRank> getKeywords(@RequestParam(required = false) Long folderId) {
        if (folderId != null) {
            return keywordRepository.findByFolderIdAndDataType(folderId, "RANK");
        }
        return keywordRepository.findAll().stream()
                .filter(k -> "RANK".equals(k.getDataType()))
                .toList();
    }

    @GetMapping("/folder/{folderId}")
    public List<KeywordRank> getKeywordsByFolder(@PathVariable Long folderId) {
        return keywordRepository.findByFolderIdAndDataType(folderId, "RANK");
    }

    @PostMapping
    public KeywordRank saveKeyword(@RequestBody KeywordRank keyword) {
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
}

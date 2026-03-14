package com.example.rankview.controller;

import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.KeywordRankRepository;
import com.example.rankview.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardApiController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private KeywordRankRepository keywordRankRepository;

    @GetMapping("/data/{keywordId}")
    public ResponseEntity<?> getDashboardData(@PathVariable Long keywordId, 
                                            @RequestParam int year, 
                                            @RequestParam int month) {
        List<KeywordDailyData> dailyData = dashboardService.getDailyDataForMonth(keywordId, year, month);
        return ResponseEntity.ok(dailyData);
    }

    @PostMapping("/memo")
    public ResponseEntity<?> updateMemo(@RequestBody Map<String, Object> payload) {
        Long keywordId = Long.valueOf(payload.get("keywordId").toString());
        LocalDate date = LocalDate.parse(payload.get("date").toString());
        String memo = (String) payload.get("memo");
        
        dashboardService.updateDailyMemo(keywordId, date, memo);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/excel-upload")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        try {
            dashboardService.processExcelUpload(file);
            return ResponseEntity.ok("Excel processed successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error processing excel: " + e.getMessage());
        }
    }

    @PostMapping("/image-upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file, @RequestParam("id") Long id) {
        try {
            if (file.isEmpty()) return ResponseEntity.badRequest().body("File is empty");
            
            // Save to static/img folder
            String fileName = "prod_" + id + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
            java.nio.file.Path path = java.nio.file.Paths.get("src/main/resources/static/img/" + fileName);
            java.nio.file.Files.createDirectories(path.getParent());
            java.nio.file.Files.copy(file.getInputStream(), path, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            
            // Update DB
            KeywordRank keyword = keywordRankRepository.findById(id).orElseThrow();
            keyword.setImageUrl("/img/" + fileName);
            keywordRankRepository.save(keyword);
            
            return ResponseEntity.ok("Image uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading image: " + e.getMessage());
        }
    }

    @PostMapping("/update-info")
    public ResponseEntity<?> updateKeywordInfo(@RequestBody Map<String, Object> payload) {
        Long id = Long.valueOf(payload.get("id").toString());
        KeywordRank keyword = keywordRankRepository.findById(id).orElseThrow();
        
        if (payload.containsKey("price")) {
            keyword.setPrice(Integer.parseInt(payload.get("price").toString()));
        }
        if (payload.containsKey("keyword")) {
            keyword.setKeyword((String) payload.get("keyword"));
        }
        if (payload.containsKey("imageUrl")) {
            keyword.setImageUrl((String) payload.get("imageUrl"));
        }
        
        keywordRankRepository.save(keyword);
        return ResponseEntity.ok().build();
    }
}

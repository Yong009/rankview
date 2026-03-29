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
    private KeywordRankRepository keywordRepository;


    @GetMapping("/keywords")
    public ResponseEntity<List<KeywordRank>> getDashboardKeywords(@RequestParam(required = false) Long folderId, 
                                                                jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        String role = (String) session.getAttribute("role");
        if (folderId == null) {
            if ("ADMIN".equals(role)) {
                return ResponseEntity.ok(keywordRepository.findByDataType("DASHBOARD"));
            }
            return ResponseEntity.ok(keywordRepository.findDashboardByUsername(username, "DASHBOARD"));
        }

        if ("ADMIN".equals(role)) {
            return ResponseEntity.ok(keywordRepository.findByFolderId(folderId));
        }
        return ResponseEntity.ok(keywordRepository.findByFolderIdAndUsername(folderId, username));
    }

    @GetMapping("/keywords/recursive")
    public ResponseEntity<List<KeywordRank>> getDashboardKeywordsRecursive(@RequestParam Long folderId, 
                                                                         jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        String role = (String) session.getAttribute("role");
        if (username == null) return ResponseEntity.status(401).build();

        List<KeywordRank> results = dashboardService.getKeywordsRecursive(folderId, username, role);
        return ResponseEntity.ok(results);
    }


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
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file, 
                                        @RequestParam(value = "folderId", required = false) Long folderId,
                                        @RequestParam(value = "year", required = false) Integer year,
                                        @RequestParam(value = "month", required = false) Integer month,
                                        jakarta.servlet.http.HttpSession session) {
        try {
            String username = (String) session.getAttribute("user");
            dashboardService.processExcelUpload(file, folderId, year, month, username);
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
            KeywordRank keyword = keywordRepository.findById(id).orElseThrow();
            keyword.setImageUrl("/img/" + fileName);
            keywordRepository.save(keyword);
            
            return ResponseEntity.ok("Image uploaded successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error uploading image: " + e.getMessage());
        }
    }

    @PostMapping("/update-info")
    public ResponseEntity<?> updateKeywordInfo(@RequestBody Map<String, Object> payload) {
        Long id = Long.valueOf(payload.get("id").toString());
        KeywordRank keyword = keywordRepository.findById(id).orElseThrow();
        
        if (payload.containsKey("price")) {
            keyword.setPrice(Integer.parseInt(payload.get("price").toString()));
        }
        if (payload.containsKey("keyword") || payload.containsKey("productName")) {
            String name = (String) (payload.containsKey("productName") ? payload.get("productName") : payload.get("keyword"));
            keyword.setProductName(name);
        }
        if (payload.containsKey("imageUrl")) {
            keyword.setImageUrl((String) payload.get("imageUrl"));
        }
        if (payload.containsKey("productNumber")) {
            keyword.setProductNumber((String) payload.get("productNumber"));
        }
        
        keywordRepository.save(keyword);
        return ResponseEntity.ok().build();
    }
}

package com.example.rankview.service;

import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.KeywordDailyDataRepository;
import com.example.rankview.repository.KeywordRankRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class DashboardService {

    @Autowired
    private KeywordDailyDataRepository dailyDataRepository;

    @Autowired
    private KeywordRankRepository keywordRankRepository;

    public List<KeywordDailyData> getDailyDataForMonth(Long keywordId, int year, int month) {
        KeywordRank keyword = keywordRankRepository.findById(keywordId).orElse(null);
        if (keyword == null) return null;

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.plusMonths(1).minusDays(1);

        return dailyDataRepository.findByKeywordRankAndDateBetween(keyword, start, end);
    }

    @Transactional
    public void updateDailyMemo(Long keywordId, LocalDate date, String memo) {
        KeywordRank keyword = keywordRankRepository.findById(keywordId)
                .orElseThrow(() -> new IllegalArgumentException("Keyword not found"));

        KeywordDailyData dailyData = dailyDataRepository.findByKeywordRankAndDate(keyword, date)
                .orElseGet(() -> {
                    KeywordDailyData newData = new KeywordDailyData();
                    newData.setKeywordRank(keyword);
                    newData.setDate(date);
                    return newData;
                });

        dailyData.setDailyMemo(memo);
        dailyDataRepository.save(dailyData);
    }

    @Transactional
    public void processExcelUpload(MultipartFile file) throws IOException {
        Workbook workbook = new XSSFWorkbook(file.getInputStream());
        Sheet sheet = workbook.getSheetAt(0);

        // Assuming Excel structure based on requirement: 
        // Image | Product Num (Folder Name?) | Product Name | Price | Date1 | Date2 ...
        // We need a way to map Excel rows to KeywordRank entities.
        // Usually, 'Product Name' or some ID is used.
        // For now, let's assume Row 0 is header, Row 1+ are data.
        
        // The user said: "유입수 데이터를 > 엑셀을 업로드 하면 자동으로 찾아 들어가는 방식으로요!"
        // I need to know the mapping. Let's assume Product Name (Keyword?) is used as key.
        
        Row header = sheet.getRow(0);
        for (int i = 1; i <= sheet.getLastRowNum(); i++) {
            Row row = sheet.getRow(i);
            if (row == null) continue;

            String productName = getCellValueAsString(row.getCell(2)); // Index 2: 상품명
            Optional<KeywordRank> keywordOpt = keywordRankRepository.findByKeyword(productName);
            
            if (keywordOpt.isPresent()) {
                KeywordRank keyword = keywordOpt.get();
                // Process dates from column 4 onwards
                for (int j = 4; j < row.getLastCellNum(); j++) {
                    Cell dateCell = header.getCell(j);
                    Cell inflowCell = row.getCell(j);
                    
                    if (dateCell != null && inflowCell != null) {
                        try {
                            LocalDate date = dateCell.getLocalDateTimeCellValue().toLocalDate();
                            int inflow = (int) inflowCell.getNumericCellValue();
                            
                            updateInflowCount(keyword, date, inflow);
                        } catch (Exception e) {
                            // Skip invalid date/numeric values
                        }
                    }
                }
            }
        }
        workbook.close();
    }

    private void updateInflowCount(KeywordRank keyword, LocalDate date, int inflow) {
        KeywordDailyData dailyData = dailyDataRepository.findByKeywordRankAndDate(keyword, date)
                .orElseGet(() -> {
                    KeywordDailyData newData = new KeywordDailyData();
                    newData.setKeywordRank(keyword);
                    newData.setDate(date);
                    return newData;
                });
        dailyData.setInflowCount(inflow);
        dailyDataRepository.save(dailyData);
    }

    private String getCellValueAsString(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING: return cell.getStringCellValue();
            case NUMERIC: return String.valueOf((long)cell.getNumericCellValue());
            default: return "";
        }
    }

    @Scheduled(cron = "0 0 0 * * *") // Every day at midnight
    @Transactional
    public void cleanOldData() {
        LocalDate fiftyDaysAgo = LocalDate.now().minusDays(50);
        dailyDataRepository.deleteByDateBefore(fiftyDaysAgo);
    }
}

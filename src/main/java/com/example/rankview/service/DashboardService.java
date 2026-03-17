package com.example.rankview.service;

import com.example.rankview.entity.KeywordDailyData;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.repository.KeywordDailyDataRepository;
import com.example.rankview.repository.KeywordRankRepository;
import org.apache.poi.ss.usermodel.*;
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

    @Autowired
    private com.example.rankview.repository.FolderRepository folderRepository;

    @Transactional
    public void processExcelUpload(MultipartFile file, Long folderId) throws IOException {
        System.out.println("[ExcelUpload] Starting processing: " + file.getOriginalFilename() + " (Folder: " + folderId + ")");
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row header = sheet.getRow(0);
            if (header == null) {
                System.out.println("[ExcelUpload] Header row is missing.");
                return;
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                // A열 (Index 0): 키워드
                String keywordName = getCellValueAsString(row.getCell(0));
                // B열 (Index 1): 상품번호
                String productNumber = getCellValueAsString(row.getCell(1)); 
                // C열 (Index 2): 상품명
                String productNameFromExcel = getCellValueAsString(row.getCell(2)); 
                
                if (productNumber.isEmpty() && keywordName.isEmpty()) continue;

                // 상품 검색 (DASHBOARD 타입만)
                Optional<KeywordRank> keywordOpt = Optional.empty();
                if (!productNumber.isEmpty()) {
                    keywordOpt = keywordRankRepository.findByProductNumberAndDataType(productNumber, "DASHBOARD");
                    if (keywordOpt.isEmpty()) {
                        keywordOpt = keywordRankRepository.findByMidAndDataType(productNumber, "DASHBOARD");
                    }
                }
                if (keywordOpt.isEmpty() && !keywordName.isEmpty()) {
                    keywordOpt = keywordRankRepository.findByKeywordAndDataType(keywordName, "DASHBOARD");
                }
                
                KeywordRank keyword;
                if (keywordOpt.isPresent()) {
                    keyword = keywordOpt.get();
                    if (!productNumber.isEmpty() && !productNumber.equals(keyword.getProductNumber())) {
                        keyword.setProductNumber(productNumber);
                        keywordRankRepository.save(keyword);
                    }
                } else {
                    System.out.println("[ExcelUpload] Creating new DASHBOARD product: " + (productNameFromExcel.isEmpty() ? keywordName : productNameFromExcel));
                    keyword = new KeywordRank();
                    keyword.setKeyword(keywordName.isEmpty() ? productNameFromExcel : keywordName);
                    keyword.setProductName(productNameFromExcel.isEmpty() ? keywordName : productNameFromExcel);
                    keyword.setProductNumber(productNumber);
                    keyword.setDataType("DASHBOARD"); // 대시보드 데이터로 표시
                    
                    if (folderId != null) {
                        folderRepository.findById(folderId).ifPresent(keyword::setFolder);
                    }
                    keywordRankRepository.save(keyword);
                }

                // G열 (Index 6): 유입수 및 날짜 처리
                int targetCol = 6; 
                Cell dateHeaderCell = header.getCell(targetCol);
                LocalDate date = parseDateFromHeader(dateHeaderCell);
                
                if (date == null) {
                    date = parseDateFromHeader(row.getCell(0)); // A열 시도
                }
                if (date == null) {
                    date = LocalDate.now().minusDays(1);
                }

                Cell inflowCell = row.getCell(targetCol);
                if (inflowCell != null) {
                    try {
                        int inflow = 0;
                        if (inflowCell.getCellType() == CellType.NUMERIC) {
                            inflow = (int) inflowCell.getNumericCellValue();
                        } else if (inflowCell.getCellType() == CellType.STRING) {
                            String val = inflowCell.getStringCellValue().replaceAll("[^0-9]", "");
                            if (!val.isEmpty()) inflow = Integer.parseInt(val);
                        }
                        updateDailyInflow(keyword, date, inflow);
                    } catch (Exception e) {
                        System.err.println("[ExcelUpload] Row " + i + " error: " + e.getMessage());
                    }
                }
            }
        }
    }

    private LocalDate parseDateFromHeader(Cell cell) {
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
            
            String text = getCellValueAsString(cell).trim();
            if (text.isEmpty()) return null;

            // 정규식으로 YYYY.MM.DD 또는 YYYY-MM-DD 확인 (숫자8자리 이상)
            String digits = text.replaceAll("[^0-9]", "");
            if (digits.length() >= 8) {
                int year = Integer.parseInt(digits.substring(0, 4));
                int month = Integer.parseInt(digits.substring(4, 6));
                int day = Integer.parseInt(digits.substring(6, 8));
                return LocalDate.of(year, month, day);
            }
            
            // "1일" 또는 "01" 같은 일자만 있는 경우
            if (!digits.isEmpty()) {
                int day = Integer.parseInt(digits);
                if (day > 0 && day <= 31) {
                    return LocalDate.of(LocalDate.now().getYear(), LocalDate.now().getMonthValue(), day);
                }
            }
        } catch (Exception e) {
            System.err.println("[DateParse] Failed to parse: " + cell + " Error: " + e.getMessage());
        }
        return null;
    }

    private void updateDailyInflow(KeywordRank keyword, LocalDate date, int inflow) {
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

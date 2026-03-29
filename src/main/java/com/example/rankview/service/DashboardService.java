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
import java.util.ArrayList;
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

    public List<KeywordRank> getKeywordsRecursive(Long folderId, String username, String role) {
        List<com.example.rankview.entity.Folder> allFolders;
        if ("ADMIN".equals(role)) {
            allFolders = folderRepository.findAll();
        } else {
            allFolders = folderRepository.findByUsername(username);
        }

        List<Long> targetFolderIds = new ArrayList<>();
        collectFolderIdsRecursive(folderId, allFolders, targetFolderIds);

        if (targetFolderIds.isEmpty()) return new ArrayList<>();

        return keywordRankRepository.findByFolderIdsAndUsername(targetFolderIds, username, "DASHBOARD");
    }

    private void collectFolderIdsRecursive(Long parentId, List<com.example.rankview.entity.Folder> allFolders, List<Long> targetIds) {
        targetIds.add(parentId);
        for (com.example.rankview.entity.Folder f : allFolders) {
            if (parentId.equals(f.getParentId())) { 
                collectFolderIdsRecursive(f.getId(), allFolders, targetIds);
            }
        }
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
    public void processExcelUpload(MultipartFile file, Long folderId, Integer year, Integer month, String username) throws IOException {
        System.out.println("[ExcelUpload] Starting processing: " + file.getOriginalFilename() + " (Folder: " + folderId + ", User: " + username + ")");
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

                // A열 (Index 0): 상품명 (Keyword & ProductName)
                String productNameFromExcel = getCellValueAsString(row.getCell(0));
                // B열 (Index 1): 상품번호 (MID)
                String productNumber = getCellValueAsString(row.getCell(1)); 
                
                if (productNumber.isEmpty() && productNameFromExcel.isEmpty()) continue;

                // 상품 검색 및 생성 (DASHBOARD 타입, 사용자별 격리)
                Optional<KeywordRank> keywordOpt = findDashboardKeyword(productNumber, productNameFromExcel, username);
                
                KeywordRank keyword;
                if (keywordOpt.isPresent()) {
                    keyword = keywordOpt.get();
                    if (!productNumber.isEmpty()) {
                        keyword.setProductNumber(productNumber);
                    }
                    if (folderId != null) {
                        folderRepository.findById(folderId).ifPresent(keyword::setFolder);
                    }
                } else {
                    keyword = new KeywordRank();
                    // A열의 상품명을 키워드와 상품명 모두에 적용
                    keyword.setKeyword(productNameFromExcel);
                    keyword.setProductName(productNameFromExcel);
                    keyword.setProductNumber(productNumber);
                    keyword.setDataType("DASHBOARD");
                    keyword.setUsername(username);
                    
                    if (folderId != null) {
                        folderRepository.findById(folderId).ifPresent(keyword::setFolder);
                    }
                }
                keywordRankRepository.save(keyword);

                // G열 (Index 6)부터 마지막 열까지 시도 (날짜별 유입수)
                for (int col = 6; col < row.getLastCellNum(); col++) {
                    Cell dateHeaderCell = header.getCell(col);
                    LocalDate date = parseDateFromHeader(dateHeaderCell, year, month);
                    
                    if (date == null && col == 6) {
                        // 첫 번째 데이터 열(6번)의 헤더가 날짜가 아니면 A열 등에서 날짜를 찾아봄 (단일 날짜 행 형식)
                        date = parseDateFromHeader(row.getCell(0), year, month); 
                    }
                    
                    if (date == null) {
                        // 여전히 날짜를 못 찾으면 오늘 또는 어제로 기본 설정하거나 스킵
                        continue;
                    }

                    Cell inflowCell = row.getCell(col);
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
                            System.err.println("[ExcelUpload] Row " + i + " Col " + col + " error: " + e.getMessage());
                        }
                    }
                }
            }
        }
    }

    private Optional<KeywordRank> findDashboardKeyword(String productNumber, String keywordName, String username) {
        if (productNumber != null && !productNumber.isEmpty()) {
            // 사용자별로 같은 상품번호가 있을 수 있으므로 username 필터링 포함된 메서드 사용
            Optional<KeywordRank> opt = keywordRankRepository.findByProductNumberAndDataTypeAndUsername(productNumber, "DASHBOARD", username);
            if (opt.isPresent()) return opt;
            
            opt = keywordRankRepository.findByMidAndDataTypeAndUsername(productNumber, "DASHBOARD", username);
            if (opt.isPresent()) return opt;
        }
        if (keywordName != null && !keywordName.isEmpty()) {
            Optional<KeywordRank> opt = keywordRankRepository.findByKeywordAndDataTypeAndUsername(keywordName, "DASHBOARD", username);
            if (opt.isPresent()) return opt;
        }
        return Optional.empty();
    }

    private LocalDate parseDateFromHeader(Cell cell, Integer preferredYear, Integer preferredMonth) {
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
                    int y = (preferredYear != null) ? preferredYear : LocalDate.now().getYear();
                    int m = (preferredMonth != null) ? preferredMonth : LocalDate.now().getMonthValue();
                    return LocalDate.of(y, m, day);
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

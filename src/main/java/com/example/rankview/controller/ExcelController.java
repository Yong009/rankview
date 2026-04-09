package com.example.rankview.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.util.*;

@RestController
@RequestMapping("/api/excel")
public class ExcelController {

    @PostMapping("/upload")
    public ResponseEntity<List<Map<String, String>>> uploadExcel(@RequestParam("file") MultipartFile file) {
        List<Map<String, String>> dataList = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Assume 1st row as header
            Row headerRow = sheet.getRow(0);
            if (headerRow == null)
                return ResponseEntity.badRequest().build();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null)
                    continue;

                Map<String, String> data = new HashMap<>();
                // Field mapping based on your app structure
                data.put("keyword", getCellValue(row.getCell(0)));
                data.put("mid", getCellValue(row.getCell(1)));
                data.put("catalogMid", getCellValue(row.getCell(2)));
                data.put("storeName", getCellValue(row.getCell(3)));
                data.put("memo", getCellValue(row.getCell(4)));
                data.put("link", getCellValue(row.getCell(5)));

                if (data.get("keyword") != null && !data.get("keyword").isEmpty()) {
                    dataList.add(data);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(dataList);
    }

    @GetMapping("/download-sample")
    public ResponseEntity<byte[]> downloadSample() {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("샘플양식");
            
            // 헤더 생성
            Row headerRow = sheet.createRow(0);
            String[] headers = {"키워드", "MID", "카탈로그 MID", "스토어명", "메모", "링크"};
            
            // 헤더 스타일 (선택사항 - 좀 더 깔끔하게)
            CellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // 샘플 데이터 추가
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("무선 이어폰");
            dataRow.createCell(1).setCellValue("87495077064");
            dataRow.createCell(2).setCellValue(""); // 카탈로그 MID 비워둠
            dataRow.createCell(3).setCellValue("테스트스토어");
            dataRow.createCell(4).setCellValue("샘플 데이터입니다.");
            dataRow.createCell(5).setCellValue("https://search.shopping.naver.com/");
            
            // 컬럼 너비 자동 조절
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }
            
            workbook.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=keyword_sample.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private String getCellValue(Cell cell) {
        if (cell == null)
            return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                return String.valueOf((long) cell.getNumericCellValue());
            default:
                return "";
        }
    }
}

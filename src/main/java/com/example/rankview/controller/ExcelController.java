package com.example.rankview.controller;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
        try (Workbook workbook = new XSSFWorkbook();
                java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Keyword_Sample");
            Row headerRow = sheet.createRow(0);
            String[] headers = { "키워드", "MID", "카탈로그 MID", "스토어명", "메모", "상품주소(URL)" };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // Example data row
            Row dataRow = sheet.createRow(1);
            dataRow.createCell(0).setCellValue("무선 이어폰");
            dataRow.createCell(1).setCellValue("87495077064");
            dataRow.createCell(2).setCellValue("12345");
            dataRow.createCell(3).setCellValue("테스트 스토어");
            dataRow.createCell(4).setCellValue("메모 예시입니다.");
            dataRow.createCell(5).setCellValue("https://search.shopping.naver.com/...");

            workbook.write(out);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=keyword_upload_sample.xlsx")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
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

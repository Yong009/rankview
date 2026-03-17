package com.example.rankview.controller;

import org.apache.poi.ss.usermodel.*;
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
        try {
            java.io.File file = new java.io.File("c:\\web-project\\유입율.xlsx");
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=inflow_sample.xlsx")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(bytes);
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

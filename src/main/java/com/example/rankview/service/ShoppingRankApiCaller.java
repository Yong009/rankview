package com.example.rankview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;

@Service
public class ShoppingRankApiCaller {

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    private static final String API_URL = "https://openapi.naver.com/v1/search/shop.json";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public int getRank(String keyword, String targetMid, String targetCatalogMid, String targetStoreName) {
        if (clientId == null || clientId.contains("YOUR_CLIENT_ID")) {
            System.err.println("[ShoppingRankApiCaller] Client ID가 설정되지 않았습니다.");
            return -1;
        }

        String cleanMid = targetMid != null ? targetMid.trim() : "";
        String cleanCatMid = targetCatalogMid != null ? targetCatalogMid.trim() : "";
        String cleanStore = targetStoreName != null ? targetStoreName.replaceAll("\\s", "").toLowerCase() : "";

        System.out.println("[ShoppingRankApiCaller] 분석 시작 >>> [" + keyword + "] (MID:" + cleanMid + ", CatMID:"
                + cleanCatMid + ", Store:" + cleanStore + ")");

        int currentRank = 0;

        // Naver API start + display <= 1000 (또는 1100) 규정에 맞춰 조정
        for (int start = 1; start <= 901; start += 100) {
            int retryCount = 0;
            boolean success = false;

            while (retryCount < 2 && !success) {
                try {
                    URI uri = UriComponentsBuilder.fromHttpUrl(API_URL)
                            .queryParam("query", keyword)
                            .queryParam("display", 100)
                            .queryParam("start", start)
                            .queryParam("sort", "sim")
                            .build()
                            .encode(StandardCharsets.UTF_8)
                            .toUri();

                    HttpHeaders headers = new HttpHeaders();
                    headers.set("X-Naver-Client-Id", clientId.replace("\"", "").trim());
                    headers.set("X-Naver-Client-Secret", clientSecret.replace("\"", "").trim());
                    headers.setContentType(MediaType.APPLICATION_JSON);

                    HttpEntity<String> entity = new HttpEntity<>(headers);
                    ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                    if (response.getStatusCode() == HttpStatus.OK) {
                        success = true;
                        JsonNode root = objectMapper.readTree(response.getBody());
                        JsonNode items = root.path("items");

                        if (items.isArray() && items.size() > 0) {
                            for (int i = 0; i < items.size(); i++) {
                                currentRank++;
                                JsonNode item = items.get(i);

                                String productId = item.path("productId").asText("");
                                String mallName = item.path("mallName").asText("").replaceAll("\\s", "").toLowerCase();
                                String title = item.path("title").asText("").replaceAll("<[^>]*>", "");

                                // 1. MID 또는 Catalog MID 일치 확인
                                if ((!cleanMid.isEmpty() && cleanMid.equals(productId)) ||
                                        (!cleanCatMid.isEmpty() && cleanCatMid.equals(productId))) {
                                    System.out.println(
                                            ">>> [발견] " + currentRank + "위: " + title + " (ID: " + productId + ")");
                                    return currentRank;
                                }

                                // 2. 스토어명 일치 확인 (네이버 가격비교 묶음 제외)
                                if (!cleanStore.isEmpty() && !mallName.isEmpty() && !"네이버".equals(mallName)) {
                                    if (mallName.contains(cleanStore) || cleanStore.contains(mallName)) {
                                        System.out.println(
                                                ">>> [발견] " + currentRank + "위: " + title + " (스토어: " + mallName + ")");
                                        return currentRank;
                                    }
                                }
                            }
                        } else {
                            // 결과가 더 이상 없으면 종료
                            System.out.println(">>> [알림] " + start + "위 이후 결과 없음. 검색 종료.");
                            return -1;
                        }

                        // 전체 결과 수를 넘었으면 종료
                        int total = root.path("total").asInt(0);
                        if (currentRank >= total) {
                            System.out.println(">>> [알림] 전체 검색 결과(" + total + ") 분석 완료. 종료.");
                            return -1;
                        }
                    } else {
                        System.err.println("[ShoppingRankApiCaller] API 오류 응답: " + response.getStatusCode());
                        break;
                    }
                } catch (HttpClientErrorException.TooManyRequests e) {
                    System.err.println("[ShoppingRankApiCaller] 요청 한도 초과 (429). 1초 대기 후 재시도...");
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ie) {
                    }
                    retryCount++;
                } catch (Exception e) {
                    System.err.println("[ShoppingRankApiCaller] 조회 중 오류: " + e.getMessage());
                    retryCount++;
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ie) {
                    }
                }
            }

            if (!success)
                break;
        }

        System.out.println("[ShoppingRankApiCaller] 분석 종료 >>> 1000위 내 상품 없음.");
        return -1;
    }
}

package com.example.rankview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;

// @Service
public class NaverApiService {

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    private static final String API_URL = "https://openapi.naver.com/v1/search/shop.json";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * 네이버 쇼핑 검색 API를 사용하여 특정 상품의 현재 순위를 탐색합니다. (최대 1000위)
     *
     * @param keyword         검색어
     * @param targetMid       찾고자 하는 상품의 MID
     * @param targetStoreName 찾고자 하는 상품의 스토어명
     * @return 발견된 순위(1~1000), 발견되지 않으면 -1
     */
    public int getRank(String keyword, String targetMid, String targetStoreName) {
        if (clientId == null || clientId.contains("YOUR_CLIENT_ID")) {
            System.err.println("[NaverApiService] Client ID가 설정되지 않았습니다.");
            return -1;
        }

        String cleanMid = targetMid != null ? targetMid.trim() : "";
        String cleanStore = targetStoreName != null ? targetStoreName.replaceAll("\\s", "").toLowerCase() : "";

        // 검색 API는 100개씩 최대 1000위(start=901)까지 조회 가능
        for (int start = 1; start <= 1000; start += 100) {
            try {
                URI uri = UriComponentsBuilder.fromHttpUrl(API_URL)
                        .queryParam("query", keyword)
                        .queryParam("display", 100)
                        .queryParam("start", start)
                        .queryParam("sort", "sim") // 유사도순 (기본 검색 순위)
                        .build()
                        .encode(StandardCharsets.UTF_8)
                        .toUri();

                HttpHeaders headers = new HttpHeaders();
                headers.set("X-Naver-Client-Id", clientId);
                headers.set("X-Naver-Client-Secret", clientSecret);
                headers.setContentType(MediaType.APPLICATION_JSON);

                HttpEntity<String> entity = new HttpEntity<>(headers);
                ResponseEntity<String> response = restTemplate.exchange(uri, HttpMethod.GET, entity, String.class);

                if (response.getStatusCode() == HttpStatus.OK) {
                    JsonNode root = objectMapper.readTree(response.getBody());
                    JsonNode items = root.path("items");

                    if (items.isArray()) {
                        for (int i = 0; i < items.size(); i++) {
                            JsonNode item = items.get(i);
                            String productId = item.path("productId").asText();
                            String mallName = item.path("mallName").asText().replaceAll("\\s", "").toLowerCase();

                            // 1. MID 매칭 (우선)
                            if (!cleanMid.isEmpty() && cleanMid.equals(productId)) {
                                return start + i;
                            }
                            // 2. 스토어명 매칭
                            if (!cleanStore.isEmpty() && mallName.contains(cleanStore)) {
                                return start + i;
                            }
                        }
                    } else {
                        break; // 더 이상 결과 없음
                    }

                    // 총 결과 개수가 현재 탐색 범위보다 작으면 중단
                    int total = root.path("total").asInt();
                    if (start + items.size() > total)
                        break;

                } else {
                    System.err.println("[NaverApiService] API 호출 실패: " + response.getStatusCode());
                    break;
                }
            } catch (Exception e) {
                System.err.println("[NaverApiService] 오류 발생: " + e.getMessage());
                e.printStackTrace();
                break;
            }
        }

        return -1;
    }
}

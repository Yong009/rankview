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

@Service
public class ShoppingRankApiCaller {

    @Value("${naver.api.client-id}")
    private String clientId;

    @Value("${naver.api.client-secret}")
    private String clientSecret;

    private static final String API_URL = "https://openapi.naver.com/v1/search/shop.json";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RankResult getRank(String keyword, String targetMid, String targetCatalogMid, String targetStoreName) {
        RankResult result = new RankResult();
        result.setRank(-1);

        if (clientId == null || clientId.contains("YOUR_CLIENT_ID")) {
            System.err.println("[ShoppingRankApiCaller] Client ID가 설정되지 않았습니다.");
            return result;
        }

        String cleanMid = targetMid != null ? targetMid.trim() : "";
        String cleanCatMid = targetCatalogMid != null ? targetCatalogMid.trim() : "";
        String cleanStore = targetStoreName != null ? targetStoreName.replaceAll("\\s", "").toLowerCase() : "";

        System.out.println("[ShoppingRankApiCaller] 분석 시작 >>> [" + keyword + "] (MID:" + cleanMid + ", CatMID:"
                + cleanCatMid + ", Store:" + cleanStore + ")");

        int currentRank = 0;

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
                                String link = item.path("link").asText("");
                                String image = item.path("image").asText("");
                                int lprice = item.path("lprice").asInt(0);

                                // 일치 조건 확인
                                boolean matchFound = false;
                                if ((!cleanMid.isEmpty() && cleanMid.equals(productId)) ||
                                        (!cleanCatMid.isEmpty() && cleanCatMid.equals(productId))) {
                                    matchFound = true;
                                } else if (!cleanStore.isEmpty() && !mallName.isEmpty() && !"네이버".equals(mallName)) {
                                    if (mallName.contains(cleanStore) || cleanStore.contains(mallName)) {
                                        matchFound = true;
                                    }
                                }

                                if (matchFound) {
                                    System.out.println(">>> [발견] " + currentRank + "위: " + title);
                                    result.setRank(currentRank);
                                    result.setLink(link);
                                    result.setImage(image);
                                    result.setPrice(lprice);
                                    result.setProductName(title);
                                    return result;
                                }
                            }
                        } else {
                            System.out.println(">>> [알림] " + start + "위 이후 결과 없음. 검색 종료.");
                            return result;
                        }

                        int total = root.path("total").asInt(0);
                        if (currentRank >= total) {
                            return result;
                        }
                    } else {
                        break;
                    }
                } catch (Exception e) {
                    retryCount++;
                    try { Thread.sleep(500); } catch (Exception ie) {}
                }
            }
            if (!success) break;
        }

        System.out.println("[ShoppingRankApiCaller] 분석 종료 >>> 1000위 내 상품 없음.");
        return result;
    }

    public static class RankResult {
        private int rank;
        private String link;
        private String image;
        private int price;
        private String productName;

        public int getRank() { return rank; }
        public void setRank(int rank) { this.rank = rank; }
        public String getLink() { return link; }
        public void setLink(String link) { this.link = link; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public int getPrice() { return price; }
        public void setPrice(int price) { this.price = price; }
        public String getProductName() { return productName; }
        public void setProductName(String productName) { this.productName = productName; }
    }
}

package com.example.rankview.service;

import com.microsoft.playwright.*;
import com.microsoft.playwright.options.LoadState;
import org.springframework.stereotype.Service;

@Service
public class PlaywrightService {

    private Playwright playwright;
    private Browser browser;

    public synchronized void simulateNaverSearch(String keyword, String mid, String storeName) {
        try {
            if (playwright == null)
                playwright = Playwright.create();

            if (browser != null) {
                try {
                    browser.close();
                } catch (Exception e) {
                }
            }

            browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                    .setHeadless(false)
                    .setSlowMo(150));

            BrowserContext context = browser.newContext();
            Page page = context.newPage();

            System.out.println("네이버 접속: " + keyword);
            page.navigate("https://www.naver.com");
            page.fill("#query", keyword);
            page.keyboard().press("Enter");
            page.waitForLoadState(LoadState.NETWORKIDLE);

            System.out.println("쇼핑 이동...");
            Locator shoppingTab = page.locator("text=쇼핑").first();
            if (shoppingTab.isVisible()) {
                shoppingTab.click();
                page.waitForLoadState(LoadState.NETWORKIDLE);
            }

            System.out.println("상품 찾는 중: " + storeName);
            for (int i = 0; i < 10; i++) {
                page.mouse().wheel(0, 2000);
                page.waitForTimeout(1000);

                Locator productCard = page.locator("li, div")
                        .filter(new Locator.FilterOptions().setHasText(storeName))
                        .filter(new Locator.FilterOptions().setHas(page.locator("a")))
                        .first();

                if (productCard.count() > 0 && productCard.isVisible()) {
                    System.out.println("상품 구역 발견!");
                    String matchText = keyword.length() > 20 ? keyword.substring(0, 20) : keyword;
                    Locator titleLink = productCard.locator("a")
                            .filter(new Locator.FilterOptions().setHasText(matchText)).first();

                    if (titleLink.count() > 0) {
                        System.out.println("제품명 클릭하여 진입합니다.");
                        titleLink.scrollIntoViewIfNeeded();
                        titleLink.click();
                        break;
                    } else {
                        Locator fallbackLink = productCard.locator("a[class*='link']").first();
                        if (fallbackLink.count() > 0) {
                            fallbackLink.click();
                            break;
                        }
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * 네이버 쇼핑에서 해당 키워드로 검색 후, 스토어명에 해당하는 상품의 순위를 가져옵니다.
     */
    public int getNaverShoppingRank(String keyword, String mid, String storeName) {
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
            // 1. 브라우저 컨텍스트 설정 (최신 User-Agent 추가하여 봇 감지 회피)
            BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                    .setUserAgent(
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"));
            Page page = context.newPage();

            System.out.println("[Step 1] 네이버 메인 접속...");
            page.navigate("https://www.naver.com");
            page.waitForLoadState(LoadState.NETWORKIDLE);
            page.fill("#query", "가격비교");
            page.keyboard().press("Enter");
            page.waitForLoadState(LoadState.NETWORKIDLE);

            // 2. 쇼핑 섹션 이동 (새 탭 대응)
            System.out.println("[Step 2] 네이버 쇼핑 이동...");
            Locator shoppingLink = page.locator("a:has-text('네이버 쇼핑'), a[href*='search.shopping.naver.com']").first();

            Page shoppingPage = null;
            if (shoppingLink.isVisible()) {
                shoppingPage = context.waitForPage(() -> {
                    shoppingLink.click();
                });
            } else {
                page.navigate("https://search.shopping.naver.com/search/all?query=가격비교");
                shoppingPage = page;
            }
            shoppingPage.waitForLoadState(LoadState.NETWORKIDLE);
            shoppingPage.waitForTimeout(1000);

            // 3. 실제 타겟 키워드 검색
            System.out.println("[Step 3] 키워드 검색: " + keyword);
            // 다양한 검색창 셀렉터 시도
            Locator searchBox = shoppingPage
                    .locator("input[class*='searchInput'], input[class*='_searchInput_'], input[title='검색어 입력']")
                    .first();
            if (!searchBox.isVisible()) {
                // 검색창이 바로 안 보일 경우 직접 URL 이동 (최종 보루)
                shoppingPage.navigate(
                        "https://search.shopping.naver.com/search/all?query=" + keyword + "&productSet=model");
            } else {
                searchBox.click();
                searchBox.fill(""); // 기존 내용 삭제
                searchBox.type(keyword, new Locator.TypeOptions().setDelay(50));
                shoppingPage.keyboard().press("Enter");
            }
            shoppingPage.waitForLoadState(LoadState.NETWORKIDLE);
            shoppingPage.waitForTimeout(1500);

            // 4. '가격비교' 탭 확실히 클릭
            System.out.println("[Step 4] 가격비교 탭 선택...");
            // URL에 productSet=model이 포함되어 있지 않을 경우에만 클릭
            if (!shoppingPage.url().contains("productSet=model")) {
                Locator modelFilter = shoppingPage.locator("a:active, a")
                        .filter(new Locator.FilterOptions().setHasText("가격비교")).first();
                if (modelFilter.isVisible()) {
                    modelFilter.click();
                    shoppingPage.waitForLoadState(LoadState.NETWORKIDLE);
                    shoppingPage.waitForTimeout(1000);
                }
            }

            int rank = -1;
            boolean found = false;
            String cleanTargetStore = storeName.replaceAll("\\s", "").toLowerCase();

            // 최대 25페이지 탐색
            for (int p = 1; p <= 25; p++) {
                System.out.println("[Step 5] 페이지 " + p + " 분석 중...");

                // 스크롤 (더 꼼꼼하게)
                for (int s = 0; s < 12; s++) {
                    shoppingPage.mouse().wheel(0, 1000);
                    shoppingPage.waitForTimeout(200);
                }
                shoppingPage.waitForTimeout(1500);

                // 아이템 수집 (광고 상품 'ad_product'까지 모두 포함)
                Locator items = shoppingPage
                        .locator("div[class*='product_item'], li[class*='product_item'], div[class*='ad_product']");
                int itemCount = items.count();

                for (int i = 0; i < itemCount; i++) {
                    Locator item = items.nth(i);
                    String itemText = item.innerText();
                    String cleanItemText = itemText.replaceAll("\\s", "").toLowerCase();

                    // 1. 텍스트 직접 매칭
                    if (cleanItemText.contains(cleanTargetStore)) {
                        rank = ((p - 1) * 40) + (i + 1);
                        found = true;
                    }
                    // 2. 내부 몰 링크 속성 매칭 (텍스트에 안 보일 경우 대비)
                    else {
                        Locator mallItems = item.locator("a[class*='mall'], [title*='" + storeName + "']");
                        int mallCount = mallItems.count();
                        for (int j = 0; j < mallCount; j++) {
                            String title = mallItems.nth(j).getAttribute("title");
                            if (title != null && title.replaceAll("\\s", "").toLowerCase().contains(cleanTargetStore)) {
                                rank = ((p - 1) * 40) + (i + 1);
                                found = true;
                                break;
                            }
                        }
                    }

                    // 3. MID 매칭
                    if (!found && mid != null && !mid.isEmpty() && itemText.contains(mid)) {
                        rank = ((p - 1) * 40) + (i + 1);
                        found = true;
                    }

                    if (found) {
                        System.out.println(">>> 상품 발견! 순위: " + rank);
                        break;
                    }
                }

                if (found)
                    break;

                // 다음 페이지 버튼
                Locator nextBtn = shoppingPage.locator("a[class*='pagination_next'], a[class*='next']").first();
                if (nextBtn.count() > 0 && nextBtn.isVisible() && nextBtn.isEnabled()) {
                    nextBtn.click();
                    shoppingPage.waitForLoadState(LoadState.NETWORKIDLE);
                    shoppingPage.waitForTimeout(2000);
                } else {
                    break;
                }
            }

            browser.close();
            return rank;
        } catch (Exception e) {
            System.err.println("순위 검색 중 심각한 오류: " + e.getMessage());
            e.printStackTrace();
            return -1;
        }
    }
}

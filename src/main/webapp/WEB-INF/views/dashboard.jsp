<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RankView | 대시보드</title>
    <!-- CSS Load -->
    <link rel="stylesheet" href="css/style.css">
    <!-- Font Load -->
    <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-logo">
                <i class="fas fa-rocket"></i> RankView
            </div>
            
            <div class="sidebar-header">
                <h2><i class="fas fa-folder"></i> 내 폴더</h2>
                <button id="addFolderBtn" class="btn-icon" title="새 폴더 추가">
                    <i class="fas fa-plus-square"></i>
                </button>
            </div>
            
            <ul class="folder-list" id="folderList">
                <!-- Folders rendered by JS -->
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="content-area">
            <header class="content-header">
                <h1 class="user-status"><%= session.getAttribute("user") %>님의 대시보드</h1>
                <div class="action-buttons-right">
                    <a href="/" class="btn btn-secondary" style="text-decoration:none;"><i class="fas fa-list"></i> 기본 리스트 뷰</a>
                    <a href="history" class="btn btn-primary" style="text-decoration:none; background: #10b981;"><i class="fas fa-history"></i> 히스토리</a>
                    <a href="/logout" class="btn btn-secondary btn-logout" style="text-decoration:none;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>
                </div>
            </header>

            <div class="action-bar-wrapper">
                <div class="action-buttons-left">
                    <button class="btn btn-primary" onclick="loadAllKeywords()"><i class="fas fa-sync-alt"></i> 전체 데이터 새로고침</button>
                    <button class="btn btn-primary" id="uploadExcelBtn"><i class="fas fa-file-import"></i> 엑셀 업로드</button>
                    <button class="btn btn-secondary" id="exportExcelBtn"><i class="fas fa-file-export"></i> 엑셀 내보내기</button>
                </div>
                
                <div class="action-buttons-right">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" placeholder="상품명, ID, 키워드 검색...">
                    </div>
                </div>
            </div>

            <div class="current-folder-info" style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <h3 id="currentFolderName" style="margin: 0;">전체 대시보드</h3>
                    <div class="month-selector" style="display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.7); padding: 5px 15px; border-radius: 20px; border: 1px solid var(--border-color);">
                        <button onclick="changeMonth(-1)" class="btn-icon" style="color: var(--primary);"><i class="fas fa-chevron-left"></i></button>
                        <span id="currentMonthDisplay" style="font-weight: 700; font-size: 1rem; min-width: 100px; text-align: center; color: var(--text-main);">2026년 03월</span>
                        <button onclick="changeMonth(1)" class="btn-icon" style="color: var(--primary);"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <span class="item-count">총 <b id="itemCount">0</b>건</span>
            </div>

            <div class="table-container premium-excel-view">
                <div class="table-scroll-wrapper">
                    <table class="data-table" id="mainTable">
                        <thead>
                            <tr id="tableHeaderRow">
                                <th class="sticky-col-1" width="60">이미지</th>
                                <th class="sticky-col-2" width="220">상품명 / 상품ID</th>
                                <!-- JS에서 1일~31일 컬럼 동적 생성 -->
                            </tr>
                        </thead>
                        <tbody id="dashboardTableBody">
                            <!-- Data rendered by JS -->
                        </tbody>
                        <tfoot id="tableFooterRow">
                            <!-- 합계 등이 JS에서 렌더링됨 -->
                        </tfoot>
                    </table>
                </div>
                <div id="emptyState" style="text-align:center; padding: 100px 0; color: #a0aec0; display:none;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>등록된 데이터가 없습니다.</p>
                </div>
            </div>
        </main>
    </div>

    <!-- Modals (Add Folder) -->
    <div id="folderModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>새 폴더 만들기</h2>
                <button class="close-modal btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>상위 폴더 (선택)</label>
                    <select id="parentFolderSelect" class="form-control">
                        <option value="">없음 (최상위)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>폴더 이름</label>
                    <input type="text" id="newFolderName" placeholder="예: 패션의류, 가전잡화">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">취소</button>
                <button class="btn btn-primary" id="saveFolderBtn">생성하기</button>
            </div>
        </div>
    </div>

    <!-- Excel Upload Modal -->
    <div id="excelModal" class="modal-overlay">
        <div class="modal-content" style="max-width: 450px;">
            <div class="modal-header">
                <h2>엑셀 데이터 업로드</h2>
                <button class="close-modal btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>업로드 대상 폴더</label>
                    <select id="excelTargetFolder" class="form-control">
                        <!-- JS에서 폴더 목록 채워줌 -->
                    </select>
                </div>
                <div style="display: flex; gap: 15px;">
                    <div class="form-group" style="flex: 1;">
                        <label>연도</label>
                        <select id="excelYear" class="form-control">
                            <option value="2024">2024년</option>
                            <option value="2025">2025년</option>
                            <option value="2026" selected>2026년</option>
                        </select>
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label>월</label>
                        <select id="excelMonth" class="form-control">
                            <option value="1">1월</option>
                            <option value="2">2월</option>
                            <option value="3">3월</option>
                            <option value="4">4월</option>
                            <option value="5">5월</option>
                            <option value="6">6월</option>
                            <option value="7">7월</option>
                            <option value="8">8월</option>
                            <option value="9">9월</option>
                            <option value="10">10월</option>
                            <option value="11">11월</option>
                            <option value="12">12월</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>파일 선택 (.xlsx, .xls)</label>
                    <input type="file" id="excelFileInput" accept=".xlsx, .xls" class="form-control" style="padding: 8px;">
                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                        * A열: 상품명, B열: 상품번호(MID), G열부터 유입수 시작
                    </p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">취소</button>
                <button class="btn btn-primary" id="startUploadBtn"><i class="fas fa-upload"></i> 업로드 시작</button>
            </div>
        </div>
    </div>

    <div id="toast" class="toast">알림</div>

    <!-- Hidden Image Upload Input -->
    <input type="file" id="dashboardImageInput" style="display:none;" accept="image/*">

    <!-- JS Load -->
    <script src="js/dashboard.js"></script>
</body>
</html>

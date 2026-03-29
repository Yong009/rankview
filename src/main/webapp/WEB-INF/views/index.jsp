<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RankView | 키워드 순위 관리</title>
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
                <h1 class="user-status"><%= session.getAttribute("user") %>님 
                    <span><%= "test123123".equals(session.getAttribute("user")) ? "관리자" : "일반 사용자" %></span>
                </h1>
                <div class="action-buttons-right">
                   <% if ("ADMIN".equals(session.getAttribute("role"))) { %>
                        <a href="/admin/users" class="btn btn-secondary" style="border-color:var(--primary); color:var(--primary); text-decoration:none;"><i class="fas fa-user-shield"></i> 관리자 모드</a>
                   <% } %>
                    <a href="/" class="btn btn-secondary" style="text-decoration:none;"><i class="fas fa-list"></i> 기본 리스트 뷰</a>
                    <a href="history" class="btn btn-primary" style="text-decoration:none; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);"><i class="fas fa-history"></i> 순위 히스토리</a>
                   <a href="/logout" class="btn btn-secondary btn-logout" style="text-decoration:none;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>
                </div>
            </header>

            <!-- Rank Update Progress Indicator -->
            <div id="rankProgressContainer" class="progress-notice" style="display:none;">
                <div class="progress-info">
                   <i class="fas fa-spinner fa-spin"></i> <span id="progressText">순위 정보를 조회하고 있습니다...</span>
                </div>
                <div class="progress-bar-bg">
                   <div id="progressBar" class="progress-bar-fill" style="width: 0%"></div>
                </div>
            </div>

            <div class="action-bar-wrapper">
                <div class="action-buttons-left">
                    <button class="btn btn-primary" id="addProductBtn"><i class="fas fa-plus-circle"></i> 상품 등록</button>
                    <button class="btn btn-primary" id="refreshAllBtn"><i class="fas fa-sync-alt"></i> 순위 새로고침</button>
                    <a href="history" class="btn btn-primary" style="text-decoration:none; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);"><i class="fas fa-history"></i> 순위 히스토리</a>
                    <button class="btn btn-secondary"><i class="fas fa-bullhorn"></i> 공지사항</button>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <button class="btn btn-secondary" id="excelUploadBtn"><i class="fas fa-file-excel"></i> 엑셀 업로드</button>
                        <input type="file" id="excelFile" style="display:none" accept=".xlsx, .xls">
                        <a href="/api/excel/download-sample" class="action-link" style="font-size: 11px; margin-top: 4px; text-decoration: none;"><i class="fas fa-download"></i> 샘플 다운로드</a>
                    </div>

                    <button class="btn btn-secondary"><i class="fas fa-key"></i> API 입력</button>
                    <button class="btn btn-secondary" id="deleteSelectedBtn"><i class="fas fa-trash-alt"></i> 선택삭제</button>
                </div>
                
                <div class="action-buttons-right">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" placeholder="키워드, MID, 스토어명 검색...">
                    </div>
                </div>
            </div>

            <div class="current-folder-info">
                <h3 id="currentFolderName">기본 폴더</h3>
                <span class="item-count">총 <b id="itemCount">0</b>건</span>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th width="40"><input type="checkbox" id="selectAll"></th>
                            <th>키워드</th>
                            <th>MID</th>
                            <th>카탈로그 MID</th>
                            <th>스토어명</th>
                            <th>메모</th>
                            <th>링크</th>
                            <th>오늘순위</th>
                            <th>어제순위</th>
                            <th>등락</th>
                            <th>순위체크</th>
                            <th>수정</th>
                            <th>삭제</th>
                        </tr>
                    </thead>
                    <tbody id="keywordTableBody">
                        <!-- Data rendered by JS -->
                    </tbody>
                </table>
                <div id="emptyState" style="text-align:center; padding: 100px 0; color: #a0aec0; display:none;">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>등록된 키워드가 없습니다.</p>
                </div>
            </div>
        </main>
    </div>

    <!-- Modals -->
    <div id="productModal" class="modal-overlay">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-plus-circle"></i> 새 상품 등록</h2>
                <button class="close-modal btn-icon"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="productForm">
                    <div class="form-group">
                        <label>대상 폴더</label>
                        <div id="modalFolderName" style="font-weight:700; color:var(--primary);">기본 폴더</div>
                    </div>
                    <div style="display:flex; gap:20px;">
                        <div class="form-group" style="flex:1;">
                            <label>키워드 <span style="color:red">*</span></label>
                            <input type="text" id="pdKeyword" placeholder="예: 무선 이어폰">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>MID <span style="color:red">*</span></label>
                            <input type="text" id="pdMid" placeholder="예: 87495077064">
                        </div>
                    </div>
                    <div style="display:flex; gap:20px;">
                        <div class="form-group" style="flex:1;">
                            <label>카탈로그 MID</label>
                            <input type="text" id="pdCatMid" placeholder="선택 사항">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>스토어명</label>
                            <input type="text" id="pdStore" placeholder="스토어 이름">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>상품주소 (URL)</label>
                        <input type="text" id="pdLink" placeholder="https://...">
                    </div>
                    <div class="form-group">
                        <label>메모</label>
                        <textarea id="pdMemo" rows="2" placeholder="기타 참고 사항"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">취소</button>
                <button class="btn btn-primary" id="saveProductBtn">등록하기</button>
            </div>
        </div>
    </div>

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

    <div id="toast" class="toast">알림</div>
    


    <!-- JS Load -->
    <script src="js/app.js"></script>
</body>
</html>

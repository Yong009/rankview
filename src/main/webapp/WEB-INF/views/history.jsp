<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RankView | 순위 히스토리</title>
    <!-- CSS Load -->
    <link rel="stylesheet" href="css/style.css">
    <!-- Font Load -->
    <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .history-card {
            background: white;
            border-radius: 12px;
            box-shadow: var(--shadow-md);
            margin-bottom: 30px;
            overflow: hidden;
            border: 1px solid var(--border-color);
        }
        .history-card-header {
            padding: 20px;
            background: #f8fafc;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            gap: 20px;
        }
        .history-prod-img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #edf2f7;
        }
        .history-prod-info h3 {
            font-size: 1.2rem;
            margin-bottom: 5px;
            color: var(--text-main);
        }
        .history-prod-info p {
            font-size: 0.9rem;
            color: var(--text-muted);
        }
        .history-table-wrapper {
            overflow-x: auto;
        }
        .history-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.85rem;
        }
        .history-table th {
            background: #f1f5f9;
            padding: 10px;
            border: 1px solid #e2e8f0;
            min-width: 60px;
            text-align: center;
        }
        .history-table td {
            padding: 12px 10px;
            border: 1px solid #e2e8f0;
            text-align: center;
        }
        .rank-top10 { background-color: #fef3c7; font-weight: 800; color: #92400e; }
        .rank-top3 { background-color: #fde68a; font-weight: 900; color: #b45309; }
        .rank-out { color: #cbd5e1; }
        
        .month-selector {
            display: flex;
            align-items: center;
            gap: 15px;
            padding: 15px 25px;
            background: white;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: var(--shadow-sm);
            width: fit-content;
        }
    </style>
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
            </div>
            
            <ul class="folder-list" id="folderList">
                <!-- Folders rendered by JS -->
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="content-area">
            <header class="content-header">
                <h1 class="user-status"><%= session.getAttribute("user") %>님 
                    <span>순위 히스토리 (30일 상세)</span>
                </h1>
                <div class="action-buttons-right">
                   <a href="/" class="btn btn-secondary" style="text-decoration:none;"><i class="fas fa-list"></i> 리스트 뷰</a>
                   <a href="dashboard" class="btn btn-secondary" style="text-decoration:none;"><i class="fas fa-chart-line"></i> 대시보드</a>
                   <a href="/logout" class="btn btn-secondary btn-logout" style="text-decoration:none;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>
                </div>
            </header>

            <div class="month-selector">
                <button id="prevMonth" class="btn-icon"><i class="fas fa-chevron-left"></i></button>
                <span id="currentMonthDisplay" style="font-weight:700; font-size:1.1rem;">2024년 3월</span>
                <button id="nextMonth" class="btn-icon"><i class="fas fa-chevron-right"></i></button>
            </div>

            <div class="current-folder-info" style="margin-bottom:20px;">
                <h3 id="currentFolderName">기본 폴더</h3>
                <span class="item-count">총 <b id="itemCount">0</b>건의 키워드 히스토리</span>
            </div>

            <div id="historyContainer">
                <!-- Data cards rendered by JS -->
                <div id="emptyState" style="text-align:center; padding: 100px 0; color: #a0aec0;">
                    <i class="fas fa-history" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <p>조회할 키워드를 선택해주세요.</p>
                </div>
            </div>
        </main>
    </div>

    <div id="toast" class="toast">알림</div>

    <!-- JS Load -->
    <script src="js/history.js"></script>
</body>
</html>

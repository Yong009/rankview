<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="jakarta.tags.core" %>
<%@ taglib prefix="fmt" uri="jakarta.tags.fmt" %>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RankView | 관리자 모드</title>
    <link rel="stylesheet" href="/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .admin-sidebar {
            background: #1a202c !important;
        }
        .admin-sidebar .folder-item {
            color: #a0aec0;
        }
        .admin-sidebar .folder-item.active {
            background: #2d3748;
            color: white;
        }
        .user-mgmt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        .badge {
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 700;
        }
        .badge-admin { background: #fed7d7; color: #9b2c2c; }
        .badge-user { background: #ebf8ff; color: #2b6cb0; }
        .badge-active { background: #c6f6d5; color: #22543d; }
        .badge-inactive { background: #edf2f7; color: #4a5568; }
        
        .add-user-modal .modal-content {
            max-width: 450px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar admin-sidebar">
            <div class="sidebar-logo" style="color:white">
                <i class="fas fa-shield-alt"></i> RankView Admin
            </div>
            <div class="sidebar-header">
                <h2>전체 관리</h2>
            </div>
            <ul class="folder-list">
                <li class="folder-item active">
                    <i class="fas fa-user-friends"></i> <span>사용자 관리</span>
                </li>
                <li class="folder-item">
                    <i class="fas fa-chart-line"></i> <span>시스템 통계</span>
                </li>
                <li class="folder-item">
                    <i class="fas fa-cog"></i> <span>설정</span>
                </li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="content-area">
            <header class="content-header">
                <h1 class="user-status">관리자 시스템 <span>Admin Mode</span></h1>
                <div class="action-buttons-right">
                   <a href="/" class="btn btn-secondary">메인 이동</a>
                   <a href="/logout" class="btn btn-secondary btn-logout" style="text-decoration:none;"><i class="fas fa-sign-out-alt"></i> 로그아웃</a>
                </div>
            </header>

            <div class="user-mgmt-header">
                <h3><i class="fas fa-users-cog"></i> 회원 관리 리스트</h3>
                <button class="btn btn-primary" onclick="document.getElementById('userModal').classList.add('active')">
                    <i class="fas fa-user-plus"></i> 일반 회원 추가
                </button>
            </div>

            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>아이디</th>
                            <th>권한</th>
                            <th>가입일</th>
                            <th>상태</th>
                            <th>관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        <c:forEach var="u" items="${users}">
                            <tr>
                                <td>${u.id}</td>
                                <td style="font-weight:700">${u.username}</td>
                                <td>
                                    <span class="badge ${u.role == 'ADMIN' ? 'badge-admin' : 'badge-user'}">
                                        ${u.role == 'ADMIN' ? '운영자' : '일반회원'}
                                    </span>
                                </td>
                                <td><fmt:parseDate value="${u.createdAt}" pattern="yyyy-MM-dd'T'HH:mm" var="parsedDate" type="both" />
                                    <fmt:formatDate value="${parsedDate}" pattern="yyyy-MM-dd HH:mm" /></td>
                                <td>
                                    <span class="badge ${u.status == 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
                                        ${u.status == 'ACTIVE' ? '이용중' : '정지됨'}
                                    </span>
                                </td>
                                <td>
                                    <div style="display:flex; gap:8px">
                                        <form action="/admin/users/${u.id}/status" method="POST" style="margin:0">
                                            <button type="submit" class="btn btn-secondary" style="padding:4px 8px; font-size:0.75rem">
                                                ${u.status == 'ACTIVE' ? '정지' : '활성'}
                                            </button>
                                        </form>
                                        <c:if test="${u.username != 'test123123'}">
                                            <form action="/admin/users/${u.id}/delete" method="POST" style="margin:0" onsubmit="return confirm('정말 삭제하시겠습니까?')">
                                                <button type="submit" class="btn btn-danger" style="padding:4px 8px; font-size:0.75rem; color:red; border-color:red">삭제</button>
                                            </form>
                                        </c:if>
                                    </div>
                                </td>
                            </tr>
                        </c:forEach>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <!-- User Add Modal -->
    <div class="modal-overlay add-user-modal" id="userModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>새 사용자 추가</h2>
                <button class="btn-icon close-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <form id="addUserForm" action="/admin/users/add" method="POST">
                    <div class="form-group">
                        <label>아이디</label>
                        <input type="text" name="username" required placeholder="아이디 입력">
                    </div>
                    <div class="form-group">
                        <label>비밀번호</label>
                        <input type="password" name="password" required placeholder="비밀번호 입력">
                    </div>
                    <div class="form-group">
                        <label>권한</label>
                        <select name="role" style="width:100%; padding:12px; border:1px solid #e2e8f0; border-radius:10px;">
                            <option value="USER">일반회원</option>
                            <option value="ADMIN">운영자</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">취소</button>
                <button class="btn btn-primary" onclick="document.getElementById('addUserForm').submit()">추가하기</button>
            </div>
        </div>
    </div>

    <script>
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.onclick = () => {
                document.getElementById('userModal').classList.remove('active');
            };
        });
    </script>
</body>
</html>

<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RankView | Login</title>
    <!-- CSS Load -->
    <link rel="stylesheet" href="/css/style.css">
    <!-- Font Load -->
    <link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .login-card {
            background: white;
            padding: 48px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
            text-align: center;
        }
        .login-logo {
            font-size: 2.2rem;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }
        .login-subtitle {
            font-size: 0.95rem;
            color: var(--text-muted);
            margin-bottom: 40px;
        }
        .login-form .form-group {
            text-align: left;
            margin-bottom: 24px;
        }
        .login-form input {
            width: 100%;
            padding: 14px 18px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            font-size: 1rem;
            transition: all 0.2s;
        }
        .login-form input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 4px rgba(90,103,216,0.1);
        }
        .btn-login {
            width: 100%;
            padding: 14px;
            border: none;
            background: var(--primary);
            color: white;
            font-weight: 700;
            font-size: 1.1rem;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 10px;
        }
        .btn-login:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(90,103,216,0.3);
        }
        .error-msg {
            background: #fff5f5;
            color: #c53030;
            padding: 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            margin-bottom: 20px;
            border: 1px solid #feb2b2;
        }
        .login-footer {
            margin-top: 32px;
            font-size: 0.85rem;
            color: var(--text-muted);
        }
        .login-footer a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="login-logo">
            <i class="fas fa-rocket"></i> RankView
        </div>
        <p class="login-subtitle">키워드 순위 관리 솔루션의 시작</p>

        <% if (request.getAttribute("error") != null) { %>
            <div class="error-msg">
                <%= request.getAttribute("error") %>
            </div>
        <% } %>

        <form action="/login" method="POST" class="login-form">
            <div class="form-group">
                <label>아이디</label>
                <input type="text" name="username" placeholder="아이디를 입력하세요" required>
            </div>
            <div class="form-group">
                <label>비밀번호</label>
                <input type="password" name="password" placeholder="비밀번호를 입력하세요" required>
            </div>
            <button type="submit" class="btn-login">시작하기</button>
        </form>


    </div>
</body>
</html>

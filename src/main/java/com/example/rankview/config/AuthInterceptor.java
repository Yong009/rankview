package com.example.rankview.config;

import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {
        HttpSession session = request.getSession();

        String path = request.getRequestURI();

        // 정적 리소스나 로그인/로그아웃 페이지는 통과
        if (path.startsWith("/login") || path.startsWith("/logout") || path.startsWith("/css") || path.startsWith("/js")
                || path.startsWith("/images") || path.startsWith("/error")) {
            return true;
        }

        // 로그인 상태 확인
        String user = (String) session.getAttribute("user");
        String role = (String) session.getAttribute("role");

        if (user == null) {
            response.sendRedirect("/login");
            return false;
        }

        // 관리자 전용 경로 보호
        if (path.startsWith("/admin") && !"ADMIN".equals(role)) {
            response.sendRedirect("/");
            return false;
        }

        return true;
    }
}

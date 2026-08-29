package com.alura.finance_ai.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private final int maxRequests;
    private final long windowMillis;
    private final ConcurrentHashMap<String, Window> clients = new ConcurrentHashMap<>();

    public RateLimitFilter(@Value("${rate-limit.max-requests:60}") int maxRequests,
                           @Value("${rate-limit.window-seconds:60}") long windowSeconds) {
        if (maxRequests < 1 || windowSeconds < 1) {
            throw new IllegalArgumentException("Rate-limit values must be positive");
        }
        this.maxRequests = maxRequests;
        this.windowMillis = windowSeconds * 1000L;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!request.getRequestURI().startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String client = SecurityContextHolder.getContext().getAuthentication() != null
                && SecurityContextHolder.getContext().getAuthentication().isAuthenticated()
                ? "authenticated-api-client"
                : request.getRemoteAddr();
        long now = System.currentTimeMillis();
        Window window = clients.compute(client, (key, current) -> {
            if (current == null || now - current.startedAt >= windowMillis) {
                return new Window(now, new AtomicInteger(1));
            }
            current.requests.incrementAndGet();
            return current;
        });

        long remaining = Math.max(0, maxRequests - window.requests.get());
        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
        if (window.requests.get() > maxRequests) {
            long retryAfter = Math.max(1, (window.startedAt + windowMillis - now + 999) / 1000);
            response.setStatus(429); // 429 Too Many Requests
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"retry_after_seconds\":" + retryAfter + "}");
            return;
        }
        filterChain.doFilter(request, response);
    }

    private record Window(long startedAt, AtomicInteger requests) {}
}

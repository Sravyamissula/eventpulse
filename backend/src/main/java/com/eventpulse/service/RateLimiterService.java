package com.eventpulse.service;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * In-memory sliding window rate limiter per webhook endpoint.
 * Prevents overwhelming customer receiving servers beyond their configured rate limits.
 */
@Service
public class RateLimiterService {

    private static class RateWindow {
        long windowStartMinute;
        AtomicInteger count;

        RateWindow(long windowStartMinute) {
            this.windowStartMinute = windowStartMinute;
            this.count = new AtomicInteger(0);
        }
    }

    private final Map<UUID, RateWindow> endpointWindows = new ConcurrentHashMap<>();

    /**
     * Checks if a request can be dispatched to the endpoint without exceeding its rate limit.
     *
     * @param endpointId          UUID of the webhook endpoint
     * @param rateLimitPerMinute  allowed requests per minute
     * @return true if permitted, false if rate limit exceeded
     */
    public boolean tryAcquire(UUID endpointId, int rateLimitPerMinute) {
        if (rateLimitPerMinute <= 0) {
            return true;
        }

        long currentMinute = System.currentTimeMillis() / 60000;

        RateWindow window = endpointWindows.compute(endpointId, (id, existing) -> {
            if (existing == null || existing.windowStartMinute != currentMinute) {
                return new RateWindow(currentMinute);
            }
            return existing;
        });

        int currentCount = window.count.incrementAndGet();
        return currentCount <= rateLimitPerMinute;
    }

    /**
     * Returns remaining requests in the current minute window.
     */
    public int getRemaining(UUID endpointId, int rateLimitPerMinute) {
        long currentMinute = System.currentTimeMillis() / 60000;
        RateWindow window = endpointWindows.get(endpointId);
        if (window == null || window.windowStartMinute != currentMinute) {
            return rateLimitPerMinute;
        }
        int used = window.count.get();
        return Math.max(0, rateLimitPerMinute - used);
    }
}

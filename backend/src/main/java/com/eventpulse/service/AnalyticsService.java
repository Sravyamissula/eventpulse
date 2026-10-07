package com.eventpulse.service;

import com.eventpulse.dto.AnalyticsResponse;
import com.eventpulse.repository.DeadLetterEventRepository;
import com.eventpulse.repository.DeliveryAttemptRepository;
import com.eventpulse.repository.EventDeliveryRepository;
import com.eventpulse.repository.EventRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service calculating real-time analytics, throughput, delivery rates,
 * and latency percentiles (p50, p95, p99) for dashboard metrics.
 */
@Service
public class AnalyticsService {

    private final EventRepository eventRepository;
    private final EventDeliveryRepository deliveryRepository;
    private final DeadLetterEventRepository dlqRepository;
    private final DeliveryAttemptRepository attemptRepository;

    public AnalyticsService(EventRepository eventRepository,
                            EventDeliveryRepository deliveryRepository,
                            DeadLetterEventRepository dlqRepository,
                            DeliveryAttemptRepository attemptRepository) {
        this.eventRepository = eventRepository;
        this.deliveryRepository = deliveryRepository;
        this.dlqRepository = dlqRepository;
        this.attemptRepository = attemptRepository;
    }

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics(UUID organizationId, UUID projectId) {
        AnalyticsResponse response = new AnalyticsResponse();

        long totalEvents = projectId != null ?
                eventRepository.countByProjectId(projectId) :
                eventRepository.countByOrganizationId(organizationId);

        long totalDeliveries = projectId != null ?
                deliveryRepository.countByProjectId(projectId) :
                deliveryRepository.countByOrganizationId(organizationId);

        long successDeliveries = projectId != null ?
                deliveryRepository.countByProjectIdAndStatus(projectId, "SUCCESS") :
                deliveryRepository.countByOrganizationIdAndStatus(organizationId, "SUCCESS");

        long failedDeliveries = projectId != null ?
                deliveryRepository.countByProjectIdAndStatus(projectId, "FAILED") :
                deliveryRepository.countByOrganizationIdAndStatus(organizationId, "FAILED");

        long retryingDeliveries = projectId != null ?
                deliveryRepository.countByProjectIdAndStatus(projectId, "RETRYING") :
                deliveryRepository.countByOrganizationIdAndStatus(organizationId, "RETRYING");

        long dlqCount = projectId != null ?
                dlqRepository.countByProjectId(projectId) :
                dlqRepository.countByOrganizationId(organizationId);

        response.setTotalEvents(totalEvents);
        response.setTotalDeliveries(totalDeliveries);
        response.setSuccessDeliveries(successDeliveries);
        response.setFailedDeliveries(failedDeliveries);
        response.setRetryingDeliveries(retryingDeliveries);
        response.setDlqCount(dlqCount);

        if (totalDeliveries > 0) {
            double successRate = (double) successDeliveries / totalDeliveries * 100.0;
            double failureRate = (double) failedDeliveries / totalDeliveries * 100.0;
            response.setSuccessRatePercent(Math.round(successRate * 10.0) / 10.0);
            response.setFailureRatePercent(Math.round(failureRate * 10.0) / 10.0);
        } else {
            response.setSuccessRatePercent(100.0);
            response.setFailureRatePercent(0.0);
        }

        Map<String, Long> statusBreakdown = new LinkedHashMap<>();
        statusBreakdown.put("SUCCESS", successDeliveries);
        statusBreakdown.put("FAILED", failedDeliveries);
        statusBreakdown.put("RETRYING", retryingDeliveries);
        statusBreakdown.put("PENDING", Math.max(0, totalDeliveries - (successDeliveries + failedDeliveries + retryingDeliveries)));
        response.setStatusBreakdown(statusBreakdown);

        // Calculate latency percentiles
        List<Long> latencies = attemptRepository.findRecentLatenciesByOrganizationId(organizationId)
                .stream()
                .filter(l -> l != null && l >= 0)
                .sorted()
                .collect(Collectors.toList());

        if (!latencies.isEmpty()) {
            double avg = latencies.stream().mapToLong(Long::longValue).average().orElse(0.0);
            response.setAverageLatencyMs(Math.round(avg * 10.0) / 10.0);
            response.setLatencyP50Ms(getPercentile(latencies, 50));
            response.setLatencyP95Ms(getPercentile(latencies, 95));
            response.setLatencyP99Ms(getPercentile(latencies, 99));
        } else {
            response.setAverageLatencyMs(0.0);
            response.setLatencyP50Ms(0L);
            response.setLatencyP95Ms(0L);
            response.setLatencyP99Ms(0L);
        }

        return response;
    }

    private Long getPercentile(List<Long> sortedValues, double percentile) {
        if (sortedValues.isEmpty()) {
            return 0L;
        }
        int index = (int) Math.ceil((percentile / 100.0) * sortedValues.size()) - 1;
        index = Math.max(0, Math.min(index, sortedValues.size() - 1));
        return sortedValues.get(index);
    }
}

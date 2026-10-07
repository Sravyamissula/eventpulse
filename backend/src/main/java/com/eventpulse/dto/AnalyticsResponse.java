package com.eventpulse.dto;

import java.util.Map;

public class AnalyticsResponse {

    private long totalEvents;
    private long totalDeliveries;
    private long successDeliveries;
    private long failedDeliveries;
    private long retryingDeliveries;
    private long dlqCount;
    private double successRatePercent;
    private double failureRatePercent;

    private Long latencyP50Ms;
    private Long latencyP95Ms;
    private Long latencyP99Ms;
    private Double averageLatencyMs;

    private Map<String, Long> statusBreakdown;

    public AnalyticsResponse() {
    }

    public long getTotalEvents() {
        return totalEvents;
    }

    public void setTotalEvents(long totalEvents) {
        this.totalEvents = totalEvents;
    }

    public long getTotalDeliveries() {
        return totalDeliveries;
    }

    public void setTotalDeliveries(long totalDeliveries) {
        this.totalDeliveries = totalDeliveries;
    }

    public long getSuccessDeliveries() {
        return successDeliveries;
    }

    public void setSuccessDeliveries(long successDeliveries) {
        this.successDeliveries = successDeliveries;
    }

    public long getFailedDeliveries() {
        return failedDeliveries;
    }

    public void setFailedDeliveries(long failedDeliveries) {
        this.failedDeliveries = failedDeliveries;
    }

    public long getRetryingDeliveries() {
        return retryingDeliveries;
    }

    public void setRetryingDeliveries(long retryingDeliveries) {
        this.retryingDeliveries = retryingDeliveries;
    }

    public long getDlqCount() {
        return dlqCount;
    }

    public void setDlqCount(long dlqCount) {
        this.dlqCount = dlqCount;
    }

    public double getSuccessRatePercent() {
        return successRatePercent;
    }

    public void setSuccessRatePercent(double successRatePercent) {
        this.successRatePercent = successRatePercent;
    }

    public double getFailureRatePercent() {
        return failureRatePercent;
    }

    public void setFailureRatePercent(double failureRatePercent) {
        this.failureRatePercent = failureRatePercent;
    }

    public Long getLatencyP50Ms() {
        return latencyP50Ms;
    }

    public void setLatencyP50Ms(Long latencyP50Ms) {
        this.latencyP50Ms = latencyP50Ms;
    }

    public Long getLatencyP95Ms() {
        return latencyP95Ms;
    }

    public void setLatencyP95Ms(Long latencyP95Ms) {
        this.latencyP95Ms = latencyP95Ms;
    }

    public Long getLatencyP99Ms() {
        return latencyP99Ms;
    }

    public void setLatencyP99Ms(Long latencyP99Ms) {
        this.latencyP99Ms = latencyP99Ms;
    }

    public Double getAverageLatencyMs() {
        return averageLatencyMs;
    }

    public void setAverageLatencyMs(Double averageLatencyMs) {
        this.averageLatencyMs = averageLatencyMs;
    }

    public Map<String, Long> getStatusBreakdown() {
        return statusBreakdown;
    }

    public void setStatusBreakdown(Map<String, Long> statusBreakdown) {
        this.statusBreakdown = statusBreakdown;
    }
}

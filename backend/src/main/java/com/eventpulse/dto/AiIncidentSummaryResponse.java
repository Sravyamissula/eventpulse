package com.eventpulse.dto;

import java.util.List;

public class AiIncidentSummaryResponse {

    private String incidentTitle;
    private String severity;
    private String impactSummary;
    private List<String> affectedEndpoints;
    private String commonPattern;
    private List<String> recommendations;
    private String circuitBreakerAdvice;

    public AiIncidentSummaryResponse() {
    }

    public AiIncidentSummaryResponse(String incidentTitle, String severity, String impactSummary,
                                    List<String> affectedEndpoints, String commonPattern,
                                    List<String> recommendations, String circuitBreakerAdvice) {
        this.incidentTitle = incidentTitle;
        this.severity = severity;
        this.impactSummary = impactSummary;
        this.affectedEndpoints = affectedEndpoints;
        this.commonPattern = commonPattern;
        this.recommendations = recommendations;
        this.circuitBreakerAdvice = circuitBreakerAdvice;
    }

    public String getIncidentTitle() {
        return incidentTitle;
    }

    public void setIncidentTitle(String incidentTitle) {
        this.incidentTitle = incidentTitle;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getImpactSummary() {
        return impactSummary;
    }

    public void setImpactSummary(String impactSummary) {
        this.impactSummary = impactSummary;
    }

    public List<String> getAffectedEndpoints() {
        return affectedEndpoints;
    }

    public void setAffectedEndpoints(List<String> affectedEndpoints) {
        this.affectedEndpoints = affectedEndpoints;
    }

    public String getCommonPattern() {
        return commonPattern;
    }

    public void setCommonPattern(String commonPattern) {
        this.commonPattern = commonPattern;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public String getCircuitBreakerAdvice() {
        return circuitBreakerAdvice;
    }

    public void setCircuitBreakerAdvice(String circuitBreakerAdvice) {
        this.circuitBreakerAdvice = circuitBreakerAdvice;
    }
}

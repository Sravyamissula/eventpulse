package com.eventpulse.dto;

import java.util.List;

public class AiAnalysisResponse {

    private String deliveryId;
    private String rootCauseCategory;
    private double confidenceScore;
    private String explanation;
    private List<String> suggestedRemediation;
    private boolean retryable;
    private String recommendedAction;

    public AiAnalysisResponse() {
    }

    public AiAnalysisResponse(String deliveryId, String rootCauseCategory, double confidenceScore,
                              String explanation, List<String> suggestedRemediation,
                              boolean retryable, String recommendedAction) {
        this.deliveryId = deliveryId;
        this.rootCauseCategory = rootCauseCategory;
        this.confidenceScore = confidenceScore;
        this.explanation = explanation;
        this.suggestedRemediation = suggestedRemediation;
        this.retryable = retryable;
        this.recommendedAction = recommendedAction;
    }

    public String getDeliveryId() {
        return deliveryId;
    }

    public void setDeliveryId(String deliveryId) {
        this.deliveryId = deliveryId;
    }

    public String getRootCauseCategory() {
        return rootCauseCategory;
    }

    public void setRootCauseCategory(String rootCauseCategory) {
        this.rootCauseCategory = rootCauseCategory;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<String> getSuggestedRemediation() {
        return suggestedRemediation;
    }

    public void setSuggestedRemediation(List<String> suggestedRemediation) {
        this.suggestedRemediation = suggestedRemediation;
    }

    public boolean isRetryable() {
        return retryable;
    }

    public void setRetryable(boolean retryable) {
        this.retryable = retryable;
    }

    public String getRecommendedAction() {
        return recommendedAction;
    }

    public void setRecommendedAction(String recommendedAction) {
        this.recommendedAction = recommendedAction;
    }
}

package com.eventpulse.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class WebhookEndpointRequest {

    @NotBlank(message = "Endpoint name is required")
    @Size(max = 255, message = "Name cannot exceed 255 characters")
    private String name;

    @NotBlank(message = "URL is required")
    @Size(max = 1024, message = "URL cannot exceed 1024 characters")
    @Pattern(regexp = "^https?://.*", message = "URL must start with http:// or https://")
    private String url;

    @Size(max = 255, message = "Secret token cannot exceed 255 characters")
    private String secretToken;

    @Min(value = 1, message = "Rate limit per minute must be at least 1")
    @Max(value = 10000, message = "Rate limit per minute cannot exceed 10000")
    private int rateLimitPerMinute = 60;

    public WebhookEndpointRequest() {
    }

    public WebhookEndpointRequest(String name, String url) {
        this.name = name;
        this.url = url;
    }

    public WebhookEndpointRequest(String name, String url, String secretToken, int rateLimitPerMinute) {
        this.name = name;
        this.url = url;
        this.secretToken = secretToken;
        this.rateLimitPerMinute = rateLimitPerMinute;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getSecretToken() {
        return secretToken;
    }

    public void setSecretToken(String secretToken) {
        this.secretToken = secretToken;
    }

    public int getRateLimitPerMinute() {
        return rateLimitPerMinute;
    }

    public void setRateLimitPerMinute(int rateLimitPerMinute) {
        this.rateLimitPerMinute = rateLimitPerMinute;
    }
}

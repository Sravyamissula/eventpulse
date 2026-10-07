package com.eventpulse.dto;

/**
 * Data transfer object returned upon successful authentication.
 * Delivers the signed JWT access token and expiration details.
 */
public class LoginResponse {

    private String accessToken;
    private String tokenType = "Bearer";
    private long expiresIn;

    public LoginResponse() {
    }

    public LoginResponse(String accessToken, String tokenType, long expiresIn) {
        this.accessToken = accessToken;
        this.tokenType = tokenType != null ? tokenType : "Bearer";
        this.expiresIn = expiresIn;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getTokenType() {
        return tokenType;
    }

    public void setTokenType(String tokenType) {
        this.tokenType = tokenType;
    }

    public long getExpiresIn() {
        return expiresIn;
    }

    public void setExpiresIn(long expiresIn) {
        this.expiresIn = expiresIn;
    }

    @Override
    public String toString() {
        return "LoginResponse{" +
                "tokenType='" + tokenType + '\'' +
                ", expiresIn=" + expiresIn +
                ", accessToken='[PROTECTED]'" +
                '}';
    }
}

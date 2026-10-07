package com.eventpulse.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/**
 * Service for computing and verifying HMAC-SHA256 webhook signatures.
 * Follows industry standard signature format (similar to Stripe/GitHub):
 * Header: X-EventPulse-Signature: t=1710000000,v1=abcdef...
 */
@Service
public class WebhookSignatureService {

    private static final String HMAC_SHA256 = "HmacSHA256";

    /**
     * Computes signature header value for a webhook payload.
     *
     * @param payload     the raw JSON payload string
     * @param secretToken endpoint secret token
     * @param timestamp   epoch seconds timestamp
     * @return header string formatted as t={timestamp},v1={hexSignature}
     */
    public String generateSignatureHeader(String payload, String secretToken, long timestamp) {
        String signedPayload = timestamp + "." + payload;
        String signature = computeHmacSha256(signedPayload, secretToken);
        return "t=" + timestamp + ",v1=" + signature;
    }

    /**
     * Computes raw HMAC-SHA256 hex string.
     */
    public String computeHmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256);
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(rawHmac);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to calculate HMAC-SHA256 signature", e);
        }
    }

    /**
     * Verifies whether an incoming signature matches expected payload and secret.
     */
    public boolean verifySignature(String payload, String secretToken, String header) {
        if (header == null || !header.contains("t=") || !header.contains("v1=")) {
            return false;
        }

        try {
            String[] parts = header.split(",");
            long timestamp = 0;
            String expectedHash = null;

            for (String part : parts) {
                if (part.startsWith("t=")) {
                    timestamp = Long.parseLong(part.substring(2));
                } else if (part.startsWith("v1=")) {
                    expectedHash = part.substring(3);
                }
            }

            if (timestamp == 0 || expectedHash == null) {
                return false;
            }

            String signedPayload = timestamp + "." + payload;
            String actualHash = computeHmacSha256(signedPayload, secretToken);
            return actualHash.equalsIgnoreCase(expectedHash);
        } catch (Exception e) {
            return false;
        }
    }
}

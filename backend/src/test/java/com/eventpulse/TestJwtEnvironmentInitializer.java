package com.eventpulse;

import org.springframework.boot.test.util.TestPropertyValues;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Initializes a secure, ephemeral 256-bit JWT test secret for test executions
 * if EVENTPULSE_JWT_SECRET is not already set in the environment.
 * Ensures tests never fail due to a missing secret while preventing any secret
 * from being committed to Git or hardcoded in configuration files.
 */
public class TestJwtEnvironmentInitializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        String existingSecret = applicationContext.getEnvironment().getProperty("EVENTPULSE_JWT_SECRET");
        if (existingSecret == null || existingSecret.isBlank()) {
            byte[] keyBytes = new byte[32];
            new SecureRandom().nextBytes(keyBytes);
            String testSecret = Base64.getEncoder().encodeToString(keyBytes);
            TestPropertyValues.of(
                    "EVENTPULSE_JWT_SECRET=" + testSecret,
                    "eventpulse.jwt.secret=" + testSecret
            ).applyTo(applicationContext.getEnvironment());
        }
    }
}

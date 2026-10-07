package com.eventpulse.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(SecurityConfigTest.TestSecureController.class)
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Minimal test-only controller used strictly to verify that application endpoints
     * enforce authentication rules without adding dummy endpoints to production code.
     */
    @RestController
    @RequestMapping("/api/test-secure")
    static class TestSecureController {
        @GetMapping
        public String secureEndpoint() {
            return "secure-payload";
        }
    }

    @Test
    @DisplayName("Application context and security configuration should load successfully")
    void contextAndSecurityConfigLoad() {
        assertThat(applicationContext.getBean(SecurityConfig.class)).isNotNull();
        assertThat(applicationContext.getBean(SecurityFilterChain.class)).isNotNull();
    }

    @Test
    @DisplayName("PasswordEncoder bean must exist and use BCrypt")
    void passwordEncoderBeanExistsAndUsesBCrypt() {
        assertThat(passwordEncoder).isNotNull();
        assertThat(passwordEncoder).isInstanceOf(BCryptPasswordEncoder.class);

        String rawPassword = "TestP@ssword123!";
        String encoded = passwordEncoder.encode(rawPassword);

        // BCrypt standard hash format check: starts with $2a$ or $2b$
        assertThat(encoded).matches("^\\$2[ab]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
        assertThat(passwordEncoder.matches(rawPassword, encoded)).isTrue();
        assertThat(passwordEncoder.matches("WrongPassword", encoded)).isFalse();
    }

    @Test
    @DisplayName("Actuator health endpoint should be publicly accessible without authentication")
    void actuatorHealthIsPubliclyAccessible() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sensitive actuator endpoints like /actuator/info should require authentication")
    void sensitiveActuatorEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Application API endpoint should reject unauthenticated requests with 401 Unauthorized")
    void unauthenticatedApiRequestReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/test-secure"))
                .andExpect(status().isUnauthorized())
                // Ensure no HTTP Basic auth challenge header is sent
                .andExpect(header().doesNotExist("WWW-Authenticate"));
    }

    @Test
    @DisplayName("Application API endpoint should succeed when request is authenticated")
    @WithMockUser(username = "test-user")
    void authenticatedApiRequestSucceeds() throws Exception {
        mockMvc.perform(get("/api/test-secure"))
                .andExpect(status().isOk())
                .andExpect(content().string("secure-payload"));
    }

    @Test
    @DisplayName("No HTML form login or default login redirect should exist")
    void noFormLoginOrRedirect() throws Exception {
        // Without form login, hitting /login returns 401 (stateless protected), not 200 or 302
        mockMvc.perform(get("/login"))
                .andExpect(status().isUnauthorized());
    }
}

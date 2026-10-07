package com.eventpulse.service;

import com.eventpulse.dto.RegisterRequest;
import com.eventpulse.entity.User;
import com.eventpulse.repository.OrganizationRepository;
import com.eventpulse.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest
class AuthServiceTransactionTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private OrganizationRepository organizationRepository;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @DisplayName("Should roll back organization persistence if user creation fails")
    void testRegistrationRollbackWhenUserSaveFails() {
        when(userRepository.existsByOrganizationIdAndEmail(any(), any())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenThrow(new RuntimeException("Simulated database failure during user creation"));

        String uniqueOrgName = "Rollback Target Org";
        RegisterRequest request = new RegisterRequest(uniqueOrgName, "rollback@target.com", "Password123!");

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Simulated database failure during user creation");

        // Verify that the organization was rolled back and is NOT present in the database
        assertThat(organizationRepository.findByName(uniqueOrgName)).isEmpty();
    }
}

package com.eventpulse.service;

import com.eventpulse.dto.LoginRequest;
import com.eventpulse.dto.LoginResponse;
import com.eventpulse.dto.RegisterRequest;
import com.eventpulse.dto.RegisterResponse;
import com.eventpulse.entity.Organization;
import com.eventpulse.entity.User;
import com.eventpulse.exception.DuplicateResourceException;
import com.eventpulse.repository.OrganizationRepository;
import com.eventpulse.repository.UserRepository;
import com.eventpulse.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

/**
 * Service orchestrating user, organization registration, and authentication flows.
 * Enforces atomic transactions, password hashing, email normalization,
 * tenant uniqueness constraints, and JWT generation.
 */
@Service
public class AuthService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(OrganizationRepository organizationRepository,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Registers a new organization and its initial administrative user atomically.
     *
     * @param request validated registration payload
     * @return safe registration response containing non-sensitive details
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Registration request cannot be null");
        }

        String orgName = request.getOrganizationName() != null ? request.getOrganizationName().trim() : "";
        String rawEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String normalizedEmail = rawEmail.toLowerCase(Locale.ROOT);
        String rawPassword = request.getPassword();

        if (orgName.isEmpty()) {
            throw new IllegalArgumentException("Organization name cannot be empty");
        }
        if (normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        // 1. Create and persist the Organization
        Organization organization = new Organization(orgName);
        Organization savedOrg = organizationRepository.save(organization);

        // 2. Check tenant uniqueness constraint (defense-in-depth)
        if (userRepository.existsByOrganizationIdAndEmail(savedOrg.getId(), normalizedEmail)) {
            throw new DuplicateResourceException("User with email " + normalizedEmail + " already exists in this organization");
        }

        // 3. Securely hash password with BCrypt
        String passwordHash = passwordEncoder.encode(rawPassword);

        // 4. Create and persist the initial User linked to the organization
        User user = new User(savedOrg.getId(), normalizedEmail, passwordHash);
        User savedUser = userRepository.save(user);

        // 5. Construct and return safe DTO (no password or hash returned)
        return new RegisterResponse(
                savedOrg.getId(),
                savedOrg.getName(),
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getCreatedAt()
        );
    }

    /**
     * Creates a user in an existing organization, enforcing tenant-scoped email uniqueness.
     *
     * @param organizationId tenant organization UUID
     * @param email user email address
     * @param rawPassword user raw password
     * @return persisted User entity
     */
    @Transactional
    public User registerUserInOrganization(UUID organizationId, String email, String rawPassword) {
        if (organizationId == null) {
            throw new IllegalArgumentException("Organization ID cannot be null");
        }
        String normalizedEmail = email != null ? email.trim().toLowerCase(Locale.ROOT) : "";
        if (normalizedEmail.isEmpty()) {
            throw new IllegalArgumentException("Email cannot be empty");
        }
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters");
        }

        if (userRepository.existsByOrganizationIdAndEmail(organizationId, normalizedEmail)) {
            throw new DuplicateResourceException("User with email " + normalizedEmail + " already exists in this organization");
        }

        String passwordHash = passwordEncoder.encode(rawPassword);
        User user = new User(organizationId, normalizedEmail, passwordHash);
        return userRepository.save(user);
    }

    /**
     * Authenticates an existing user within an organization and issues a signed JWT access token.
     *
     * @param request login payload containing organizationId, email, and password
     * @return login response containing Bearer access token and expiration
     * @throws BadCredentialsException if credentials, organization, or user are invalid
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        if (request == null) {
            throw new BadCredentialsException("Invalid credentials");
        }

        UUID organizationId = request.getOrganizationId();
        String rawEmail = request.getEmail() != null ? request.getEmail().trim() : "";
        String normalizedEmail = rawEmail.toLowerCase(Locale.ROOT);
        String rawPassword = request.getPassword();

        if (organizationId == null || normalizedEmail.isEmpty() || rawPassword == null) {
            throw new BadCredentialsException("Invalid credentials");
        }

        User user = userRepository.findByOrganizationIdAndEmail(organizationId, normalizedEmail)
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        String accessToken = jwtService.generateToken(user);
        return new LoginResponse(accessToken, "Bearer", jwtService.getExpirationSeconds());
    }
}

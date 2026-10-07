package com.eventpulse.security;

import com.eventpulse.dto.ErrorResponse;
import com.eventpulse.entity.ApiKey;
import com.eventpulse.service.ApiKeyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

/**
 * Filter that authenticates requests using X-API-Key header.
 * Ideal for machine-to-machine ingestion endpoints like /api/v1/events.
 */
@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiKeyAuthenticationFilter.class);
    public static final String API_KEY_HEADER = "X-API-Key";

    private final ApiKeyService apiKeyService;
    private final ObjectMapper objectMapper;

    public ApiKeyAuthenticationFilter(ApiKeyService apiKeyService, ObjectMapper objectMapper) {
        this.apiKeyService = apiKeyService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String apiKeyHeader = request.getHeader(API_KEY_HEADER);

        if (apiKeyHeader != null && !apiKeyHeader.isBlank()) {
            Optional<ApiKey> apiKeyOpt = apiKeyService.authenticateApiKey(apiKeyHeader);
            if (apiKeyOpt.isPresent()) {
                ApiKey apiKey = apiKeyOpt.get();
                ApiKeyPrincipal principal = new ApiKeyPrincipal(
                        apiKey.getOrganizationId(),
                        apiKey.getProjectId(),
                        apiKey.getId(),
                        apiKey.getKeyPrefix()
                );

                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT"))
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                log.warn("Invalid or expired API Key provided for request {}", request.getRequestURI());
                sendUnauthorizedError(response, "Invalid or expired API key");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorizedError(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse errorResponse = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                HttpStatus.UNAUTHORIZED.getReasonPhrase(),
                message
        );
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}

package com.eventpulse.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.UUID;

/**
 * Filter inspecting HTTP requests for JWT Bearer tokens in the Authorization header.
 * Validates the token signature, expiration, and claims, populating the SecurityContext
 * with a multi-tenant UserPrincipal upon successful validation.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        if (token.isEmpty()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Claims claims = jwtService.validateAndExtractClaims(token);
            String subject = claims.getSubject();
            String orgIdStr = claims.get("organization_id", String.class);
            String email = claims.get("email", String.class);

            if (subject != null && orgIdStr != null && email != null) {
                UUID userId = UUID.fromString(subject);
                UUID organizationId = UUID.fromString(orgIdStr);

                UserPrincipal principal = new UserPrincipal(userId, organizationId, email);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(principal, null, Collections.emptyList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            // Clear any lingering authentication on validation/parsing failure
            SecurityContextHolder.clearContext();
            // Do not leak internal JWT parsing or cryptographic error details to the response
        }

        filterChain.doFilter(request, response);
    }
}

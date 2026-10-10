package com.manabandhu.backend.auth;

import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

/**
 * The verified caller of a request. Identity always comes from the JWT subject, never from client input.
 * Services take an {@code Actor} so REST and GraphQL share one authorization path.
 */
public record Actor(UUID id, boolean admin, boolean superAdmin, String verifiedGender) {

    private static final Set<String> ADMIN_ROLES = Set.of("ROLE_ADMIN", "ROLE_SUPER_ADMIN");

    public Actor(UUID id, boolean admin, boolean superAdmin) {
        this(id, admin, superAdmin, null);
    }

    /** Resolves the caller or fails with 401 when the request is anonymous. */
    public static Actor require(Authentication authentication) {
        return from(authentication).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required"));
    }

    /** Resolves the caller when present; anonymous requests yield an empty result. */
    public static Optional<Actor> from(Authentication authentication) {
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken
                || authentication.getName() == null) {
            return Optional.empty();
        }
        UUID id;
        try {
            id = UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token subject is not a user id");
        }
        var authorities = authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
        var admin = authorities.stream().anyMatch(ADMIN_ROLES::contains);
        var superAdmin = authorities.contains("ROLE_SUPER_ADMIN");
        return Optional.of(new Actor(id, admin, superAdmin, verifiedGender(authentication)));
    }

    /**
     * Gender from the token's {@code app_metadata.gender}, lowercased. {@code app_metadata} is writable only with
     * the service role, so users cannot set it themselves ({@code user_metadata} would be self-declared).
     */
    private static String verifiedGender(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken token)) return null;
        var metadata = token.getToken().getClaimAsMap("app_metadata");
        if (metadata == null || !(metadata.get("gender") instanceof String gender) || gender.isBlank()) return null;
        return gender.trim().toLowerCase(Locale.ROOT);
    }

    public boolean is(UUID userId) {
        return id.equals(userId);
    }

    /** Passes when the caller is the owner or an admin; otherwise 403. */
    public void requireOwner(UUID ownerId, String message) {
        if (!admin && !id.equals(ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
    }

    /** Passes when the caller is one of the given users or an admin; otherwise 403. */
    public void requireAnyOf(String message, UUID... userIds) {
        if (admin) return;
        for (var userId : userIds) {
            if (id.equals(userId)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
    }

    public void requireAdmin() {
        if (!admin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }
}

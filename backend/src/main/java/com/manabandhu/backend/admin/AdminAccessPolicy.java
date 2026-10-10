package com.manabandhu.backend.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
class AdminAccessPolicy {

    private final boolean publicAccessEnabled;

    AdminAccessPolicy(@Value("${app.admin.public-access-enabled:false}") boolean publicAccessEnabled,
                      @Value("${app.supabase.jwt.issuer:}") String jwtIssuer) {
        if (publicAccessEnabled && !isLocalIssuer(jwtIssuer)) {
            // Fail startup rather than serve the admin surface without a login against real users.
            throw new IllegalStateException(
                    "ADMIN_PUBLIC_ACCESS_ENABLED is only allowed with a local auth issuer (localhost); unset it for deployed environments");
        }
        this.publicAccessEnabled = publicAccessEnabled;
    }

    /** The public demo override is limited to the local auth stub, so it can never reach the hosted user base. */
    static boolean isLocalIssuer(String issuer) {
        if (issuer == null || issuer.isBlank()) return false;
        try {
            var host = java.net.URI.create(issuer.trim()).getHost();
            return "localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host) || "::1".equals(host) || "[::1]".equals(host);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    void require(Authentication authentication) {
        if (publicAccessEnabled || hasAdminRole(authentication)) return;
        throw new AccessDeniedException("SUPER_ADMIN or ADMIN role is required");
    }

    String actorId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) return authentication.getName();
        return "public-demo";
    }

    private static boolean hasAdminRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        return authentication.getAuthorities().stream()
                .anyMatch((authority) -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority())
                        || "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}

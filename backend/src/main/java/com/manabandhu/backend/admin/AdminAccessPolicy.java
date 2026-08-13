package com.manabandhu.backend.admin;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
class AdminAccessPolicy {

    private final boolean publicAccessEnabled;

    AdminAccessPolicy(@Value("${app.admin.public-access-enabled:false}") boolean publicAccessEnabled) {
        this.publicAccessEnabled = publicAccessEnabled;
    }

    void require(Authentication authentication) {
        if (publicAccessEnabled || hasSuperAdminRole(authentication)) return;
        throw new AccessDeniedException("SUPER_ADMIN role is required");
    }

    String actorId(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated()) return authentication.getName();
        return "public-demo";
    }

    private static boolean hasSuperAdminRole(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        return authentication.getAuthorities().stream()
                .anyMatch((authority) -> "ROLE_SUPER_ADMIN".equals(authority.getAuthority()));
    }
}

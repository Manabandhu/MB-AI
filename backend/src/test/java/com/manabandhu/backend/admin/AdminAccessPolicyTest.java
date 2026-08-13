package com.manabandhu.backend.admin;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class AdminAccessPolicyTest {

    @Test
    void publicOverrideAllowsAnonymousAccess() {
        var policy = new AdminAccessPolicy(true);

        assertDoesNotThrow(() -> policy.require(null));
        assertEquals("public-demo", policy.actorId(null));
    }

    @Test
    void protectedModeRequiresSuperAdminRole() {
        var policy = new AdminAccessPolicy(false);
        var user = new UsernamePasswordAuthenticationToken("user-1", "n/a", List.of());
        var superAdmin = new UsernamePasswordAuthenticationToken(
                "admin-1", "n/a", List.of(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN")));

        assertThrows(AccessDeniedException.class, () -> policy.require(null));
        assertThrows(AccessDeniedException.class, () -> policy.require(user));
        assertDoesNotThrow(() -> policy.require(superAdmin));
        assertEquals("admin-1", policy.actorId(superAdmin));
    }
}

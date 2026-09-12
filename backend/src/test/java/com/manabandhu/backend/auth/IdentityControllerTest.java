package com.manabandhu.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

class IdentityControllerTest {

    private final IdentityController controller = new IdentityController();

    private static Authentication authWith(Jwt jwt) {
        return new AbstractAuthenticationToken(List.of()) {
            @Override
            public Object getCredentials() {
                return null;
            }
            @Override
            public Object getPrincipal() {
                return jwt;
            }
            @Override
            public String getName() {
                return jwt.getSubject();
            }
        };
    }

    private static Jwt jwtWith(Map<String, Object> claims) {
        return new Jwt(
                "test-token",
                Instant.now(),
                Instant.now().plusSeconds(3600),
                Map.of("alg", "RS256", "typ", "JWT"),
                claims);
    }

    @Test
    void returnsIdentityFromVerifiedJwtClaims() {
        var jwt = jwtWith(Map.of(
                "sub", "user-123",
                "email", "test@example.com",
                "user_metadata", Map.of("full_name", "Test User"),
                "app_metadata", Map.of("roles", List.of("user", "community_manager"))));

        var result = controller.me(authWith(jwt));

        assertThat(result.id()).isEqualTo("user-123");
        assertThat(result.email()).isEqualTo("test@example.com");
        assertThat(result.fullName()).isEqualTo("Test User");
        assertThat(result.role()).isEqualTo("USER");
    }

    @Test
    void missingEmailClaimReturnsNull() {
        var jwt = jwtWith(Map.of(
                "sub", "user-456",
                "app_metadata", Map.of("roles", List.of("user"))));

        var result = controller.me(authWith(jwt));

        assertThat(result.email()).isNull();
    }

    @Test
    void missingUserMetadataReturnsNullFullName() {
        var jwt = jwtWith(Map.of(
                "sub", "user-789",
                "email", "user@example.com",
                "app_metadata", Map.of("roles", List.of("user"))));

        var result = controller.me(authWith(jwt));

        assertThat(result.fullName()).isNull();
    }

    @Test
    void missingAppMetadataDefaultsToUserRole() {
        var jwt = jwtWith(Map.of(
                "sub", "user-no-meta",
                "email", "a@example.com"));

        var result = controller.me(authWith(jwt));

        assertThat(result.role()).isEqualTo("user");
    }

    @Test
    void emptyAppMetadataRolesDefaultsToUserRole() {
        var jwt = jwtWith(Map.of(
                "sub", "user-no-roles",
                "email", "b@example.com",
                "app_metadata", Map.of()));

        var result = controller.me(authWith(jwt));

        assertThat(result.role()).isEqualTo("user");
    }

    @Test
    void userMetadataCannotGrantAdminRole() {
        var jwt = jwtWith(Map.of(
                "sub", "user-trusted",
                "email", "trusted@example.com",
                "user_metadata", Map.of("roles", List.of("admin"), "full_name", "Trusted User"),
                "app_metadata", Map.of("roles", List.of("user"))));

        var result = controller.me(authWith(jwt));

        assertThat(result.role()).isEqualTo("USER");
        assertThat(result.fullName()).isEqualTo("Trusted User");
    }

    @Test
    void nullAuthenticationThrows() {
        assertThatThrownBy(() -> controller.me(null))
                .isInstanceOf(NullPointerException.class);
    }
}

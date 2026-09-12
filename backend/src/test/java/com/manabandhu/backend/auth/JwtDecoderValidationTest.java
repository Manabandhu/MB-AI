package com.manabandhu.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.JwtValidationException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import com.nimbusds.jose.jwk.RSAKey;

class JwtDecoderValidationTest {

    private static RSAKey signingKey;
    private static NimbusJwtDecoder decoder;

    @BeforeAll
    static void setUp() throws Exception {
        signingKey = TestJwt.generateRsaKey();
        var validators = List.<OAuth2TokenValidator<Jwt>>of(
                new JwtTimestampValidator(),
                new JwtIssuerValidator("https://test.supabase.co/auth/v1"),
                new JwtAudienceValidator("authenticated"));
        decoder = NimbusJwtDecoder.withPublicKey(signingKey.toRSAPublicKey())
                .signatureAlgorithm(SignatureAlgorithm.RS256)
                .build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validators));
    }

    private static Jwt decode(String token) {
        return decoder.decode(token);
    }

    @Test
    void validTokenPassesValidation() throws Exception {
        var token = TestJwt.sign(signingKey, TestJwt.validClaims(
                "user-123", "test@example.com", "Test User"));
        assertThatCode(() -> decode(token)).doesNotThrowAnyException();
    }

    @Test
    void expiredTokenIsRejected() throws Exception {
        var token = TestJwt.sign(signingKey, TestJwt.expiredClaims());
        assertThatThrownBy(() -> decode(token)).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void wrongIssuerIsRejected() throws Exception {
        var token = TestJwt.sign(signingKey, TestJwt.wrongIssuerClaims());
        assertThatThrownBy(() -> decode(token)).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void wrongAudienceIsRejected() throws Exception {
        var token = TestJwt.sign(signingKey, TestJwt.wrongAudienceClaims());
        assertThatThrownBy(() -> decode(token)).isInstanceOf(JwtValidationException.class);
    }

    @Test
    void unsignedTokenIsRejected() {
        assertThatThrownBy(() -> decode("not-a-jwt")).isInstanceOf(JwtException.class);
    }

    @Test
    void untrustedMetadataCannotGrantAdminRole() throws Exception {
        var claims = new java.util.HashMap<String, Object>(TestJwt.validClaims(
                "user-trusted", "trusted@example.com", "Trusted User"));
        claims.put("user_metadata", Map.of(
                "full_name", "Trusted User",
                "roles", List.of("admin")));
        var token = TestJwt.sign(signingKey, claims);

        var jwt = decode(token);
        var controller = new IdentityController();
        var auth = new JwtAuthenticationToken(jwt);
        var identity = controller.me(auth);

        assertThat(identity.role()).isEqualTo("USER");
    }

    @Test
    void tokenWithTrustedAdminRoleIsAdmin() throws Exception {
        var claims = new java.util.HashMap<String, Object>(TestJwt.validClaims(
                "admin-123", "admin@example.com", "Admin User"));
        claims.put("app_metadata", Map.of("roles", List.of("admin")));
        var token = TestJwt.sign(signingKey, claims);

        var jwt = decode(token);
        var controller = new IdentityController();
        var auth = new JwtAuthenticationToken(jwt);
        var identity = controller.me(auth);

        assertThat(identity.role()).isEqualTo("ADMIN");
    }
}

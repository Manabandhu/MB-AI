package com.manabandhu.backend.auth;

import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Map;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.gen.RSAKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;

public final class TestJwt {

    private TestJwt() {
    }

    public static RSAKey generateRsaKey() throws Exception {
        return new RSAKeyGenerator(2048)
                .keyID("test-key")
                .generate();
    }

    public static String sign(RSAKey privateKey, Map<String, Object> claims) throws Exception {
        var signer = new RSASSASigner(privateKey);
        var builder = new JWTClaimsSet.Builder();
        for (var entry : claims.entrySet()) {
            builder.claim(entry.getKey(), entry.getValue());
        }
        var claimsSet = builder.build();
        var header = new JWSHeader.Builder(JWSAlgorithm.RS256)
                .type(JOSEObjectType.JWT)
                .keyID(privateKey.getKeyID())
                .build();
        var signed = new JWSObject(header, new Payload(claimsSet.toJSONObject()));
        signed.sign(signer);
        return signed.serialize();
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> validClaims(String subject, String email, String fullName) {
        return Map.of(
                "sub", subject,
                "email", email,
                "email_confirmed_at", Date.from(Instant.now()).toString(),
                "user_metadata", Map.of("full_name", fullName),
                "app_metadata", Map.of("roles", List.of("user")),
                "iss", "https://test.supabase.co/auth/v1",
                "aud", List.of("authenticated"),
                "iat", Date.from(Instant.now()),
                "exp", Date.from(Instant.now().plusSeconds(3600)));
    }

    public static Map<String, Object> expiredClaims() {
        return Map.of(
                "sub", "user-expired",
                "email", "expired@example.com",
                "app_metadata", Map.of("roles", List.of("user")),
                "iss", "https://test.supabase.co/auth/v1",
                "aud", List.of("authenticated"),
                "iat", Date.from(Instant.now().minusSeconds(7200)),
                "exp", Date.from(Instant.now().minusSeconds(3600)));
    }

    public static Map<String, Object> wrongIssuerClaims() {
        return Map.of(
                "sub", "user-wrong-iss",
                "email", "wrong@example.com",
                "app_metadata", Map.of("roles", List.of("user")),
                "iss", "https://evil.example.com/auth/v1",
                "aud", List.of("authenticated"),
                "iat", Date.from(Instant.now()),
                "exp", Date.from(Instant.now().plusSeconds(3600)));
    }

    public static Map<String, Object> wrongAudienceClaims() {
        return Map.of(
                "sub", "user-wrong-aud",
                "email", "wrong-aud@example.com",
                "app_metadata", Map.of("roles", List.of("user")),
                "iss", "https://test.supabase.co/auth/v1",
                "aud", List.of("other-audience"),
                "iat", Date.from(Instant.now()),
                "exp", Date.from(Instant.now().plusSeconds(3600)));
    }
}

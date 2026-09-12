package com.manabandhu.backend.auth;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = IdentityController.class, properties = {
        "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=",
        "app.supabase.jwt.issuer=https://test.supabase.co/auth/v1",
        "app.supabase.jwt.audience=authenticated",
        "app.cors.allowed-origins=http://localhost:19006"
})
@Import(com.manabandhu.backend.config.SecurityConfig.class)
class IdentityEndpointWebTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private Jwt validJwt() {
        return new Jwt(
                "test-token",
                Instant.now(),
                Instant.now().plus(1, ChronoUnit.HOURS),
                Map.of("alg", "RS256", "typ", "JWT"),
                Map.of(
                        "sub", "user-123",
                        "email", "test@example.com",
                        "user_metadata", Map.of("full_name", "Test User"),
                        "app_metadata", Map.of("roles", List.of("user"))));
    }

    @Test
    void validTokenReturnsIdentity() throws Exception {
        when(jwtDecoder.decode(any())).thenReturn(validJwt());

        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-123"))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.fullName").value("Test User"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void missingTokenIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedTokenIsUnauthorized() throws Exception {
        when(jwtDecoder.decode(any())).thenThrow(new BadJwtException("malformed"));

        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer not-a-valid-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void decoderFailureIsUnauthorized() throws Exception {
        when(jwtDecoder.decode(any())).thenThrow(new BadJwtException("expired"));

        mockMvc.perform(get("/api/v1/me")
                        .header("Authorization", "Bearer expired-token"))
                .andExpect(status().isUnauthorized());
    }
}

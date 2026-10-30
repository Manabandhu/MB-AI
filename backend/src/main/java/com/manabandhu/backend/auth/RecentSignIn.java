package com.manabandhu.backend.auth;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * When the caller last proved who they are. Supabase puts each sign-in method with its timestamp in the token's
 * {@code amr} claim and keeps it across refreshes, so it reflects a real sign-in, not the latest token refresh.
 */
public final class RecentSignIn {

    private RecentSignIn() {}

    /** The newest sign-in time in the token, or {@code null} when the token carries none. */
    public static Instant of(Authentication authentication) {
        if (!(authentication instanceof JwtAuthenticationToken token)) return null;
        var amr = token.getToken().getClaim("amr");
        if (!(amr instanceof List<?> entries)) return null;
        Instant newest = null;
        for (var entry : entries) {
            if (entry instanceof Map<?, ?> map && map.get("timestamp") instanceof Number seconds) {
                var at = Instant.ofEpochSecond(seconds.longValue());
                if (newest == null || at.isAfter(newest)) newest = at;
            }
        }
        return newest;
    }
}

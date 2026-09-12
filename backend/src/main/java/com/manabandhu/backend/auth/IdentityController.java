package com.manabandhu.backend.auth;

import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class IdentityController {

    @GetMapping("/me")
    IdentityResponse me(Authentication authentication) {
        var jwt = (Jwt) authentication.getPrincipal();

        var id = jwt.getClaimAsString("sub");
        var email = jwt.getClaimAsString("email");
        var fullName = claimAsString(jwt, "user_metadata", "full_name");

        var role = primaryRole(jwt);

        return new IdentityResponse(id, email, fullName, role);
    }

    private static String claimAsString(Jwt jwt, String... path) {
        Object node = jwt.getClaims();
        for (String key : path) {
            if (node instanceof Map<?, ?> map) {
                node = map.get(key);
            } else {
                return null;
            }
        }
        return node instanceof String str ? str : null;
    }

    @SuppressWarnings("unchecked")
    private static String primaryRole(Jwt jwt) {
        var appMetadata = jwt.getClaimAsMap("app_metadata");
        if (appMetadata == null) {
            return "user";
        }
        var rolesValue = appMetadata.get("roles");
        List<String> roles;
        if (rolesValue instanceof List<?> raw) {
            roles = raw.stream().map(Object::toString).toList();
        } else if (rolesValue instanceof String str && !str.isBlank()) {
            roles = List.of(str);
        } else {
            roles = List.of();
        }
        return roles.isEmpty() ? "user" : roles.get(0).toUpperCase(Locale.ROOT);
    }
}

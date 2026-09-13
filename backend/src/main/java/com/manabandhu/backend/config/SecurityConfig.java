package com.manabandhu.backend.config;

import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtAudienceValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtIssuerValidator;
import org.springframework.security.oauth2.jwt.JwtTimestampValidator;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.proc.SecurityContext;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        var publicGetEndpoints = new String[] {
                "/api/v1/health",
                "/api/v1/foundation/welcome",
                "/api/v1/foundation/screens/**",
                "/api/v1/rooms/screens/**",
                "/api/v1/rooms/listings",
                "/api/v1/rooms/{roomId}",
                "/api/v1/rooms/listings/{listingId}",
                "/api/v1/rides/screens/**",
                "/api/v1/rides/offers",
                "/api/v1/rides/offers/**",
                "/api/v1/rides/{rideId}",
                "/api/v1/jobs",
                "/api/v1/jobs/**",
                "/api/v1/jobs/screens/**",
                "/api/v1/jobs/categories",
                "/api/v1/jobs/categories/**",
                "/api/v1/events",
                "/api/v1/events/**",
                "/api/v1/marketplace",
                "/api/v1/marketplace/**",
                "/api/v1/communities",
                "/api/v1/communities/**",
                "/api/v1/posts",
                "/api/v1/posts/**",
                "/api/v1/utilities/home",
                "/api/v1/utilities/nearby",
                "/api/v1/utilities/emergency",
                "/api/v1/referrals/screens/**",
                "/api/v1/safety/center",
                "/actuator/health/**"
        };

        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, publicGetEndpoints).permitAll()
                        .requestMatchers("/actuator/info").permitAll()
                        .requestMatchers("/api/v1/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter())))
                .build();
    }

    @Bean
    JwtAuthenticationConverter jwtAuthenticationConverter() {
        var scopeConverter = new JwtGrantedAuthoritiesConverter();
        var converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            var convertedScopes = scopeConverter.convert(jwt);
            var scopeAuthorities = convertedScopes == null ? Stream.<GrantedAuthority>empty() : convertedScopes.stream();
            var metadata = jwt.getClaimAsMap("app_metadata");
            List<String> roles = metadata == null ? List.of() : rolesFrom(metadata);
            Stream<GrantedAuthority> roleAuthorities = roles.stream()
                    .map(role -> "ROLE_" + role.toUpperCase(Locale.ROOT))
                    .map(SimpleGrantedAuthority::new);
            return Stream.concat(scopeAuthorities, roleAuthorities).distinct().toList();
        });
        converter.setPrincipalClaimName("sub");
        return converter;
    }

    private static List<String> rolesFrom(Map<String, Object> metadata) {
        var value = metadata.get("roles");
        if (value instanceof List<?> roles) return roles.stream().map(String::valueOf).toList();
        if (value instanceof String role && !role.isBlank()) return List.of(role);
        return List.of();
    }

    @Bean
    JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}") String jwkSetUri,
            @Value("${app.supabase.jwt.issuer:}") String expectedIssuer,
            @Value("${app.supabase.jwt.audience:authenticated}") String expectedAudience) {
        if (jwkSetUri == null || jwkSetUri.isBlank()) {
            return jwt -> {
                throw new JwtException("JWT validation is not configured");
            };
        }
        var decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri)
                .jwsAlgorithms(algs -> {
                    algs.add(SignatureAlgorithm.ES256);
                    algs.add(SignatureAlgorithm.RS256);
                })
                .build();
        var validators = new ArrayList<OAuth2TokenValidator<Jwt>>();
        validators.add(new JwtTimestampValidator());
        if (expectedIssuer != null && !expectedIssuer.isBlank()) {
            validators.add(new JwtIssuerValidator(expectedIssuer));
        }
        if (expectedAudience != null && !expectedAudience.isBlank()) {
            validators.add(new JwtAudienceValidator(expectedAudience));
        }
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(validators));
        return decoder;
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins) {
        var configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        configuration.setAllowCredentials(true);

        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

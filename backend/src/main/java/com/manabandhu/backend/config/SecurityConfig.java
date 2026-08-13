package com.manabandhu.backend.config;

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
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET, "/api/v1/health", "/actuator/health/**").permitAll()
                        .requestMatchers("/actuator/info").permitAll()
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

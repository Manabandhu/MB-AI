package com.manabandhu.backend.auth;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

/** Supabase Auth admin API (service role). The key never leaves the backend. */
@Component
public class SupabaseAdminClient {

    private final String projectUrl;
    private final String serviceRoleKey;
    private final RestTemplate restTemplate;

    SupabaseAdminClient(@Value("${app.supabase.project-url:}") String projectUrl,
                        @Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.projectUrl = projectUrl;
        this.serviceRoleKey = serviceRoleKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public boolean configured() {
        return !projectUrl.isBlank() && !serviceRoleKey.isBlank();
    }

    /** Bans (suspends) or unbans an account; banned users cannot start new sessions. */
    public void setBanned(UUID userId, String banDuration) {
        exchange(HttpMethod.PUT, userId, Map.of("ban_duration", banDuration), "Supabase rejected the status change");
    }

    /** Deletes the auth user; database rows referencing auth.users cascade. A user that is already gone is fine. */
    public void deleteUser(UUID userId) {
        try {
            exchange(HttpMethod.DELETE, userId, null, "Supabase could not delete the account");
        } catch (ResponseStatusException exception) {
            if (exception.getCause() instanceof HttpClientErrorException.NotFound) return;
            throw exception;
        }
    }

    private void exchange(HttpMethod method, UUID userId, Object body, String failure) {
        if (!configured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Supabase admin API is not configured");
        }
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        headers.set("apikey", serviceRoleKey);
        try {
            restTemplate.exchange(projectUrl + "/auth/v1/admin/users/" + userId, method, new HttpEntity<>(body, headers),
                    String.class);
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, failure, exception);
        }
    }
}

package com.manabandhu.backend.media;

import java.net.URI;
import java.time.Duration;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/v1/media")
public class UploadController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.supabase.project-url:}")
    private String supabaseProjectUrl;

    @Value("${app.supabase.service-role-key:}")
    private String serviceRoleKey;

    @PostMapping("/upload-url")
    ResponseEntity<Map<String, String>> uploadUrl(@Valid @RequestBody UploadUrlRequest request) {
        if (supabaseProjectUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE, "Storage provider is not configured");
        }
        var url = supabaseProjectUrl + "/storage/v1/object/upload/sign/" + request.bucket() + "/" + request.path();
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        var payload = Map.of("expiresIn", Duration.ofMinutes(15).getSeconds());
        var response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(payload, headers),
                Map.class);
        var body = response.getBody();
        if (body == null || !body.containsKey("signedURL")) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_GATEWAY, "Failed to generate upload URL");
        }
        var uploadUrl = body.get("signedURL").toString();
        if (!uploadUrl.startsWith("http")) {
            uploadUrl = supabaseProjectUrl + "/storage/v1" + uploadUrl;
        }
        return ResponseEntity.ok(Map.of(
                "uploadUrl", uploadUrl,
                "path", request.path(),
                "bucket", request.bucket()));
    }

    public record UploadUrlRequest(
            @NotBlank @Size(max = 120) String bucket,
            @NotBlank @Size(max = 400) String path,
            @NotNull Map<String, String> metadata) {}
}

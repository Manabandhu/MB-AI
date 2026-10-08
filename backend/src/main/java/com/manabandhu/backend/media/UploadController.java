package com.manabandhu.backend.media;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/**
 * Issues short-lived signed upload URLs. Files always land under the caller's own folder, paths are limited to
 * safe characters, and only image (plus PDF for documents) extensions are accepted.
 */
@RestController
@RequestMapping("/api/v1/media")
public class UploadController {

    private static final Set<String> ALLOWED_BUCKETS = Set.of(
            "rooms", "rides", "avatars", "posts", "marketplace", "documents", "community");
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "heic", "gif");
    private static final Pattern SAFE_PATH = Pattern.compile("^[A-Za-z0-9][A-Za-z0-9._-]*(/[A-Za-z0-9][A-Za-z0-9._-]*){0,4}$");

    private final RestTemplate restTemplate;
    private final String supabaseProjectUrl;
    private final String serviceRoleKey;

    UploadController(@Value("${app.supabase.project-url:}") String supabaseProjectUrl,
                     @Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.supabaseProjectUrl = supabaseProjectUrl;
        this.serviceRoleKey = serviceRoleKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    @PostMapping("/upload-url")
    ResponseEntity<Map<String, String>> uploadUrl(Authentication authentication, @Valid @RequestBody UploadUrlRequest request) {
        var actor = Actor.require(authentication);
        var bucket = request.bucket().trim().toLowerCase(Locale.ROOT);
        if (!ALLOWED_BUCKETS.contains(bucket)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or unauthorized storage bucket");
        }
        var rawPath = request.path().trim();
        if (!SAFE_PATH.matcher(rawPath).matches() || rawPath.contains("..")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Path may only contain letters, digits, '.', '_', '-' and '/'");
        }
        var extension = rawPath.contains(".") ? rawPath.substring(rawPath.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        var allowed = IMAGE_EXTENSIONS.contains(extension) || ("documents".equals(bucket) && "pdf".equals(extension));
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }

        if (supabaseProjectUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage provider is not configured");
        }

        var safePath = actor.id() + "/" + rawPath;
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        Map<?, ?> body;
        try {
            body = restTemplate.exchange(
                    supabaseProjectUrl + "/storage/v1/object/upload/sign/" + bucket + "/" + safePath,
                    HttpMethod.POST,
                    new HttpEntity<>(Map.of("expiresIn", Duration.ofMinutes(15).getSeconds()), headers),
                    Map.class).getBody();
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage provider unavailable", exception);
        }
        if (body == null || body.get("url") == null && body.get("signedURL") == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to generate upload URL");
        }
        var uploadUrl = String.valueOf(body.get("url") != null ? body.get("url") : body.get("signedURL"));
        if (!uploadUrl.startsWith("http")) {
            uploadUrl = supabaseProjectUrl + "/storage/v1" + uploadUrl;
        }
        return ResponseEntity.ok(Map.of("uploadUrl", uploadUrl, "path", safePath, "bucket", bucket));
    }

    public record UploadUrlRequest(
            @NotBlank @Size(max = 120) String bucket,
            @NotBlank @Size(max = 400) String path,
            Map<String, String> metadata) {}
}

package com.manabandhu.backend.media;

import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/**
 * Uploads go straight from the device to Supabase Storage with a short-lived signed URL. The server picks the
 * object key ({@code <userId>/<random uuid>.<ext>}), so callers can never write into someone else's folder or
 * overwrite a file, and it limits type and size (the bucket settings in V37 enforce the same limits on upload).
 */
@Service
public class MediaService {

    static final Set<String> BUCKETS = Set.of("rooms", "rides", "avatars", "posts", "marketplace", "documents", "community");
    static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;
    static final long MAX_DOCUMENT_BYTES = 10L * 1024 * 1024;
    private static final Map<String, String> IMAGE_TYPES = Map.of(
            "image/jpeg", "jpg", "image/png", "png", "image/webp", "webp", "image/heic", "heic", "image/gif", "gif");

    public record UploadTicket(String uploadUrl, String bucket, String path, String publicUrl, String contentType,
                               long maxBytes) {}

    private final StorageUrls storageUrls;
    private final RestTemplate restTemplate;
    private final String projectUrl;
    private final String serviceRoleKey;

    MediaService(StorageUrls storageUrls,
                 @Value("${app.supabase.project-url:}") String projectUrl,
                 @Value("${app.supabase.service-role-key:}") String serviceRoleKey) {
        this.storageUrls = storageUrls;
        this.projectUrl = projectUrl;
        this.serviceRoleKey = serviceRoleKey;
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(10));
        this.restTemplate = new RestTemplate(requestFactory);
    }

    public UploadTicket createUpload(Actor actor, String rawBucket, String rawContentType, long size) {
        var bucket = normalizeBucket(rawBucket);
        var contentType = rawContentType == null ? "" : rawContentType.trim().toLowerCase(Locale.ROOT);
        String extension;
        long limit;
        if (IMAGE_TYPES.containsKey(contentType)) {
            extension = IMAGE_TYPES.get(contentType);
            limit = MAX_IMAGE_BYTES;
        } else if ("application/pdf".equals(contentType) && "documents".equals(bucket)) {
            extension = "pdf";
            limit = MAX_DOCUMENT_BYTES;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a JPEG, PNG, WebP, HEIC or GIF image");
        }
        if (size <= 0 || size > limit) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Files can be at most " + (limit / (1024 * 1024)) + " MB");
        }
        requireConfigured();
        var path = actor.id() + "/" + UUID.randomUUID() + "." + extension;
        Map<?, ?> body;
        try {
            body = restTemplate.exchange(projectUrl + "/storage/v1/object/upload/sign/" + bucket + "/" + path,
                    HttpMethod.POST, new HttpEntity<>(Map.of("expiresIn", Duration.ofMinutes(15).getSeconds()), headers()),
                    Map.class).getBody();
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage provider unavailable", exception);
        }
        var signed = body == null ? null : body.get("url") != null ? body.get("url") : body.get("signedURL");
        if (signed == null) throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to generate upload URL");
        var uploadUrl = String.valueOf(signed);
        if (!uploadUrl.startsWith("http")) uploadUrl = projectUrl + "/storage/v1" + uploadUrl;
        // The documents bucket is private, so there is no public URL to hand out.
        var publicUrl = "documents".equals(bucket) ? null : storageUrls.publicUrl(bucket, path);
        return new UploadTicket(uploadUrl, bucket, path, publicUrl, contentType, limit);
    }

    /** Deletes one of the caller's own files; paths outside their folder read as not found. */
    public void delete(Actor actor, String rawBucket, String path) {
        var bucket = normalizeBucket(rawBucket);
        if (path == null || !path.startsWith(actor.id() + "/") || path.contains("..") || path.indexOf('/') != path.lastIndexOf('/')) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }
        requireConfigured();
        try {
            restTemplate.exchange(projectUrl + "/storage/v1/object/" + bucket + "/" + path, HttpMethod.DELETE,
                    new HttpEntity<>(headers()), String.class);
        } catch (HttpClientErrorException.NotFound exception) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        } catch (RestClientException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Storage provider unavailable", exception);
        }
    }

    private static String normalizeBucket(String rawBucket) {
        var bucket = rawBucket == null ? "" : rawBucket.trim().toLowerCase(Locale.ROOT);
        if (!BUCKETS.contains(bucket)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or unauthorized storage bucket");
        }
        return bucket;
    }

    private void requireConfigured() {
        if (projectUrl.isBlank() || serviceRoleKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Storage provider is not configured");
        }
    }

    private HttpHeaders headers() {
        var headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(serviceRoleKey);
        headers.set("apikey", serviceRoleKey);
        return headers;
    }
}

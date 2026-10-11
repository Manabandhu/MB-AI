package com.manabandhu.backend.media;

import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Checks that an image URL points into this project's storage, in an allowed bucket, under the given owner's
 * folder. Listings may only show images their owner uploaded through {@code /api/v1/media/upload-url}; arbitrary
 * URLs (tracking pixels, someone else's files, local file:// paths) are rejected.
 */
@Component
public class StorageUrls {

    private static final Pattern OBJECT_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(jpg|png|webp|heic|gif|pdf)$");

    private final String projectUrl;

    StorageUrls(@Value("${app.supabase.project-url:}") String projectUrl) {
        this.projectUrl = projectUrl.endsWith("/") ? projectUrl.substring(0, projectUrl.length() - 1) : projectUrl;
    }

    public String publicUrl(String bucket, String path) {
        return projectUrl + "/storage/v1/object/public/" + bucket + "/" + path;
    }

    /** The {@code bucket} and {@code owner/object} path of one of our public object URLs, or empty for anything else. */
    public java.util.Optional<String[]> bucketAndPath(String url) {
        if (url == null || projectUrl.isBlank()) return java.util.Optional.empty();
        var prefix = projectUrl + "/storage/v1/object/public/";
        if (!url.startsWith(prefix) || url.contains("..") || url.contains("?") || url.contains("#")) {
            return java.util.Optional.empty();
        }
        var parts = url.substring(prefix.length()).split("/");
        if (parts.length != 3 || !OBJECT_NAME.matcher(parts[2]).matches()) return java.util.Optional.empty();
        return java.util.Optional.of(new String[] {parts[0], parts[1] + "/" + parts[2]});
    }

    /** Fails with 400 unless {@code url} is a public object URL in one of {@code buckets} owned by one of {@code owners}. */
    public void requireOwnedImage(String url, Set<String> buckets, UUID... owners) {
        if (url == null || projectUrl.isBlank()) throw invalid();
        var prefix = projectUrl + "/storage/v1/object/public/";
        if (!url.startsWith(prefix) || url.contains("..") || url.contains("?") || url.contains("#")) throw invalid();
        var parts = url.substring(prefix.length()).split("/");
        if (parts.length != 3 || !buckets.contains(parts[0]) || !OBJECT_NAME.matcher(parts[2]).matches()) throw invalid();
        for (var owner : owners) {
            if (owner != null && owner.toString().equals(parts[1])) return;
        }
        throw invalid();
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Images must be uploaded through ManaBandhu");
    }
}

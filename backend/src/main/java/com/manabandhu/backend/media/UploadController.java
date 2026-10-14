package com.manabandhu.backend.media;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.manabandhu.backend.auth.Actor;

/** Signed uploads to Supabase Storage and deletion of the caller's own files (rules in {@link MediaService}). */
@RestController
@RequestMapping("/api/v1/media")
public class UploadController {

    private final MediaService mediaService;

    UploadController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping("/upload-url")
    MediaService.UploadTicket uploadUrl(Authentication authentication, @Valid @RequestBody UploadUrlRequest request) {
        return mediaService.createUpload(Actor.require(authentication), request.bucket(), request.contentType(),
                request.size());
    }

    /** POST with a body so object paths never appear in access logs. */
    @PostMapping("/delete")
    ResponseEntity<Void> delete(Authentication authentication, @Valid @RequestBody DeleteRequest request) {
        mediaService.delete(Actor.require(authentication), request.bucket(), request.path());
        return ResponseEntity.noContent().build();
    }

    public record UploadUrlRequest(
            @NotBlank @Size(max = 40) String bucket,
            @NotBlank @Size(max = 60) String contentType,
            @Positive long size) {}

    public record DeleteRequest(@NotBlank @Size(max = 40) String bucket, @NotBlank @Size(max = 200) String path) {}
}

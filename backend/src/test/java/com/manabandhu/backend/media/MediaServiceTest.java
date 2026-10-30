package com.manabandhu.backend.media;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Set;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class MediaServiceTest {

    private static final String PROJECT = "https://example.supabase.co";
    private final StorageUrls urls = new StorageUrls(PROJECT);
    // Storage is "configured" so a passing check would reach the network; every case here must stop before that.
    private final MediaService media = new MediaService(urls, "http://127.0.0.1:1", "service-role");
    private final Actor caller = new Actor(UUID.randomUUID(), false, false);

    @Test
    void rejectsUnknownBucketsTypesAndSizes() {
        assertThatThrownBy(() -> media.createUpload(caller, "secrets", "image/png", 10))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("bucket");
        assertThatThrownBy(() -> media.createUpload(caller, "avatars", "text/html", 10))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
        assertThatThrownBy(() -> media.createUpload(caller, "avatars", "application/pdf", 10))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
        assertThatThrownBy(() -> media.createUpload(caller, "avatars", "image/jpeg", MediaService.MAX_IMAGE_BYTES + 1))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("5 MB");
        assertThatThrownBy(() -> media.createUpload(caller, "avatars", "image/jpeg", 0))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deletingOutsideYourFolderIsNotFound() {
        assertThatThrownBy(() -> media.delete(caller, "avatars", UUID.randomUUID() + "/x.png"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        assertThatThrownBy(() -> media.delete(caller, "avatars", caller.id() + "/../x.png"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        assertThatThrownBy(() -> media.delete(caller, "avatars", caller.id() + "/a/b.png"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
    }

    @Test
    void listingImagesMustBeTheOwnersUploads() {
        var owner = caller.id();
        var good = PROJECT + "/storage/v1/object/public/rooms/" + owner + "/" + UUID.randomUUID() + ".jpg";
        assertThatCode(() -> urls.requireOwnedImage(good, Set.of("rooms"), owner)).doesNotThrowAnyException();

        for (var bad : new String[] {
                "https://images.unsplash.com/photo.jpg",
                "file:///var/mobile/photo.jpg",
                PROJECT + "/storage/v1/object/public/rooms/" + UUID.randomUUID() + "/" + UUID.randomUUID() + ".jpg",
                PROJECT + "/storage/v1/object/public/avatars/" + owner + "/" + UUID.randomUUID() + ".jpg",
                PROJECT + "/storage/v1/object/public/rooms/" + owner + "/../x/" + UUID.randomUUID() + ".jpg",
                good + "?track=1",
                "https://example.supabase.co.evil.test/storage/v1/object/public/rooms/" + owner + "/" + UUID.randomUUID() + ".jpg",
        }) {
            assertThatThrownBy(() -> urls.requireOwnedImage(bad, Set.of("rooms"), owner))
                    .as(bad).isInstanceOf(ResponseStatusException.class);
        }
    }
}

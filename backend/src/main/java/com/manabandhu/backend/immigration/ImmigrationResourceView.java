package com.manabandhu.backend.immigration;

import java.time.Instant;
import java.util.UUID;

/**
 * A resource as shown to readers. The submitter's user id is never exposed; {@code mine} tells the caller whether
 * they submitted it (for example to explain that it awaits review).
 */
public record ImmigrationResourceView(UUID id, String title, String description, String category, String url,
                                      ImmigrationResource.ResourceType resourceType, String tags, boolean verified,
                                      boolean mine, Instant createdAt) {

    static ImmigrationResourceView of(ImmigrationResource resource, UUID callerId) {
        return new ImmigrationResourceView(resource.getId(), resource.getTitle(), resource.getDescription(),
                resource.getCategory(), resource.getUrl(), resource.getResourceType(), resource.getTags(),
                resource.isVerified(), callerId != null && callerId.equals(resource.getOwnerId()), resource.getCreatedAt());
    }
}

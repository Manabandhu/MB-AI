package com.manabandhu.backend.post;

import java.util.UUID;

/** Community card data plus whether the viewer has joined. */
public record CommunityView(
        UUID id,
        String name,
        String description,
        int memberCount,
        String category,
        String image,
        boolean isJoined,
        String slug,
        String metroArea) {

    static CommunityView of(Community community, boolean joined) {
        var image = community.getCoverUrl() != null ? community.getCoverUrl() : community.getAvatarUrl();
        return new CommunityView(community.getId(), community.getName(),
                community.getDescription() != null ? community.getDescription() : "",
                community.getMemberCount(), community.getCategory() != null ? community.getCategory() : "CITY",
                image, joined, community.getSlug(), community.getMetroArea());
    }
}

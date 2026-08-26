package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface ListingFavoriteRepository extends JpaRepository<ListingFavorite, UUID> {
    List<ListingFavorite> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByListingIdAndUserId(UUID listingId, UUID userId);

    void deleteByListingIdAndUserId(UUID listingId, UUID userId);

    void deleteByUserId(UUID userId);
}

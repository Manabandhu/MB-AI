package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomFavoriteRepository extends JpaRepository<RoomFavorite, UUID> {
    List<RoomFavorite> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByListingIdAndUserId(UUID listingId, UUID userId);

    List<RoomFavorite> findByUserIdAndListingIdIn(UUID userId, java.util.Collection<UUID> listingIds);

    Optional<RoomFavorite> findByListingIdAndUserId(UUID listingId, UUID userId);

    void deleteByListingIdAndUserId(UUID listingId, UUID userId);

    void deleteByUserId(UUID userId);
}

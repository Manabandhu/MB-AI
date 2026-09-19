package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomAmenityRepository extends JpaRepository<RoomAmenity, UUID> {
    List<RoomAmenity> findByListingIdOrderByCreatedAtAsc(UUID listingId);

    List<RoomAmenity> findByListingIdInOrderByCreatedAtAsc(java.util.Collection<UUID> listingIds);

    void deleteByListingId(UUID listingId);
}

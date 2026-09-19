package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomPreferenceRepository extends JpaRepository<RoomPreference, UUID> {
    List<RoomPreference> findByListingIdOrderByCreatedAtAsc(UUID listingId);

    List<RoomPreference> findByListingIdInOrderByCreatedAtAsc(java.util.Collection<UUID> listingIds);

    void deleteByListingId(UUID listingId);
}

package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomAnalyticRepository extends JpaRepository<RoomAnalytic, UUID> {
    long countByListingIdAndEventType(UUID listingId, String eventType);

    List<RoomAnalytic> findByListingIdAndEventTypeOrderByCreatedAtDesc(UUID listingId, String eventType);
}

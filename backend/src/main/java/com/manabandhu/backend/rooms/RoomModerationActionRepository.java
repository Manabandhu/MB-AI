package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomModerationActionRepository extends JpaRepository<RoomModerationAction, UUID> {
    List<RoomModerationAction> findByListingIdOrderByCreatedAtDesc(UUID listingId);
}

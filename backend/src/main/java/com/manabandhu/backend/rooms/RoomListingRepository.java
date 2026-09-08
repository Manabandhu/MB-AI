package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RoomListingRepository extends JpaRepository<RoomListing, UUID> {
    List<RoomListing> findByStatusOrderByCreatedAtDesc(String status);

    List<RoomListing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status);

    List<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status);

    List<RoomListing> findByStatusAndRoomTypeAndBroadLocationContainingIgnoreCaseOrderByCreatedAtDesc(
            String status, String roomType, String location);

    @Query(value = "SELECT l.* FROM room_listings l INNER JOIN room_favorites f ON l.id = f.listing_id WHERE f.user_id = :userId AND l.status IN ('active', 'paused') ORDER BY f.created_at DESC", nativeQuery = true)
    List<RoomListing> findSavedListingsByUserId(@Param("userId") UUID userId);
}

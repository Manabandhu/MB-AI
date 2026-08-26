package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomListingRepository extends JpaRepository<RoomListing, UUID> {
    List<RoomListing> findByStatusOrderByCreatedAtDesc(String status);

    List<RoomListing> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<RoomListing> findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(String location, String status);

    List<RoomListing> findByRoomTypeAndStatusOrderByCreatedAtDesc(String roomType, String status);
}

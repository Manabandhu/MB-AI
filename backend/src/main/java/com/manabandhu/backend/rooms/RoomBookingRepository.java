package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomBookingRepository extends JpaRepository<RoomBooking, UUID> {
    List<RoomBooking> findByListingIdOrderByCreatedAtDesc(UUID listingId);

    List<RoomBooking> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId);

    List<RoomBooking> findByListingIdAndStatusOrderByCreatedAtDesc(UUID listingId, String status);
}

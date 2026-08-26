package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomAvailabilityRepository extends JpaRepository<RoomAvailability, UUID> {
    List<RoomAvailability> findByListingIdOrderByAvailableFromAsc(UUID listingId);
}

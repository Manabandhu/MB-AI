package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RideBookingRepository extends JpaRepository<RideBooking, UUID> {
    List<RideBooking> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideBooking> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

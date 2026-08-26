package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RideRequestRepository extends JpaRepository<RideRequest, UUID> {
    List<RideRequest> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideRequest> findByRiderIdOrderByCreatedAtDesc(UUID riderId);
}

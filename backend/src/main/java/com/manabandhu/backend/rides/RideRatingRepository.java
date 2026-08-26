package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RideRatingRepository extends JpaRepository<RideRating, UUID> {
    List<RideRating> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideRating> findByRateeIdOrderByCreatedAtDesc(UUID rateeId);
}

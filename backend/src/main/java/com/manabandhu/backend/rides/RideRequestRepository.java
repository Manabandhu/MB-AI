package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import java.util.Optional;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface RideRequestRepository extends JpaRepository<RideRequest, UUID> {
    List<RideRequest> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideRequest> findByRiderIdOrderByCreatedAtDesc(UUID riderId);

    List<RideRequest> findByRideIdAndRiderIdOrderByCreatedAtDesc(UUID rideId, UUID riderId);

    boolean existsByRideIdAndRiderIdAndStatus(UUID rideId, UUID riderId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RideRequest r WHERE r.id = :id")
    Optional<RideRequest> findByIdForUpdate(@Param("id") UUID id);
}

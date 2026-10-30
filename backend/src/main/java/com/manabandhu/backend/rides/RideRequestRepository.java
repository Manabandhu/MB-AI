package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

interface RideRequestRepository extends JpaRepository<RideRequest, UUID> {
    List<RideRequest> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideRequest> findByRiderIdOrderByCreatedAtDesc(UUID riderId);

    List<RideRequest> findByRideIdAndRiderIdOrderByCreatedAtDesc(UUID rideId, UUID riderId);

    boolean existsByRideIdAndRiderIdAndStatus(UUID rideId, UUID riderId, String status);

    @Query("SELECT COALESCE(SUM(r.seatsRequested), 0) FROM RideRequest r WHERE r.rideId = :rideId AND LOWER(r.status) = 'accepted'")
    long sumAcceptedSeats(@Param("rideId") UUID rideId);

    List<RideRequest> findByRiderIdOrderByCreatedAtDesc(UUID riderId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM RideRequest r WHERE r.id = :id")
    Optional<RideRequest> findByIdForUpdate(@Param("id") UUID id);
}

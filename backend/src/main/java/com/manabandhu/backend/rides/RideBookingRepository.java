package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface RideBookingRepository extends JpaRepository<RideBooking, UUID> {
    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @org.springframework.data.jpa.repository.Query("SELECT b FROM RideBooking b WHERE b.id = :id")
    java.util.Optional<RideBooking> findByIdForUpdate(@org.springframework.data.repository.query.Param("id") UUID id);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(b.seatsBooked), 0) FROM RideBooking b WHERE b.rideId = :rideId AND LOWER(b.status) <> 'cancelled'")
    long sumLiveSeats(@org.springframework.data.repository.query.Param("rideId") UUID rideId);

    List<RideBooking> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<RideBooking> findByRideIdOrderByCreatedAtDesc(UUID rideId);

    List<RideBooking> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<RideBooking> findByRideIdAndUserIdOrderByCreatedAtDesc(UUID rideId, UUID userId);

    boolean existsByRideIdAndUserIdAndStatusNot(UUID rideId, UUID userId, String status);
}

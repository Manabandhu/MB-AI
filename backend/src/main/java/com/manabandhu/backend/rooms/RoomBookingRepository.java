package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

interface RoomBookingRepository extends JpaRepository<RoomBooking, UUID> {
    List<RoomBooking> findByListingIdOrderByCreatedAtDesc(UUID listingId, Pageable pageable);

    List<RoomBooking> findByRequesterIdOrderByCreatedAtDesc(UUID requesterId, Pageable pageable);

    boolean existsByListingIdAndRequesterIdAndStatus(UUID listingId, UUID requesterId, String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from RoomBooking b where b.id = :id")
    Optional<RoomBooking> findByIdForUpdate(@Param("id") UUID id);
}

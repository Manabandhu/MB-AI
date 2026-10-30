package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface RoomReportRepository extends JpaRepository<RoomReport, UUID> {
    List<RoomReport> findByListingIdOrderByCreatedAtDesc(UUID listingId);

    List<RoomReport> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<RoomReport> findByReporterIdOrderByCreatedAtDesc(UUID reporterId, Pageable pageable);

    boolean existsByListingIdAndReporterIdAndStatus(UUID listingId, UUID reporterId, String status);
}

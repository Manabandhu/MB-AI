package com.manabandhu.backend.events;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface EventAttendanceRepository extends JpaRepository<EventAttendance, UUID> {
    List<EventAttendance> findByEventIdOrderByCreatedAtDesc(UUID eventId);

    List<EventAttendance> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

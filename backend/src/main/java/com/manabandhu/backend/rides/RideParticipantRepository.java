package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RideParticipantRepository extends JpaRepository<RideParticipant, UUID> {
    List<RideParticipant> findByRideIdOrderByJoinedAtAsc(UUID rideId);

    List<RideParticipant> findByUserIdOrderByJoinedAtDesc(UUID userId);
}

package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface RoomSavedSearchRepository extends JpaRepository<RoomSavedSearch, UUID> {
    List<RoomSavedSearch> findByUserIdOrderByCreatedAtDesc(UUID userId);

    boolean existsByUserIdAndName(UUID userId, String name);
}

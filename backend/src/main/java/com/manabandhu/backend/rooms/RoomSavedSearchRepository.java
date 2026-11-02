package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

interface RoomSavedSearchRepository extends JpaRepository<RoomSavedSearch, UUID> {
    List<RoomSavedSearch> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    boolean existsByUserIdAndName(UUID userId, String name);
}

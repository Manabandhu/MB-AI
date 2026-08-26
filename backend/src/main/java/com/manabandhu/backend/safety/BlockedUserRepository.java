package com.manabandhu.backend.safety;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface BlockedUserRepository extends JpaRepository<BlockedUser, UUID> {
    Optional<BlockedUser> findByOwnerIdAndBlockedUserId(UUID ownerId, UUID blockedUserId);
    List<BlockedUser> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
    boolean existsByOwnerIdAndBlockedUserId(UUID ownerId, UUID blockedUserId);
}

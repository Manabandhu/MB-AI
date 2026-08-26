package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface CommunityRepository extends JpaRepository<Community, UUID> {
    List<Community> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}

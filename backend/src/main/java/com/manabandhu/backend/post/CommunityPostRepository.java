package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface CommunityPostRepository extends JpaRepository<CommunityPost, UUID> {
    List<CommunityPost> findAllByOrderByCreatedAtDesc();

    List<CommunityPost> findByCommunityIdOrderByCreatedAtDesc(UUID communityId);
}

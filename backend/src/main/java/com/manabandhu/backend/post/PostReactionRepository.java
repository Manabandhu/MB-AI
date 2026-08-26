package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PostReactionRepository extends JpaRepository<PostReaction, UUID> {
    List<PostReaction> findByPostIdOrderByCreatedAtDesc(UUID postId);

    List<PostReaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    PostReaction findByPostIdAndUserId(UUID postId, UUID userId);
}

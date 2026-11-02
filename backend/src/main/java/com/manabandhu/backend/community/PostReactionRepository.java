package com.manabandhu.backend.community;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface PostReactionRepository extends JpaRepository<PostReaction, UUID> {
    List<PostReaction> findTop200ByPostIdOrderByCreatedAtDesc(UUID postId);

    List<PostReaction> findByUserIdOrderByCreatedAtDesc(UUID userId);

    PostReaction findByPostIdAndUserId(UUID postId, UUID userId);

    List<PostReaction> findByUserIdAndPostIdIn(UUID userId, Collection<UUID> postIds);

    /** Rows of {@code [postId, type, count]}. */
    @Query("select r.postId, r.type, count(r) from PostReaction r where r.postId in :postIds group by r.postId, r.type")
    List<Object[]> countByPostIdsAndType(@Param("postIds") Collection<UUID> postIds);
}

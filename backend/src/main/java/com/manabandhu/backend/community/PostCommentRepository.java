package com.manabandhu.backend.community;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
    List<PostComment> findByPostIdOrderByCreatedAtDesc(UUID postId);

    List<PostComment> findTop200ByPostIdOrderByCreatedAtDesc(UUID postId);

    /** Rows of {@code [postId, count]}. */
    @Query("select c.postId, count(c) from PostComment c where c.postId in :postIds group by c.postId")
    List<Object[]> countByPostIds(@Param("postIds") Collection<UUID> postIds);
}

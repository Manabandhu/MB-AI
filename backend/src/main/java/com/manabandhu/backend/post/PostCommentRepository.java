package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface PostCommentRepository extends JpaRepository<PostComment, UUID> {
    List<PostComment> findByPostIdOrderByCreatedAtDesc(UUID postId);

    List<PostComment> findByAuthorIdOrderByCreatedAtDesc(UUID authorId);
}

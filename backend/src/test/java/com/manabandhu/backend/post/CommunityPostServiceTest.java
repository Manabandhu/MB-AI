package com.manabandhu.backend.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

class CommunityPostServiceTest {

    @Test
    void createPost() {
        var postRepo = mock(CommunityPostRepository.class);
        var communityRepo = mock(CommunityRepository.class);
        var commentRepo = mock(PostCommentRepository.class);
        var reactionRepo = mock(PostReactionRepository.class);
        when(postRepo.save(any(CommunityPost.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new CommunityPostService(postRepo, communityRepo, commentRepo, reactionRepo);
        var ownerId = UUID.randomUUID();
        var post = service.create(ownerId, new CreatePostInput("Hello", "World"));

        assertThat(post).isNotNull();
        assertThat(post.getOwnerId()).isEqualTo(ownerId);
        assertThat(post.getTitle()).isEqualTo("Hello");
        verify(postRepo).save(any(CommunityPost.class));
    }

    @Test
    void addComment() {
        var postRepo = mock(CommunityPostRepository.class);
        var communityRepo = mock(CommunityRepository.class);
        var commentRepo = mock(PostCommentRepository.class);
        var reactionRepo = mock(PostReactionRepository.class);
        when(commentRepo.save(any(PostComment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new CommunityPostService(postRepo, communityRepo, commentRepo, reactionRepo);
        var postId = UUID.randomUUID();
        var comment = service.addComment(postId, UUID.randomUUID(), "Nice post");

        assertThat(comment).isNotNull();
        assertThat(comment.getPostId()).isEqualTo(postId);
        assertThat(comment.getBody()).isEqualTo("Nice post");
        verify(commentRepo).save(any(PostComment.class));
    }

    @Test
    void addReaction() {
        var postRepo = mock(CommunityPostRepository.class);
        var communityRepo = mock(CommunityRepository.class);
        var commentRepo = mock(PostCommentRepository.class);
        var reactionRepo = mock(PostReactionRepository.class);
        when(reactionRepo.findByPostIdAndUserId(any(UUID.class), any(UUID.class))).thenReturn(null);
        when(reactionRepo.save(any(PostReaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new CommunityPostService(postRepo, communityRepo, commentRepo, reactionRepo);
        var postId = UUID.randomUUID();
        var reaction = service.addReaction(postId, UUID.randomUUID(), "LIKE");

        assertThat(reaction).isNotNull();
        assertThat(reaction.getPostId()).isEqualTo(postId);
        assertThat(reaction.getType()).isEqualTo("LIKE");
        verify(reactionRepo).save(any(PostReaction.class));
    }
}

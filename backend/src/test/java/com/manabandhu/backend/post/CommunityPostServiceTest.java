package com.manabandhu.backend.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class CommunityPostServiceTest {

    private CommunityPostRepository postRepo;
    private CommunityRepository communityRepo;
    private PostCommentRepository commentRepo;
    private PostReactionRepository reactionRepo;
    private AuthorNameService authorNames;
    private CommunityMembershipService membership;
    private CommunityPostService service;

    @BeforeEach
    void setUp() {
        postRepo = mock(CommunityPostRepository.class);
        communityRepo = mock(CommunityRepository.class);
        commentRepo = mock(PostCommentRepository.class);
        reactionRepo = mock(PostReactionRepository.class);
        authorNames = mock(AuthorNameService.class);
        when(authorNames.names(anyCollection())).thenReturn(Map.of());
        membership = mock(CommunityMembershipService.class);
        var reader = new CommunityPostReader(postRepo, communityRepo, commentRepo, reactionRepo);
        service = new CommunityPostService(postRepo, communityRepo, commentRepo, reactionRepo, reader, authorNames,
                membership);
    }

    private CommunityPost existingPost(UUID ownerId) {
        var post = new CommunityPost(UUID.randomUUID(), ownerId, "Title", "Body");
        when(postRepo.findById(post.getId())).thenReturn(Optional.of(post));
        return post;
    }

    @Test
    void createPost() {
        var communityId = UUID.randomUUID();
        when(communityRepo.findById(communityId)).thenReturn(Optional.of(new Community(UUID.randomUUID(), "C", "")));
        when(postRepo.save(any(CommunityPost.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var ownerId = UUID.randomUUID();
        when(membership.isMember(communityId, ownerId)).thenReturn(true);
        var post = service.create(ownerId, new CreatePostInput(communityId, "Hello", "World"));

        assertThat(post.getOwnerId()).isEqualTo(ownerId);
        assertThat(post.getTitle()).isEqualTo("Hello");
        verify(postRepo).save(any(CommunityPost.class));
    }

    @Test
    void nonMemberCannotPostIs403() {
        var communityId = UUID.randomUUID();
        var ownerId = UUID.randomUUID();
        when(communityRepo.findById(communityId)).thenReturn(Optional.of(new Community(UUID.randomUUID(), "C", "")));
        when(membership.isMember(communityId, ownerId)).thenReturn(false);

        assertThatThrownBy(() -> service.create(ownerId, new CreatePostInput(communityId, "Hello", "World")))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("403");
        verify(postRepo, never()).save(any());
    }

    @Test
    void createPostInUnknownCommunityIs404() {
        var communityId = UUID.randomUUID();
        when(communityRepo.findById(communityId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(UUID.randomUUID(), new CreatePostInput(communityId, "Hello", "World")))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        verify(postRepo, never()).save(any());
    }

    @Test
    void addComment() {
        var post = existingPost(UUID.randomUUID());
        when(commentRepo.save(any(PostComment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var comment = service.addComment(post.getId(), UUID.randomUUID(), "Nice post");

        assertThat(comment.getPostId()).isEqualTo(post.getId());
        assertThat(comment.getBody()).isEqualTo("Nice post");
    }

    @Test
    void commentOnMissingPostIs404() {
        var postId = UUID.randomUUID();
        when(postRepo.findById(postId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addComment(postId, UUID.randomUUID(), "Hi"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
        verify(commentRepo, never()).save(any());
    }

    @Test
    void addReactionNormalizesType() {
        var post = existingPost(UUID.randomUUID());
        when(reactionRepo.findByPostIdAndUserId(any(UUID.class), any(UUID.class))).thenReturn(null);
        when(reactionRepo.save(any(PostReaction.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var reaction = service.addReaction(post.getId(), UUID.randomUUID(), "helpful");

        assertThat(reaction.getType()).isEqualTo("HELPFUL");
    }

    @Test
    void unknownReactionTypeIs400() {
        var post = existingPost(UUID.randomUUID());

        assertThatThrownBy(() -> service.addReaction(post.getId(), UUID.randomUUID(), "ANGRY"))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("400");
        verify(reactionRepo, never()).save(any());
    }

    @Test
    void removeReactionDeletesOnlyTheCallersReaction() {
        var post = existingPost(UUID.randomUUID());
        var caller = UUID.randomUUID();
        var own = new PostReaction(post.getId(), caller, "LIKE");
        when(reactionRepo.findByPostIdAndUserId(post.getId(), caller)).thenReturn(own);

        service.removeReaction(post.getId(), caller);

        verify(reactionRepo).findByPostIdAndUserId(post.getId(), caller);
        verify(reactionRepo).delete(own);
    }

    @Test
    void removeReactionWithoutOneIsANoop() {
        var post = existingPost(UUID.randomUUID());
        var caller = UUID.randomUUID();
        when(reactionRepo.findByPostIdAndUserId(post.getId(), caller)).thenReturn(null);

        service.removeReaction(post.getId(), caller);

        verify(reactionRepo, never()).delete(any());
    }

    @Test
    void removeReactionOnMissingPostIs404() {
        var postId = UUID.randomUUID();
        when(postRepo.findById(postId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.removeReaction(postId, UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class).hasMessageContaining("404");
    }

    @Test
    void viewCarriesAuthorNameCountsAndViewerReaction() {
        var ownerId = UUID.randomUUID();
        var viewer = UUID.randomUUID();
        var post = existingPost(ownerId);
        when(commentRepo.countByPostIds(List.of(post.getId())))
                .thenReturn(List.<Object[]>of(new Object[] {post.getId(), 3L}));
        when(reactionRepo.countByPostIdsAndType(List.of(post.getId()))).thenReturn(List.of(
                new Object[] {post.getId(), "LIKE", 2L}, new Object[] {post.getId(), "HEART", 1L}));
        when(reactionRepo.findByUserIdAndPostIdIn(viewer, List.of(post.getId())))
                .thenReturn(List.of(new PostReaction(post.getId(), viewer, "HEART")));
        when(authorNames.names(anyCollection())).thenReturn(Map.of(ownerId, "Asha"));

        var view = service.view(post.getId(), viewer);

        assertThat(view.authorName()).isEqualTo("Asha");
        assertThat(view.mine()).isFalse();
        assertThat(service.view(post.getId(), ownerId).mine()).isTrue();
        assertThat(view.commentCount()).isEqualTo(3);
        assertThat(view.reactionCounts()).containsEntry("LIKE", 2L).containsEntry("HEART", 1L);
        assertThat(view.reactionCount()).isEqualTo(3);
        assertThat(view.viewerReaction()).isEqualTo("HEART");
    }

    @Test
    void signedOutViewerHasNoReactionAndUnknownAuthorIsMember() {
        var post = existingPost(UUID.randomUUID());

        var view = service.view(post.getId(), null);

        assertThat(view.viewerReaction()).isNull();
        assertThat(view.mine()).isFalse();
        assertThat(view.authorName()).isEqualTo("Member");
        assertThat(view.commentCount()).isZero();
        verify(reactionRepo, never()).findByUserIdAndPostIdIn(any(), anyCollection());
    }

    @Test
    void reactionCountsCarryNoUserIds() {
        var post = existingPost(UUID.randomUUID());
        when(reactionRepo.countByPostIdsAndType(List.of(post.getId())))
                .thenReturn(List.<Object[]>of(new Object[] {post.getId(), "LIKE", 2L}));

        assertThat(service.reactionCounts(post.getId())).containsExactly(new ReactionCount("LIKE", 2));
    }

    @Test
    void commentViewsMarkTheViewersOwn() {
        var post = existingPost(UUID.randomUUID());
        var me = UUID.randomUUID();
        when(commentRepo.findTop200ByPostIdOrderByCreatedAtDesc(post.getId())).thenReturn(List.of(
                new PostComment(post.getId(), me, "mine"), new PostComment(post.getId(), UUID.randomUUID(), "theirs")));

        var views = service.commentViews(post.getId(), me);
        assertThat(views).extracting(CommentView::mine).containsExactly(true, false);
        assertThat(views).extracting(CommentView::authorName).containsOnly("Member");
    }
}

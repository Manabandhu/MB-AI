package com.manabandhu.backend.post;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Community posts. Writes are transactional here; reads go through {@link CommunityPostReader} (one read-only
 * transaction) and author names are added afterwards, so no request holds two pooled connections at once.
 */
@Service
public class CommunityPostService {

    /** Reaction types the app offers; stored upper case. */
    static final Set<String> REACTION_TYPES = Set.of("LIKE", "HELPFUL", "HEART");

    private final CommunityPostRepository postRepository;
    private final CommunityRepository communityRepository;
    private final PostCommentRepository commentRepository;
    private final PostReactionRepository reactionRepository;
    private final CommunityPostReader reader;
    private final AuthorNameService authorNames;
    private final CommunityMembershipService membership;

    CommunityPostService(CommunityPostRepository postRepository, CommunityRepository communityRepository,
                         PostCommentRepository commentRepository, PostReactionRepository reactionRepository,
                         CommunityPostReader reader, AuthorNameService authorNames,
                         CommunityMembershipService membership) {
        this.postRepository = postRepository;
        this.communityRepository = communityRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.reader = reader;
        this.authorNames = authorNames;
        this.membership = membership;
    }

    // ─── Reads (views) ────────────────────────────────────────────────────────

    /** The newest {@value CommunityPostReader#FEED_LIMIT} posts. {@code viewerId} may be null when signed out. */
    public List<PostView> feed(UUID viewerId) {
        return views(reader.feed(viewerId), viewerId);
    }

    public PostView view(UUID postId, UUID viewerId) {
        return views(reader.one(postId, viewerId), viewerId).getFirst();
    }

    PostView view(CommunityPost post, UUID viewerId) {
        return view(post.getId(), viewerId);
    }

    /** The community's newest {@value CommunityPostReader#FEED_LIMIT} posts; 404 for an unknown community. */
    public List<PostView> communityFeed(UUID communityId, UUID viewerId) {
        return views(reader.communityFeed(communityId, viewerId), viewerId);
    }

    /** The newest {@value CommunityPostReader#COMMENT_LIMIT} comments with author names; 404 for a missing post. */
    public List<CommentView> commentViews(UUID postId, UUID viewerId) {
        var comments = reader.comments(postId);
        var names = authorNames.names(comments.stream().map(PostComment::getAuthorId).toList());
        return comments.stream()
                .map(c -> CommentView.of(c, AuthorNameService.nameOf(names, c.getAuthorId()), viewerId))
                .toList();
    }

    CommentView commentView(PostComment comment, UUID viewerId) {
        var names = authorNames.names(List.of(comment.getAuthorId()));
        return CommentView.of(comment, AuthorNameService.nameOf(names, comment.getAuthorId()), viewerId);
    }

    /** Reaction counts by type for a public reader; no user ids. */
    public List<ReactionCount> reactionCounts(UUID postId) {
        return reader.reactionCounts(postId);
    }

    private List<PostView> views(CommunityPostReader.PostRows rows, UUID viewerId) {
        var names = authorNames.names(rows.posts().stream().map(CommunityPost::getOwnerId).toList());
        return rows.posts().stream().map(post -> {
            var counts = rows.reactionCounts().getOrDefault(post.getId(), java.util.Map.of());
            return new PostView(post.getId(), post.getCommunityId(), AuthorNameService.nameOf(names, post.getOwnerId()),
                    viewerId != null && viewerId.equals(post.getOwnerId()), post.getTitle(), post.getBody(),
                    post.getCreatedAt(), rows.commentCounts().getOrDefault(post.getId(), 0L), counts,
                    counts.values().stream().mapToLong(Long::longValue).sum(), rows.viewerReactions().get(post.getId()));
        }).toList();
    }

    // ─── Entities (GraphQL) ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CommunityPost> findAll() {
        return postRepository.findTop100ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Optional<CommunityPost> findById(UUID id) {
        return postRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<Community> findAllCommunities() {
        return communityRepository.findAll(Sort.by(
                Sort.Direction.DESC, "memberCount"));
    }

    @Transactional(readOnly = true)
    public Optional<Community> findCommunityById(UUID id) {
        return communityRepository.findById(id);
    }

    @Transactional(readOnly = true)
    public Community findCommunity(UUID id) {
        return communityRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found"));
    }

    @Transactional(readOnly = true)
    public List<CommunityPost> findPostsByCommunity(UUID communityId) {
        return postRepository.findTop100ByCommunityIdOrderByCreatedAtDesc(communityId);
    }

    @Transactional(readOnly = true)
    public List<PostComment> findCommentsByPost(UUID postId) {
        return commentRepository.findTop200ByPostIdOrderByCreatedAtDesc(postId);
    }

    /** The 200 newest reactions on a post (GraphQL only; REST serves counts). */
    @Transactional(readOnly = true)
    public List<PostReaction> findReactionsByPost(UUID postId) {
        return reactionRepository.findTop200ByPostIdOrderByCreatedAtDesc(postId);
    }

    // ─── Writes ───────────────────────────────────────────────────────────────

    /** Members only: you can post in a community after joining it. 404 unknown community, 403 not a member. */
    @Transactional
    public CommunityPost create(UUID ownerId, CreatePostInput input) {
        findCommunity(input.communityId());
        if (!membership.isMember(input.communityId(), ownerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Join this community to post in it");
        }
        return postRepository.save(new CommunityPost(input.communityId(), ownerId, input.title(), input.body()));
    }

    @Transactional
    public Community createCommunity(UUID ownerId, String name, String description) {
        return communityRepository.save(new Community(ownerId, name, description));
    }

    @Transactional
    public PostComment addComment(UUID postId, UUID authorId, String body) {
        reader.requirePost(postId);
        return commentRepository.save(new PostComment(postId, authorId, body));
    }

    /** Sets the caller's single reaction on a post (replacing an earlier one). */
    @Transactional
    public PostReaction addReaction(UUID postId, UUID userId, String type) {
        var normalized = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        if (!REACTION_TYPES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reaction must be LIKE, HELPFUL, or HEART");
        }
        reader.requirePost(postId);
        var existing = reactionRepository.findByPostIdAndUserId(postId, userId);
        if (existing != null) {
            existing.type = normalized;
            return reactionRepository.save(existing);
        }
        return reactionRepository.save(new PostReaction(postId, userId, normalized));
    }

    /** Removes the caller's own reaction; nothing to remove is not an error. Nobody can remove another's. */
    @Transactional
    public void removeReaction(UUID postId, UUID userId) {
        reader.requirePost(postId);
        var existing = reactionRepository.findByPostIdAndUserId(postId, userId);
        if (existing != null) {
            reactionRepository.delete(existing);
        }
    }
}

package com.manabandhu.backend.post;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Read side of community posts: loads posts or comments plus their counts inside one read-only transaction and
 * returns plain data. Author names are resolved by the caller afterwards, outside this transaction.
 */
@Component
class CommunityPostReader {

    /** Newest posts a feed returns; the app labels the list when it is full. */
    static final int FEED_LIMIT = 100;
    /** Newest comments a post returns. */
    static final int COMMENT_LIMIT = 200;

    record PostRows(List<CommunityPost> posts, Map<UUID, Long> commentCounts,
                    Map<UUID, Map<String, Long>> reactionCounts, Map<UUID, String> viewerReactions) {}

    private final CommunityPostRepository postRepository;
    private final CommunityRepository communityRepository;
    private final PostCommentRepository commentRepository;
    private final PostReactionRepository reactionRepository;

    CommunityPostReader(CommunityPostRepository postRepository, CommunityRepository communityRepository,
                        PostCommentRepository commentRepository, PostReactionRepository reactionRepository) {
        this.postRepository = postRepository;
        this.communityRepository = communityRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
    }

    @Transactional(readOnly = true)
    public PostRows feed(UUID viewerId) {
        return rows(postRepository.findTop100ByOrderByCreatedAtDesc(), viewerId);
    }

    @Transactional(readOnly = true)
    public PostRows communityFeed(UUID communityId, UUID viewerId) {
        if (!communityRepository.existsById(communityId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Community not found");
        }
        return rows(postRepository.findTop100ByCommunityIdOrderByCreatedAtDesc(communityId), viewerId);
    }

    @Transactional(readOnly = true)
    public PostRows one(UUID postId, UUID viewerId) {
        return rows(List.of(requirePost(postId)), viewerId);
    }

    @Transactional(readOnly = true)
    public List<PostComment> comments(UUID postId) {
        requirePost(postId);
        return commentRepository.findTop200ByPostIdOrderByCreatedAtDesc(postId);
    }

    @Transactional(readOnly = true)
    public List<ReactionCount> reactionCounts(UUID postId) {
        var counts = rows(List.of(requirePost(postId)), null).reactionCounts().getOrDefault(postId, Map.of());
        return counts.entrySet().stream().map(e -> new ReactionCount(e.getKey(), e.getValue())).toList();
    }

    CommunityPost requirePost(UUID postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private PostRows rows(List<CommunityPost> posts, UUID viewerId) {
        var commentCounts = new HashMap<UUID, Long>();
        var reactionCounts = new HashMap<UUID, Map<String, Long>>();
        var viewerReactions = new HashMap<UUID, String>();
        if (posts.isEmpty()) return new PostRows(posts, commentCounts, reactionCounts, viewerReactions);
        var ids = posts.stream().map(CommunityPost::getId).toList();
        for (var row : nonNull(commentRepository.countByPostIds(ids))) {
            commentCounts.put((UUID) row[0], ((Number) row[1]).longValue());
        }
        for (var row : nonNull(reactionRepository.countByPostIdsAndType(ids))) {
            reactionCounts.computeIfAbsent((UUID) row[0], k -> new TreeMap<>())
                    .merge(String.valueOf(row[1]).toUpperCase(Locale.ROOT), ((Number) row[2]).longValue(), Long::sum);
        }
        if (viewerId != null) {
            for (var reaction : nonNull(reactionRepository.findByUserIdAndPostIdIn(viewerId, ids))) {
                viewerReactions.put(reaction.getPostId(), reaction.getType().toUpperCase(Locale.ROOT));
            }
        }
        return new PostRows(posts, commentCounts, reactionCounts, viewerReactions);
    }

    private static <T> List<T> nonNull(List<T> rows) {
        return rows == null ? List.of() : rows;
    }
}

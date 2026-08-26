package com.manabandhu.backend.post;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CommunityPostService {

    private final CommunityPostRepository postRepository;
    private final CommunityRepository communityRepository;
    private final PostCommentRepository commentRepository;
    private final PostReactionRepository reactionRepository;

    CommunityPostService(CommunityPostRepository postRepository, CommunityRepository communityRepository,
                         PostCommentRepository commentRepository, PostReactionRepository reactionRepository) {
        this.postRepository = postRepository;
        this.communityRepository = communityRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
    }

    @Transactional(readOnly = true)
    public List<CommunityPost> findAll() {
        return postRepository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public CommunityPost create(UUID ownerId, CreatePostInput input) {
        return postRepository.save(new CommunityPost(ownerId, input.title(), input.body()));
    }

    @Transactional(readOnly = true)
    public List<Community> findAllCommunities() {
        return communityRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Community> findCommunityById(UUID id) {
        return communityRepository.findById(id);
    }

    @Transactional
    public Community createCommunity(UUID ownerId, String name, String description) {
        return communityRepository.save(new Community(ownerId, name, description));
    }

    @Transactional
    public List<PostComment> findCommentsByPost(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    @Transactional
    public PostComment addComment(UUID postId, UUID authorId, String body) {
        return commentRepository.save(new PostComment(postId, authorId, body));
    }

    @Transactional
    public List<PostReaction> findReactionsByPost(UUID postId) {
        return reactionRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }

    @Transactional
    public PostReaction addReaction(UUID postId, UUID userId, String type) {
        var existing = reactionRepository.findByPostIdAndUserId(postId, userId);
        if (existing != null) {
            existing.type = type;
            return reactionRepository.save(existing);
        }
        return reactionRepository.save(new PostReaction(postId, userId, type));
    }
}

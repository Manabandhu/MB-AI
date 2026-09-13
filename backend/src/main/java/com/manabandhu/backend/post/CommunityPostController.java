package com.manabandhu.backend.post;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/posts")
public class CommunityPostController {

    private final CommunityPostService service;

    CommunityPostController(CommunityPostService service) {
        this.service = service;
    }

    @GetMapping
    List<CommunityPost> findAll() {
        return service.findAll();
    }

    @GetMapping("/{postId}")
    CommunityPost findById(@PathVariable UUID postId) {
        return service.findById(postId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Post not found"));
    }

    @PostMapping
    ResponseEntity<CommunityPost> create(
            Authentication authentication, @Valid @RequestBody CreatePostInput input) {
        var post = service.create(UUID.fromString(authentication.getName()), input);
        return ResponseEntity.created(URI.create("/api/v1/posts/" + post.getId())).body(post);
    }

    @GetMapping("/communities")
    List<Community> communities() {
        return service.findAllCommunities();
    }

    @GetMapping("/communities/{communityId}")
    Community community(@PathVariable UUID communityId) {
        return service.findCommunityById(communityId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Community not found"));
    }

    @GetMapping("/communities/{communityId}/posts")
    List<CommunityPost> postsByCommunity(@PathVariable UUID communityId) {
        return service.findPostsByCommunity(communityId);
    }

    @PostMapping("/communities")
    ResponseEntity<Community> createCommunity(Authentication authentication, @Valid @RequestBody CreateCommunityInput input) {
        var community = service.createCommunity(UUID.fromString(authentication.getName()), input.name(), input.description());
        return ResponseEntity.created(URI.create("/api/v1/posts/communities/" + community.getId())).body(community);
    }

    @GetMapping("/{postId}/comments")
    List<PostComment> comments(@PathVariable UUID postId) {
        return service.findCommentsByPost(postId);
    }

    @PostMapping("/{postId}/comments")
    ResponseEntity<PostComment> comment(@PathVariable UUID postId, Authentication authentication,
                                        @Valid @RequestBody CreatePostCommentInput input) {
        var comment = service.addComment(postId, UUID.fromString(authentication.getName()), input.body());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/comments/" + comment.getId())).body(comment);
    }

    @GetMapping("/{postId}/reactions")
    List<PostReaction> reactions(@PathVariable UUID postId) {
        return service.findReactionsByPost(postId);
    }

    @PostMapping("/{postId}/reactions")
    ResponseEntity<PostReaction> react(@PathVariable UUID postId, Authentication authentication,
                                       @Valid @RequestBody CreatePostReactionInput input) {
        var reaction = service.addReaction(postId, UUID.fromString(authentication.getName()), input.type());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/reactions/" + reaction.getId())).body(reaction);
    }
}

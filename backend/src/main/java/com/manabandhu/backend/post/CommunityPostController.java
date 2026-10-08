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
import com.manabandhu.backend.auth.Actor;

@RestController
@RequestMapping("/api/v1/posts")
public class CommunityPostController {

    private final CommunityPostService service;
    private final CommunityMembershipService membershipService;

    CommunityPostController(CommunityPostService service, CommunityMembershipService membershipService) {
        this.service = service;
        this.membershipService = membershipService;
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
        var post = service.create(Actor.require(authentication).id(), input);
        return ResponseEntity.created(URI.create("/api/v1/posts/" + post.getId())).body(post);
    }

    @GetMapping("/communities")
    List<CommunityView> communities(Authentication authentication) {
        return membershipService.views(service.findAllCommunities(), joinedBy(authentication));
    }

    @GetMapping("/communities/{communityId}")
    CommunityView community(Authentication authentication, @PathVariable UUID communityId) {
        var community = service.findCommunity(communityId);
        return CommunityView.of(community, joinedBy(authentication).contains(communityId));
    }

    @PostMapping("/communities/{communityId}/join")
    ResponseEntity<Void> join(Authentication authentication, @PathVariable UUID communityId) {
        membershipService.join(communityId, Actor.require(authentication).id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/communities/{communityId}/leave")
    ResponseEntity<Void> leave(Authentication authentication, @PathVariable UUID communityId) {
        membershipService.leave(communityId, Actor.require(authentication).id());
        return ResponseEntity.noContent().build();
    }

    private java.util.Set<UUID> joinedBy(Authentication authentication) {
        return Actor.from(authentication)
                .map(actor -> membershipService.joinedCommunityIds(actor.id()))
                .orElse(java.util.Set.of());
    }

    @GetMapping("/communities/{communityId}/posts")
    List<CommunityPost> postsByCommunity(@PathVariable UUID communityId) {
        return service.findPostsByCommunity(communityId);
    }

    @PostMapping("/communities")
    ResponseEntity<Community> createCommunity(Authentication authentication, @Valid @RequestBody CreateCommunityInput input) {
        var community = service.createCommunity(Actor.require(authentication).id(), input.name(), input.description());
        return ResponseEntity.created(URI.create("/api/v1/posts/communities/" + community.getId())).body(community);
    }

    @GetMapping("/{postId}/comments")
    List<PostComment> comments(@PathVariable UUID postId) {
        return service.findCommentsByPost(postId);
    }

    @PostMapping("/{postId}/comments")
    ResponseEntity<PostComment> comment(@PathVariable UUID postId, Authentication authentication,
                                        @Valid @RequestBody CreatePostCommentInput input) {
        var comment = service.addComment(postId, Actor.require(authentication).id(), input.body());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/comments/" + comment.getId())).body(comment);
    }

    @GetMapping("/{postId}/reactions")
    List<PostReaction> reactions(@PathVariable UUID postId) {
        return service.findReactionsByPost(postId);
    }

    @PostMapping("/{postId}/reactions")
    ResponseEntity<PostReaction> react(@PathVariable UUID postId, Authentication authentication,
                                       @Valid @RequestBody CreatePostReactionInput input) {
        var reaction = service.addReaction(postId, Actor.require(authentication).id(), input.type());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/reactions/" + reaction.getId())).body(reaction);
    }
}

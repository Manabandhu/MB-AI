package com.manabandhu.backend.community;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
    List<PostView> findAll(Authentication authentication) {
        return service.feed(viewerId(authentication));
    }

    @GetMapping("/{postId}")
    PostView findById(Authentication authentication, @PathVariable UUID postId) {
        return service.view(postId, viewerId(authentication));
    }

    @PostMapping
    ResponseEntity<PostView> create(
            Authentication authentication, @Valid @RequestBody CreatePostInput input) {
        var actor = Actor.require(authentication);
        var post = service.create(actor.id(), input);
        return ResponseEntity.created(URI.create("/api/v1/posts/" + post.getId())).body(service.view(post, actor.id()));
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

    private static UUID viewerId(Authentication authentication) {
        return Actor.from(authentication).map(Actor::id).orElse(null);
    }

    @GetMapping("/communities/{communityId}/posts")
    List<PostView> postsByCommunity(Authentication authentication, @PathVariable UUID communityId) {
        return service.communityFeed(communityId, viewerId(authentication));
    }

    @PostMapping("/communities")
    ResponseEntity<Community> createCommunity(Authentication authentication, @Valid @RequestBody CreateCommunityInput input) {
        var community = service.createCommunity(Actor.require(authentication).id(), input.name(), input.description());
        return ResponseEntity.created(URI.create("/api/v1/posts/communities/" + community.getId())).body(community);
    }

    @GetMapping("/{postId}/comments")
    List<CommentView> comments(Authentication authentication, @PathVariable UUID postId) {
        return service.commentViews(postId, viewerId(authentication));
    }

    @PostMapping("/{postId}/comments")
    ResponseEntity<CommentView> comment(@PathVariable UUID postId, Authentication authentication,
                                        @Valid @RequestBody CreatePostCommentInput input) {
        var actor = Actor.require(authentication);
        var comment = service.addComment(postId, actor.id(), input.body());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/comments/" + comment.getId()))
                .body(service.commentView(comment, actor.id()));
    }

    /** Public: counts per reaction type, without user ids. */
    @GetMapping("/{postId}/reactions")
    List<ReactionCount> reactions(@PathVariable UUID postId) {
        return service.reactionCounts(postId);
    }

    @PostMapping("/{postId}/reactions")
    ResponseEntity<PostReaction> react(@PathVariable UUID postId, Authentication authentication,
                                       @Valid @RequestBody CreatePostReactionInput input) {
        var reaction = service.addReaction(postId, Actor.require(authentication).id(), input.type());
        return ResponseEntity.created(URI.create("/api/v1/posts/" + postId + "/reactions/" + reaction.getId())).body(reaction);
    }

    /** Removes the caller's own reaction from the post. */
    @DeleteMapping("/{postId}/reactions")
    ResponseEntity<Void> unreact(@PathVariable UUID postId, Authentication authentication) {
        service.removeReaction(postId, Actor.require(authentication).id());
        return ResponseEntity.noContent().build();
    }
}

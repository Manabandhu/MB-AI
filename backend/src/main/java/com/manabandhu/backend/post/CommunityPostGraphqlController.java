package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class CommunityPostGraphqlController {

    private final CommunityPostService service;

    CommunityPostGraphqlController(CommunityPostService service) {
        this.service = service;
    }

    @QueryMapping
    List<CommunityPost> communityPosts() {
        return service.findAll();
    }

    @MutationMapping
    CommunityPost createCommunityPost(
            Authentication authentication, @Argument @Valid CreatePostInput input) {
        return service.create(UUID.fromString(authentication.getName()), input);
    }

    @QueryMapping
    List<Community> communities() {
        return service.findAllCommunities();
    }

    @MutationMapping
    Community createCommunity(Authentication authentication, @Argument @Valid CreateCommunityInput input) {
        return service.createCommunity(UUID.fromString(authentication.getName()), input.name(), input.description());
    }

    @QueryMapping
    List<PostComment> postComments(@Argument UUID postId) {
        return service.findCommentsByPost(postId);
    }

    @MutationMapping
    PostComment addPostComment(Authentication authentication, @Argument UUID postId, @Argument @Valid CreatePostCommentInput input) {
        return service.addComment(postId, UUID.fromString(authentication.getName()), input.body());
    }

    @QueryMapping
    List<PostReaction> postReactions(@Argument UUID postId) {
        return service.findReactionsByPost(postId);
    }

    @MutationMapping
    PostReaction addPostReaction(Authentication authentication, @Argument UUID postId, @Argument @Valid CreatePostReactionInput input) {
        return service.addReaction(postId, UUID.fromString(authentication.getName()), input.type());
    }
}

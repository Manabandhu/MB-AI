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
}

package com.manabandhu.backend.post;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
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

    @PostMapping
    ResponseEntity<CommunityPost> create(
            Authentication authentication, @Valid @RequestBody CreatePostInput input) {
        var post = service.create(UUID.fromString(authentication.getName()), input);
        return ResponseEntity.created(URI.create("/api/v1/posts/" + post.getId())).body(post);
    }
}

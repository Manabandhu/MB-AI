package com.manabandhu.backend.post;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CommunityPostService {

    private final CommunityPostRepository repository;

    CommunityPostService(CommunityPostRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<CommunityPost> findAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Transactional
    public CommunityPost create(UUID ownerId, CreatePostInput input) {
        return repository.save(new CommunityPost(ownerId, input.title(), input.body()));
    }
}

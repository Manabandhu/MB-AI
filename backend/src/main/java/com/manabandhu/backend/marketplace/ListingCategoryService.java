package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.common.Paging;

@Service
public class ListingCategoryService {

    private final ListingCategoryRepository repository;

    ListingCategoryService(ListingCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ListingCategory> findAll() {
        return repository.findAllByOrderByNameAsc().stream().limit(Paging.LIST_CAP).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ListingCategory> findById(UUID id) {
        return repository.findById(id);
    }

    /** Moderators manage the category list. */
    @Transactional
    public ListingCategory create(com.manabandhu.backend.auth.Actor actor, String name, String slug) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        if (repository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slug already exists");
        }
        return repository.save(new ListingCategory(name, slug));
    }
}

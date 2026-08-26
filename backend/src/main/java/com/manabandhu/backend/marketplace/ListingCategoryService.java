package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingCategoryService {

    private final ListingCategoryRepository repository;

    ListingCategoryService(ListingCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ListingCategory> findAll() {
        return repository.findAllByOrderByNameAsc();
    }

    @Transactional(readOnly = true)
    public Optional<ListingCategory> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public ListingCategory create(String name, String slug) {
        if (repository.existsBySlug(slug)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Slug already exists");
        }
        return repository.save(new ListingCategory(name, slug));
    }
}

package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingService {

    private final ListingRepository repository;
    private final ListingCategoryRepository categoryRepository;

    ListingService(ListingRepository repository, ListingCategoryRepository categoryRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<Listing> findAll() {
        return repository.findByStatusOrderByCreatedAtDesc("active");
    }

    @Transactional(readOnly = true)
    public Optional<Listing> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public Listing create(UUID ownerId, UUID categoryId, String title, String description, BigDecimal price,
                          String currency, String condition, String location, Boolean negotiable) {
        var category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
        var listing = new Listing(ownerId, category, title, description, price, currency, condition, location, negotiable, "active");
        return repository.save(listing);
    }

    @Transactional
    public Listing update(UUID id, UUID categoryId, String title, String description, BigDecimal price, String currency,
                          String condition, String location, Boolean negotiable, String status) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        if (categoryId != null) {
            var category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
            listing.category = category;
        }
        if (title != null) listing.title = title;
        if (description != null) listing.description = description;
        if (price != null) listing.price = price;
        if (currency != null) listing.currency = currency;
        if (condition != null) listing.condition = condition;
        if (location != null) listing.location = location;
        if (negotiable != null) listing.negotiable = negotiable;
        if (status != null) listing.status = status;
        listing.updatedAt = java.time.Instant.now();
        return repository.save(listing);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
        }
        repository.deleteById(id);
    }
}

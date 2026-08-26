package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingFavoriteService {

    private final ListingFavoriteRepository repository;
    private final ListingRepository listingRepository;

    ListingFavoriteService(ListingFavoriteRepository repository, ListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<ListingFavorite> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public ListingFavorite favorite(UUID userId, UUID listingId) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
        }
        if (repository.existsByListingIdAndUserId(listingId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already favorited");
        }
        return repository.save(new ListingFavorite(listingId, userId));
    }

    @Transactional
    public void unfavorite(UUID userId, UUID listingId) {
        repository.deleteByListingIdAndUserId(listingId, userId);
    }
}

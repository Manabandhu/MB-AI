package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
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
        return repository.findByUserIdOrderByCreatedAtDesc(userId).stream().limit(MarketplaceRules.LIST_CAP).toList();
    }

    /** The saved listings themselves that are still public, newest save first. */
    @Transactional(readOnly = true)
    public List<Listing> savedListings(UUID userId) {
        return listingRepository.findSavedBy(userId, PageRequest.of(0, MarketplaceRules.LIST_CAP));
    }

    @Transactional(readOnly = true)
    public java.util.Set<UUID> savedAmong(UUID userId, java.util.Collection<UUID> listingIds) {
        if (userId == null || listingIds.isEmpty()) return java.util.Set.of();
        return repository.findByUserIdAndListingIdIn(userId, listingIds).stream()
                .map(ListingFavorite::getListingId).collect(java.util.stream.Collectors.toSet());
    }

    /** Saving is idempotent; you cannot save your own listing or one that is no longer active. */
    @Transactional
    public ListingFavorite favorite(UUID userId, UUID listingId) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        if (listing.getOwnerId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot save your own listing");
        }
        var existing = repository.findByUserIdAndListingIdIn(userId, List.of(listingId));
        if (!existing.isEmpty()) return existing.getFirst();
        if (!"active".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only active listings can be saved");
        }
        return repository.save(new ListingFavorite(listingId, userId));
    }

    @Transactional
    public void unfavorite(UUID userId, UUID listingId) {
        repository.deleteByListingIdAndUserId(listingId, userId);
    }
}

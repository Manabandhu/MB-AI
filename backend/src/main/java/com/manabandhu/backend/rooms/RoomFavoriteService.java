package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomFavoriteService {

    private final RoomFavoriteRepository repository;
    private final RoomListingRepository listingRepository;

    RoomFavoriteService(RoomFavoriteRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomFavorite> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public boolean isSaved(UUID listingId, UUID userId) {
        return repository.existsByListingIdAndUserId(listingId, userId);
    }

    @Transactional(readOnly = true)
    public java.util.Set<UUID> findSavedListingIds(UUID userId, java.util.Collection<UUID> listingIds) {
        if (userId == null || listingIds == null || listingIds.isEmpty()) return java.util.Set.of();
        return repository.findByUserIdAndListingIdIn(userId, listingIds).stream()
                .map(RoomFavorite::getListingId)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findSavedListings(UUID userId) {
        return listingRepository.findSavedListingsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public List<RoomListingResponse> findListingResponses(UUID userId, RoomListingService listingService) {
        return findSavedListings(userId).stream()
                .map(l -> RoomListingResponse.from(l,
                        listingService.amenitiesFor(l.getId()),
                        listingService.preferencesFor(l.getId()),
                        true))
                .toList();
    }

    @Transactional
    public RoomFavorite favorite(UUID userId, UUID listingId) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!"active".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You can only save published listings");
        }
        if (repository.existsByListingIdAndUserId(listingId, userId)) {
            return repository.findByListingIdAndUserId(listingId, userId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Favorite not found"));
        }
        return repository.save(new RoomFavorite(listingId, userId));
    }

    @Transactional
    public void unfavorite(UUID userId, UUID listingId) {
        repository.deleteByListingIdAndUserId(listingId, userId);
    }
}

package com.manabandhu.backend.rooms;

import java.util.List;
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

    @Transactional
    public RoomFavorite favorite(UUID userId, UUID listingId) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        if (repository.existsByListingIdAndUserId(listingId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already favorited");
        }
        return repository.save(new RoomFavorite(listingId, userId));
    }

    @Transactional
    public void unfavorite(UUID userId, UUID listingId) {
        repository.deleteByListingIdAndUserId(listingId, userId);
    }
}

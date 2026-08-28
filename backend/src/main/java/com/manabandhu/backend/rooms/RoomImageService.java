package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomImageService {

    private final RoomImageRepository repository;
    private final RoomListingRepository listingRepository;

    RoomImageService(RoomImageRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomImage> findByListingId(UUID listingId) {
        return repository.findByListingIdOrderBySortOrderAsc(listingId);
    }

    @Transactional
    public RoomImage add(UUID listingId, UUID actorId, boolean isAdmin, String url, int sortOrder) {
        requireOwnedListing(listingId, actorId, isAdmin);
        return repository.save(new RoomImage(listingId, url, sortOrder));
    }

    @Transactional
    public void delete(UUID imageId, UUID actorId, boolean isAdmin) {
        var image = repository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room image not found"));
        requireOwnedListing(image.getListingId(), actorId, isAdmin);
        repository.deleteById(imageId);
    }

    private void requireOwnedListing(UUID listingId, UUID actorId, boolean isAdmin) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!isAdmin && !listing.getOwnerId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }
    }
}

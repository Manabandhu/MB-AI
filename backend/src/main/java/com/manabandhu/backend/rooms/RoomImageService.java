package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class RoomImageService {

    static final int MAX_IMAGES = 20;

    private final RoomImageRepository repository;
    private final RoomListingService listingService;
    private final com.manabandhu.backend.media.StorageUrls storageUrls;

    RoomImageService(RoomImageRepository repository, RoomListingService listingService,
                     com.manabandhu.backend.media.StorageUrls storageUrls) {
        this.repository = repository;
        this.listingService = listingService;
        this.storageUrls = storageUrls;
    }

    /** Photos of a public listing, or of the viewer's own listing in any status. */
    @Transactional(readOnly = true)
    public List<RoomImage> findVisible(UUID listingId, Actor viewer) {
        listingService.requireVisible(listingId, viewer);
        return repository.findByListingIdOrderBySortOrderAsc(listingId);
    }

    @Transactional
    public RoomImage add(Actor actor, UUID listingId, String url, int sortOrder) {
        var listing = listingService.requireOwned(actor, listingId);
        // Only images uploaded through ManaBandhu storage into the owner's (or acting admin's) folder.
        storageUrls.requireOwnedImage(url, java.util.Set.of("rooms"), listing.getOwnerId(), actor.id());
        if (repository.countByListingId(listingId) >= MAX_IMAGES) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A listing can have at most " + MAX_IMAGES + " photos");
        }
        return repository.save(new RoomImage(listingId, url, sortOrder));
    }

    @Transactional
    public void delete(Actor actor, UUID imageId) {
        var image = repository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room image not found"));
        listingService.requireOwned(actor, image.getListingId());
        repository.deleteById(imageId);
    }
}

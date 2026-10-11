package com.manabandhu.backend.marketplace;

import java.util.Set;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.media.StorageUrls;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListingImageService {

    private final ListingImageRepository repository;
    private final ListingRepository listingRepository;
    private final StorageUrls storageUrls;

    ListingImageService(ListingImageRepository repository, ListingRepository listingRepository, StorageUrls storageUrls) {
        this.repository = repository;
        this.listingRepository = listingRepository;
        this.storageUrls = storageUrls;
    }

    @Transactional(readOnly = true)
    public List<ListingImage> findByListingId(UUID listingId) {
        return repository.findByListingIdOrderBySortOrderAsc(listingId);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<ListingImage> findById(UUID id) {
        return repository.findById(id);
    }

    /** The listing owner (or an admin) adds an image the owner uploaded through ManaBandhu storage. */
    @Transactional
    public ListingImage add(Actor actor, UUID listingId, String url, int sortOrder) {
        var listing = requireManaged(actor, listingId, "Not authorized to add images to this listing");
        storageUrls.requireOwnedImage(url, Set.of("marketplace"), listing.getOwnerId(), actor.id());
        return repository.save(new ListingImage(listingId, url, sortOrder));
    }

    @Transactional
    public void delete(Actor actor, UUID imageId) {
        var image = repository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
        requireManaged(actor, image.getListingId(), "Not authorized to delete this image");
        repository.deleteById(imageId);
    }

    private Listing requireManaged(Actor actor, UUID listingId, String message) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        actor.requireOwner(listing.getOwnerId(), message);
        return listing;
    }

    @Transactional
    public void deleteByListingId(UUID listingId) {
        repository.deleteByListingId(listingId);
    }
}

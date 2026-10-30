package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.media.MediaService;
import com.manabandhu.backend.media.StorageUrls;

@Service
public class ListingImageService {

    private final ListingImageRepository repository;
    private final ListingRepository listingRepository;
    private final StorageUrls storageUrls;
    private final MediaService mediaService;

    ListingImageService(ListingImageRepository repository, ListingRepository listingRepository, StorageUrls storageUrls,
                        MediaService mediaService) {
        this.repository = repository;
        this.listingRepository = listingRepository;
        this.storageUrls = storageUrls;
        this.mediaService = mediaService;
    }

    /** Photos of a listing the viewer can see. */
    @Transactional(readOnly = true)
    public List<ListingImage> findVisible(UUID listingId, Actor viewer) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        var visible = MarketplaceRules.PUBLIC_STATUSES.contains(listing.getStatus())
                || (viewer != null && (viewer.admin() || viewer.is(listing.getOwnerId())));
        if (!visible) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
        return repository.findByListingIdOrderBySortOrderAsc(listingId);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<ListingImage> findById(UUID id) {
        return repository.findById(id);
    }

    /** The listing owner (or an admin) adds an image the owner uploaded through ManaBandhu storage; at most 10. */
    @Transactional
    public ListingImage add(Actor actor, UUID listingId, String url, int sortOrder) {
        var listing = requireManaged(actor, listingId, "Not authorized to add images to this listing");
        storageUrls.requireOwnedImage(url, Set.of("marketplace"), listing.getOwnerId(), actor.id());
        if (repository.countByListingId(listingId) >= MarketplaceRules.MAX_IMAGES) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A listing can have at most " + MarketplaceRules.MAX_IMAGES + " photos");
        }
        return repository.save(new ListingImage(listingId, url, sortOrder));
    }

    @Transactional
    public void delete(Actor actor, UUID imageId) {
        var image = repository.findById(imageId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found"));
        requireManaged(actor, image.getListingId(), "Not authorized to delete this image");
        repository.deleteById(imageId);
        mediaService.deleteStoredQuietly(image.getUrl());
    }

    /** Removes every photo row and stored file of a listing that is being deleted. */
    @Transactional
    public void deleteAllFor(Listing listing) {
        var images = repository.findByListingIdOrderBySortOrderAsc(listing.getId());
        repository.deleteByListingId(listing.getId());
        images.forEach(image -> mediaService.deleteStoredQuietly(image.getUrl()));
    }

    private Listing requireManaged(Actor actor, UUID listingId, String message) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        actor.requireOwner(listing.getOwnerId(), message);
        return listing;
    }
}

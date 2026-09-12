package com.manabandhu.backend.marketplace;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ListingImageService {

    private final ListingImageRepository repository;

    ListingImageService(ListingImageRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ListingImage> findByListingId(UUID listingId) {
        return repository.findByListingIdOrderBySortOrderAsc(listingId);
    }

    @Transactional(readOnly = true)
    public java.util.Optional<ListingImage> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public ListingImage add(UUID listingId, String url, int sortOrder) {
        var image = new ListingImage(listingId, url, sortOrder);
        return repository.save(image);
    }

    @Transactional
    public void delete(UUID imageId) {
        repository.deleteById(imageId);
    }

    @Transactional
    public void deleteByListingId(UUID listingId) {
        repository.deleteByListingId(listingId);
    }
}

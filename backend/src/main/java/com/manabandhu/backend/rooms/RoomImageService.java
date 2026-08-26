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
    public RoomImage add(UUID listingId, String url, int sortOrder) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        return repository.save(new RoomImage(listingId, url, sortOrder));
    }

    @Transactional
    public void delete(UUID imageId) {
        repository.deleteById(imageId);
    }
}

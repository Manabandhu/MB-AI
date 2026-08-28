package com.manabandhu.backend.rooms;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomAnalyticsService {

    private final RoomAnalyticRepository repository;
    private final RoomListingRepository listingRepository;

    RoomAnalyticsService(RoomAnalyticRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional
    public void record(UUID listingId, String eventType) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        repository.save(new RoomAnalytic(listingId, eventType));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> summary(UUID listingId, UUID actorId, boolean isAdmin) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!isAdmin && !listing.getOwnerId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }
        return Map.of(
                "views", repository.countByListingIdAndEventType(listingId, "view"),
                "saves", repository.countByListingIdAndEventType(listingId, "save"),
                "inquiries", repository.countByListingIdAndEventType(listingId, "inquiry"));
    }
}

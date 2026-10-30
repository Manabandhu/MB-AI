package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class RoomAvailabilityService {

    private final RoomAvailabilityRepository repository;
    private final RoomListingService listingService;

    RoomAvailabilityService(RoomAvailabilityRepository repository, RoomListingService listingService) {
        this.repository = repository;
        this.listingService = listingService;
    }

    /** Availability of a public listing, or of the viewer's own listing in any status. */
    @Transactional(readOnly = true)
    public List<RoomAvailability> findVisible(UUID listingId, Actor viewer) {
        listingService.requireVisible(listingId, viewer);
        return repository.findByListingIdOrderByAvailableFromAsc(listingId);
    }

    @Transactional
    public RoomAvailability create(Actor actor, UUID listingId, CreateRoomAvailabilityInput input) {
        listingService.requireOwned(actor, listingId);
        var availability = new RoomAvailability(listingId, input.availableFrom(), input.availableTo(), input.minStayMonths());
        return repository.save(availability);
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        var availability = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room availability not found"));
        listingService.requireOwned(actor, availability.getListingId());
        repository.deleteById(id);
    }
}

package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomAvailabilityService {

    private final RoomAvailabilityRepository repository;
    private final RoomListingRepository listingRepository;

    RoomAvailabilityService(RoomAvailabilityRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomAvailability> findByListingId(UUID listingId) {
        return repository.findByListingIdOrderByAvailableFromAsc(listingId);
    }

    @Transactional(readOnly = true)
    public Optional<RoomAvailability> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RoomAvailability create(UUID listingId, UUID actorId, boolean isAdmin, CreateRoomAvailabilityInput input) {
        requireOwnedListing(listingId, actorId, isAdmin);
        var availability = new RoomAvailability(listingId, input.availableFrom(), input.availableTo(), input.minStayMonths());
        return repository.save(availability);
    }

    @Transactional
    public void delete(UUID id, UUID actorId, boolean isAdmin) {
        var availability = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room availability not found"));
        requireOwnedListing(availability.getListingId(), actorId, isAdmin);
        repository.deleteById(id);
    }

    private void requireOwnedListing(UUID listingId, UUID actorId, boolean isAdmin) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!isAdmin && !listing.getOwnerId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }
    }
}

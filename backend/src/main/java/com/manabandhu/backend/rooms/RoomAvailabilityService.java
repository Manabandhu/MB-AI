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
    public RoomAvailability create(UUID listingId, CreateRoomAvailabilityInput input) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        var availability = new RoomAvailability(listingId, input.availableFrom(), input.availableTo(), input.minStayMonths());
        return repository.save(availability);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room availability not found");
        }
        repository.deleteById(id);
    }
}

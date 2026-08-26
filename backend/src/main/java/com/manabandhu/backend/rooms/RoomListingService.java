package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomListingService {

    private final RoomListingRepository repository;

    RoomListingService(RoomListingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findAll() {
        return repository.findByStatusOrderByCreatedAtDesc("active");
    }

    @Transactional(readOnly = true)
    public Optional<RoomListing> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public List<RoomListing> search(String location, String roomType) {
        if (location != null && roomType != null) {
            return repository.findByRoomTypeAndStatusOrderByCreatedAtDesc(roomType, "active").stream()
                    .filter(l -> l.getBroadLocation() != null
                            && l.getBroadLocation().toLowerCase().contains(location.toLowerCase()))
                    .toList();
        }
        if (location != null) {
            return repository.findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(location, "active");
        }
        if (roomType != null) {
            return repository.findByRoomTypeAndStatusOrderByCreatedAtDesc(roomType, "active");
        }
        return findAll();
    }

    @Transactional
    public RoomListing create(UUID ownerId, CreateRoomListingInput input) {
        var listing = new RoomListing(ownerId, input.title(), input.description(), input.price(),
                input.roomType(), "active", input.broadLocation(), input.exactAddress(),
                input.latitude(), input.longitude());
        return repository.save(listing);
    }

    @Transactional
    public RoomListing update(UUID id, UpdateRoomListingInput input) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (input.title() != null) listing.setTitle(input.title());
        if (input.description() != null) listing.setDescription(input.description());
        if (input.price() != null) listing.setPrice(input.price());
        if (input.roomType() != null) listing.roomType = input.roomType();
        if (input.broadLocation() != null) listing.broadLocation = input.broadLocation();
        if (input.exactAddress() != null) listing.exactAddress = input.exactAddress();
        if (input.latitude() != null) listing.latitude = input.latitude();
        if (input.longitude() != null) listing.longitude = input.longitude();
        if (input.status() != null) listing.setStatus(input.status());
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        repository.deleteById(id);
    }
}

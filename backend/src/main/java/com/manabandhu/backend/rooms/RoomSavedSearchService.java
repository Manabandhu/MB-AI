package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomSavedSearchService {

    private final RoomSavedSearchRepository repository;

    RoomSavedSearchService(RoomSavedSearchRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RoomSavedSearch> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public RoomSavedSearch findOwnedById(UUID id, UUID userId) {
        var search = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Saved search not found"));
        if (!search.getUserId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this saved search");
        }
        return search;
    }

    @Transactional
    public RoomSavedSearch create(UUID userId, CreateSavedSearchInput input) {
        if (repository.existsByUserIdAndName(userId, input.name())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A saved search with this name already exists");
        }
        var search = new RoomSavedSearch(userId, input.name(), input.query(), input.city(),
                input.broadLocation(), input.roomType(), input.minPrice(), input.maxPrice(),
                input.availableFrom(), input.furnished(), input.alertsEnabled() == null || input.alertsEnabled());
        return repository.save(search);
    }

    @Transactional
    public RoomSavedSearch update(UUID id, UUID userId, UpdateSavedSearchInput input) {
        var search = findOwnedById(id, userId);
        if (input.name() != null) search.setName(input.name());
        if (input.query() != null) search.setQuery(input.query());
        if (input.city() != null) search.setCity(input.city());
        if (input.broadLocation() != null) search.setBroadLocation(input.broadLocation());
        if (input.roomType() != null) search.setRoomType(input.roomType());
        if (input.minPrice() != null) search.setMinPrice(input.minPrice());
        if (input.maxPrice() != null) search.setMaxPrice(input.maxPrice());
        if (input.availableFrom() != null) search.setAvailableFrom(input.availableFrom());
        if (input.furnished() != null) search.setFurnished(input.furnished());
        if (input.alertsEnabled() != null) search.setAlertsEnabled(input.alertsEnabled());
        return repository.save(search);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        var search = findOwnedById(id, userId);
        repository.delete(search);
    }
}

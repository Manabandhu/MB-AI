package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomsService {

    private final RoomListingRepository listingRepository;
    private final RoomBookingRepository bookingRepository;

    RoomsService(RoomListingRepository listingRepository, RoomBookingRepository bookingRepository) {
        this.listingRepository = listingRepository;
        this.bookingRepository = bookingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findAllActive() {
        return listingRepository.findByStatusOrderByCreatedAtDesc("active");
    }

    @Transactional(readOnly = true)
    public List<RoomListing> search(String location) {
        if (location == null || location.isBlank()) {
            return findAllActive();
        }
        return listingRepository.findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(location, "active");
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findSaved() {
        return listingRepository.findByStatusOrderByCreatedAtDesc("saved");
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findMyListings(UUID ownerId) {
        return listingRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    @Transactional(readOnly = true)
    public Optional<RoomListing> findById(UUID id) {
        return listingRepository.findById(id);
    }

    @Transactional
    public RoomListing create(UUID ownerId, String title, String description, BigDecimal price, String roomType,
                              String broadLocation, String exactAddress, BigDecimal latitude, BigDecimal longitude) {
        return listingRepository.save(new RoomListing(ownerId, title, description, price, roomType, "active",
                broadLocation, exactAddress, latitude, longitude));
    }

    @Transactional
    public RoomListing update(UUID id, String title, String description, BigDecimal price, String status) {
        var listing = listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (title != null) listing.title = title;
        if (description != null) listing.description = description;
        if (price != null) listing.price = price;
        if (status != null) listing.status = status;
        listing.updatedAt = java.time.Instant.now();
        return listingRepository.save(listing);
    }

    @Transactional
    public void delete(UUID id) {
        if (!listingRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        listingRepository.deleteById(id);
    }

    @Transactional
    public RoomBooking book(UUID listingId, UUID requesterId, String message) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!"active".equals(listing.status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Listing is not available");
        }
        return bookingRepository.save(new RoomBooking(listingId, requesterId, "pending", message));
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findBookings(UUID listingId) {
        return bookingRepository.findByListingIdOrderByCreatedAtDesc(listingId);
    }
}

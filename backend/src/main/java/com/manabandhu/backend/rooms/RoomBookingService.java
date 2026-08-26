package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomBookingService {

    private final RoomBookingRepository repository;
    private final RoomListingRepository listingRepository;

    RoomBookingService(RoomBookingRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findByListingId(UUID listingId) {
        return repository.findByListingIdOrderByCreatedAtDesc(listingId);
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findByRequester(UUID requesterId) {
        return repository.findByRequesterIdOrderByCreatedAtDesc(requesterId);
    }

    @Transactional(readOnly = true)
    public Optional<RoomBooking> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RoomBooking create(UUID listingId, UUID requesterId, CreateRoomBookingInput input) {
        if (!listingRepository.existsById(listingId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
        }
        var booking = new RoomBooking(listingId, requesterId, "pending", input.message());
        return repository.save(booking);
    }

    @Transactional
    public RoomBooking updateStatus(UUID id, String status) {
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        booking.setStatus(status);
        return repository.save(booking);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found");
        }
        repository.deleteById(id);
    }
}

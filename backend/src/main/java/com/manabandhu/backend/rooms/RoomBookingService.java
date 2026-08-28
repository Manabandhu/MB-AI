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

    private static final List<String> STATUSES = List.of("pending", "accepted", "rejected", "cancelled");

    private final RoomBookingRepository repository;
    private final RoomListingRepository listingRepository;

    RoomBookingService(RoomBookingRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findByListingId(UUID listingId, UUID actorId, boolean isAdmin) {
        requireListingParticipant(listingId, actorId, isAdmin);
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

    @Transactional(readOnly = true)
    public RoomBooking requireBooking(UUID id, UUID actorId, boolean isAdmin) {
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        if (!isAdmin && !booking.getRequesterId().equals(actorId)
                && !listingOwnerEquals(booking.getListingId(), actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this booking");
        }
        return booking;
    }

    @Transactional
    public RoomBooking create(UUID listingId, UUID requesterId, CreateRoomBookingInput input) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (listing.getOwnerId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot send an inquiry to your own listing");
        }
        if (!"active".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This listing is not accepting inquiries");
        }
        if (repository.existsByListingIdAndRequesterIdAndStatus(listingId, requesterId, "pending")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending inquiry for this listing");
        }
        var booking = new RoomBooking(listingId, requesterId, "pending", input.message());
        return repository.save(booking);
    }

    @Transactional
    public RoomBooking updateStatus(UUID id, UUID actorId, boolean isAdmin, String status) {
        if (!STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown booking status: " + status);
        }
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        var isOwner = listingOwnerEquals(booking.getListingId(), actorId);
        if (!isAdmin && !isOwner && !booking.getRequesterId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot modify this booking");
        }
        if ("cancelled".equals(status) && !booking.getRequesterId().equals(actorId) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the requester can cancel an inquiry");
        }
        if (("accepted".equals(status) || "rejected".equals(status)) && !isOwner && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the listing owner can accept or reject an inquiry");
        }
        booking.setStatus(status);
        return repository.save(booking);
    }

    @Transactional
    public void delete(UUID id, UUID actorId, boolean isAdmin) {
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        if (!isAdmin && !booking.getRequesterId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this booking");
        }
        repository.deleteById(id);
    }

    private void requireListingParticipant(UUID listingId, UUID actorId, boolean isAdmin) {
        var listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!isAdmin && !listing.getOwnerId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view bookings for this listing");
        }
    }

    private boolean listingOwnerEquals(UUID listingId, UUID actorId) {
        return listingRepository.findById(listingId).map(l -> l.getOwnerId().equals(actorId)).orElse(false);
    }
}

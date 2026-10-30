package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Booking requests on a listing. REST and GraphQL both go through {@link #create}. */
@Service
public class RoomBookingService {

    static final int LIST_CAP = 200;

    /** pending can be decided or withdrawn; an accepted booking can still be cancelled; the rest are final. */
    private static final Map<String, List<String>> TRANSITIONS = Map.of(
            "pending", List.of("accepted", "rejected", "cancelled"),
            "accepted", List.of("cancelled"),
            "rejected", List.of(),
            "cancelled", List.of());

    private final RoomBookingRepository repository;
    private final RoomListingRepository listingRepository;

    RoomBookingService(RoomBookingRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findByListingId(Actor actor, UUID listingId) {
        var listing = requireListing(listingId);
        if (!actor.admin() && !actor.is(listing.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot view bookings for this listing");
        }
        return repository.findByListingIdOrderByCreatedAtDesc(listingId, PageRequest.of(0, LIST_CAP));
    }

    @Transactional(readOnly = true)
    public List<RoomBooking> findByRequester(Actor actor) {
        return repository.findByRequesterIdOrderByCreatedAtDesc(actor.id(), PageRequest.of(0, LIST_CAP));
    }

    @Transactional(readOnly = true)
    public RoomBooking requireBooking(Actor actor, UUID id) {
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        if (!actor.admin() && !actor.is(booking.getRequesterId()) && !isListingOwner(booking.getListingId(), actor)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access this booking");
        }
        return booking;
    }

    @Transactional
    public RoomBooking create(UUID listingId, UUID requesterId, CreateRoomBookingInput input) {
        var listing = requireListing(listingId);
        if (listing.getOwnerId().equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot send an inquiry to your own listing");
        }
        if (!"active".equals(listing.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This listing is not accepting inquiries");
        }
        if (repository.existsByListingIdAndRequesterIdAndStatus(listingId, requesterId, "pending")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending inquiry for this listing");
        }
        return repository.save(new RoomBooking(listingId, requesterId, "pending", input.message()));
    }

    /** The owner accepts or rejects; the requester cancels. The row is locked so two decisions cannot both apply. */
    @Transactional
    public RoomBooking updateStatus(Actor actor, UUID id, String status) {
        if (status == null || !TRANSITIONS.containsKey(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown booking status: " + status);
        }
        var booking = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        var isOwner = isListingOwner(booking.getListingId(), actor);
        var isRequester = actor.is(booking.getRequesterId());
        if (!actor.admin() && !isOwner && !isRequester) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot modify this booking");
        }
        if ("cancelled".equals(status) && !isRequester && !actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the requester can cancel an inquiry");
        }
        if (("accepted".equals(status) || "rejected".equals(status)) && !isOwner && !actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the listing owner can accept or reject an inquiry");
        }
        if (status.equals(booking.getStatus())) {
            return booking;
        }
        if (!TRANSITIONS.getOrDefault(booking.getStatus(), List.of()).contains(status)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot change a " + booking.getStatus() + " booking to " + status);
        }
        booking.setStatus(status);
        return repository.save(booking);
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        var booking = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
        if (!actor.admin() && !actor.is(booking.getRequesterId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot delete this booking");
        }
        repository.delete(booking);
    }

    private RoomListing requireListing(UUID listingId) {
        return listingRepository.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
    }

    private boolean isListingOwner(UUID listingId, Actor actor) {
        return listingRepository.findById(listingId).map(l -> actor.is(l.getOwnerId())).orElse(false);
    }
}

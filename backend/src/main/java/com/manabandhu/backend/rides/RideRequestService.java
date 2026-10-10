package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Seat requests: the rider asks, the driver accepts or rejects, the rider may withdraw. */
@Service
public class RideRequestService {

    static final String PENDING = "pending";
    static final String ACCEPTED = "accepted";
    static final String REJECTED = "rejected";
    static final String WITHDRAWN = "withdrawn";

    private final RideRequestRepository repository;
    private final RideOfferRepository offerRepository;
    private final RideBookingRepository bookingRepository;
    private final RideParticipantRepository participantRepository;
    private final RideAccess access;

    RideRequestService(RideRequestRepository repository, RideOfferRepository offerRepository,
                       RideBookingRepository bookingRepository, RideParticipantRepository participantRepository,
                       RideAccess access) {
        this.repository = repository;
        this.offerRepository = offerRepository;
        this.bookingRepository = bookingRepository;
        this.participantRepository = participantRepository;
        this.access = access;
    }

    /** The driver and admins see every request; anyone else sees only their own. */
    @Transactional(readOnly = true)
    public List<RideRequest> listForRide(Actor actor, UUID rideId) {
        var offer = access.requireOffer(rideId);
        if (access.canManage(actor, offer)) {
            return repository.findByRideIdOrderByCreatedAtDesc(rideId);
        }
        return repository.findByRideIdAndRiderIdOrderByCreatedAtDesc(rideId, actor.id());
    }

    @Transactional(readOnly = true)
    public List<RideRequest> findByRider(UUID riderId) {
        return repository.findByRiderIdOrderByCreatedAtDesc(riderId);
    }

    @Transactional(readOnly = true)
    public Optional<RideRequest> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public RideRequest requireVisible(Actor actor, UUID id) {
        var request = requireRequest(id);
        var offer = access.requireOffer(request.getRideId());
        actor.requireAnyOf("Not authorized to view this request", request.getRiderId(), offer.getDriverId());
        return request;
    }

    @Transactional
    public RideRequest create(UUID rideId, Actor actor, CreateRideRequestInput input) {
        var riderId = actor.id();
        var offer = access.requireOffer(rideId);
        if (offer.getDriverId().equals(riderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot request a seat on your own ride");
        }
        // Checked here because the driver accepts later with their own token, which carries no rider attributes.
        access.requireEligibleRider(actor, offer);
        if (!"active".equalsIgnoreCase(offer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride is not accepting requests");
        }
        if (repository.existsByRideIdAndRiderIdAndStatus(rideId, riderId, "pending")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending request for this ride");
        }
        var request = new RideRequest(rideId, riderId, input.seatsRequested(), input.message(), "pending");
        return repository.save(request);
    }

    /**
     * Transitions: pending → accepted | rejected (driver), pending → withdrawn (rider), accepted → rejected (driver)
     * or withdrawn (rider). Accepting reserves the seats on the row-locked offer and adds the rider as a participant;
     * leaving the accepted state returns them. Rejected and withdrawn are terminal.
     */
    @Transactional
    public RideRequest updateStatus(Actor actor, UUID id, String rawStatus) {
        var status = rawStatus == null ? "" : rawStatus.trim().toLowerCase(Locale.ROOT);
        if (!List.of(PENDING, ACCEPTED, REJECTED, WITHDRAWN).contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be one of pending, accepted, rejected, withdrawn");
        }
        // Lock the request, then the offer, so two concurrent accepts cannot both reserve seats.
        var request = repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
        var offer = offerRepository.findByIdForUpdate(request.getRideId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (WITHDRAWN.equals(status)) {
            actor.requireOwner(request.getRiderId(), "Only the rider can withdraw this request");
        } else {
            access.requireDriver(actor, offer);
        }
        var current = request.getStatus() == null ? PENDING : request.getStatus().toLowerCase(Locale.ROOT);
        if (status.equals(current)) {
            return request;
        }
        var allowed = switch (current) {
            case PENDING -> !PENDING.equals(status);
            case ACCEPTED -> REJECTED.equals(status) || WITHDRAWN.equals(status);
            default -> false;
        };
        if (!allowed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " request cannot become " + status);
        }
        if (ACCEPTED.equals(status)) {
            reserveSeats(offer, request);
        } else if (ACCEPTED.equals(current)) {
            releaseSeats(offer, request);
        }
        request.setStatus(status);
        return repository.save(request);
    }

    private void reserveSeats(RideOffer offer, RideRequest request) {
        if (!"active".equalsIgnoreCase(offer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride is not accepting riders");
        }
        if (offer.getDepartureAt() != null && offer.getDepartureAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride has already departed");
        }
        if (bookingRepository.existsByRideIdAndUserIdAndStatusNot(offer.getId(), request.getRiderId(), RideBookingService.CANCELLED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This rider already has a booking on this ride");
        }
        if (offer.getSeatsAvailable() < request.getSeatsRequested()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough seats available");
        }
        offer.setSeatsAvailable(offer.getSeatsAvailable() - request.getSeatsRequested());
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);
        if (!participantRepository.existsByRideIdAndUserId(offer.getId(), request.getRiderId())) {
            participantRepository.save(new RideParticipant(offer.getId(), request.getRiderId(), "rider"));
        }
    }

    private void releaseSeats(RideOffer offer, RideRequest request) {
        offer.setSeatsAvailable(Math.min(offer.getSeatsTotal(), offer.getSeatsAvailable() + request.getSeatsRequested()));
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);
        // Keep the participant row when the rider still holds a live booking on this ride.
        if (!bookingRepository.existsByRideIdAndUserIdAndStatusNot(offer.getId(), request.getRiderId(), RideBookingService.CANCELLED)) {
            participantRepository.deleteByRideIdAndUserId(offer.getId(), request.getRiderId());
        }
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        var request = requireRequest(id);
        actor.requireOwner(request.getRiderId(), "Not your ride request");
        repository.delete(request);
    }

    private RideRequest requireRequest(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
    }
}

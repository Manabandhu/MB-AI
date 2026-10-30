package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;

/**
 * Seat bookings. Every non-cancelled booking holds its seats; cancelling is terminal and returns them.
 * Seat changes always run against a row-locked offer so concurrent requests cannot oversell a ride.
 */
@Service
public class RideBookingService {

    static final String PENDING = "pending";
    static final String CONFIRMED = "confirmed";
    static final String CANCELLED = "cancelled";
    private static final Set<String> STATUSES = Set.of(PENDING, CONFIRMED, CANCELLED);


    private final RideBookingRepository repository;
    private final RideOfferRepository offerRepository;
    private final RideAccess access;
    private final RideMembership membership;
    private final RideParticipantRepository participantRepository;

    RideBookingService(RideBookingRepository repository, RideOfferRepository offerRepository, RideAccess access,
                       RideMembership membership, RideParticipantRepository participantRepository) {
        this.repository = repository;
        this.offerRepository = offerRepository;
        this.access = access;
        this.membership = membership;
        this.participantRepository = participantRepository;
    }

    /** All bookings for internal coordination (for example provisioning the ride chat). */
    @Transactional(readOnly = true)
    public List<RideBooking> findByRideId(UUID rideId) {
        return repository.findByRideIdOrderByCreatedAtDesc(rideId);
    }

    /** The driver and admins see every booking; anyone else sees only their own. */
    @Transactional(readOnly = true)
    public List<RideBooking> listForRide(Actor actor, UUID rideId) {
        var offer = access.requireOffer(rideId);
        if (access.canManage(actor, offer)) {
            return repository.findByRideIdOrderByCreatedAtDesc(rideId);
        }
        return repository.findByRideIdAndUserIdOrderByCreatedAtDesc(rideId, actor.id());
    }

    @Transactional(readOnly = true)
    public List<RideBooking> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId, Paging.firstPage());
    }

    @Transactional(readOnly = true)
    public Optional<RideBooking> findById(UUID id) {
        return repository.findById(id);
    }

    /** Visible to the passenger who booked, the driver, and admins. */
    @Transactional(readOnly = true)
    public RideBooking requireVisible(Actor actor, UUID id) {
        var booking = requireBooking(id);
        var offer = access.requireOffer(booking.getRideId());
        actor.requireAnyOf("Not authorized to view this booking", booking.getUserId(), offer.getDriverId());
        return booking;
    }

    @Transactional
    public RideBooking create(UUID rideId, Actor actor, CreateRideBookingInput input) {
        var userId = actor.id();
        var offer = lockOffer(rideId);
        if (offer.getDriverId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot book a seat on your own ride");
        }
        access.requireEligibleRider(actor, offer);
        if (!"active".equalsIgnoreCase(offer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride is not accepting bookings");
        }
        if (offer.getDepartureAt() != null && offer.getDepartureAt().isBefore(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride has already departed");
        }
        if (repository.existsByRideIdAndUserIdAndStatusNot(rideId, userId, CANCELLED)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a booking on this ride");
        }
        if (access.hasAcceptedRequest(userId, rideId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Your seat request on this ride was already accepted");
        }
        if (offer.getSeatsAvailable() < input.seatsBooked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough seats available");
        }
        adjustSeats(offer, -input.seatsBooked());
        var booking = repository.save(new RideBooking(rideId, userId, input.seatsBooked(), CONFIRMED));
        // A booked rider is part of the ride: listed with the participants and allowed into the ride chat.
        if (!participantRepository.existsByRideIdAndUserId(rideId, userId)) {
            participantRepository.save(new RideParticipant(rideId, userId, "rider"));
        }
        return booking;
    }

    /**
     * Status changes: the passenger may cancel; the driver may confirm or cancel. Cancelled is terminal,
     * so a booking can never re-acquire seats it already returned — the passenger books again instead.
     */
    @Transactional
    public RideBooking updateStatus(Actor actor, UUID id, String rawStatus) {
        var status = normalize(rawStatus);
        // Lock the booking, then the offer, so two cancellations cannot both return the same seats.
        var booking = lockBooking(id);
        var offer = lockOffer(booking.getRideId());
        var isDriver = access.canManage(actor, offer);
        var isPassenger = actor.is(booking.getUserId());
        if (!isDriver && !isPassenger) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to update this booking");
        }
        if (status.equals(booking.getStatus())) {
            return booking;
        }
        if (CANCELLED.equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A cancelled booking cannot be reopened; book again instead");
        }
        if (!CANCELLED.equals(status) && !isDriver) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver can confirm a booking");
        }
        if (CANCELLED.equals(status)) {
            adjustSeats(offer, booking.getSeatsBooked());
        }
        booking.setStatus(status);
        var saved = repository.saveAndFlush(booking);
        if (CANCELLED.equals(status)) {
            membership.leaveIfNoSeat(offer, booking.getUserId());
        }
        return saved;
    }

    /** Deleting a live booking returns its seats first. */
    @Transactional
    public void delete(Actor actor, UUID id) {
        var booking = lockBooking(id);
        var offer = lockOffer(booking.getRideId());
        actor.requireAnyOf("Not authorized to delete this booking", booking.getUserId(), offer.getDriverId());
        if (!CANCELLED.equals(booking.getStatus())) {
            adjustSeats(offer, booking.getSeatsBooked());
        }
        repository.delete(booking);
        repository.flush();
        membership.leaveIfNoSeat(offer, booking.getUserId());
    }

    private RideBooking requireBooking(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride booking not found"));
    }

    private RideBooking lockBooking(UUID id) {
        return repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride booking not found"));
    }

    private RideOffer lockOffer(UUID rideId) {
        return offerRepository.findByIdForUpdate(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    private void adjustSeats(RideOffer offer, int delta) {
        var seats = Math.min(offer.getSeatsTotal(), Math.max(0, offer.getSeatsAvailable() + delta));
        offer.setSeatsAvailable(seats);
        offer.setUpdatedAt(Instant.now());
        offerRepository.save(offer);
    }

    private static String normalize(String status) {
        var value = status == null ? "" : status.trim().toLowerCase(Locale.ROOT);
        if (!STATUSES.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be one of pending, confirmed, cancelled");
        }
        return value;
    }
}

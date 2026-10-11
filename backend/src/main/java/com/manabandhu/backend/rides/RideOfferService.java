package com.manabandhu.backend.rides;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class RideOfferService {

    static final java.util.Set<String> OFFER_STATUSES =
            java.util.Set.of("draft", "active", "in_progress", "completed", "cancelled");

    static final int LIST_CAP = 200;

    private final RideOfferRepository repository;
    private final RideAccess access;
    private final RideMembership membership;
    private final com.manabandhu.backend.chat.ConversationParticipantService chatParticipants;

    RideOfferService(RideOfferRepository repository, RideAccess access, RideMembership membership,
                     com.manabandhu.backend.chat.ConversationParticipantService chatParticipants) {
        this.repository = repository;
        this.access = access;
        this.membership = membership;
        this.chatParticipants = chatParticipants;
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAllById(List<UUID> ids) {
        return repository.findAllById(ids);
    }

    /** Fails with 403 unless the caller is the driver, a passenger, or an admin. */
    @Transactional(readOnly = true)
    public void requireRideMember(Actor actor, RideOffer offer) {
        access.requireMember(actor, offer);
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAllForAdmin() {
        return repository.findAll(org.springframework.data.domain.PageRequest.of(0, 500,
                org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "createdAt")))
                .getContent();
    }

    @Transactional(readOnly = true)
    public Optional<RideOffer> findById(UUID id) {
        return repository.findById(id);
    }

    /** The driver's newest offers, capped. */
    @Transactional(readOnly = true)
    public List<RideOffer> findByDriver(UUID driverId) {
        return repository.findByDriverIdOrderByCreatedAtDesc(driverId,
                org.springframework.data.domain.PageRequest.of(0, LIST_CAP));
    }

    /** Finished, cancelled, or departed rides the user drove or rode on. */
    @Transactional(readOnly = true)
    public List<RideOffer> findHistory(UUID userId) {
        return repository.findHistoryFor(userId, Instant.now(),
                org.springframework.data.domain.PageRequest.of(0, LIST_CAP));
    }

    @Transactional(readOnly = true)
    public Page<RideOffer> search(String origin, String destination, Pageable pageable) {
        return searchActive(origin, destination, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<RideOffer> searchActive(String origin, String destination, Boolean avoidTolls,
                                        String genderPreference, Boolean isRecurring, Pageable pageable) {
        return repository.searchActive(Instant.now(), origin, destination, avoidTolls, genderPreference, isRecurring, pageable);
    }

    @Transactional
    public RideOffer create(UUID driverId, CreateRideOfferInput input) {
        var offer = new RideOffer(driverId, input.originArea(), input.destinationArea(), input.departureAt(),
                input.seatsTotal(), input.seatsTotal(), input.contribution(), "active");
        if (input.originLat() != null) offer.setOriginLat(input.originLat());
        if (input.originLng() != null) offer.setOriginLng(input.originLng());
        if (input.destinationLat() != null) offer.setDestinationLat(input.destinationLat());
        if (input.destinationLng() != null) offer.setDestinationLng(input.destinationLng());
        if (input.routePolyline() != null) offer.setRoutePolyline(input.routePolyline());
        if (input.distanceMiles() != null) offer.setDistanceMiles(input.distanceMiles());
        if (input.estimatedDurationMins() != null) offer.setEstimatedDurationMins(input.estimatedDurationMins());
        if (input.tollPreference() != null) offer.setTollPreference(input.tollPreference());
        if (input.estimatedTollAmount() != null) offer.setEstimatedTollAmount(input.estimatedTollAmount());
        if (input.isRecurring() != null) offer.setIsRecurring(input.isRecurring());
        if (input.recurrencePattern() != null) offer.setRecurrencePattern(input.recurrencePattern());
        if (input.recurringDays() != null) offer.setRecurringDays(input.recurringDays());
        if (input.luggageCapacity() != null) offer.setLuggageCapacity(input.luggageCapacity());
        if (input.genderPreference() != null) offer.setGenderPreference(input.genderPreference());
        return repository.save(offer);
    }

    /** Clones one of the driver's rides with a new future departure; admins cannot create rides for others. */
    @Transactional
    public RideOffer reactivate(Actor actor, UUID originalRideId, Instant newDepartureAt) {
        var original = repository.findById(originalRideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Original ride offer not found"));
        if (!actor.is(original.getDriverId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only re-activate your own rides");
        }
        if (newDepartureAt == null || !newDepartureAt.isAfter(Instant.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a departure time in the future");
        }
        var driverId = actor.id();
        var clone = new RideOffer(
                driverId,
                original.getOriginArea(),
                original.getDestinationArea(),
                newDepartureAt,
                original.getSeatsTotal(),
                original.getSeatsTotal(),
                original.getContribution(),
                "active"
        );
        clone.setOriginLat(original.getOriginLat());
        clone.setOriginLng(original.getOriginLng());
        clone.setDestinationLat(original.getDestinationLat());
        clone.setDestinationLng(original.getDestinationLng());
        clone.setRoutePolyline(original.getRoutePolyline());
        clone.setDistanceMiles(original.getDistanceMiles());
        clone.setEstimatedDurationMins(original.getEstimatedDurationMins());
        clone.setTollPreference(original.getTollPreference());
        clone.setEstimatedTollAmount(original.getEstimatedTollAmount());
        clone.setIsRecurring(original.getIsRecurring());
        clone.setRecurrencePattern(original.getRecurrencePattern());
        clone.setRecurringDays(original.getRecurringDays());
        clone.setLuggageCapacity(original.getLuggageCapacity());
        clone.setGenderPreference(original.getGenderPreference());

        return repository.save(clone);
    }

    /** draft → active|cancelled; active → in_progress|completed|cancelled; in_progress → completed|cancelled. */
    private static final java.util.Map<String, java.util.Set<String>> TRANSITIONS = java.util.Map.of(
            "draft", java.util.Set.of("active", "cancelled"),
            "active", java.util.Set.of("in_progress", "completed", "cancelled"),
            "in_progress", java.util.Set.of("completed", "cancelled"),
            "completed", java.util.Set.of(),
            "cancelled", java.util.Set.of());

    /**
     * The driver (or an admin) moves the ride through its lifecycle. Cancelling releases every rider's seat, removes
     * them from the ride and its chat, and notifies them. Completing starts the two-hour chat expiry.
     */
    @Transactional
    public RideOffer updateStatus(Actor actor, UUID id, String status) {
        // Statuses are stored lowercase to match the ride_offers_status_valid constraint.
        var normalized = status == null ? "" : status.trim().toLowerCase(java.util.Locale.ROOT);
        if (!OFFER_STATUSES.contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be one of draft, active, in_progress, completed, cancelled");
        }
        var offer = lock(id);
        access.requireDriver(actor, offer);
        var current = offer.getStatus() == null ? "active" : offer.getStatus().toLowerCase(java.util.Locale.ROOT);
        if (current.equals(normalized)) {
            return offer;
        }
        if (!TRANSITIONS.getOrDefault(current, java.util.Set.of()).contains(normalized)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " ride cannot become " + normalized);
        }
        if ("cancelled".equals(normalized)) {
            membership.releaseEveryone(offer, actor.id(), "cancelled");
        }
        offer.setStatus(normalized);
        if ("completed".equals(normalized)) {
            Instant now = Instant.now();
            offer.setCompletedAt(now);
            offer.setChatExpiresAt(now.plus(Duration.ofHours(2)));
        }
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    /** Driver edits. Seat counts can never drop below the seats riders already hold. */
    @Transactional
    public RideOffer update(Actor actor, UUID id, UpdateRideOfferInput input) {
        var offer = lock(id);
        access.requireDriver(actor, offer);
        var current = offer.getStatus() == null ? "" : offer.getStatus().toLowerCase(java.util.Locale.ROOT);
        if ("completed".equals(current) || "cancelled".equals(current)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " ride cannot be edited");
        }
        if (input.seatsTotal() != null || input.seatsAvailable() != null) {
            var held = membership.heldSeats(id);
            var total = input.seatsTotal() != null ? input.seatsTotal() : offer.getSeatsTotal();
            if (total < held) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Riders already hold " + held + " seats; the ride needs at least that many");
            }
            var available = input.seatsAvailable() != null ? input.seatsAvailable() : total - held;
            if (available > total - held) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "At most " + (total - held) + " seats can be open");
            }
            offer.setSeatsTotal(total);
            offer.setSeatsAvailable(available);
        }
        if (input.originArea() != null) offer.setOriginArea(input.originArea().trim());
        if (input.destinationArea() != null) offer.setDestinationArea(input.destinationArea().trim());
        if (input.originLat() != null) offer.setOriginLat(input.originLat());
        if (input.originLng() != null) offer.setOriginLng(input.originLng());
        if (input.destinationLat() != null) offer.setDestinationLat(input.destinationLat());
        if (input.destinationLng() != null) offer.setDestinationLng(input.destinationLng());
        if (input.routePolyline() != null) offer.setRoutePolyline(input.routePolyline());
        if (input.distanceMiles() != null) offer.setDistanceMiles(input.distanceMiles());
        if (input.estimatedDurationMins() != null) offer.setEstimatedDurationMins(input.estimatedDurationMins());
        if (input.tollPreference() != null) offer.setTollPreference(input.tollPreference());
        if (input.estimatedTollAmount() != null) offer.setEstimatedTollAmount(input.estimatedTollAmount());
        if (input.isRecurring() != null) offer.setIsRecurring(input.isRecurring());
        if (input.recurrencePattern() != null) offer.setRecurrencePattern(input.recurrencePattern());
        if (input.recurringDays() != null) offer.setRecurringDays(input.recurringDays());
        if (input.luggageCapacity() != null) offer.setLuggageCapacity(input.luggageCapacity());
        if (input.genderPreference() != null) offer.setGenderPreference(input.genderPreference());
        if (input.departureAt() != null) offer.setDepartureAt(input.departureAt());
        if (input.contribution() != null) offer.setContribution(input.contribution().trim());
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    /** Opens or blocks seats; never below zero and never more than the seats riders are not holding. */
    @Transactional
    public RideOffer adjustSeats(Actor actor, UUID rideId, int seatsToAdd) {
        var offer = lock(rideId);
        access.requireDriver(actor, offer);
        var free = offer.getSeatsTotal() - membership.heldSeats(rideId);
        offer.setSeatsAvailable(Math.min(free, Math.max(0, offer.getSeatsAvailable() + seatsToAdd)));
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    /** Deleting a ride first releases and notifies its riders, as cancelling does. */
    @Transactional
    public void delete(Actor actor, UUID id) {
        var offer = lock(id);
        access.requireDriver(actor, offer);
        membership.releaseEveryone(offer, actor.id(), "removed");
        if (offer.getConversationId() != null) {
            chatParticipants.leave(offer.getConversationId(), offer.getDriverId());
        }
        repository.delete(offer);
    }

    private RideOffer lock(UUID id) {
        return repository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    @Transactional
    public void attachConversation(UUID rideId, UUID conversationId, Instant expiresAt) {
        var offer = repository.findByIdForUpdate(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        offer.setConversationId(conversationId);
        offer.setChatExpiresAt(expiresAt);
        repository.save(offer);
    }
}

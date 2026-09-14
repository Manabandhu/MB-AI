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

@Service
public class RideOfferService {

    private final RideOfferRepository repository;

    RideOfferService(RideOfferRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAll() {
        return repository.findByStatusOrderByDepartureAtAsc("active");
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAllForAdmin() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<RideOffer> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findByDriver(UUID driverId) {
        return repository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findDriverHistory(UUID driverId) {
        return repository.findByDriverIdOrderByDepartureAtDesc(driverId);
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
                input.seatsTotal(), input.seatsTotal(), input.contribution(), "ACTIVE");
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

    @Transactional
    public RideOffer reactivate(UUID originalRideId, UUID driverId, Instant newDepartureAt) {
        var original = repository.findById(originalRideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Original ride offer not found"));
        if (!original.getDriverId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only re-activate your own rides");
        }

        Instant departure = newDepartureAt != null ? newDepartureAt : Instant.now().plus(Duration.ofDays(1));

        var clone = new RideOffer(
                driverId,
                original.getOriginArea(),
                original.getDestinationArea(),
                departure,
                original.getSeatsTotal(),
                original.getSeatsTotal(),
                original.getContribution(),
                "ACTIVE"
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

    @Transactional
    public RideOffer updateStatus(UUID id, UUID actorId, boolean isAdmin, String status) {
        var offer = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to update this ride");
        }
        String upper = status.toUpperCase();
        offer.setStatus(upper);
        if ("COMPLETED".equals(upper)) {
            Instant now = Instant.now();
            offer.setCompletedAt(now);
            offer.setChatExpiresAt(now.plus(Duration.ofHours(2)));
        }
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    @Transactional
    public RideOffer update(UUID id, UpdateRideOfferInput input) {
        var offer = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (input.originArea() != null) offer.setOriginArea(input.originArea());
        if (input.destinationArea() != null) offer.setDestinationArea(input.destinationArea());
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
        if (input.seatsTotal() != null) offer.setSeatsTotal(input.seatsTotal());
        if (input.seatsAvailable() != null) offer.setSeatsAvailable(input.seatsAvailable());
        if (input.contribution() != null) offer.setContribution(input.contribution());
        if (input.status() != null) offer.setStatus(input.status());
        if (input.completedAt() != null) offer.setCompletedAt(input.completedAt());
        if (input.conversationId() != null) offer.setConversationId(input.conversationId());
        if (input.chatExpiresAt() != null) offer.setChatExpiresAt(input.chatExpiresAt());
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    @Transactional
    public RideOffer adjustSeats(UUID rideId, int seatsToAdd) {
        var offer = repository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        offer.setSeatsAvailable(Math.max(0, offer.getSeatsAvailable() + seatsToAdd));
        offer.setUpdatedAt(Instant.now());
        return repository.save(offer);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found");
        }
        repository.deleteById(id);
    }

    @Transactional
    public void attachConversation(UUID rideId, UUID conversationId, Instant expiresAt) {
        var offer = repository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        offer.setConversationId(conversationId);
        offer.setChatExpiresAt(expiresAt);
        repository.save(offer);
    }
}

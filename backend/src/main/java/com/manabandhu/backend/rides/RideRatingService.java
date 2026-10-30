package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RideRatingService {

    private final RideRatingRepository repository;
    private final RideAccess access;

    RideRatingService(RideRatingRepository repository, RideAccess access) {
        this.repository = repository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<RideRating> findByRideId(UUID rideId) {
        return repository.findByRideIdOrderByCreatedAtDesc(rideId).stream().limit(200).toList();
    }

    @Transactional(readOnly = true)
    public List<RideRating> findByRatee(UUID rateeId) {
        return repository.findByRateeIdOrderByCreatedAtDesc(rateeId).stream().limit(200).toList();
    }

    @Transactional(readOnly = true)
    public Optional<RideRating> findById(UUID id) {
        return repository.findById(id);
    }

    /** People who shared a completed ride rate each other once per pair; a passenger may omit the ratee to rate the driver. */
    @Transactional
    public RideRating create(UUID rideId, UUID raterId, CreateRideRatingInput input) {
        var offer = access.requireOffer(rideId);
        var rateeId = input.rateeId() != null ? input.rateeId() : offer.getDriverId();
        if (!onRide(raterId, offer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver and passengers of this ride can rate each other");
        }
        if (!"completed".equalsIgnoreCase(offer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You can rate a ride once it is completed");
        }
        if (raterId.equals(rateeId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot rate yourself");
        }
        // Only people who shared the ride can rate each other, once per pair.
        if (!onRide(raterId, offer) || !onRide(rateeId, offer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver and passengers of this ride can rate each other");
        }
        if (repository.existsByRideIdAndRaterIdAndRateeId(rideId, raterId, rateeId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already rated this person for this ride");
        }
        var rating = new RideRating(rideId, raterId, rateeId, input.rating(), input.comment());
        return repository.save(rating);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found");
        }
        repository.deleteById(id);
    }

    private boolean onRide(UUID userId, RideOffer offer) {
        return offer.getDriverId().equals(userId) || access.isPassenger(userId, offer.getId());
    }
}

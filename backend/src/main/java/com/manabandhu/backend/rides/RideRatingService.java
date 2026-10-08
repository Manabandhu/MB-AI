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
        return repository.findByRideIdOrderByCreatedAtDesc(rideId);
    }

    @Transactional(readOnly = true)
    public List<RideRating> findByRatee(UUID rateeId) {
        return repository.findByRateeIdOrderByCreatedAtDesc(rateeId);
    }

    @Transactional(readOnly = true)
    public Optional<RideRating> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RideRating create(UUID rideId, UUID raterId, CreateRideRatingInput input) {
        var offer = access.requireOffer(rideId);
        if (raterId.equals(input.rateeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot rate yourself");
        }
        // Only people who shared the ride can rate each other, once per pair.
        if (!onRide(raterId, offer) || !onRide(input.rateeId(), offer)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the driver and passengers of this ride can rate each other");
        }
        if (repository.existsByRideIdAndRaterIdAndRateeId(rideId, raterId, input.rateeId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already rated this person for this ride");
        }
        var rating = new RideRating(rideId, raterId, input.rateeId(), input.rating(), input.comment());
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

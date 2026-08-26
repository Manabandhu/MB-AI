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
    private final RideOfferRepository offerRepository;

    RideRatingService(RideRatingRepository repository, RideOfferRepository offerRepository) {
        this.repository = repository;
        this.offerRepository = offerRepository;
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
        if (!offerRepository.existsById(rideId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found");
        }
        if (raterId.equals(input.rateeId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot rate yourself");
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
}

package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RidesService {

    private final RideOfferRepository offerRepository;
    private final RideParticipantRepository participantRepository;
    private final RideRatingRepository ratingRepository;

    RidesService(RideOfferRepository offerRepository, RideParticipantRepository participantRepository,
                 RideRatingRepository ratingRepository) {
        this.offerRepository = offerRepository;
        this.participantRepository = participantRepository;
        this.ratingRepository = ratingRepository;
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAllOpen() {
        return offerRepository.findByStatusOrderByDepartureAtAsc("active");
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findMyRides(UUID driverId) {
        return offerRepository.findByDriverIdOrderByCreatedAtDesc(driverId);
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findHistory() {
        return offerRepository.findByStatusOrderByDepartureAtAsc("completed");
    }

    @Transactional(readOnly = true)
    public Optional<RideOffer> findOfferById(UUID id) {
        return offerRepository.findById(id);
    }

    @Transactional
    public RideOffer createOffer(UUID driverId, String originArea, String destinationArea, Instant departureAt,
                                 int seatsTotal, String contribution) {
        return offerRepository.save(new RideOffer(driverId, originArea, destinationArea, departureAt, seatsTotal,
                seatsTotal, contribution, "active"));
    }

    @Transactional(readOnly = true)
    public List<RideRating> findRatings(UUID rideId) {
        return ratingRepository.findByRideIdOrderByCreatedAtDesc(rideId);
    }
}

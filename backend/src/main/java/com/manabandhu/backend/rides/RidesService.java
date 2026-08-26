package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RidesService {

    private final RideOfferRepository offerRepository;
    private final RideRequestRepository requestRepository;
    private final RideParticipantRepository participantRepository;
    private final RideRatingRepository ratingRepository;

    RidesService(RideOfferRepository offerRepository, RideRequestRepository requestRepository,
                 RideParticipantRepository participantRepository, RideRatingRepository ratingRepository) {
        this.offerRepository = offerRepository;
        this.requestRepository = requestRepository;
        this.participantRepository = participantRepository;
        this.ratingRepository = ratingRepository;
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findAllOpen() {
        return offerRepository.findByStatusOrderByDepartureAtAsc("open");
    }

    @Transactional(readOnly = true)
    public List<RideOffer> findSaved() {
        return offerRepository.findByStatusOrderByDepartureAtAsc("saved");
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

    @Transactional(readOnly = true)
    public List<RideRequest> findRequests(UUID rideId) {
        return requestRepository.findByRideIdOrderByCreatedAtDesc(rideId);
    }

    @Transactional(readOnly = true)
    public List<RideParticipant> findParticipants(UUID rideId) {
        return participantRepository.findByRideIdOrderByJoinedAtAsc(rideId);
    }

    @Transactional
    public RideOffer createOffer(UUID driverId, String originArea, String destinationArea, Instant departureAt,
                                 int seatsTotal, String contribution) {
        return offerRepository.save(new RideOffer(driverId, originArea, destinationArea, departureAt, seatsTotal,
                seatsTotal, contribution, "open"));
    }

    @Transactional
    public RideRequest requestSeat(UUID rideId, UUID riderId, int seatsRequested, String message) {
        return requestRepository.save(new RideRequest(rideId, riderId, seatsRequested, message, "pending"));
    }

    @Transactional
    public RideRequest updateRequestStatus(UUID id, String status) {
        var request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
        request.status = status;
        return requestRepository.save(request);
    }

    @Transactional
    public RideRating rate(UUID rideId, UUID raterId, UUID rateeId, int rating, String comment) {
        return ratingRepository.save(new RideRating(rideId, raterId, rateeId, rating, comment));
    }

    @Transactional(readOnly = true)
    public List<RideRating> findRatings(UUID rideId) {
        return ratingRepository.findByRideIdOrderByCreatedAtDesc(rideId);
    }
}

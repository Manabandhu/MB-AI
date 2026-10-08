package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class RideParticipantService {

    private final RideParticipantRepository repository;
    private final RideOfferRepository offerRepository;
    private final RideAccess access;

    RideParticipantService(RideParticipantRepository repository, RideOfferRepository offerRepository, RideAccess access) {
        this.repository = repository;
        this.offerRepository = offerRepository;
        this.access = access;
    }

    /** Participant lists are private to the ride's driver, passengers, and admins. */
    @Transactional(readOnly = true)
    public List<RideParticipant> listForRide(Actor actor, UUID rideId) {
        access.requireMember(actor, access.requireOffer(rideId));
        return repository.findByRideIdOrderByJoinedAtAsc(rideId);
    }

    /**
     * Joins the caller to a ride. The role is derived, never client-chosen: the driver joins as
     * {@code driver}; anyone else must already hold a booking or accepted request and joins as {@code rider}.
     */
    @Transactional
    public RideParticipant join(Actor actor, UUID rideId) {
        var offer = access.requireOffer(rideId);
        if (actor.is(offer.getDriverId())) {
            return addParticipant(rideId, actor.id(), "driver");
        }
        if (!access.isPassenger(actor.id(), rideId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Book a seat or get your request accepted first");
        }
        return addParticipant(rideId, actor.id(), "rider");
    }

    @Transactional
    public void delete(Actor actor, UUID participantId) {
        var participant = repository.findById(participantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Participant not found"));
        var offer = access.requireOffer(participant.getRideId());
        actor.requireAnyOf("Not authorized to remove participant", participant.getUserId(), offer.getDriverId());
        repository.delete(participant);
    }

    @Transactional(readOnly = true)
    public List<RideParticipant> findByRideId(UUID rideId) {
        return repository.findByRideIdOrderByJoinedAtAsc(rideId);
    }

    @Transactional(readOnly = true)
    public List<RideParticipant> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByJoinedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Optional<RideParticipant> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RideParticipant addParticipant(UUID rideId, UUID userId, String role) {
        if (!offerRepository.existsById(rideId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found");
        }
        if (repository.existsByRideIdAndUserId(rideId, userId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User already a participant");
        }
        var participant = new RideParticipant(rideId, userId, role);
        return repository.save(participant);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride participant not found");
        }
        repository.deleteById(id);
    }
}

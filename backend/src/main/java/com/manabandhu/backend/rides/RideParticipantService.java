package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RideParticipantService {

    private final RideParticipantRepository repository;
    private final RideOfferRepository offerRepository;

    RideParticipantService(RideParticipantRepository repository, RideOfferRepository offerRepository) {
        this.repository = repository;
        this.offerRepository = offerRepository;
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
        if (repository.existsById(userId)) {
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

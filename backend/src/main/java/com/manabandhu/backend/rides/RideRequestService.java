package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RideRequestService {

    private final RideRequestRepository repository;

    RideRequestService(RideRequestRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<RideRequest> findByRideId(UUID rideId) {
        return repository.findByRideIdOrderByCreatedAtDesc(rideId);
    }

    @Transactional(readOnly = true)
    public List<RideRequest> findByRider(UUID riderId) {
        return repository.findByRiderIdOrderByCreatedAtDesc(riderId);
    }

    @Transactional(readOnly = true)
    public Optional<RideRequest> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RideRequest create(UUID rideId, UUID riderId, CreateRideRequestInput input) {
        var request = new RideRequest(rideId, riderId, input.seatsRequested(), input.message(), "pending");
        return repository.save(request);
    }

    @Transactional
    public RideRequest updateStatus(UUID id, String status) {
        var request = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
        request.setStatus(status);
        return repository.save(request);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found");
        }
        repository.deleteById(id);
    }
}

package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Seat requests: the rider asks, the driver accepts or rejects, the rider may withdraw. */
@Service
public class RideRequestService {

    private final RideRequestRepository repository;
    private final RideAccess access;

    RideRequestService(RideRequestRepository repository, RideAccess access) {
        this.repository = repository;
        this.access = access;
    }

    /** The driver and admins see every request; anyone else sees only their own. */
    @Transactional(readOnly = true)
    public List<RideRequest> listForRide(Actor actor, UUID rideId) {
        var offer = access.requireOffer(rideId);
        if (access.canManage(actor, offer)) {
            return repository.findByRideIdOrderByCreatedAtDesc(rideId);
        }
        return repository.findByRideIdAndRiderIdOrderByCreatedAtDesc(rideId, actor.id());
    }

    @Transactional(readOnly = true)
    public List<RideRequest> findByRider(UUID riderId) {
        return repository.findByRiderIdOrderByCreatedAtDesc(riderId);
    }

    @Transactional(readOnly = true)
    public Optional<RideRequest> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public RideRequest requireVisible(Actor actor, UUID id) {
        var request = requireRequest(id);
        var offer = access.requireOffer(request.getRideId());
        actor.requireAnyOf("Not authorized to view this request", request.getRiderId(), offer.getDriverId());
        return request;
    }

    @Transactional
    public RideRequest create(UUID rideId, UUID riderId, CreateRideRequestInput input) {
        var offer = access.requireOffer(rideId);
        if (offer.getDriverId().equals(riderId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot request a seat on your own ride");
        }
        if (!"active".equalsIgnoreCase(offer.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This ride is not accepting requests");
        }
        if (repository.existsByRideIdAndRiderIdAndStatus(rideId, riderId, "pending")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have a pending request for this ride");
        }
        var request = new RideRequest(rideId, riderId, input.seatsRequested(), input.message(), "pending");
        return repository.save(request);
    }

    /** The driver may accept or reject; the rider may only withdraw their own request. */
    @Transactional
    public RideRequest updateStatus(Actor actor, UUID id, String rawStatus) {
        var status = rawStatus == null ? "" : rawStatus.trim().toLowerCase(Locale.ROOT);
        var request = requireRequest(id);
        var offer = access.requireOffer(request.getRideId());
        switch (status) {
            case "accepted", "rejected", "pending" -> access.requireDriver(actor, offer);
            case "withdrawn" -> actor.requireOwner(request.getRiderId(), "Only the rider can withdraw this request");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Status must be one of pending, accepted, rejected, withdrawn");
        }
        request.setStatus(status);
        return repository.save(request);
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        var request = requireRequest(id);
        actor.requireOwner(request.getRiderId(), "Not your ride request");
        repository.delete(request);
    }

    private RideRequest requireRequest(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
    }
}

package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
    public List<RideOffer> search(String origin, String destination) {
        if (origin != null && destination != null) {
            return repository.findByStatusAndOriginAreaContainingIgnoreCaseAndDestinationAreaContainingIgnoreCaseOrderByDepartureAtAsc(
                    "active", origin, destination);
        }
        if (origin != null) {
            return repository.findByOriginAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(origin, "active");
        }
        if (destination != null) {
            return repository.findByDestinationAreaContainingIgnoreCaseAndStatusOrderByDepartureAtAsc(destination, "active");
        }
        return findAll();
    }

    @Transactional
    public RideOffer create(UUID driverId, CreateRideOfferInput input) {
        var offer = new RideOffer(driverId, input.originArea(), input.destinationArea(), input.departureAt(),
                input.seatsTotal(), input.seatsTotal(), input.contribution(), "active");
        return repository.save(offer);
    }

    @Transactional
    public RideOffer update(UUID id, UpdateRideOfferInput input) {
        var offer = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (input.originArea() != null) offer.setOriginArea(input.originArea());
        if (input.destinationArea() != null) offer.setDestinationArea(input.destinationArea());
        if (input.departureAt() != null) offer.setDepartureAt(input.departureAt());
        if (input.seatsTotal() != null) offer.setSeatsTotal(input.seatsTotal());
        if (input.seatsAvailable() != null) offer.setSeatsAvailable(input.seatsAvailable());
        if (input.contribution() != null) offer.setContribution(input.contribution());
        if (input.status() != null) offer.setStatus(input.status());
        offer.setUpdatedAt(java.time.Instant.now());
        return repository.save(offer);
    }

    @Transactional
    public RideOffer adjustSeats(UUID rideId, int seatsToAdd) {
        var offer = repository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        offer.setSeatsAvailable(Math.max(0, offer.getSeatsAvailable() + seatsToAdd));
        offer.setUpdatedAt(java.time.Instant.now());
        return repository.save(offer);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found");
        }
        repository.deleteById(id);
    }
}

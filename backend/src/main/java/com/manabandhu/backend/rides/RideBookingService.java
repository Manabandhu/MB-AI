package com.manabandhu.backend.rides;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RideBookingService {

    private final RideBookingRepository repository;
    private final RideOfferRepository offerRepository;

    RideBookingService(RideBookingRepository repository, RideOfferRepository offerRepository) {
        this.repository = repository;
        this.offerRepository = offerRepository;
    }

    @Transactional(readOnly = true)
    public List<RideBooking> findByRideId(UUID rideId) {
        return repository.findByRideIdOrderByCreatedAtDesc(rideId);
    }

    @Transactional(readOnly = true)
    public List<RideBooking> findByUserId(UUID userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public Optional<RideBooking> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional
    public RideBooking create(UUID rideId, UUID userId, CreateRideBookingInput input) {
        var offer = offerRepository.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (offer.getSeatsAvailable() < input.seatsBooked()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Not enough seats available");
        }
        var booking = new RideBooking(rideId, userId, input.seatsBooked(), "confirmed");
        offer.setSeatsAvailable(offer.getSeatsAvailable() - input.seatsBooked());
        offer.setUpdatedAt(java.time.Instant.now());
        offerRepository.save(offer);
        return repository.save(booking);
    }

    @Transactional
    public RideBooking updateStatus(UUID id, String status) {
        var booking = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride booking not found"));
        if ("cancelled".equals(booking.getStatus()) && "cancelled".equals(status)) {
            return booking;
        }
        if ("cancelled".equals(status) && !"cancelled".equals(booking.getStatus())) {
            var offer = offerRepository.findById(booking.getRideId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
            offer.setSeatsAvailable(offer.getSeatsAvailable() + booking.getSeatsBooked());
            offer.setUpdatedAt(java.time.Instant.now());
            offerRepository.save(offer);
        }
        booking.setStatus(status);
        return repository.save(booking);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride booking not found");
        }
        repository.deleteById(id);
    }
}

package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RideBookingServiceTest {

    @Mock
    RideBookingRepository bookingRepository;

    @Mock
    RideOfferRepository offerRepository;

    @InjectMocks
    RideBookingService service;

    @Test
    void createDecrementsAvailableSeats() {
        var rideId = UUID.randomUUID();
        var userId = UUID.randomUUID();
        var offer = new RideOffer(UUID.randomUUID(), "Irving", "Dallas", Instant.now().plusSeconds(3600),
                3, 3, "$15", "active");
        var input = new CreateRideBookingInput(2);
        when(offerRepository.findById(rideId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var booking = service.create(rideId, userId, input);
        assertThat(booking.getSeatsBooked()).isEqualTo(2);
        assertThat(booking.getUserId()).isEqualTo(userId);
        assertThat(offer.getSeatsAvailable()).isEqualTo(1);
    }

    @Test
    void createThrowsConflictWhenNotEnoughSeats() {
        var rideId = UUID.randomUUID();
        var userId = UUID.randomUUID();
        var offer = new RideOffer(UUID.randomUUID(), "Irving", "Dallas", Instant.now().plusSeconds(3600),
                3, 1, "$15", "active");
        var input = new CreateRideBookingInput(2);
        when(offerRepository.findById(rideId)).thenReturn(Optional.of(offer));
        assertThatThrownBy(() -> service.create(rideId, userId, input))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void updateStatusToCancelledReleasesSeats() {
        var bookingId = UUID.randomUUID();
        var rideId = UUID.randomUUID();
        var offer = new RideOffer(UUID.randomUUID(), "Irving", "Dallas", Instant.now().plusSeconds(3600),
                3, 1, "$15", "active");
        var booking = new RideBooking(rideId, UUID.randomUUID(), 2, "confirmed");
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(offerRepository.findById(rideId)).thenReturn(Optional.of(offer));
        when(offerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.updateStatus(bookingId, "cancelled");
        assertThat(result.getStatus()).isEqualTo("cancelled");
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }
}

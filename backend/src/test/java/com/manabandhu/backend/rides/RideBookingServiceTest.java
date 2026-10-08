package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@ExtendWith(MockitoExtension.class)
class RideBookingServiceTest {

    @Mock
    RideBookingRepository bookingRepository;

    @Mock
    RideOfferRepository offerRepository;

    @Mock
    RideParticipantRepository participantRepository;

    @Mock
    RideRequestRepository requestRepository;

    RideBookingService service;

    final UUID driverId = UUID.randomUUID();
    final UUID riderId = UUID.randomUUID();
    RideOffer offer;

    @BeforeEach
    void setUp() {
        var access = new RideAccess(offerRepository, bookingRepository, requestRepository, participantRepository);
        service = new RideBookingService(bookingRepository, offerRepository, access);
        offer = new RideOffer(driverId, "Irving", "Dallas", Instant.now().plusSeconds(3600), 3, 3, "$15", "active");
        lenient().when(offerRepository.findByIdForUpdate(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(offerRepository.findById(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(offerRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static Actor user(UUID id) {
        return new Actor(id, false, false);
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    void createDecrementsAvailableSeats() {
        var booking = service.create(offer.getId(), riderId, new CreateRideBookingInput(2));
        assertThat(booking.getSeatsBooked()).isEqualTo(2);
        assertThat(booking.getUserId()).isEqualTo(riderId);
        assertThat(offer.getSeatsAvailable()).isEqualTo(1);
    }

    @Test
    void createRejectsOverbooking() {
        assertThatThrownBy(() -> service.create(offer.getId(), riderId, new CreateRideBookingInput(4)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void driverCannotBookOwnRide() {
        assertThatThrownBy(() -> service.create(offer.getId(), driverId, new CreateRideBookingInput(1)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void cannotBookACancelledRide() {
        offer.setStatus("cancelled");
        assertThatThrownBy(() -> service.create(offer.getId(), riderId, new CreateRideBookingInput(1)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void cancellingReleasesSeats() {
        var booking = new RideBooking(offer.getId(), riderId, 2, "confirmed");
        offer.setSeatsAvailable(1);
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        var result = service.updateStatus(user(riderId), booking.getId(), "cancelled");

        assertThat(result.getStatus()).isEqualTo("cancelled");
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }

    /** Regression: cancel -> confirm -> cancel used to add the same seats back repeatedly. */
    @Test
    void cancelledBookingCannotBeReopened() {
        var booking = new RideBooking(offer.getId(), riderId, 2, "cancelled");
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.updateStatus(user(driverId), booking.getId(), "confirmed"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }

    @Test
    void passengerCannotConfirmTheirOwnBooking() {
        var booking = new RideBooking(offer.getId(), riderId, 1, "pending");
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.updateStatus(user(riderId), booking.getId(), "confirmed"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void strangerCannotTouchABooking() {
        var booking = new RideBooking(offer.getId(), riderId, 1, "confirmed");
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> service.updateStatus(user(UUID.randomUUID()), booking.getId(), "cancelled"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    void unknownStatusIsRejected() {
        assertThatThrownBy(() -> service.updateStatus(user(riderId), UUID.randomUUID(), "teleported"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void deletingALiveBookingReturnsSeats() {
        var booking = new RideBooking(offer.getId(), riderId, 2, "confirmed");
        offer.setSeatsAvailable(1);
        when(bookingRepository.findById(booking.getId())).thenReturn(Optional.of(booking));

        service.delete(user(riderId), booking.getId());

        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        verify(bookingRepository).delete(booking);
    }
}

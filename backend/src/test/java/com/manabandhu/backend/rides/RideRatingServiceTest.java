package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
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

@ExtendWith(MockitoExtension.class)
class RideRatingServiceTest {

    @Mock
    RideRatingRepository ratingRepository;

    @Mock
    RideOfferRepository offerRepository;

    @Mock
    RideBookingRepository bookingRepository;

    @Mock
    RideRequestRepository requestRepository;

    @Mock
    RideParticipantRepository participantRepository;

    RideRatingService service;

    final UUID driverId = UUID.randomUUID();
    final UUID riderId = UUID.randomUUID();
    RideOffer offer;

    @BeforeEach
    void setUp() {
        service = new RideRatingService(ratingRepository,
                new RideAccess(offerRepository, bookingRepository, requestRepository, participantRepository));
        offer = new RideOffer(driverId, "Irving", "Dallas", Instant.now().minusSeconds(3600), 3, 2, "$15", "completed");
        lenient().when(offerRepository.findById(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(ratingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void passengerCanRateDriver() {
        when(bookingRepository.existsByRideIdAndUserIdAndStatusNot(offer.getId(), riderId, "cancelled")).thenReturn(true);
        var rating = service.create(offer.getId(), riderId, new CreateRideRatingInput(driverId, 5, "Great ride!"));
        assertThat(rating.getRating()).isEqualTo(5);
        assertThat(rating.getRaterId()).isEqualTo(riderId);
        assertThat(rating.getRateeId()).isEqualTo(driverId);
    }

    @Test
    void selfRatingIsRejected() {
        assertThatThrownBy(() -> service.create(offer.getId(), driverId, new CreateRideRatingInput(driverId, 5, "Me!")))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void outsidersCannotRate() {
        var outsider = UUID.randomUUID();
        assertThatThrownBy(() -> service.create(offer.getId(), outsider, new CreateRideRatingInput(driverId, 1, "Fake")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void duplicateRatingIsRejected() {
        when(bookingRepository.existsByRideIdAndUserIdAndStatusNot(offer.getId(), riderId, "cancelled")).thenReturn(true);
        when(ratingRepository.existsByRideIdAndRaterIdAndRateeId(offer.getId(), riderId, driverId)).thenReturn(true);
        assertThatThrownBy(() -> service.create(offer.getId(), riderId, new CreateRideRatingInput(driverId, 5, "Again")))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }
}

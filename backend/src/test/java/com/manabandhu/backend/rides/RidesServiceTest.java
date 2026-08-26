package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class RidesServiceTest {

    @Test
    void createOfferAndFindById() {
        var offerRepo = mock(RideOfferRepository.class);
        var requestRepo = mock(RideRequestRepository.class);
        var participantRepo = mock(RideParticipantRepository.class);
        var ratingRepo = mock(RideRatingRepository.class);
        when(offerRepo.save(any(RideOffer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RidesService(offerRepo, requestRepo, participantRepo, ratingRepo);
        var driverId = UUID.randomUUID();
        var departureAt = Instant.now().plusSeconds(3600);
        var offer = service.createOffer(driverId, "Irving", "DFW", departureAt, 3, "$15");

        assertThat(offer).isNotNull();
        assertThat(offer.getDriverId()).isEqualTo(driverId);
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThat(offer.getStatus()).isEqualTo("open");
        verify(offerRepo).save(any(RideOffer.class));
    }

    @Test
    void requestSeat() {
        var offerRepo = mock(RideOfferRepository.class);
        var requestRepo = mock(RideRequestRepository.class);
        var participantRepo = mock(RideParticipantRepository.class);
        var ratingRepo = mock(RideRatingRepository.class);
        when(requestRepo.save(any(RideRequest.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RidesService(offerRepo, requestRepo, participantRepo, ratingRepo);
        var rideId = UUID.randomUUID();
        var request = service.requestSeat(rideId, UUID.randomUUID(), 2, "I can make it");

        assertThat(request).isNotNull();
        assertThat(request.getRideId()).isEqualTo(rideId);
        assertThat(request.getSeatsRequested()).isEqualTo(2);
        assertThat(request.getStatus()).isEqualTo("pending");
        verify(requestRepo).save(any(RideRequest.class));
    }

    @Test
    void rateRide() {
        var offerRepo = mock(RideOfferRepository.class);
        var requestRepo = mock(RideRequestRepository.class);
        var participantRepo = mock(RideParticipantRepository.class);
        var ratingRepo = mock(RideRatingRepository.class);
        when(ratingRepo.save(any(RideRating.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RidesService(offerRepo, requestRepo, participantRepo, ratingRepo);
        var rideId = UUID.randomUUID();
        var rating = service.rate(rideId, UUID.randomUUID(), UUID.randomUUID(), 5, "Great ride");

        assertThat(rating).isNotNull();
        assertThat(rating.getRideId()).isEqualTo(rideId);
        assertThat(rating.getRating()).isEqualTo(5);
        verify(ratingRepo).save(any(RideRating.class));
    }
}

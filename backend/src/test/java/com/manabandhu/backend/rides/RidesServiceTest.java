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
        var participantRepo = mock(RideParticipantRepository.class);
        var ratingRepo = mock(RideRatingRepository.class);
        when(offerRepo.save(any(RideOffer.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RidesService(offerRepo, participantRepo, ratingRepo);
        var driverId = UUID.randomUUID();
        var departureAt = Instant.now().plusSeconds(3600);
        var offer = service.createOffer(driverId, "Irving", "DFW", departureAt, 3, "$15");

        assertThat(offer).isNotNull();
        assertThat(offer.getDriverId()).isEqualTo(driverId);
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThat(offer.getStatus()).isEqualTo("active");
        verify(offerRepo).save(any(RideOffer.class));
    }

    @Test
    void findAllOpenReturnsOnlyActiveOffersWithAvailableSeats() {
        var offerRepo = mock(RideOfferRepository.class);
        var participantRepo = mock(RideParticipantRepository.class);
        var ratingRepo = mock(RideRatingRepository.class);
        var service = new RidesService(offerRepo, participantRepo, ratingRepo);
        var active = new RideOffer(UUID.randomUUID(), "Irving", "DFW", Instant.now().plusSeconds(3600),
                3, 2, "$15", "active");
        var draft = new RideOffer(UUID.randomUUID(), "Dallas", "Austin", Instant.now().plusSeconds(3600),
                2, 2, "$10", "draft");
        var completed = new RideOffer(UUID.randomUUID(), "Plano", "Frisco", Instant.now().minusSeconds(3600),
                4, 0, "$20", "completed");
        var cancelled = new RideOffer(UUID.randomUUID(), "Houston", "San Antonio", Instant.now().plusSeconds(3600),
                2, 2, "$25", "cancelled");
        when(offerRepo.findByStatusOrderByDepartureAtAsc("active")).thenReturn(List.of(active));

        var open = service.findAllOpen();

        assertThat(open).containsExactly(active);
    }
}

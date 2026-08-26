package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
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

@ExtendWith(MockitoExtension.class)
class RideOfferServiceTest {

    @Mock
    RideOfferRepository repository;

    @InjectMocks
    RideOfferService service;

    @Test
    void createMapsInputToEntity() {
        var driverId = UUID.randomUUID();
        var departureAt = Instant.now().plusSeconds(3600);
        var input = new CreateRideOfferInput("Irving", "Dallas", departureAt, 3, "$15 contribution");
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var offer = service.create(driverId, input);
        assertThat(offer.getOriginArea()).isEqualTo("Irving");
        assertThat(offer.getDestinationArea()).isEqualTo("Dallas");
        assertThat(offer.getSeatsTotal()).isEqualTo(3);
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThat(offer.getStatus()).isEqualTo("active");
    }

    @Test
    void adjustSeatsUpdatesAvailableSeats() {
        var rideId = UUID.randomUUID();
        var offer = new RideOffer(UUID.randomUUID(), "Irving", "Dallas", Instant.now().plusSeconds(3600),
                3, 3, "$15", "active");
        when(repository.findById(rideId)).thenReturn(Optional.of(offer));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.adjustSeats(rideId, -1);
        assertThat(result.getSeatsAvailable()).isEqualTo(2);
    }
}

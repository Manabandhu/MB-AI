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
        assertThat(offer.getStatus()).isEqualToIgnoringCase("active");
    }

    @Test
    void adjustSeatsUpdatesAvailableSeats() {
        var rideId = UUID.randomUUID();
        var offer = new RideOffer(UUID.randomUUID(), "Irving", "Dallas", Instant.now().plusSeconds(3600),
                3, 3, "$15", "ACTIVE");
        when(repository.findById(rideId)).thenReturn(Optional.of(offer));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.adjustSeats(rideId, -1);
        assertThat(result.getSeatsAvailable()).isEqualTo(2);
    }

    @Test
    void updateStatusCompletedSetsExpiration() {
        var rideId = UUID.randomUUID();
        var driverId = UUID.randomUUID();
        var offer = new RideOffer(driverId, "Plano", "Frisco", Instant.now().plusSeconds(3600),
                2, 2, "$10", "ACTIVE");
        when(repository.findById(rideId)).thenReturn(Optional.of(offer));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var updated = service.updateStatus(rideId, driverId, false, "COMPLETED");
        assertThat(updated.getStatus()).isEqualTo("COMPLETED");
        assertThat(updated.getCompletedAt()).isNotNull();
        assertThat(updated.getChatExpiresAt()).isNotNull();
        assertThat(updated.getChatExpiresAt()).isAfter(updated.getCompletedAt());
    }

    @Test
    void reactivateClonesOriginalRideDetails() {
        var rideId = UUID.randomUUID();
        var driverId = UUID.randomUUID();
        var original = new RideOffer(driverId, "Austin", "Houston", Instant.now().minusSeconds(7200),
                4, 0, "$25", "COMPLETED");
        original.setTollPreference("AVOID_TOLLS");
        original.setIsRecurring(true);
        original.setRecurrencePattern("WEEKDAYS");

        when(repository.findById(rideId)).thenReturn(Optional.of(original));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Instant nextDate = Instant.now().plusSeconds(86400);
        var cloned = service.reactivate(rideId, driverId, nextDate);

        assertThat(cloned.getOriginArea()).isEqualTo("Austin");
        assertThat(cloned.getDestinationArea()).isEqualTo("Houston");
        assertThat(cloned.getSeatsTotal()).isEqualTo(4);
        assertThat(cloned.getSeatsAvailable()).isEqualTo(4);
        assertThat(cloned.getStatus()).isEqualTo("ACTIVE");
        assertThat(cloned.getTollPreference()).isEqualTo("AVOID_TOLLS");
        assertThat(cloned.getRecurrencePattern()).isEqualTo("WEEKDAYS");
        assertThat(cloned.getDepartureAt()).isEqualTo(nextDate);
    }
}

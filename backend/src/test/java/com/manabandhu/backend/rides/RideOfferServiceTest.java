package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.ConversationParticipantService;

class RideOfferServiceTest {

    private final RideOfferRepository repository = mock(RideOfferRepository.class);
    private final RideBookingRepository bookingRepository = mock(RideBookingRepository.class);
    private final RideRequestRepository requestRepository = mock(RideRequestRepository.class);
    private final RideParticipantRepository participantRepository = mock(RideParticipantRepository.class);
    private final RideMembership membership = mock(RideMembership.class);
    private final RideAccess access = new RideAccess(repository, bookingRepository, requestRepository, participantRepository);
    private final RideOfferService service = new RideOfferService(repository, access, membership,
            mock(ConversationParticipantService.class));

    private final UUID driverId = UUID.randomUUID();
    private final Actor driver = new Actor(driverId, false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);

    private RideOffer offer(UUID rideId, int total, int available, String status) {
        var offer = new RideOffer(driverId, "Irving", "Dallas", Instant.now().plusSeconds(3600),
                total, available, "$15", status);
        when(repository.findByIdForUpdate(rideId)).thenReturn(Optional.of(offer));
        when(repository.findById(rideId)).thenReturn(Optional.of(offer));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        return offer;
    }

    private static HttpStatus status(Throwable error) {
        return (HttpStatus) ((ResponseStatusException) error).getStatusCode();
    }

    @Test
    void createMapsInputToEntity() {
        var departureAt = Instant.now().plusSeconds(3600);
        var input = new CreateRideOfferInput("Irving", "Dallas", departureAt, 3, "$15 contribution");
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var offer = service.create(driverId, input);
        assertThat(offer.getOriginArea()).isEqualTo("Irving");
        assertThat(offer.getSeatsTotal()).isEqualTo(3);
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThat(offer.getStatus()).isEqualToIgnoringCase("active");
    }

    @Test
    void adjustSeatsUpdatesAvailableSeats() {
        var rideId = UUID.randomUUID();
        offer(rideId, 3, 3, "active");
        assertThat(service.adjustSeats(driver, rideId, -1).getSeatsAvailable()).isEqualTo(2);
    }

    @Test
    void adjustSeatsNeverOpensSeatsRidersHold() {
        var rideId = UUID.randomUUID();
        offer(rideId, 4, 1, "active");
        when(membership.heldSeats(rideId)).thenReturn(2);
        assertThat(service.adjustSeats(driver, rideId, 10).getSeatsAvailable()).isEqualTo(2);
    }

    @Test
    void strangersCannotEditDeleteOrChangeSeats() {
        var rideId = UUID.randomUUID();
        offer(rideId, 3, 3, "active");
        assertThatThrownBy(() -> service.adjustSeats(stranger, rideId, 1))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.update(stranger, rideId, new UpdateRideOfferInput("X", null, null, null, null, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.delete(stranger, rideId))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.updateStatus(stranger, rideId, "cancelled"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(repository, never()).delete(any());
    }

    @Test
    void editCannotDropSeatsBelowWhatRidersHold() {
        var rideId = UUID.randomUUID();
        offer(rideId, 4, 1, "active");
        when(membership.heldSeats(rideId)).thenReturn(3);
        assertThatThrownBy(() -> service.update(driver, rideId, new UpdateRideOfferInput(null, null, null, 2, null, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        var updated = service.update(driver, rideId, new UpdateRideOfferInput(null, null, null, 5, null, null));
        assertThat(updated.getSeatsTotal()).isEqualTo(5);
        assertThat(updated.getSeatsAvailable()).isEqualTo(2);
    }

    @Test
    void theEditInputCannotCarryChatOrStatusFields() {
        assertThat(UpdateRideOfferInput.class.getRecordComponents())
                .extracting(java.lang.reflect.RecordComponent::getName)
                .doesNotContain("conversationId", "chatExpiresAt", "completedAt", "status");
    }

    @Test
    void updateStatusCompletedSetsExpiration() {
        var rideId = UUID.randomUUID();
        offer(rideId, 2, 2, "active");
        var updated = service.updateStatus(driver, rideId, "COMPLETED");
        assertThat(updated.getStatus()).isEqualTo("completed");
        assertThat(updated.getChatExpiresAt()).isAfter(updated.getCompletedAt());
    }

    @Test
    void finishedRidesCannotBeReopened() {
        var rideId = UUID.randomUUID();
        offer(rideId, 2, 2, "cancelled");
        assertThatThrownBy(() -> service.updateStatus(driver, rideId, "active"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void cancellingReleasesEveryRider() {
        var rideId = UUID.randomUUID();
        var offer = offer(rideId, 3, 1, "active");
        service.updateStatus(driver, rideId, "cancelled");
        verify(membership).releaseEveryone(eq(offer), eq(driverId), any());
    }

    @Test
    void deletingReleasesEveryRiderFirst() {
        var rideId = UUID.randomUUID();
        var offer = offer(rideId, 3, 1, "active");
        service.delete(driver, rideId);
        verify(membership).releaseEveryone(eq(offer), eq(driverId), any());
        verify(repository).delete(offer);
    }

    @Test
    void updateStatusRejectsUnknownStatus() {
        var rideId = UUID.randomUUID();
        offer(rideId, 2, 2, "active");
        assertThatThrownBy(() -> service.updateStatus(driver, rideId, "teleported"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void reactivateClonesOriginalRideDetailsAndNeedsAFutureTime() {
        var rideId = UUID.randomUUID();
        var original = offer(rideId, 4, 0, "completed");
        original.setTollPreference("AVOID_TOLLS");
        original.setRecurrencePattern("WEEKDAYS");

        assertThatThrownBy(() -> service.reactivate(driver, rideId, Instant.now().minusSeconds(60)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        assertThatThrownBy(() -> service.reactivate(stranger, rideId, Instant.now().plusSeconds(60)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));

        Instant nextDate = Instant.now().plusSeconds(86400);
        var cloned = service.reactivate(driver, rideId, nextDate);
        assertThat(cloned.getSeatsAvailable()).isEqualTo(4);
        assertThat(cloned.getStatus()).isEqualTo("active");
        assertThat(cloned.getRecurrencePattern()).isEqualTo("WEEKDAYS");
        assertThat(cloned.getDepartureAt()).isEqualTo(nextDate);
    }
}

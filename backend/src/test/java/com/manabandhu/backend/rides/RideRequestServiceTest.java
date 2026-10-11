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
class RideRequestServiceTest {

    @Mock
    RideRequestRepository repository;

    @Mock
    RideOfferRepository offerRepository;

    @Mock
    RideBookingRepository bookingRepository;

    @Mock
    RideParticipantRepository participantRepository;

    @Mock
    com.manabandhu.backend.notifications.NotificationPublisher notifications;

    RideRequestService service;

    final UUID driverId = UUID.randomUUID();
    final UUID riderId = UUID.randomUUID();
    final Actor driver = new Actor(driverId, false, false);
    final Actor rider = new Actor(riderId, false, false);
    RideOffer offer;

    @BeforeEach
    void setUp() {
        service = new RideRequestService(repository, offerRepository, bookingRepository, participantRepository,
                new RideAccess(offerRepository, bookingRepository, repository, participantRepository), notifications);
        offer = new RideOffer(driverId, "Irving", "Dallas", Instant.now().plusSeconds(3600), 3, 3, "$15", "active");
        lenient().when(offerRepository.findById(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(offerRepository.findByIdForUpdate(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private RideRequest stored(int seats, String status) {
        var request = new RideRequest(offer.getId(), riderId, seats, null, status);
        when(repository.findByIdForUpdate(request.getId())).thenReturn(Optional.of(request));
        return request;
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    void createMapsInputToEntity() {
        var request = service.create(offer.getId(), rider, new CreateRideRequestInput(2, "Can I get a ride?"));
        assertThat(request.getSeatsRequested()).isEqualTo(2);
        assertThat(request.getStatus()).isEqualTo("pending");
        assertThat(request.getMessage()).isEqualTo("Can I get a ride?");
    }

    @Test
    void acceptingReservesSeatsAndAddsTheRiderAsParticipant() {
        var request = stored(2, "pending");

        var result = service.updateStatus(driver, request.getId(), "ACCEPTED");

        assertThat(result.getStatus()).isEqualTo("accepted");
        assertThat(offer.getSeatsAvailable()).isEqualTo(1);
        verify(participantRepository).save(any(RideParticipant.class));
        verify(notifications).publish(org.mockito.ArgumentMatchers.eq(riderId), org.mockito.ArgumentMatchers.eq(driverId),
                org.mockito.ArgumentMatchers.eq(com.manabandhu.backend.notifications.Notification.NotificationType.RIDE),
                any(), any(), any());
    }

    @Test
    void acceptingMoreSeatsThanAvailableIsRejected() {
        var request = stored(4, "pending");

        assertThatThrownBy(() -> service.updateStatus(driver, request.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThat(request.getStatus()).isEqualTo("pending");
        verify(participantRepository, never()).save(any());
    }

    @Test
    void acceptingOnAnInactiveRideIsRejected() {
        offer.setStatus("cancelled");
        var request = stored(1, "pending");

        assertThatThrownBy(() -> service.updateStatus(driver, request.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }

    @Test
    void rejectedRequestsCannotBeReaccepted() {
        var request = stored(1, "rejected");

        assertThatThrownBy(() -> service.updateStatus(driver, request.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }

    @Test
    void withdrawingAnAcceptedRequestReturnsSeats() {
        offer.setSeatsAvailable(1);
        var request = stored(2, "accepted");

        var result = service.updateStatus(rider, request.getId(), "withdrawn");

        assertThat(result.getStatus()).isEqualTo("withdrawn");
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        verify(participantRepository).deleteByRideIdAndUserId(offer.getId(), riderId);
    }

    @Test
    void riderCannotAcceptOwnRequest() {
        var request = stored(2, "pending");
        assertThatThrownBy(() -> service.updateStatus(rider, request.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
    }

    @Test
    void riderCanWithdraw() {
        var request = stored(2, "pending");
        var result = service.updateStatus(rider, request.getId(), "withdrawn");
        assertThat(result.getStatus()).isEqualTo("withdrawn");
    }

    @Test
    void unverifiedRiderCannotRequestAWomenOnlyRide() {
        offer.setGenderPreference("FEMALE_ONLY");

        assertThatThrownBy(() -> service.create(offer.getId(), rider, new CreateRideRequestInput(1, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(repository, never()).save(any());
    }

    @Test
    void verifiedWomanCanRequestAWomenOnlyRide() {
        offer.setGenderPreference("FEMALE_ONLY");
        var woman = new Actor(riderId, false, false, "female");

        assertThat(service.create(offer.getId(), woman, new CreateRideRequestInput(1, null)).getStatus())
                .isEqualTo("pending");
    }

    @Test
    void strangersOnlySeeTheirOwnRequests() {
        var stranger = UUID.randomUUID();
        when(repository.findByRideIdAndRiderIdOrderByCreatedAtDesc(offer.getId(), stranger)).thenReturn(java.util.List.of());
        assertThat(service.listForRide(new Actor(stranger, false, false), offer.getId())).isEmpty();
    }

    @Test
    void anAcceptedRequestCannotBeDeletedAroundTheSeatAccounting() {
        offer.setSeatsAvailable(1);
        var request = stored(2, "accepted");

        assertThatThrownBy(() -> service.delete(rider, request.getId()))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        verify(repository, never()).delete(any());
    }

    @Test
    void aRiderCannotBeAcceptedTwiceOnOneRide() {
        when(repository.existsByRideIdAndRiderIdAndStatus(offer.getId(), riderId, "accepted")).thenReturn(true);
        var second = stored(1, "pending");

        assertThatThrownBy(() -> service.updateStatus(driver, second.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
        assertThat(offer.getSeatsAvailable()).isEqualTo(3);
        assertThatThrownBy(() -> service.create(offer.getId(), rider, new CreateRideRequestInput(1, null)))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.CONFLICT));
    }
}

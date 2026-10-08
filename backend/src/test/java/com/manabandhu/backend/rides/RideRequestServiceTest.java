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

    RideRequestService service;

    final UUID driverId = UUID.randomUUID();
    final UUID riderId = UUID.randomUUID();
    RideOffer offer;

    @BeforeEach
    void setUp() {
        service = new RideRequestService(repository,
                new RideAccess(offerRepository, bookingRepository, repository, participantRepository));
        offer = new RideOffer(driverId, "Irving", "Dallas", Instant.now().plusSeconds(3600), 3, 3, "$15", "active");
        lenient().when(offerRepository.findById(offer.getId())).thenReturn(Optional.of(offer));
        lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    private static HttpStatus status(Throwable error) {
        return HttpStatus.valueOf(((ResponseStatusException) error).getStatusCode().value());
    }

    @Test
    void createMapsInputToEntity() {
        var request = service.create(offer.getId(), riderId, new CreateRideRequestInput(2, "Can I get a ride?"));
        assertThat(request.getSeatsRequested()).isEqualTo(2);
        assertThat(request.getStatus()).isEqualTo("pending");
        assertThat(request.getMessage()).isEqualTo("Can I get a ride?");
    }

    @Test
    void driverCanAcceptRequest() {
        var request = new RideRequest(offer.getId(), riderId, 2, null, "pending");
        when(repository.findById(request.getId())).thenReturn(Optional.of(request));
        var result = service.updateStatus(new Actor(driverId, false, false), request.getId(), "ACCEPTED");
        assertThat(result.getStatus()).isEqualTo("accepted");
    }

    @Test
    void riderCannotAcceptOwnRequest() {
        var request = new RideRequest(offer.getId(), riderId, 2, null, "pending");
        when(repository.findById(request.getId())).thenReturn(Optional.of(request));
        assertThatThrownBy(() -> service.updateStatus(new Actor(riderId, false, false), request.getId(), "accepted"))
                .satisfies(e -> assertThat(status(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void riderCanWithdraw() {
        var request = new RideRequest(offer.getId(), riderId, 2, null, "pending");
        when(repository.findById(request.getId())).thenReturn(Optional.of(request));
        var result = service.updateStatus(new Actor(riderId, false, false), request.getId(), "withdrawn");
        assertThat(result.getStatus()).isEqualTo("withdrawn");
    }

    @Test
    void strangersOnlySeeTheirOwnRequests() {
        var stranger = UUID.randomUUID();
        when(repository.findByRideIdAndRiderIdOrderByCreatedAtDesc(offer.getId(), stranger)).thenReturn(java.util.List.of());
        assertThat(service.listForRide(new Actor(stranger, false, false), offer.getId())).isEmpty();
    }
}

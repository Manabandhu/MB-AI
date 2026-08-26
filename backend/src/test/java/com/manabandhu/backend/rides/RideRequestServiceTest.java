package com.manabandhu.backend.rides;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RideRequestServiceTest {

    @Mock
    RideRequestRepository repository;

    @InjectMocks
    RideRequestService service;

    @Test
    void createMapsInputToEntity() {
        var rideId = UUID.randomUUID();
        var riderId = UUID.randomUUID();
        var input = new CreateRideRequestInput(2, "Can I get a ride?");
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var request = service.create(rideId, riderId, input);
        assertThat(request.getSeatsRequested()).isEqualTo(2);
        assertThat(request.getStatus()).isEqualTo("pending");
        assertThat(request.getMessage()).isEqualTo("Can I get a ride?");
    }

    @Test
    void updateStatusSetsNewStatus() {
        var requestId = UUID.randomUUID();
        var request = new RideRequest(UUID.randomUUID(), UUID.randomUUID(), 2, null, "pending");
        when(repository.findById(requestId)).thenReturn(Optional.of(request));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.updateStatus(requestId, "accepted");
        assertThat(result.getStatus()).isEqualTo("accepted");
    }
}

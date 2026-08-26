package com.manabandhu.backend.rooms;

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
class RoomBookingServiceTest {

    @Mock
    RoomBookingRepository bookingRepository;

    @Mock
    RoomListingRepository listingRepository;

    @InjectMocks
    RoomBookingService service;

    @Test
    void createMapsInputToEntity() {
        var listingId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var input = new CreateRoomBookingInput("I'm interested in this room.");
        when(listingRepository.existsById(listingId)).thenReturn(true);
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var booking = service.create(listingId, requesterId, input);
        assertThat(booking.getStatus()).isEqualTo("pending");
        assertThat(booking.getRequesterId()).isEqualTo(requesterId);
        assertThat(booking.getMessage()).isEqualTo("I'm interested in this room.");
    }

    @Test
    void updateStatusSetsNewStatus() {
        var bookingId = UUID.randomUUID();
        var booking = new RoomBooking(UUID.randomUUID(), UUID.randomUUID(), "pending", null);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.updateStatus(bookingId, "accepted");
        assertThat(result.getStatus()).isEqualTo("accepted");
    }
}

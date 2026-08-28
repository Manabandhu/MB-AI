package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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
        var ownerId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var input = new CreateRoomBookingInput("I'm interested in this room.");
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(bookingRepository.existsByListingIdAndRequesterIdAndStatus(listingId, requesterId, "pending"))
                .thenReturn(false);
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var booking = service.create(listingId, requesterId, input);
        assertThat(booking.getStatus()).isEqualTo("pending");
        assertThat(booking.getRequesterId()).isEqualTo(requesterId);
        assertThat(booking.getMessage()).isEqualTo("I'm interested in this room.");
    }

    @Test
    void updateStatusSetsNewStatusForOwner() {
        var ownerId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var bookingId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        var booking = new RoomBooking(listingId, requesterId, "pending", null);
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(bookingRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.updateStatus(bookingId, ownerId, false, "accepted");
        assertThat(result.getStatus()).isEqualTo("accepted");
    }
}

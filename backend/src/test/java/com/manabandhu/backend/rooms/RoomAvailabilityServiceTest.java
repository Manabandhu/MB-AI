package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RoomAvailabilityServiceTest {

    @Mock
    RoomAvailabilityRepository availabilityRepository;

    @Mock
    RoomListingRepository listingRepository;

    @InjectMocks
    RoomAvailabilityService service;

    @Test
    void createMapsInputToEntity() {
        var ownerId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(availabilityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var availability = service.create(listingId, ownerId, false, input);
        assertThat(availability.getMinStayMonths()).isEqualTo(3);
        assertThat(availability.getListingId()).isEqualTo(listingId);
    }

    @Test
    void createThrowsNotFoundForMissingListing() {
        var listingId = UUID.randomUUID();
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        when(listingRepository.findById(listingId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(listingId, UUID.randomUUID(), false, input))
                .isInstanceOf(ResponseStatusException.class);
    }
}

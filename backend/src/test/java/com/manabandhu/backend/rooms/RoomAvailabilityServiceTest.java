package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

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
        var listingId = UUID.randomUUID();
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        when(listingRepository.existsById(listingId)).thenReturn(true);
        when(availabilityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var availability = service.create(listingId, input);
        assertThat(availability.getMinStayMonths()).isEqualTo(3);
        assertThat(availability.getListingId()).isEqualTo(listingId);
    }

    @Test
    void createThrowsNotFoundForMissingListing() {
        var listingId = UUID.randomUUID();
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        when(listingRepository.existsById(listingId)).thenReturn(false);
        assertThatThrownBy(() -> service.create(listingId, input))
                .isInstanceOf(ResponseStatusException.class);
    }
}

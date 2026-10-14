package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

class RoomAvailabilityServiceTest {

    private final RoomAvailabilityRepository availabilityRepository = mock(RoomAvailabilityRepository.class);
    private final RoomListingRepository listingRepository = mock(RoomListingRepository.class);
    private final RoomListingService listingService = new RoomListingService(listingRepository,
            mock(RoomAmenityRepository.class), mock(RoomPreferenceRepository.class));
    private final RoomAvailabilityService service = new RoomAvailabilityService(availabilityRepository, listingService);

    private final UUID ownerId = UUID.randomUUID();
    private final UUID listingId = UUID.randomUUID();

    private RoomListing listing(String status) {
        return new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", status, "Irving", null, null, null);
    }

    @Test
    void createMapsInputToEntity() {
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing("active")));
        when(availabilityRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var availability = service.create(new Actor(ownerId, false, false), listingId, input);
        assertThat(availability.getMinStayMonths()).isEqualTo(3);
        assertThat(availability.getListingId()).isEqualTo(listingId);
    }

    @Test
    void createThrowsNotFoundForMissingListing() {
        var input = new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().plusMonths(6), 3);
        when(listingRepository.findById(listingId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(new Actor(UUID.randomUUID(), false, false), listingId, input))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void draftAvailabilityIsHiddenFromStrangersButNotTheOwner() {
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing("draft")));
        assertThatThrownBy(() -> service.findVisible(listingId, null))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(service.findVisible(listingId, new Actor(ownerId, false, false))).isEmpty();
    }

    @Test
    void rangeMustNotEndBeforeItStarts() {
        assertThat(new CreateRoomAvailabilityInput(LocalDate.now(), LocalDate.now().minusDays(1), 0).isRangeValid())
                .isFalse();
    }
}

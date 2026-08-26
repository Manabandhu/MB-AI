package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RoomListingServiceTest {

    @Mock
    RoomListingRepository repository;

    @InjectMocks
    RoomListingService service;

    @Test
    void createMapsInputToEntity() {
        var ownerId = UUID.randomUUID();
        var input = new CreateRoomListingInput("Sunny room", "Description", BigDecimal.valueOf(850),
                "private", "Irving", "123 Main St", BigDecimal.valueOf(32.8), BigDecimal.valueOf(-96.9));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var listing = service.create(ownerId, input);
        assertThat(listing.getTitle()).isEqualTo("Sunny room");
        assertThat(listing.getStatus()).isEqualTo("active");
        assertThat(listing.getOwnerId()).isEqualTo(ownerId);
    }

    @Test
    void updateAppliesChanges() {
        var listingId = UUID.randomUUID();
        var input = new UpdateRoomListingInput(null, null, BigDecimal.valueOf(900), null,
                null, null, null, null, "paused");
        var listing = new RoomListing(UUID.randomUUID(), "Old", null, BigDecimal.valueOf(850),
                "private", "active", "Irving", null, null, null);
        when(repository.findById(listingId)).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.update(listingId, input);
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(900));
        assertThat(result.getStatus()).isEqualTo("paused");
    }

    @Test
    void updateThrowsNotFound() {
        var input = new UpdateRoomListingInput(null, null, null, null, null, null, null, null, "paused");
        var listingId = UUID.randomUUID();
        when(repository.findById(listingId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(listingId, input))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deleteThrowsNotFound() {
        var id = UUID.randomUUID();
        when(repository.existsById(id)).thenReturn(false);
        assertThatThrownBy(() -> service.delete(id))
                .isInstanceOf(ResponseStatusException.class);
    }
}

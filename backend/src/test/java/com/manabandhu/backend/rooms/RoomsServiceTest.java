package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class RoomsServiceTest {

    @Test
    void createAndFindListing() {
        var listingRepo = mock(RoomListingRepository.class);
        var bookingRepo = mock(RoomBookingRepository.class);
        when(listingRepo.save(any(RoomListing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RoomsService(listingRepo, bookingRepo);
        var ownerId = UUID.randomUUID();
        var listing = service.create(ownerId, "Sunny room", "Nice place", BigDecimal.valueOf(850), "PRIVATE",
                "Irving", "123 Main St", BigDecimal.valueOf(32.8), BigDecimal.valueOf(-96.9));

        assertThat(listing).isNotNull();
        assertThat(listing.getOwnerId()).isEqualTo(ownerId);
        assertThat(listing.getTitle()).isEqualTo("Sunny room");
        assertThat(listing.getStatus()).isEqualTo("active");
        verify(listingRepo).save(any(RoomListing.class));
    }

    @Test
    void updateListing() {
        var listingRepo = mock(RoomListingRepository.class);
        var bookingRepo = mock(RoomBookingRepository.class);
        var id = UUID.randomUUID();
        var existing = new RoomListing(UUID.randomUUID(), "Old", null, BigDecimal.ONE, "PRIVATE", "active",
                "Loc", null, null, null);
        existing.title = "Old";
        when(listingRepo.findById(id)).thenReturn(Optional.of(existing));
        when(listingRepo.save(any(RoomListing.class))).thenAnswer(invocation -> invocation.getArgument(0));
        var service = new RoomsService(listingRepo, bookingRepo);

        var updated = service.update(id, "New", null, null, "paused");
        assertThat(updated).isNotNull();
        assertThat(updated.getTitle()).isEqualTo("New");
        assertThat(updated.getStatus()).isEqualTo("paused");
        verify(listingRepo).save(existing);
    }

    @Test
    void deleteMissingListingThrowsNotFound() {
        var listingRepo = mock(RoomListingRepository.class);
        var bookingRepo = mock(RoomBookingRepository.class);
        when(listingRepo.existsById(any(UUID.class))).thenReturn(false);
        var service = new RoomsService(listingRepo, bookingRepo);

        assertThatThrownBy(() -> service.delete(UUID.randomUUID()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode").isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void bookNonActiveListingThrowsBadRequest() {
        var listingRepo = mock(RoomListingRepository.class);
        var bookingRepo = mock(RoomBookingRepository.class);
        var id = UUID.randomUUID();
        var existing = new RoomListing(UUID.randomUUID(), "Old", null, BigDecimal.ONE, "PRIVATE", "paused",
                "Loc", null, null, null);
        when(listingRepo.findById(id)).thenReturn(Optional.of(existing));
        var service = new RoomsService(listingRepo, bookingRepo);

        assertThatThrownBy(() -> service.book(id, UUID.randomUUID(), "Hello"))
                .isInstanceOf(ResponseStatusException.class)
                .extracting("statusCode").isEqualTo(HttpStatus.BAD_REQUEST);
    }
}

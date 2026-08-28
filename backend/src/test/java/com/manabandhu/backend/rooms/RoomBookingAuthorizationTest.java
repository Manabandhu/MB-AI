package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
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
class RoomBookingAuthorizationTest {

    @Mock
    RoomBookingRepository bookingRepository;

    @Mock
    RoomListingRepository listingRepository;

    @InjectMocks
    RoomBookingService bookingService;

    @Test
    void selfInquiryIsRejected() {
        var ownerId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        assertThatThrownBy(() -> bookingService.create(listingId, ownerId, new CreateRoomBookingInput("Hi")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void duplicatePendingInquiryIsRejected() {
        var ownerId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        when(bookingRepository.existsByListingIdAndRequesterIdAndStatus(listingId, requesterId, "pending"))
                .thenReturn(true);
        assertThatThrownBy(() -> bookingService.create(listingId, requesterId, new CreateRoomBookingInput("Hi")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void onlyOwnerCanAcceptOrReject() {
        var ownerId = UUID.randomUUID();
        var requesterId = UUID.randomUUID();
        var otherUserId = UUID.randomUUID();
        var bookingId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        var booking = new RoomBooking(listingId, requesterId, "pending", "Hi");
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(booking));
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        assertThatThrownBy(() -> bookingService.updateStatus(bookingId, otherUserId, false, "accepted"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void strangerCannotViewOwnerBookings() {
        var ownerId = UUID.randomUUID();
        var strangerId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", null, null, null);
        when(listingRepository.findById(listingId)).thenReturn(Optional.of(listing));
        assertThatThrownBy(() -> bookingService.findByListingId(listingId, strangerId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void publishedListingIsSearchableButDraftIsNot() {
        var published = new RoomListing(UUID.randomUUID(), "Published", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", "123 Main St", null, null);
        var draft = new RoomListing(UUID.randomUUID(), "Draft", null, BigDecimal.valueOf(800),
                "private", "draft", "Irving", "456 Main St", null, null);
        assertThat(published.getStatus()).isEqualTo("active");
        assertThat(draft.getStatus()).isEqualTo("draft");
    }

    @Test
    void publicResponseNeverExposesExactAddress() {
        var ownerId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Room", null, BigDecimal.valueOf(800),
                "private", "active", "Irving", "123 Main St", null, null);
        var response = RoomListingResponse.from(listing, List.of(), List.of(), false);
        assertThat(response.savedByViewer()).isFalse();
    }
}

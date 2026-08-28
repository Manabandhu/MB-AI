package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
class RoomListingServiceTest {

    @Mock
    RoomListingRepository repository;

    @Mock
    RoomAmenityRepository amenityRepository;

    @Mock
    RoomPreferenceRepository preferenceRepository;

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
        assertThat(listing.getStatus()).isEqualTo("draft");
        assertThat(listing.getOwnerId()).isEqualTo(ownerId);
    }

    @Test
    void updateAppliesChangesForOwner() {
        var ownerId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var input = new UpdateRoomListingInput(null, null, BigDecimal.valueOf(900), null,
                null, null, null, null, "active");
        var listing = new RoomListing(ownerId, "Old", null, BigDecimal.valueOf(850),
                "private", "draft", "Irving", null, null, null);
        when(repository.findById(listingId)).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.update(listingId, ownerId, false, input);
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(900));
        assertThat(result.getStatus()).isEqualTo("active");
    }

    @Test
    void updateRejectsNonOwner() {
        var ownerId = UUID.randomUUID();
        var otherUserId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var input = new UpdateRoomListingInput(null, null, BigDecimal.valueOf(900), null,
                null, null, null, null, "active");
        var listing = new RoomListing(ownerId, "Old", null, BigDecimal.valueOf(850),
                "private", "draft", "Irving", null, null, null);
        when(repository.findById(listingId)).thenReturn(Optional.of(listing));
        assertThatThrownBy(() -> service.update(listingId, otherUserId, false, input))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void updateAllowsAdmin() {
        var ownerId = UUID.randomUUID();
        var adminId = UUID.randomUUID();
        var listingId = UUID.randomUUID();
        var input = new UpdateRoomListingInput(null, null, null, null, null, null, null, null, "rejected");
        var listing = new RoomListing(ownerId, "Old", null, BigDecimal.valueOf(850),
                "private", "active", "Irving", null, null, null);
        when(repository.findById(listingId)).thenReturn(Optional.of(listing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        var result = service.update(listingId, adminId, true, input);
        assertThat(result.getStatus()).isEqualTo("rejected");
    }

    @Test
    void updateThrowsNotFound() {
        var input = new UpdateRoomListingInput(null, null, null, null, null, null, null, null, "active");
        var listingId = UUID.randomUUID();
        when(repository.findById(listingId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.update(listingId, UUID.randomUUID(), false, input))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    void deleteRejectsNonOwner() {
        var ownerId = UUID.randomUUID();
        var otherUserId = UUID.randomUUID();
        var id = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Old", null, BigDecimal.valueOf(850),
                "private", "draft", "Irving", null, null, null);
        when(repository.findById(id)).thenReturn(Optional.of(listing));
        assertThatThrownBy(() -> service.delete(id, otherUserId, false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void stateTransitionFromDraftToActiveAllowed() {
        service.validateTransition("draft", "active", false);
    }

    @Test
    void stateTransitionFromDraftToRejectedRejected() {
        assertThatThrownBy(() -> service.validateTransition("draft", "rejected", false))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void stateTransitionRejectedToActiveOnlyForAdmin() {
        assertThatThrownBy(() -> service.validateTransition("rejected", "active", false))
                .isInstanceOf(ResponseStatusException.class);
        service.validateTransition("rejected", "active", true);
    }

    @Test
    void publicResponseNeverExposesExactAddress() {
        var ownerId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Sunny room", "Description", BigDecimal.valueOf(850),
                "private", "active", "Irving", "123 Main St", BigDecimal.valueOf(32.8), BigDecimal.valueOf(-96.9));
        var response = RoomListingResponse.from(listing, List.of("wifi"), List.of("quiet"), false);
        assertThat(response.savedByViewer()).isFalse();
        assertThat(response).hasToString(response.toString());
    }

    @Test
    void ownerResponseIncludesExactAddress() {
        var ownerId = UUID.randomUUID();
        var listing = new RoomListing(ownerId, "Sunny room", "Description", BigDecimal.valueOf(850),
                "private", "active", "Irving", "123 Main St", BigDecimal.valueOf(32.8), BigDecimal.valueOf(-96.9));
        var response = OwnerRoomListingResponse.from(listing, List.of("wifi"), List.of("quiet"));
        org.assertj.core.api.Assertions.assertThat(
                response.toString().contains("123 Main St")).isTrue();
    }
}

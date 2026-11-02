package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

class RoomListingGraphqlControllerTest {

    private final RoomListingService listingService = mock(RoomListingService.class);
    private final RoomFavoriteService favoriteService = mock(RoomFavoriteService.class);
    private final RoomBookingService bookingService = mock(RoomBookingService.class);
    private final RoomListingGraphqlController controller = new RoomListingGraphqlController(
            listingService, favoriteService, bookingService);
    private final UUID userId = UUID.randomUUID();
    private final UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken(userId.toString(), null, List.of());

    @Test
    void savedListingsAreTheCallersFavorites() {
        when(favoriteService.findSavedListings(userId)).thenReturn(List.of());

        assertThat(controller.savedRoomListings(auth)).isEmpty();

        verify(favoriteService).findSavedListings(userId);
    }

    @Test
    void savedListingsRequireSignIn() {
        assertThatThrownBy(() -> controller.savedRoomListings(null)).isInstanceOf(ResponseStatusException.class);
        verify(favoriteService, never()).findSavedListings(any());
    }

    @Test
    void createGoesThroughTheValidatedDraftPath() {
        var input = new CreateRoomListingInput("Room", null, BigDecimal.TEN, "private", "Irving", null, null, null);
        var draft = new RoomListing(userId, "Room", null, BigDecimal.TEN, "private", "draft", "Irving", null, null, null);
        when(listingService.create(any(Actor.class), eq(input))).thenReturn(draft);

        assertThat(controller.createRoomListing(auth, input).getStatus()).isEqualTo("draft");
    }

    @Test
    void bookRoomUsesTheSameRulesAsRest() {
        var roomId = UUID.randomUUID();
        var input = new CreateRoomBookingInput("Hi");

        controller.bookRoom(auth, roomId, input);

        verify(bookingService).create(roomId, userId, input);
    }

    @Test
    void ownerIdAndExactCoordinatesAreOnlyForTheOwner() {
        var listing = new RoomListing(UUID.randomUUID(), "Room", null, BigDecimal.TEN, "private", "active", "Irving",
                "1 Main St", new BigDecimal("32.812345"), new BigDecimal("-96.954321"));

        assertThat(controller.ownerId(listing, auth)).isNull();
        assertThat(controller.isOwner(listing, auth)).isFalse();
        assertThat(controller.latitude(listing, auth)).isEqualByComparingTo("32.81");
        assertThat(controller.exactAddress(listing, auth)).isNull();

        var ownerAuth = new UsernamePasswordAuthenticationToken(listing.getOwnerId().toString(), null, List.of());
        assertThat(controller.ownerId(listing, ownerAuth)).isEqualTo(listing.getOwnerId());
        assertThat(controller.isOwner(listing, ownerAuth)).isTrue();
        assertThat(controller.latitude(listing, ownerAuth)).isEqualByComparingTo("32.812345");
    }

    @Test
    void ownersCannotMarkThemselvesVerifiedHosts() {
        // The inputs have no isVerifiedHost component; the flag can only be changed server-side.
        assertThat(CreateRoomListingInput.class.getRecordComponents())
                .noneMatch(c -> c.getName().equals("isVerifiedHost"));
        assertThat(UpdateRoomListingInput.class.getRecordComponents())
                .noneMatch(c -> c.getName().equals("isVerifiedHost"));
    }
}

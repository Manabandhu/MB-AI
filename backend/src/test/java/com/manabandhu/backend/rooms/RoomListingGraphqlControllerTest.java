package com.manabandhu.backend.rooms;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

class RoomListingGraphqlControllerTest {

    private final RoomsService roomsService = mock(RoomsService.class);
    private final RoomListingService listingService = mock(RoomListingService.class);
    private final RoomFavoriteService favoriteService = mock(RoomFavoriteService.class);
    private final RoomListingGraphqlController controller =
            new RoomListingGraphqlController(roomsService, listingService, favoriteService);
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
        when(listingService.create(userId, input)).thenReturn(draft);

        assertThat(controller.createRoomListing(auth, input).getStatus()).isEqualTo("draft");
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

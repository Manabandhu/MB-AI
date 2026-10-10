package com.manabandhu.backend.rooms;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import com.manabandhu.backend.auth.Actor;

@Controller
public class RoomListingGraphqlController {

    private final RoomsService service;
    private final RoomListingService listingService;
    private final RoomFavoriteService favoriteService;

    RoomListingGraphqlController(RoomsService service, RoomListingService listingService, RoomFavoriteService favoriteService) {
        this.service = service;
        this.listingService = listingService;
        this.favoriteService = favoriteService;
    }

    /** The newest 100 active listings; REST {@code GET /api/v1/rooms/listings} pages and filters. */
    @QueryMapping
    List<RoomListing> roomListings() {
        return service.findActivePage(100);
    }

    @QueryMapping
    RoomListing roomListing(Authentication authentication, @Argument UUID id) {
        var listing = service.findById(id)
                .filter(l -> "active".equals(l.getStatus()) || canSeePrivate(authentication, l))
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Room listing not found"));
        return listing;
    }

    /** The exact address is shared only with the owner and admins; everyone else sees the broad location. */
    @SchemaMapping(typeName = "RoomListing", field = "exactAddress")
    String exactAddress(RoomListing listing, Authentication authentication) {
        return canSeePrivate(authentication, listing) ? listing.getExactAddress() : null;
    }

    private static boolean canSeePrivate(Authentication authentication, RoomListing listing) {
        return Actor.from(authentication).map(a -> a.admin() || a.is(listing.getOwnerId())).orElse(false);
    }

    /** The caller's own favorites, same as REST {@code GET /api/v1/rooms/favorites}. */
    @QueryMapping
    List<RoomListing> savedRoomListings(Authentication authentication) {
        return favoriteService.findSavedListings(Actor.require(authentication).id());
    }

    @QueryMapping
    List<RoomListing> myRoomListings(Authentication authentication) {
        return service.findMyListings(Actor.require(authentication).id());
    }

    @MutationMapping
    RoomListing createRoomListing(Authentication authentication, @Argument @Valid CreateRoomListingInput input) {
        // Same path as REST: validated input, starts as a draft the owner publishes later.
        return listingService.create(Actor.require(authentication).id(), input);
    }

    @MutationMapping
    RoomBooking bookRoom(Authentication authentication, @Argument UUID roomId, @Argument @Valid CreateRoomBookingInput input) {
        return service.book(roomId, Actor.require(authentication).id(), input.message());
    }
}

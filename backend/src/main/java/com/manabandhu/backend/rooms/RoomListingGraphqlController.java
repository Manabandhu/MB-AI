package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
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

    RoomListingGraphqlController(RoomsService service) {
        this.service = service;
    }

    @QueryMapping
    List<RoomListing> roomListings() {
        return service.findAllActive();
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

    @QueryMapping
    List<RoomListing> savedRoomListings() {
        return service.findSaved();
    }

    @QueryMapping
    List<RoomListing> myRoomListings(Authentication authentication) {
        return service.findMyListings(Actor.require(authentication).id());
    }

    @MutationMapping
    RoomListing createRoomListing(Authentication authentication, @Argument @Valid CreateRoomListingInput input) {
        return service.create(Actor.require(authentication).id(), input.title(), input.description(),
                input.price(), input.roomType(), input.broadLocation(), input.exactAddress(),
                input.latitude(), input.longitude());
    }

    @MutationMapping
    RoomBooking bookRoom(Authentication authentication, @Argument UUID roomId, @Argument @Valid CreateRoomBookingInput input) {
        return service.book(roomId, Actor.require(authentication).id(), input.message());
    }
}

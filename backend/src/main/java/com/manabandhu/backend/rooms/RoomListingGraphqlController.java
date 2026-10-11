package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.manabandhu.backend.auth.Actor;

import jakarta.validation.Valid;

/** GraphQL mirror of the rooms REST API; every rule lives in the shared services. */
@Controller
public class RoomListingGraphqlController {

    private final RoomListingService listingService;
    private final RoomFavoriteService favoriteService;
    private final RoomBookingService bookingService;
    private final RoomListingRepository listingRepository;

    RoomListingGraphqlController(RoomListingService listingService, RoomFavoriteService favoriteService,
                                 RoomBookingService bookingService, RoomListingRepository listingRepository) {
        this.listingService = listingService;
        this.favoriteService = favoriteService;
        this.bookingService = bookingService;
        this.listingRepository = listingRepository;
    }

    /** The newest 100 active listings; REST {@code GET /api/v1/rooms/listings} pages and filters. */
    @QueryMapping
    List<RoomListing> roomListings() {
        return listingRepository.findByStatusOrderByCreatedAtDesc("active", PageRequest.of(0, 100)).getContent();
    }

    /** Same visibility as REST: active or paused for everyone, any status for the owner or an admin. */
    @QueryMapping
    RoomListing roomListing(Authentication authentication, @Argument UUID id) {
        return listingService.requireVisible(id, Actor.from(authentication).orElse(null));
    }

    /** The exact address is shared only with the owner and admins; everyone else sees the broad location. */
    @SchemaMapping(typeName = "RoomListing", field = "exactAddress")
    String exactAddress(RoomListing listing, Authentication authentication) {
        return canSeePrivate(authentication, listing) ? listing.getExactAddress() : null;
    }

    /** The owner's user id is not public. */
    @SchemaMapping(typeName = "RoomListing", field = "ownerId")
    UUID ownerId(RoomListing listing, Authentication authentication) {
        return canSeePrivate(authentication, listing) ? listing.getOwnerId() : null;
    }

    @SchemaMapping(typeName = "RoomListing", field = "isOwner")
    boolean isOwner(RoomListing listing, Authentication authentication) {
        return Actor.from(authentication).map(a -> a.is(listing.getOwnerId())).orElse(false);
    }

    /** Approximate coordinates for everyone but the owner and admins, as in REST. */
    @SchemaMapping(typeName = "RoomListing", field = "latitude")
    BigDecimal latitude(RoomListing listing, Authentication authentication) {
        return canSeePrivate(authentication, listing) ? listing.getLatitude()
                : RoomListingResponse.approximate(listing.getLatitude());
    }

    @SchemaMapping(typeName = "RoomListing", field = "longitude")
    BigDecimal longitude(RoomListing listing, Authentication authentication) {
        return canSeePrivate(authentication, listing) ? listing.getLongitude()
                : RoomListingResponse.approximate(listing.getLongitude());
    }

    private static boolean canSeePrivate(Authentication authentication, RoomListing listing) {
        return Actor.from(authentication).map(a -> a.admin() || a.is(listing.getOwnerId())).orElse(false);
    }

    /** The caller's favorites, same as REST {@code GET /api/v1/rooms/favorites}. */
    @QueryMapping
    List<RoomListing> savedRoomListings(Authentication authentication) {
        return favoriteService.findSavedListings(Actor.require(authentication).id());
    }

    /** Same as REST {@code GET /api/v1/rooms/my-listings}. */
    @QueryMapping
    List<RoomListing> myRoomListings(Authentication authentication) {
        return listingService.findByOwner(Actor.require(authentication).id());
    }

    @MutationMapping
    RoomListing createRoomListing(Authentication authentication, @Argument @Valid CreateRoomListingInput input) {
        // Same path as REST: validated input, starts as a draft the owner publishes later.
        return listingService.create(Actor.require(authentication), input);
    }

    /** Same rules as REST: no booking your own listing, only active listings, one pending request per listing. */
    @MutationMapping
    RoomBooking bookRoom(Authentication authentication, @Argument UUID roomId, @Argument @Valid CreateRoomBookingInput input) {
        return bookingService.create(roomId, Actor.require(authentication).id(), input);
    }
}

package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

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
    RoomListing roomListing(@Argument UUID id) {
        return service.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Room listing not found"));
    }

    @QueryMapping
    List<RoomListing> savedRoomListings() {
        return service.findSaved();
    }

    @QueryMapping
    List<RoomListing> myRoomListings(Authentication authentication) {
        return service.findMyListings(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    RoomListing createRoomListing(Authentication authentication, @Argument @Valid CreateRoomListingInput input) {
        return service.create(UUID.fromString(authentication.getName()), input.title(), input.description(),
                input.price(), input.roomType(), input.broadLocation(), input.exactAddress(),
                input.latitude(), input.longitude());
    }

    @MutationMapping
    RoomBooking bookRoom(Authentication authentication, @Argument UUID roomId, @Argument @Valid CreateRoomBookingInput input) {
        return service.book(roomId, UUID.fromString(authentication.getName()), input.message());
    }
}

package com.manabandhu.backend.rides;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class RidesGraphqlController {

    private final RidesService service;

    RidesGraphqlController(RidesService service) {
        this.service = service;
    }

    @QueryMapping
    List<RideOffer> rideOffers() {
        return service.findAllOpen();
    }

    @QueryMapping
    RideOffer rideOffer(@Argument UUID id) {
        return service.findOfferById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Ride not found"));
    }

    @QueryMapping
    List<RideOffer> savedRides() {
        return service.findSaved();
    }

    @QueryMapping
    List<RideOffer> myRides(Authentication authentication) {
        return service.findMyRides(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    RideOffer createRideOffer(Authentication authentication, @Argument @Valid CreateRideOfferInput input) {
        return service.createOffer(UUID.fromString(authentication.getName()), input.originArea(),
                input.destinationArea(), input.departureAt(), input.seatsTotal(), input.contribution());
    }

    @MutationMapping
    RideRequest requestRideSeat(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRequestInput input) {
        return service.requestSeat(rideId, UUID.fromString(authentication.getName()), input.seatsRequested(), input.message());
    }

    @QueryMapping
    List<RideParticipant> rideParticipants(@Argument UUID rideId) {
        return service.findParticipants(rideId);
    }

    @MutationMapping
    RideRating rateRide(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRatingInput input) {
        return service.rate(rideId, UUID.fromString(authentication.getName()),
                input.rateeId(), input.rating(), input.comment());
    }
}

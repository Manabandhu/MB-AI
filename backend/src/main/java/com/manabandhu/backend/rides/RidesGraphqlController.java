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

import com.manabandhu.backend.auth.Actor;

@Controller
public class RidesGraphqlController {

    private final RidesService service;
    private final RideRequestService requestService;
    private final RideParticipantService participantService;
    private final RideRatingService ratingService;
    private final RideFavoriteService favoriteService;

    RidesGraphqlController(RidesService service, RideRequestService requestService,
                           RideParticipantService participantService, RideRatingService ratingService,
                           RideFavoriteService favoriteService) {
        this.service = service;
        this.requestService = requestService;
        this.participantService = participantService;
        this.ratingService = ratingService;
        this.favoriteService = favoriteService;
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
    List<RideOffer> savedRides(Authentication authentication) {
        return favoriteService.savedRides(Actor.require(authentication).id());
    }

    @QueryMapping
    List<RideOffer> myRides(Authentication authentication) {
        return service.findMyRides(Actor.require(authentication).id());
    }

    @MutationMapping
    RideOffer createRideOffer(Authentication authentication, @Argument @Valid CreateRideOfferInput input) {
        return service.createOffer(Actor.require(authentication).id(), input.originArea(),
                input.destinationArea(), input.departureAt(), input.seatsTotal(), input.contribution());
    }

    @MutationMapping
    RideRequest requestRideSeat(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRequestInput input) {
        return requestService.create(rideId, Actor.require(authentication).id(), input);
    }

    @QueryMapping
    List<RideParticipant> rideParticipants(Authentication authentication, @Argument UUID rideId) {
        return participantService.listForRide(Actor.require(authentication), rideId);
    }

    @QueryMapping
    List<RideRating> rideRatings(@Argument UUID rideId) {
        return service.findRatings(rideId);
    }

    @MutationMapping
    RideRating rateRide(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRatingInput input) {
        return ratingService.create(rideId, Actor.require(authentication).id(), input);
    }
}

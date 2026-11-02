package com.manabandhu.backend.rides;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;

import jakarta.validation.Valid;

/** GraphQL mirror of the rides REST API; every rule lives in the shared services. */
@Controller
public class RidesGraphqlController {

    private final RideOfferService offerService;
    private final RideRequestService requestService;
    private final RideParticipantService participantService;
    private final RideRatingService ratingService;
    private final RideFavoriteService favoriteService;
    private final RideAccess access;

    RidesGraphqlController(RideOfferService offerService, RideRequestService requestService,
                           RideParticipantService participantService, RideRatingService ratingService,
                           RideFavoriteService favoriteService, RideAccess access) {
        this.offerService = offerService;
        this.requestService = requestService;
        this.participantService = participantService;
        this.ratingService = ratingService;
        this.favoriteService = favoriteService;
        this.access = access;
    }

    /** The next 100 open rides, the same set as REST {@code GET /api/v1/rides/offers}. */
    @QueryMapping
    List<RideOffer> rideOffers() {
        return offerService.searchActive(null, null, null, null, null, Paging.firstPage(Paging.SHORT_LIST_CAP)).getContent();
    }

    @QueryMapping
    RideOffer rideOffer(@Argument UUID id) {
        return offerService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride not found"));
    }

    /** The driver's user id is shared only with the ride's members, as in REST. */
    @SchemaMapping(typeName = "RideOffer", field = "driverId")
    UUID driverId(RideOffer offer, Authentication authentication) {
        return Actor.from(authentication)
                .filter(a -> a.admin() || a.is(offer.getDriverId()) || access.isPassenger(a.id(), offer.getId()))
                .map(a -> offer.getDriverId())
                .orElse(null);
    }

    @SchemaMapping(typeName = "RideOffer", field = "isDriver")
    boolean isDriver(RideOffer offer, Authentication authentication) {
        return Actor.from(authentication).map(a -> a.is(offer.getDriverId())).orElse(false);
    }

    @QueryMapping
    List<RideOffer> savedRides(Authentication authentication) {
        return favoriteService.savedRides(Actor.require(authentication).id());
    }

    @QueryMapping
    List<RideOffer> myRides(Authentication authentication) {
        return offerService.findByDriver(Actor.require(authentication).id());
    }

    /** Same validated path as REST {@code POST /api/v1/rides/offers}. */
    @MutationMapping
    RideOffer createRideOffer(Authentication authentication, @Argument @Valid CreateRideOfferInput input) {
        return offerService.create(Actor.require(authentication).id(), input);
    }

    @MutationMapping
    RideRequest requestRideSeat(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRequestInput input) {
        return requestService.create(rideId, Actor.require(authentication), input);
    }

    @QueryMapping
    List<RideParticipant> rideParticipants(Authentication authentication, @Argument UUID rideId) {
        return participantService.listForRide(Actor.require(authentication), rideId);
    }

    /** Public like REST: scores and comments; who rated whom is not exposed. */
    @QueryMapping
    List<RideRating> rideRatings(@Argument UUID rideId) {
        return ratingService.findByRideId(rideId);
    }

    @SchemaMapping(typeName = "RideRating", field = "raterId")
    UUID raterId(RideRating rating) {
        return null;
    }

    @SchemaMapping(typeName = "RideRating", field = "rateeId")
    UUID rateeId(RideRating rating) {
        return null;
    }

    @MutationMapping
    RideRating rateRide(Authentication authentication, @Argument UUID rideId, @Argument @Valid CreateRideRatingInput input) {
        return ratingService.create(rideId, Actor.require(authentication).id(), input);
    }
}

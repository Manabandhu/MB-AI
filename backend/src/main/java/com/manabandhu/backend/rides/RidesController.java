package com.manabandhu.backend.rides;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/rides")
public class RidesController {

    private final RidesContentService contentService;
    private final RideOfferService offerService;
    private final RideRequestService requestService;
    private final RideParticipantService participantService;
    private final RideBookingService bookingService;
    private final RideRatingService ratingService;

    RidesController(RidesContentService contentService, RideOfferService offerService,
                    RideRequestService requestService, RideParticipantService participantService,
                    RideBookingService bookingService, RideRatingService ratingService) {
        this.contentService = contentService;
        this.offerService = offerService;
        this.requestService = requestService;
        this.participantService = participantService;
        this.bookingService = bookingService;
        this.ratingService = ratingService;
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/offers")
    List<RideOffer> offers(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination) {
        return offerService.search(origin, destination);
    }

    @PostMapping("/offers")
    ResponseEntity<RideOffer> createOffer(Authentication authentication, @Valid @RequestBody CreateRideOfferInput input) {
        var driverId = UUID.fromString(authentication.getName());
        var offer = offerService.create(driverId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/offers/" + offer.getId())).body(offer);
    }

    @GetMapping("/offers/{offerId}")
    RideOffer offer(@PathVariable UUID offerId) {
        return offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    @GetMapping("/{rideId}")
    RideOffer rideDetail(@PathVariable UUID rideId) {
        return offerService.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    @GetMapping("/offers/{offerId}/owner")
    RideOffer offerForOwner(Authentication authentication, @PathVariable UUID offerId) {
        var driverId = UUID.fromString(authentication.getName());
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offer;
    }

    @GetMapping("/{rideId}/owner")
    RideOffer rideDetailForOwner(Authentication authentication, @PathVariable UUID rideId) {
        var driverId = UUID.fromString(authentication.getName());
        var offer = offerService.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(driverId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offer;
    }

    @PatchMapping("/offers/{offerId}")
    RideOffer updateOffer(@PathVariable UUID offerId, @Valid @RequestBody UpdateRideOfferInput input) {
        return offerService.update(offerId, input);
    }

    @PatchMapping("/{rideId}")
    RideOffer updateRide(@PathVariable UUID rideId, @Valid @RequestBody UpdateRideOfferInput input) {
        return offerService.update(rideId, input);
    }

    @DeleteMapping("/offers/{offerId}")
    ResponseEntity<Void> deleteOffer(@PathVariable UUID offerId) {
        offerService.delete(offerId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{rideId}")
    ResponseEntity<Void> deleteRide(@PathVariable UUID rideId) {
        offerService.delete(rideId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-offers")
    List<RideOffer> myOffers(Authentication authentication) {
        return offerService.findByDriver(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/mine")
    List<RideOffer> myRides(Authentication authentication) {
        return offerService.findByDriver(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/history")
    List<RideOffer> history(Authentication authentication) {
        return offerService.findByDriver(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/saved")
    List<RideOffer> saved(Authentication authentication) {
        return offerService.findByDriver(UUID.fromString(authentication.getName()));
    }

    @PatchMapping("/offers/{offerId}/seats")
    RideOffer adjustSeats(@PathVariable UUID offerId, @RequestParam int seats) {
        return offerService.adjustSeats(offerId, seats);
    }

    @GetMapping("/offers/{offerId}/requests")
    List<RideRequest> requests(@PathVariable UUID offerId) {
        return requestService.findByRideId(offerId);
    }

    @PostMapping("/offers/{offerId}/requests")
    ResponseEntity<RideRequest> createRequest(@PathVariable UUID offerId, Authentication authentication,
                                              @Valid @RequestBody CreateRideRequestInput input) {
        var riderId = UUID.fromString(authentication.getName());
        var request = requestService.create(offerId, riderId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/requests/" + request.getId())).body(request);
    }

    @GetMapping("/requests/{requestId}")
    RideRequest request(@PathVariable UUID requestId) {
        return requestService.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride request not found"));
    }

    @PatchMapping("/requests/{requestId}/status")
    RideRequest updateRequestStatus(@PathVariable UUID requestId, @Valid @RequestBody UpdateRideRequestStatusInput input) {
        return requestService.updateStatus(requestId, input.status());
    }

    @DeleteMapping("/requests/{requestId}")
    ResponseEntity<Void> deleteRequest(@PathVariable UUID requestId) {
        requestService.delete(requestId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-requests")
    List<RideRequest> myRequests(Authentication authentication) {
        return requestService.findByRider(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/offers/{offerId}/participants")
    List<RideParticipant> participants(@PathVariable UUID offerId) {
        return participantService.findByRideId(offerId);
    }

    @PostMapping("/offers/{offerId}/participants")
    ResponseEntity<RideParticipant> addParticipant(@PathVariable UUID offerId, Authentication authentication,
                                                    @RequestParam String role) {
        var userId = UUID.fromString(authentication.getName());
        var participant = participantService.addParticipant(offerId, userId, role);
        return ResponseEntity.created(URI.create("/api/v1/rides/participants/" + participant.getId())).body(participant);
    }

    @DeleteMapping("/participants/{participantId}")
    ResponseEntity<Void> deleteParticipant(@PathVariable UUID participantId) {
        participantService.delete(participantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/offers/{offerId}/bookings")
    List<RideBooking> bookings(@PathVariable UUID offerId) {
        return bookingService.findByRideId(offerId);
    }

    @PostMapping("/offers/{offerId}/bookings")
    ResponseEntity<RideBooking> createBooking(@PathVariable UUID offerId, Authentication authentication,
                                               @Valid @RequestBody CreateRideBookingInput input) {
        var userId = UUID.fromString(authentication.getName());
        var booking = bookingService.create(offerId, userId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/bookings/" + booking.getId())).body(booking);
    }

    @GetMapping("/bookings/{bookingId}")
    RideBooking booking(@PathVariable UUID bookingId) {
        return bookingService.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride booking not found"));
    }

    @PatchMapping("/bookings/{bookingId}/status")
    RideBooking updateBookingStatus(@PathVariable UUID bookingId, @Valid @RequestBody UpdateRideBookingStatusInput input) {
        return bookingService.updateStatus(bookingId, input.status());
    }

    @DeleteMapping("/bookings/{bookingId}")
    ResponseEntity<Void> deleteBooking(@PathVariable UUID bookingId) {
        bookingService.delete(bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-bookings")
    List<RideBooking> myBookings(Authentication authentication) {
        return bookingService.findByUserId(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/offers/{offerId}/ratings")
    List<RideRating> ratings(@PathVariable UUID offerId) {
        return ratingService.findByRideId(offerId);
    }

    @PostMapping("/offers/{offerId}/ratings")
    ResponseEntity<RideRating> createRating(@PathVariable UUID offerId, Authentication authentication,
                                             @Valid @RequestBody CreateRideRatingInput input) {
        var raterId = UUID.fromString(authentication.getName());
        var rating = ratingService.create(offerId, raterId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/ratings/" + rating.getId())).body(rating);
    }

    @GetMapping("/ratings/{ratingId}")
    RideRating rating(@PathVariable UUID ratingId) {
        return ratingService.findById(ratingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found"));
    }

    @DeleteMapping("/ratings/{ratingId}")
    ResponseEntity<Void> deleteRating(@PathVariable UUID ratingId) {
        ratingService.delete(ratingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-ratings")
    List<RideRating> myRatings(Authentication authentication) {
        return ratingService.findByRatee(UUID.fromString(authentication.getName()));
    }
}

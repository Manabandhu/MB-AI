package com.manabandhu.backend.rides;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;

@RestController
@RequestMapping("/api/v1/rides")
public class RidesController {

    private final RidesContentService contentService;
    private final RideOfferService offerService;
    private final RideRequestService requestService;
    private final RideParticipantService participantService;
    private final RideBookingService bookingService;
    private final RideRatingService ratingService;
    private final ConversationService conversationService;
    private final ConversationParticipantService chatParticipantService;
    private final MessageService messageService;
    private final RideFavoriteService favoriteService;

    RidesController(RidesContentService contentService, RideOfferService offerService,
                    RideRequestService requestService, RideParticipantService participantService,
                    RideBookingService bookingService, RideRatingService ratingService,
                    ConversationService conversationService, ConversationParticipantService chatParticipantService,
                    MessageService messageService, RideFavoriteService favoriteService) {
        this.contentService = contentService;
        this.offerService = offerService;
        this.requestService = requestService;
        this.participantService = participantService;
        this.bookingService = bookingService;
        this.ratingService = ratingService;
        this.conversationService = conversationService;
        this.chatParticipantService = chatParticipantService;
        this.messageService = messageService;
        this.favoriteService = favoriteService;
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/offers")
    Page<RideOffer> offers(
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) Boolean avoidTolls,
            @RequestParam(required = false) String genderPreference,
            @RequestParam(required = false) Boolean isRecurring,
            Pageable pageable) {
        return offerService.searchActive(origin, destination, avoidTolls, genderPreference, isRecurring, pageable);
    }

    @PostMapping("/offers")
    ResponseEntity<RideOffer> createOffer(Authentication authentication, @Valid @RequestBody CreateRideOfferInput input) {
        var driverId = actorId(authentication);
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
        var driverId = actorId(authentication);
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(driverId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offer;
    }

    @GetMapping("/{rideId}/owner")
    RideOffer rideDetailForOwner(Authentication authentication, @PathVariable UUID rideId) {
        var driverId = actorId(authentication);
        var offer = offerService.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(driverId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offer;
    }

    private static UUID actorId(Authentication authentication) {
        return Actor.require(authentication).id();
    }

    private static boolean isAdmin(Authentication authentication) {
        return Actor.from(authentication).map(Actor::admin).orElse(false);
    }

    @PatchMapping("/offers/{offerId}")
    RideOffer updateOffer(Authentication authentication, @PathVariable UUID offerId, @Valid @RequestBody UpdateRideOfferInput input) {
        var actorId = actorId(authentication);
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offerService.update(offerId, input);
    }

    @PatchMapping("/{rideId}")
    RideOffer updateRide(Authentication authentication, @PathVariable UUID rideId, @Valid @RequestBody UpdateRideOfferInput input) {
        var actorId = actorId(authentication);
        var offer = offerService.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offerService.update(rideId, input);
    }

    @PostMapping({"/offers/{offerId}/re-activate", "/{offerId}/re-activate"})
    ResponseEntity<RideOffer> reactivateOffer(
            Authentication authentication,
            @PathVariable UUID offerId,
            @RequestBody(required = false) ReactivateRideInput input) {
        var driverId = actorId(authentication);
        var newDeparture = (input != null) ? input.newDepartureAt() : null;
        var reactivated = offerService.reactivate(offerId, driverId, newDeparture);
        return ResponseEntity.created(URI.create("/api/v1/rides/offers/" + reactivated.getId())).body(reactivated);
    }

    @PatchMapping({"/offers/{offerId}/status", "/{offerId}/status"})
    RideOffer updateOfferStatus(
            Authentication authentication,
            @PathVariable UUID offerId,
            @Valid @RequestBody UpdateRideStatusInput input) {
        var actorId = actorId(authentication);
        return offerService.updateStatus(offerId, actorId, isAdmin(authentication), input.status());
    }

    @PostMapping({"/offers/{offerId}/chat", "/{offerId}/chat"})
    ResponseEntity<RideChatResponse> provisionRideChat(
            Authentication authentication,
            @PathVariable UUID offerId) {
        var actor = Actor.require(authentication);
        var actorId = actor.id();
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        // Only the driver and passengers with a live booking or accepted request may join the ride chat.
        offerService.requireRideMember(actor, offer);

        var bookings = bookingService.findByRideId(offerId);

        if (offer.getConversationId() != null) {
            if (!chatParticipantService.isParticipant(offer.getConversationId(), actorId)) {
                chatParticipantService.add(offer.getConversationId(), actorId, ConversationParticipant.ParticipantRole.MEMBER);
            }
            return ResponseEntity.ok(new RideChatResponse(
                    offer.getConversationId(),
                    offerId,
                    offer.getChatExpiresAt(),
                    "🔒 Ephemeral Chat: This conversation will automatically self-delete 2 hours after ride completion."
            ));
        }

        var title = "Ride: " + offer.getOriginArea() + " → " + offer.getDestinationArea();
        var conversation = conversationService.create(offer.getDriverId(), Conversation.ConversationType.RIDE_TEMP, title);

        if (!actorId.equals(offer.getDriverId())) {
            chatParticipantService.add(conversation.getId(), actorId, ConversationParticipant.ParticipantRole.MEMBER);
        }

        for (var booking : bookings) {
            if ("CONFIRMED".equalsIgnoreCase(booking.getStatus()) || "ACCEPTED".equalsIgnoreCase(booking.getStatus())) {
                if (!booking.getUserId().equals(offer.getDriverId()) && !booking.getUserId().equals(actorId)) {
                    chatParticipantService.add(conversation.getId(), booking.getUserId(), ConversationParticipant.ParticipantRole.MEMBER);
                }
            }
        }

        String initialNotice = String.format(
                "🚗 Ride Coordination Chat created for %s → %s.\n\n" +
                "🔒 Ephemeral Notice: This chat is temporary and will permanently self-delete 2 hours after the ride is marked completed.",
                offer.getOriginArea(), offer.getDestinationArea()
        );
        messageService.send(conversation.getId(), offer.getDriverId(), initialNotice, Message.MessageType.SYSTEM);

        offerService.attachConversation(offerId, conversation.getId(), offer.getChatExpiresAt());

        return ResponseEntity.ok(new RideChatResponse(
                conversation.getId(),
                offerId,
                offer.getChatExpiresAt(),
                "🔒 Ephemeral Chat: This conversation will automatically self-delete 2 hours after ride completion."
        ));
    }

    @DeleteMapping("/offers/{offerId}")
    ResponseEntity<Void> deleteOffer(Authentication authentication, @PathVariable UUID offerId) {
        var actorId = actorId(authentication);
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        offerService.delete(offerId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{rideId}")
    ResponseEntity<Void> deleteRide(Authentication authentication, @PathVariable UUID rideId) {
        var actorId = actorId(authentication);
        var offer = offerService.findById(rideId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        offerService.delete(rideId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-offers")
    List<RideOffer> myOffers(Authentication authentication) {
        return offerService.findByDriver(actorId(authentication));
    }

    @GetMapping("/mine")
    List<RideOffer> myRides(Authentication authentication) {
        return offerService.findByDriver(actorId(authentication));
    }

    @GetMapping("/history")
    List<RideOffer> history(Authentication authentication) {
        return offerService.findByDriver(actorId(authentication));
    }

    @GetMapping("/saved")
    List<RideOffer> saved(Authentication authentication) {
        return favoriteService.savedRides(actorId(authentication));
    }

    @PostMapping({"/{rideId}/favorite", "/offers/{rideId}/favorite"})
    RideOffer favorite(Authentication authentication, @PathVariable UUID rideId) {
        return favoriteService.save(actorId(authentication), rideId);
    }

    @DeleteMapping({"/{rideId}/favorite", "/offers/{rideId}/favorite"})
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID rideId) {
        favoriteService.unsave(actorId(authentication), rideId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/offers/{offerId}/seats")
    RideOffer adjustSeats(Authentication authentication, @PathVariable UUID offerId, @RequestParam int seats) {
        var actorId = actorId(authentication);
        var offer = offerService.findById(offerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
        if (!offer.getDriverId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return offerService.adjustSeats(offerId, seats);
    }

    @GetMapping("/offers/{offerId}/requests")
    List<RideRequest> requests(Authentication authentication, @PathVariable UUID offerId) {
        return requestService.listForRide(Actor.require(authentication), offerId);
    }

    @PostMapping("/offers/{offerId}/requests")
    ResponseEntity<RideRequest> createRequest(@PathVariable UUID offerId, Authentication authentication,
                                              @Valid @RequestBody CreateRideRequestInput input) {
        var request = requestService.create(offerId, Actor.require(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/rides/requests/" + request.getId())).body(request);
    }

    @GetMapping("/requests/{requestId}")
    RideRequest request(Authentication authentication, @PathVariable UUID requestId) {
        return requestService.requireVisible(Actor.require(authentication), requestId);
    }

    @PatchMapping("/requests/{requestId}/status")
    RideRequest updateRequestStatus(Authentication authentication, @PathVariable UUID requestId, @Valid @RequestBody UpdateRideRequestStatusInput input) {
        return requestService.updateStatus(Actor.require(authentication), requestId, input.status());
    }

    @DeleteMapping("/requests/{requestId}")
    ResponseEntity<Void> deleteRequest(Authentication authentication, @PathVariable UUID requestId) {
        requestService.delete(Actor.require(authentication), requestId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-requests")
    List<RideRequest> myRequests(Authentication authentication) {
        return requestService.findByRider(actorId(authentication));
    }

    @GetMapping("/offers/{offerId}/participants")
    List<RideParticipant> participants(Authentication authentication, @PathVariable UUID offerId) {
        return participantService.listForRide(Actor.require(authentication), offerId);
    }

    /** Joins the caller to the ride; the role is derived server-side, never taken from the client. */
    @PostMapping("/offers/{offerId}/participants")
    ResponseEntity<RideParticipant> addParticipant(@PathVariable UUID offerId, Authentication authentication) {
        var participant = participantService.join(Actor.require(authentication), offerId);
        return ResponseEntity.created(URI.create("/api/v1/rides/participants/" + participant.getId())).body(participant);
    }

    @DeleteMapping("/participants/{participantId}")
    ResponseEntity<Void> deleteParticipant(Authentication authentication, @PathVariable UUID participantId) {
        participantService.delete(Actor.require(authentication), participantId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/offers/{offerId}/bookings")
    List<RideBooking> bookings(Authentication authentication, @PathVariable UUID offerId) {
        return bookingService.listForRide(Actor.require(authentication), offerId);
    }

    @PostMapping("/offers/{offerId}/bookings")
    ResponseEntity<RideBooking> createBooking(@PathVariable UUID offerId, Authentication authentication,
                                               @Valid @RequestBody CreateRideBookingInput input) {
        var booking = bookingService.create(offerId, Actor.require(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/rides/bookings/" + booking.getId())).body(booking);
    }

    @GetMapping("/bookings/{bookingId}")
    RideBooking booking(Authentication authentication, @PathVariable UUID bookingId) {
        return bookingService.requireVisible(Actor.require(authentication), bookingId);
    }

    @PatchMapping("/bookings/{bookingId}/status")
    RideBooking updateBookingStatus(Authentication authentication, @PathVariable UUID bookingId, @Valid @RequestBody UpdateRideBookingStatusInput input) {
        return bookingService.updateStatus(Actor.require(authentication), bookingId, input.status());
    }

    @DeleteMapping("/bookings/{bookingId}")
    ResponseEntity<Void> deleteBooking(Authentication authentication, @PathVariable UUID bookingId) {
        bookingService.delete(Actor.require(authentication), bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-bookings")
    List<RideBooking> myBookings(Authentication authentication) {
        return bookingService.findByUserId(actorId(authentication));
    }

    @GetMapping("/offers/{offerId}/ratings")
    List<RideRating> ratings(@PathVariable UUID offerId) {
        return ratingService.findByRideId(offerId);
    }

    @PostMapping("/offers/{offerId}/ratings")
    ResponseEntity<RideRating> createRating(@PathVariable UUID offerId, Authentication authentication,
                                             @Valid @RequestBody CreateRideRatingInput input) {
        var raterId = actorId(authentication);
        var rating = ratingService.create(offerId, raterId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/ratings/" + rating.getId())).body(rating);
    }

    @GetMapping("/ratings/{ratingId}")
    RideRating rating(@PathVariable UUID ratingId) {
        return ratingService.findById(ratingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found"));
    }

    @DeleteMapping("/ratings/{ratingId}")
    ResponseEntity<Void> deleteRating(Authentication authentication, @PathVariable UUID ratingId) {
        var actorId = actorId(authentication);
        var rating = ratingService.findById(ratingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found"));
        if (!rating.getRaterId().equals(actorId) && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your rating");
        }
        ratingService.delete(ratingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-ratings")
    List<RideRating> myRatings(Authentication authentication) {
        return ratingService.findByRatee(actorId(authentication));
    }
}

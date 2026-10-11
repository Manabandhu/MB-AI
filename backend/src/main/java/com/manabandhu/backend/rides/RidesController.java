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
    private final RideViews rideViews;

    RidesController(RidesContentService contentService, RideOfferService offerService,
                    RideRequestService requestService, RideParticipantService participantService,
                    RideBookingService bookingService, RideRatingService ratingService,
                    ConversationService conversationService, ConversationParticipantService chatParticipantService,
                    MessageService messageService, RideFavoriteService favoriteService, RideViews rideViews) {
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
        this.rideViews = rideViews;
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/offers")
    Page<RideOfferView> offers(
            Authentication authentication,
            @RequestParam(required = false) String origin,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) Boolean avoidTolls,
            @RequestParam(required = false) String genderPreference,
            @RequestParam(required = false) Boolean isRecurring,
            Pageable pageable) {
        // Soonest departure first only; a client-chosen sort could name a column that does not exist (500).
        var page = offerService.searchActive(origin, destination, avoidTolls, genderPreference, isRecurring,
                org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()));
        var views = rideViews.searchViews(page.getContent(), viewer(authentication));
        return new org.springframework.data.domain.PageImpl<>(views, page.getPageable(), page.getTotalElements());
    }

    @PostMapping("/offers")
    ResponseEntity<RideOfferView> createOffer(Authentication authentication, @Valid @RequestBody CreateRideOfferInput input) {
        var actor = Actor.require(authentication);
        var offer = offerService.create(actor.id(), input);
        return ResponseEntity.created(URI.create("/api/v1/rides/offers/" + offer.getId())).body(rideViews.view(offer, actor));
    }

    @GetMapping({"/offers/{offerId}", "/{offerId}"})
    RideOfferView offer(Authentication authentication, @PathVariable UUID offerId) {
        return rideViews.view(requireOffer(offerId), viewer(authentication));
    }

    @GetMapping({"/offers/{offerId}/owner", "/{offerId}/owner"})
    RideOfferView offerForOwner(Authentication authentication, @PathVariable UUID offerId) {
        var actor = Actor.require(authentication);
        var offer = requireOffer(offerId);
        if (!actor.admin() && !actor.is(offer.getDriverId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your ride");
        }
        return rideViews.view(offer, actor);
    }

    private static UUID actorId(Authentication authentication) {
        return Actor.require(authentication).id();
    }

    private static Actor viewer(Authentication authentication) {
        return Actor.from(authentication).orElse(null);
    }

    private RideOffer requireOffer(UUID id) {
        return offerService.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride offer not found"));
    }

    @PatchMapping({"/offers/{offerId}", "/{offerId}"})
    RideOfferView updateOffer(Authentication authentication, @PathVariable UUID offerId,
                              @Valid @RequestBody UpdateRideOfferInput input) {
        var actor = Actor.require(authentication);
        return rideViews.view(offerService.update(actor, offerId, input), actor);
    }

    @PostMapping({"/offers/{offerId}/re-activate", "/{offerId}/re-activate"})
    ResponseEntity<RideOfferView> reactivateOffer(
            Authentication authentication,
            @PathVariable UUID offerId,
            @Valid @RequestBody ReactivateRideInput input) {
        var actor = Actor.require(authentication);
        var reactivated = offerService.reactivate(actor, offerId, input.newDepartureAt());
        return ResponseEntity.created(URI.create("/api/v1/rides/offers/" + reactivated.getId()))
                .body(rideViews.view(reactivated, actor));
    }

    @PatchMapping({"/offers/{offerId}/status", "/{offerId}/status"})
    RideOfferView updateOfferStatus(
            Authentication authentication,
            @PathVariable UUID offerId,
            @Valid @RequestBody UpdateRideStatusInput input) {
        var actor = Actor.require(authentication);
        return rideViews.view(offerService.updateStatus(actor, offerId, input.status()), actor);
    }

    @PostMapping({"/offers/{offerId}/chat", "/{offerId}/chat"})
    ResponseEntity<RideChatResponse> provisionRideChat(
            Authentication authentication,
            @PathVariable UUID offerId) {
        var actor = Actor.require(authentication);
        var actorId = actor.id();
        var offer = requireOffer(offerId);
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

    @DeleteMapping({"/offers/{offerId}", "/{offerId}"})
    ResponseEntity<Void> deleteOffer(Authentication authentication, @PathVariable UUID offerId) {
        offerService.delete(Actor.require(authentication), offerId);
        return ResponseEntity.noContent().build();
    }

    /** The caller's newest 200 offers as a driver. */
    @GetMapping({"/my-offers", "/mine"})
    List<RideOfferView> myOffers(Authentication authentication) {
        var actor = Actor.require(authentication);
        return rideViews.views(offerService.findByDriver(actor.id()), actor);
    }

    /** Finished, cancelled, or departed rides the caller drove or rode on. */
    @GetMapping("/history")
    List<RideOfferView> history(Authentication authentication) {
        var actor = Actor.require(authentication);
        return rideViews.views(offerService.findHistory(actor.id()), actor);
    }

    @GetMapping("/saved")
    List<RideOfferView> saved(Authentication authentication) {
        var actor = Actor.require(authentication);
        return rideViews.views(favoriteService.savedRides(actor.id()), actor);
    }

    @PostMapping({"/{rideId}/favorite", "/offers/{rideId}/favorite"})
    RideOfferView favorite(Authentication authentication, @PathVariable UUID rideId) {
        var actor = Actor.require(authentication);
        return rideViews.view(favoriteService.save(actor.id(), rideId), actor);
    }

    @DeleteMapping({"/{rideId}/favorite", "/offers/{rideId}/favorite"})
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID rideId) {
        favoriteService.unsave(actorId(authentication), rideId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/offers/{offerId}/seats")
    RideOfferView adjustSeats(Authentication authentication, @PathVariable UUID offerId, @RequestParam int seats) {
        var actor = Actor.require(authentication);
        return rideViews.view(offerService.adjustSeats(actor, offerId, seats), actor);
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

    /** Public: scores and comments only, not who rated whom. */
    @GetMapping("/offers/{offerId}/ratings")
    List<RideRatingView> ratings(@PathVariable UUID offerId) {
        return ratingService.findByRideId(offerId).stream().map(RideRatingView::of).toList();
    }

    @PostMapping("/offers/{offerId}/ratings")
    ResponseEntity<RideRating> createRating(@PathVariable UUID offerId, Authentication authentication,
                                             @Valid @RequestBody CreateRideRatingInput input) {
        var raterId = actorId(authentication);
        var rating = ratingService.create(offerId, raterId, input);
        return ResponseEntity.created(URI.create("/api/v1/rides/ratings/" + rating.getId())).body(rating);
    }

    @GetMapping("/ratings/{ratingId}")
    RideRatingView rating(@PathVariable UUID ratingId) {
        return ratingService.findById(ratingId).map(RideRatingView::of)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found"));
    }

    @DeleteMapping("/ratings/{ratingId}")
    ResponseEntity<Void> deleteRating(Authentication authentication, @PathVariable UUID ratingId) {
        var actor = Actor.require(authentication);
        var rating = ratingService.findById(ratingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ride rating not found"));
        if (!actor.is(rating.getRaterId()) && !actor.admin()) {
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

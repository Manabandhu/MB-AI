package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.chat.Conversation;
import com.manabandhu.backend.chat.ConversationParticipant;
import com.manabandhu.backend.chat.ConversationParticipantService;
import com.manabandhu.backend.chat.ConversationService;
import com.manabandhu.backend.chat.Message;
import com.manabandhu.backend.chat.MessageService;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomsController {

    private static final Logger log = LoggerFactory.getLogger(RoomsController.class);

    private final RoomsContentService contentService;
    private final RoomListingService listingService;
    private final RoomAvailabilityService availabilityService;
    private final RoomBookingService bookingService;
    private final RoomImageService imageService;
    private final RoomFavoriteService favoriteService;
    private final RoomSavedSearchService savedSearchService;
    private final RoomReportService reportService;
    private final RoomAnalyticsService analyticsService;
    private final RoomInquiryRepository inquiryRepository;
    private final ConversationService conversationService;
    private final ConversationParticipantService participantService;
    private final MessageService messageService;

    public RoomsController(RoomsContentService contentService, RoomListingService listingService,
                           RoomAvailabilityService availabilityService, RoomBookingService bookingService,
                           RoomImageService imageService, RoomFavoriteService favoriteService,
                           RoomSavedSearchService savedSearchService, RoomReportService reportService,
                           RoomAnalyticsService analyticsService, RoomInquiryRepository inquiryRepository,
                           ConversationService conversationService, ConversationParticipantService participantService,
                           MessageService messageService) {
        this.contentService = contentService;
        this.listingService = listingService;
        this.availabilityService = availabilityService;
        this.bookingService = bookingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
        this.savedSearchService = savedSearchService;
        this.reportService = reportService;
        this.analyticsService = analyticsService;
        this.inquiryRepository = inquiryRepository;
        this.conversationService = conversationService;
        this.participantService = participantService;
        this.messageService = messageService;
    }

    private static UUID actorId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    private static boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return false;
        }
        return authentication.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_SUPER_ADMIN") || a.equals("ROLE_ADMIN"));
    }

    @GetMapping("/amenities")
    public List<RoomAmenityCatalog> amenities() {
        return listingService.getAmenitiesCatalog();
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/listings")
    Page<RoomListingResponse> listings(
            Authentication authentication,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String roomType,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String dietaryPreference,
            @RequestParam(required = false) String genderPreference,
            @RequestParam(required = false) BigDecimal minRent,
            @RequestParam(required = false) BigDecimal maxRent,
            @RequestParam(required = false) Boolean privateBathOnly,
            @RequestParam(required = false) BigDecimal lat,
            @RequestParam(required = false) BigDecimal lng,
            @RequestParam(required = false) Double radiusMiles,
            Pageable pageable) {
        var viewerId = authentication == null ? null : actorId(authentication);
        String searchCity = city != null ? city : location;
        String bath = Boolean.TRUE.equals(privateBathOnly) ? "PRIVATE_ATTACHED" : null;

        Page<RoomListing> listings;
        if (city != null || state != null || dietaryPreference != null || genderPreference != null
                || minRent != null || maxRent != null || bath != null) {
            listings = listingService.search(searchCity, state, dietaryPreference, genderPreference,
                    minRent, maxRent, bath, pageable);
        } else {
            listings = listingService.search(location, roomType, pageable);
        }
        List<UUID> listingIds = listings.getContent().stream().map(RoomListing::getId).toList();
        var amenitiesMap = listingService.amenitiesForListings(listingIds);
        var preferencesMap = listingService.preferencesForListings(listingIds);
        var savedSet = viewerId == null ? java.util.Set.<UUID>of() : favoriteService.findSavedListingIds(viewerId, listingIds);

        return listings.map(l -> RoomListingResponse.from(l,
                amenitiesMap.getOrDefault(l.getId(), List.of()),
                preferencesMap.getOrDefault(l.getId(), List.of()),
                savedSet.contains(l.getId())));
    }

    @PostMapping("/listings")
    ResponseEntity<OwnerRoomListingResponse> createListing(Authentication authentication,
                                                           @Valid @RequestBody CreateRoomListingInput input) {
        var ownerId = actorId(authentication);
        var listing = listingService.create(ownerId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/listings/" + listing.getId()))
                .body(toOwnerResponse(listing));
    }

    @GetMapping("/listings/{listingId}")
    RoomListingResponse listing(Authentication authentication, @PathVariable UUID listingId) {
        var viewerId = authentication == null ? null : actorId(authentication);
        var listing = listingService.findPublishedById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        return toResponse(listing, viewerId);
    }

    @GetMapping("/{roomId}")
    RoomListingResponse roomDetail(Authentication authentication, @PathVariable UUID roomId) {
        var viewerId = authentication == null ? null : actorId(authentication);
        var listing = listingService.findPublishedById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        return toResponse(listing, viewerId);
    }

    @GetMapping("/listings/{listingId}/owner")
    OwnerRoomListingResponse listingForOwner(Authentication authentication, @PathVariable UUID listingId) {
        var actorId = actorId(authentication);
        var listing = listingService.requireOwnedListingListing(actorId, isAdmin(authentication), listingId);
        return toOwnerResponse(listing);
    }

    @GetMapping("/{roomId}/owner")
    OwnerRoomListingResponse roomDetailForOwner(Authentication authentication, @PathVariable UUID roomId) {
        var actorId = actorId(authentication);
        var listing = listingService.requireOwnedListingListing(actorId, isAdmin(authentication), roomId);
        return toOwnerResponse(listing);
    }

    @PatchMapping("/listings/{listingId}")
    OwnerRoomListingResponse updateListing(Authentication authentication, @PathVariable UUID listingId,
                                           @Valid @RequestBody UpdateRoomListingInput input) {
        var actorId = actorId(authentication);
        var listing = listingService.update(listingId, actorId, isAdmin(authentication), input);
        return toOwnerResponse(listing);
    }

    @PatchMapping("/{roomId}")
    OwnerRoomListingResponse updateRoom(Authentication authentication, @PathVariable UUID roomId,
                                        @Valid @RequestBody UpdateRoomListingInput input) {
        var actorId = actorId(authentication);
        var listing = listingService.update(roomId, actorId, isAdmin(authentication), input);
        return toOwnerResponse(listing);
    }

    @PatchMapping("/listings/{listingId}/publish")
    OwnerRoomListingResponse publish(Authentication authentication, @PathVariable UUID listingId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(listingId, actorId, "active", "publish"));
    }

    @PatchMapping("/{roomId}/publish")
    OwnerRoomListingResponse publishRoom(Authentication authentication, @PathVariable UUID roomId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(roomId, actorId, "active", "publish"));
    }

    @PatchMapping("/listings/{listingId}/pause")
    OwnerRoomListingResponse pause(Authentication authentication, @PathVariable UUID listingId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(listingId, actorId, "paused", "pause"));
    }

    @PatchMapping("/{roomId}/pause")
    OwnerRoomListingResponse pauseRoom(Authentication authentication, @PathVariable UUID roomId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(roomId, actorId, "paused", "pause"));
    }

    @PatchMapping("/listings/{listingId}/archive")
    OwnerRoomListingResponse archive(Authentication authentication, @PathVariable UUID listingId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(listingId, actorId, "archived", "archive"));
    }

    @PatchMapping("/{roomId}/archive")
    OwnerRoomListingResponse archiveRoom(Authentication authentication, @PathVariable UUID roomId) {
        var actorId = actorId(authentication);
        return toOwnerResponse(listingService.setOwnerOnlyStatus(roomId, actorId, "archived", "archive"));
    }

    @DeleteMapping("/listings/{listingId}")
    ResponseEntity<Void> deleteListing(Authentication authentication, @PathVariable UUID listingId) {
        listingService.delete(listingId, actorId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{roomId}")
    ResponseEntity<Void> deleteRoom(Authentication authentication, @PathVariable UUID roomId) {
        listingService.delete(roomId, actorId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-listings")
    List<OwnerRoomListingResponse> myListings(Authentication authentication) {
        var ownerId = actorId(authentication);
        return listingService.findByOwner(ownerId).stream().map(this::toOwnerResponse).toList();
    }

    @GetMapping("/listings/{listingId}/images")
    List<RoomImage> images(@PathVariable UUID listingId) {
        return imageService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/images")
    ResponseEntity<RoomImage> addImage(Authentication authentication, @PathVariable UUID listingId,
                                       @Valid @RequestBody AddRoomImageInput input) {
        var image = imageService.add(listingId, actorId(authentication), isAdmin(authentication),
                input.url(), input.sortOrder());
        return ResponseEntity.created(URI.create("/api/v1/rooms/images/" + image.getId())).body(image);
    }

    @DeleteMapping("/images/{imageId}")
    ResponseEntity<Void> deleteImage(Authentication authentication, @PathVariable UUID imageId) {
        imageService.delete(imageId, actorId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/availability")
    List<RoomAvailability> availability(@PathVariable UUID listingId) {
        return availabilityService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/availability")
    ResponseEntity<RoomAvailability> createAvailability(Authentication authentication, @PathVariable UUID listingId,
                                                         @Valid @RequestBody CreateRoomAvailabilityInput input) {
        var availability = availabilityService.create(listingId, actorId(authentication),
                isAdmin(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/availability/" + availability.getId())).body(availability);
    }

    @DeleteMapping("/availability/{availabilityId}")
    ResponseEntity<Void> deleteAvailability(Authentication authentication, @PathVariable UUID availabilityId) {
        availabilityService.delete(availabilityId, actorId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/bookings")
    List<RoomBooking> bookings(Authentication authentication, @PathVariable UUID listingId) {
        return bookingService.findByListingId(listingId, actorId(authentication), isAdmin(authentication));
    }

    @PostMapping("/listings/{listingId}/bookings")
    ResponseEntity<RoomBooking> createBooking(Authentication authentication, @PathVariable UUID listingId,
                                               @Valid @RequestBody CreateRoomBookingInput input) {
        var requesterId = actorId(authentication);
        var booking = bookingService.create(listingId, requesterId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/bookings/" + booking.getId())).body(booking);
    }

    @PostMapping("/{roomId}/inquire")
    public ResponseEntity<RoomInquiryResponse> inquire(
            Authentication authentication,
            @PathVariable UUID roomId,
            @Valid @RequestBody RoomInquiryInput input) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required to submit room inquiry");
        }
        var senderId = actorId(authentication);
        var listing = listingService.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        var hostId = listing.getOwnerId();

        if (senderId.equals(hostId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot inquire about your own room listing");
        }

        // Create direct conversation for room inquiry with title
        var title = "Room Inquiry: " + listing.getTitle();
        var conversation = conversationService.create(senderId, Conversation.ConversationType.ROOM_INQUIRY, title);
        participantService.add(conversation.getId(), hostId, ConversationParticipant.ParticipantRole.MEMBER);

        // Format and post intro chat message
        String introText = String.format(
                "👋 Room Inquiry for \"%s\" ($%s/mo)\n\n" +
                "📅 Preferred Move-In: %s\n" +
                "⏳ Stay Duration: %d months\n" +
                "🥗 Dietary Preference: %s\n\n" +
                "💬 Message: %s",
                listing.getTitle(),
                listing.getPrice() != null ? listing.getPrice().toPlainString() : "N/A",
                input.moveInDate(),
                input.stayDurationMonths() != null ? input.stayDurationMonths() : 6,
                input.dietaryLifestyle() != null ? input.dietaryLifestyle() : "Flexible",
                input.introMessage()
        );
        messageService.send(conversation.getId(), senderId, introText, Message.MessageType.TEXT);

        // Record room inquiry
        var inquiry = inquiryRepository.save(new RoomInquiry(
                roomId, senderId, hostId, conversation.getId(),
                input.moveInDate(), input.stayDurationMonths(),
                input.dietaryLifestyle(), input.introMessage()
        ));

        return ResponseEntity.ok(new RoomInquiryResponse(inquiry.getId(), conversation.getId()));
    }

    @PostMapping("/listings/{listingId}/inquire")
    public ResponseEntity<RoomInquiryResponse> inquireByListingId(
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody RoomInquiryInput input) {
        return inquire(authentication, listingId, input);
    }

    @GetMapping("/bookings/{bookingId}")
    RoomBooking booking(Authentication authentication, @PathVariable UUID bookingId) {
        return bookingService.requireBooking(bookingId, actorId(authentication), isAdmin(authentication));
    }

    @PatchMapping("/bookings/{bookingId}/status")
    RoomBooking updateBookingStatus(Authentication authentication, @PathVariable UUID bookingId,
                                     @Valid @RequestBody UpdateRoomBookingStatusInput input) {
        return bookingService.updateStatus(bookingId, actorId(authentication), isAdmin(authentication), input.status());
    }

    @DeleteMapping("/bookings/{bookingId}")
    ResponseEntity<Void> deleteBooking(Authentication authentication, @PathVariable UUID bookingId) {
        bookingService.delete(bookingId, actorId(authentication), isAdmin(authentication));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-bookings")
    List<RoomBooking> myBookings(Authentication authentication) {
        return bookingService.findByRequester(actorId(authentication));
    }

    @GetMapping("/favorites")
    List<RoomListingResponse> favorites(Authentication authentication) {
        var userId = actorId(authentication);
        return favoriteService.findListingResponses(userId, listingService);
    }

    @PostMapping({"/listings/{listingId}/favorite", "/{listingId}/favorite"})
    ResponseEntity<RoomListingResponse> favorite(Authentication authentication, @PathVariable UUID listingId) {
        var userId = actorId(authentication);
        favoriteService.favorite(userId, listingId);
        var listing = listingService.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        return ResponseEntity.created(URI.create("/api/v1/rooms/favorites/" + listingId))
                .body(toResponse(listing, userId));
    }

    @DeleteMapping({"/listings/{listingId}/favorite", "/{listingId}/favorite"})
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID listingId) {
        favoriteService.unfavorite(actorId(authentication), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved-searches")
    List<RoomSavedSearch> savedSearches(Authentication authentication) {
        return savedSearchService.findByUserId(actorId(authentication));
    }

    @PostMapping("/saved-searches")
    ResponseEntity<RoomSavedSearch> createSavedSearch(Authentication authentication,
                                                       @Valid @RequestBody CreateSavedSearchInput input) {
        var search = savedSearchService.create(actorId(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/saved-searches/" + search.getId())).body(search);
    }

    @PatchMapping("/saved-searches/{searchId}")
    RoomSavedSearch updateSavedSearch(Authentication authentication, @PathVariable UUID searchId,
                                      @Valid @RequestBody UpdateSavedSearchInput input) {
        return savedSearchService.update(searchId, actorId(authentication), input);
    }

    @DeleteMapping("/saved-searches/{searchId}")
    ResponseEntity<Void> deleteSavedSearch(Authentication authentication, @PathVariable UUID searchId) {
        savedSearchService.delete(searchId, actorId(authentication));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/{listingId}/report")
    ResponseEntity<RoomReport> report(Authentication authentication, @PathVariable UUID listingId,
                                      @Valid @RequestBody CreateReportInput input) {
        var report = reportService.create(actorId(authentication),
                new CreateReportInput(listingId, input.reason(), input.description()));
        return ResponseEntity.created(URI.create("/api/v1/rooms/reports/" + report.getId())).body(report);
    }

    @GetMapping("/my-reports")
    List<RoomReport> myReports(Authentication authentication) {
        return reportService.findByReporter(actorId(authentication));
    }

    @GetMapping("/listings/{listingId}/analytics")
    Map<String, Long> analytics(Authentication authentication, @PathVariable UUID listingId) {
        return analyticsService.summary(listingId, actorId(authentication), isAdmin(authentication));
    }

    @GetMapping("/admin/reports")
    List<RoomReport> reviewQueue(Authentication authentication, @RequestParam(required = false) String status) {
        if (!isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Moderator access required");
        }
        return reportService.findReviewQueue(status);
    }

    @PostMapping("/admin/reports/{reportId}/review")
    RoomReport reviewReport(Authentication authentication, @PathVariable UUID reportId,
                            @RequestParam String status, @RequestParam(required = false) String resolution) {
        return reportService.review(reportId, actorId(authentication), isAdmin(authentication), status, resolution);
    }

    @PostMapping("/admin/listings/{listingId}/moderate")
    OwnerRoomListingResponse moderate(Authentication authentication, @PathVariable UUID listingId,
                                      @RequestParam String status) {
        var listing = listingService.moderate(listingId, actorId(authentication), status, isAdmin(authentication));
        return toOwnerResponse(listing);
    }

    private RoomListingResponse toResponse(RoomListing listing, UUID viewerId) {
        var amenities = listingService.amenitiesFor(listing.getId());
        var preferences = listingService.preferencesFor(listing.getId());
        var saved = viewerId != null && favoriteService.isSaved(listing.getId(), viewerId);
        return RoomListingResponse.from(listing, amenities, preferences, saved);
    }

    private OwnerRoomListingResponse toOwnerResponse(RoomListing listing) {
        return OwnerRoomListingResponse.from(listing,
                listingService.amenitiesFor(listing.getId()),
                listingService.preferencesFor(listing.getId()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        log.error("Rooms error: {}", ex.getMessage(), ex);
        var status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.valueOf(rse.getStatusCode().value());
        }
        return ResponseEntity.status(status).body(Map.of(
                "error", ex.getMessage() != null ? ex.getMessage() : "Unknown error",
                "type", ex.getClass().getSimpleName()
        ));
    }
}

package com.manabandhu.backend.rooms;

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
@RequestMapping("/api/v1/rooms")
public class RoomsController {

    private final RoomsContentService contentService;
    private final RoomListingService listingService;
    private final RoomAvailabilityService availabilityService;
    private final RoomBookingService bookingService;
    private final RoomImageService imageService;
    private final RoomFavoriteService favoriteService;
    private final RoomSavedSearchService savedSearchService;
    private final RoomReportService reportService;
    private final RoomAnalyticsService analyticsService;

    RoomsController(RoomsContentService contentService, RoomListingService listingService,
                    RoomAvailabilityService availabilityService, RoomBookingService bookingService,
                    RoomImageService imageService, RoomFavoriteService favoriteService,
                    RoomSavedSearchService savedSearchService, RoomReportService reportService,
                    RoomAnalyticsService analyticsService) {
        this.contentService = contentService;
        this.listingService = listingService;
        this.availabilityService = availabilityService;
        this.bookingService = bookingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
        this.savedSearchService = savedSearchService;
        this.reportService = reportService;
        this.analyticsService = analyticsService;
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

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/listings")
    Page<RoomListingResponse> listings(
            Authentication authentication,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String roomType,
            Pageable pageable) {
        var viewerId = authentication == null ? null : actorId(authentication);
        var listings = listingService.search(location, roomType, pageable);
        return listings.map(l -> toResponse(l, viewerId));
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

    @PostMapping("/listings/{listingId}/favorite")
    ResponseEntity<RoomListingResponse> favorite(Authentication authentication, @PathVariable UUID listingId) {
        var userId = actorId(authentication);
        favoriteService.favorite(userId, listingId);
        var listing = listingService.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        return ResponseEntity.created(URI.create("/api/v1/rooms/favorites/" + listingId))
                .body(toResponse(listing, userId));
    }

    @DeleteMapping("/listings/{listingId}/favorite")
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
}

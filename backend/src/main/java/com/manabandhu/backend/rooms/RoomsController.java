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
    private final RoomInquiryService inquiryService;
    private final RoomListingViews views;

    public RoomsController(RoomsContentService contentService, RoomListingService listingService,
                           RoomAvailabilityService availabilityService, RoomBookingService bookingService,
                           RoomImageService imageService, RoomFavoriteService favoriteService,
                           RoomSavedSearchService savedSearchService, RoomReportService reportService,
                           RoomAnalyticsService analyticsService, RoomInquiryService inquiryService,
                           RoomListingViews views) {
        this.contentService = contentService;
        this.listingService = listingService;
        this.availabilityService = availabilityService;
        this.bookingService = bookingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
        this.savedSearchService = savedSearchService;
        this.reportService = reportService;
        this.analyticsService = analyticsService;
        this.inquiryService = inquiryService;
        this.views = views;
    }

    private static Actor actor(Authentication authentication) {
        return Actor.require(authentication);
    }

    private static Actor viewer(Authentication authentication) {
        return Actor.from(authentication).orElse(null);
    }

    @GetMapping("/amenities")
    public List<RoomAmenityCatalog> amenities() {
        return listingService.getAmenitiesCatalog();
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(Authentication authentication, @PathVariable String screenId) {
        return contentService.screen(screenId, Actor.from(authentication));
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
        var bath = Boolean.TRUE.equals(privateBathOnly) ? "PRIVATE" : null;
        var criteria = new RoomSearchCriteria(city != null ? city : location, roomType, state, dietaryPreference,
                genderPreference, minRent, maxRent, bath, lat, lng, radiusMiles);
        // Newest first only; a client-chosen sort could name a column that does not exist (500).
        var page = listingService.search(criteria,
                org.springframework.data.domain.PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()));
        var responses = views.publicViews(page.getContent(), viewer(authentication));
        return new org.springframework.data.domain.PageImpl<>(responses, page.getPageable(), page.getTotalElements());
    }

    @PostMapping("/listings")
    ResponseEntity<OwnerRoomListingResponse> createListing(Authentication authentication,
                                                           @Valid @RequestBody CreateRoomListingInput input) {
        var listing = listingService.create(actor(authentication), input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/listings/" + listing.getId()))
                .body(views.ownerView(listing));
    }

    @GetMapping({"/listings/{listingId}", "/{listingId}"})
    RoomListingResponse listing(Authentication authentication, @PathVariable UUID listingId) {
        // Active or paused for everyone; the owner and admins also see drafts, rented and archived listings.
        var viewer = viewer(authentication);
        return views.publicView(listingService.requireVisible(listingId, viewer), viewer);
    }

    @GetMapping({"/listings/{listingId}/owner", "/{listingId}/owner"})
    OwnerRoomListingResponse listingForOwner(Authentication authentication, @PathVariable UUID listingId) {
        return views.ownerView(listingService.requireOwned(actor(authentication), listingId));
    }

    @PatchMapping({"/listings/{listingId}", "/{listingId}"})
    OwnerRoomListingResponse updateListing(Authentication authentication, @PathVariable UUID listingId,
                                           @Valid @RequestBody UpdateRoomListingInput input) {
        return views.ownerView(listingService.update(actor(authentication), listingId, input));
    }

    @PatchMapping({"/listings/{listingId}/publish", "/{listingId}/publish"})
    OwnerRoomListingResponse publish(Authentication authentication, @PathVariable UUID listingId) {
        return views.ownerView(listingService.setOwnerOnlyStatus(actor(authentication), listingId, "active"));
    }

    @PatchMapping({"/listings/{listingId}/pause", "/{listingId}/pause"})
    OwnerRoomListingResponse pause(Authentication authentication, @PathVariable UUID listingId) {
        return views.ownerView(listingService.setOwnerOnlyStatus(actor(authentication), listingId, "paused"));
    }

    @PatchMapping({"/listings/{listingId}/archive", "/{listingId}/archive"})
    OwnerRoomListingResponse archive(Authentication authentication, @PathVariable UUID listingId) {
        return views.ownerView(listingService.setOwnerOnlyStatus(actor(authentication), listingId, "archived"));
    }

    @DeleteMapping({"/listings/{listingId}", "/{listingId}"})
    ResponseEntity<Void> deleteListing(Authentication authentication, @PathVariable UUID listingId) {
        listingService.delete(actor(authentication), listingId);
        return ResponseEntity.noContent().build();
    }

    /** The caller's newest 200 listings in every status. */
    @GetMapping("/my-listings")
    List<OwnerRoomListingResponse> myListings(Authentication authentication) {
        return views.ownerViews(listingService.findByOwner(actor(authentication).id()));
    }

    @GetMapping("/listings/{listingId}/images")
    List<RoomImage> images(Authentication authentication, @PathVariable UUID listingId) {
        return imageService.findVisible(listingId, viewer(authentication));
    }

    @PostMapping("/listings/{listingId}/images")
    ResponseEntity<RoomImage> addImage(Authentication authentication, @PathVariable UUID listingId,
                                       @Valid @RequestBody AddRoomImageInput input) {
        var image = imageService.add(actor(authentication), listingId, input.url(), input.sortOrder());
        return ResponseEntity.created(URI.create("/api/v1/rooms/images/" + image.getId())).body(image);
    }

    @DeleteMapping("/images/{imageId}")
    ResponseEntity<Void> deleteImage(Authentication authentication, @PathVariable UUID imageId) {
        imageService.delete(actor(authentication), imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/availability")
    List<RoomAvailability> availability(Authentication authentication, @PathVariable UUID listingId) {
        return availabilityService.findVisible(listingId, viewer(authentication));
    }

    @PostMapping("/listings/{listingId}/availability")
    ResponseEntity<RoomAvailability> createAvailability(Authentication authentication, @PathVariable UUID listingId,
                                                         @Valid @RequestBody CreateRoomAvailabilityInput input) {
        var availability = availabilityService.create(actor(authentication), listingId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/availability/" + availability.getId())).body(availability);
    }

    @DeleteMapping("/availability/{availabilityId}")
    ResponseEntity<Void> deleteAvailability(Authentication authentication, @PathVariable UUID availabilityId) {
        availabilityService.delete(actor(authentication), availabilityId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/bookings")
    List<RoomBooking> bookings(Authentication authentication, @PathVariable UUID listingId) {
        return bookingService.findByListingId(actor(authentication), listingId);
    }

    @PostMapping("/listings/{listingId}/bookings")
    ResponseEntity<RoomBooking> createBooking(Authentication authentication, @PathVariable UUID listingId,
                                               @Valid @RequestBody CreateRoomBookingInput input) {
        var booking = bookingService.create(listingId, actor(authentication).id(), input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/bookings/" + booking.getId())).body(booking);
    }

    @PostMapping({"/{listingId}/inquire", "/listings/{listingId}/inquire"})
    public ResponseEntity<RoomInquiryResponse> inquire(
            Authentication authentication,
            @PathVariable UUID listingId,
            @Valid @RequestBody RoomInquiryInput input) {
        return ResponseEntity.ok(inquiryService.inquire(actor(authentication), listingId, input));
    }

    @GetMapping("/bookings/{bookingId}")
    RoomBooking booking(Authentication authentication, @PathVariable UUID bookingId) {
        return bookingService.requireBooking(actor(authentication), bookingId);
    }

    @PatchMapping("/bookings/{bookingId}/status")
    RoomBooking updateBookingStatus(Authentication authentication, @PathVariable UUID bookingId,
                                     @Valid @RequestBody UpdateRoomBookingStatusInput input) {
        return bookingService.updateStatus(actor(authentication), bookingId, input.status());
    }

    @DeleteMapping("/bookings/{bookingId}")
    ResponseEntity<Void> deleteBooking(Authentication authentication, @PathVariable UUID bookingId) {
        bookingService.delete(actor(authentication), bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-bookings")
    List<RoomBooking> myBookings(Authentication authentication) {
        return bookingService.findByRequester(actor(authentication));
    }

    /** The caller's newest 200 saved listings that are still public. */
    @GetMapping("/favorites")
    List<RoomListingResponse> favorites(Authentication authentication) {
        var actor = actor(authentication);
        return views.publicViews(favoriteService.findSavedListings(actor.id()), actor);
    }

    @PostMapping({"/listings/{listingId}/favorite", "/{listingId}/favorite"})
    ResponseEntity<RoomListingResponse> favorite(Authentication authentication, @PathVariable UUID listingId) {
        var actor = actor(authentication);
        favoriteService.favorite(actor.id(), listingId);
        var listing = listingService.requireVisible(listingId, actor);
        return ResponseEntity.created(URI.create("/api/v1/rooms/favorites/" + listingId))
                .body(views.publicView(listing, actor));
    }

    @DeleteMapping({"/listings/{listingId}/favorite", "/{listingId}/favorite"})
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID listingId) {
        favoriteService.unfavorite(actor(authentication).id(), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/saved-searches")
    List<RoomSavedSearch> savedSearches(Authentication authentication) {
        return savedSearchService.findByUserId(actor(authentication).id());
    }

    @PostMapping("/saved-searches")
    ResponseEntity<RoomSavedSearch> createSavedSearch(Authentication authentication,
                                                       @Valid @RequestBody CreateSavedSearchInput input) {
        var search = savedSearchService.create(actor(authentication).id(), input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/saved-searches/" + search.getId())).body(search);
    }

    @PatchMapping("/saved-searches/{searchId}")
    RoomSavedSearch updateSavedSearch(Authentication authentication, @PathVariable UUID searchId,
                                      @Valid @RequestBody UpdateSavedSearchInput input) {
        return savedSearchService.update(searchId, actor(authentication).id(), input);
    }

    @DeleteMapping("/saved-searches/{searchId}")
    ResponseEntity<Void> deleteSavedSearch(Authentication authentication, @PathVariable UUID searchId) {
        savedSearchService.delete(searchId, actor(authentication).id());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/{listingId}/report")
    ResponseEntity<RoomReport> report(Authentication authentication, @PathVariable UUID listingId,
                                      @Valid @RequestBody CreateReportInput input) {
        var report = reportService.create(actor(authentication), listingId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/reports/" + report.getId())).body(report);
    }

    @GetMapping("/my-reports")
    List<RoomReport> myReports(Authentication authentication) {
        return reportService.findByReporter(actor(authentication));
    }

    @GetMapping("/listings/{listingId}/analytics")
    Map<String, Long> analytics(Authentication authentication, @PathVariable UUID listingId) {
        var actor = actor(authentication);
        return analyticsService.summary(listingId, actor.id(), actor.admin());
    }

    @GetMapping("/admin/reports")
    List<RoomReport> reviewQueue(Authentication authentication, @RequestParam(required = false) String status) {
        return reportService.findReviewQueue(actor(authentication), status);
    }

    @PostMapping("/admin/reports/{reportId}/review")
    RoomReport reviewReport(Authentication authentication, @PathVariable UUID reportId,
                            @RequestParam String status, @RequestParam(required = false) String resolution) {
        return reportService.review(actor(authentication), reportId, status, resolution);
    }

    @PostMapping("/admin/listings/{listingId}/moderate")
    OwnerRoomListingResponse moderate(Authentication authentication, @PathVariable UUID listingId,
                                      @RequestParam String status) {
        return views.ownerView(listingService.moderate(actor(authentication), listingId, status));
    }
}

package com.manabandhu.backend.rooms;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
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
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/rooms")
public class RoomsController {

    private final RoomsContentService contentService;
    private final RoomListingService listingService;
    private final RoomAvailabilityService availabilityService;
    private final RoomBookingService bookingService;
    private final RoomImageService imageService;
    private final RoomFavoriteService favoriteService;

    RoomsController(RoomsContentService contentService, RoomListingService listingService,
                    RoomAvailabilityService availabilityService, RoomBookingService bookingService,
                    RoomImageService imageService, RoomFavoriteService favoriteService) {
        this.contentService = contentService;
        this.listingService = listingService;
        this.availabilityService = availabilityService;
        this.bookingService = bookingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
    }

    @GetMapping("/screens/{screenId}")
    com.manabandhu.backend.foundation.CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/listings")
    List<RoomListing> listings(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String roomType) {
        return listingService.search(location, roomType);
    }

    @PostMapping("/listings")
    ResponseEntity<RoomListing> createListing(Authentication authentication, @Valid @RequestBody CreateRoomListingInput input) {
        var ownerId = UUID.fromString(authentication.getName());
        var listing = listingService.create(ownerId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/listings/" + listing.getId())).body(listing);
    }

    @GetMapping("/listings/{listingId}")
    RoomListing listing(@PathVariable UUID listingId) {
        return listingService.findById(listingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
    }

    @PatchMapping("/listings/{listingId}")
    RoomListing updateListing(@PathVariable UUID listingId, @Valid @RequestBody UpdateRoomListingInput input) {
        return listingService.update(listingId, input);
    }

    @DeleteMapping("/listings/{listingId}")
    ResponseEntity<Void> deleteListing(@PathVariable UUID listingId) {
        listingService.delete(listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-listings")
    List<RoomListing> myListings(Authentication authentication) {
        return listingService.findByOwner(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/listings/{listingId}/images")
    List<RoomImage> images(@PathVariable UUID listingId) {
        return imageService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/images")
    ResponseEntity<RoomImage> addImage(@PathVariable UUID listingId, @Valid @RequestBody AddRoomImageInput input) {
        var image = imageService.add(listingId, input.url(), input.sortOrder());
        return ResponseEntity.created(URI.create("/api/v1/rooms/images/" + image.getId())).body(image);
    }

    @DeleteMapping("/images/{imageId}")
    ResponseEntity<Void> deleteImage(@PathVariable UUID imageId) {
        imageService.delete(imageId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/availability")
    List<RoomAvailability> availability(@PathVariable UUID listingId) {
        return availabilityService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/availability")
    ResponseEntity<RoomAvailability> createAvailability(@PathVariable UUID listingId,
                                                        @Valid @RequestBody CreateRoomAvailabilityInput input) {
        var availability = availabilityService.create(listingId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/availability/" + availability.getId())).body(availability);
    }

    @DeleteMapping("/availability/{availabilityId}")
    ResponseEntity<Void> deleteAvailability(@PathVariable UUID availabilityId) {
        availabilityService.delete(availabilityId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/bookings")
    List<RoomBooking> bookings(@PathVariable UUID listingId) {
        return bookingService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/bookings")
    ResponseEntity<RoomBooking> createBooking(@PathVariable UUID listingId, Authentication authentication,
                                              @Valid @RequestBody CreateRoomBookingInput input) {
        var requesterId = UUID.fromString(authentication.getName());
        var booking = bookingService.create(listingId, requesterId, input);
        return ResponseEntity.created(URI.create("/api/v1/rooms/bookings/" + booking.getId())).body(booking);
    }

    @GetMapping("/bookings/{bookingId}")
    RoomBooking booking(@PathVariable UUID bookingId) {
        return bookingService.findById(bookingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room booking not found"));
    }

    @PatchMapping("/bookings/{bookingId}/status")
    RoomBooking updateBookingStatus(@PathVariable UUID bookingId, @Valid @RequestBody UpdateRoomBookingStatusInput input) {
        return bookingService.updateStatus(bookingId, input.status());
    }

    @DeleteMapping("/bookings/{bookingId}")
    ResponseEntity<Void> deleteBooking(@PathVariable UUID bookingId) {
        bookingService.delete(bookingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my-bookings")
    List<RoomBooking> myBookings(Authentication authentication) {
        return bookingService.findByRequester(UUID.fromString(authentication.getName()));
    }

    @GetMapping("/favorites")
    List<RoomFavorite> favorites(Authentication authentication) {
        return favoriteService.findByUserId(UUID.fromString(authentication.getName()));
    }

    @PostMapping("/listings/{listingId}/favorite")
    ResponseEntity<RoomFavorite> favorite(@PathVariable UUID listingId, Authentication authentication) {
        var userId = UUID.fromString(authentication.getName());
        var favorite = favoriteService.favorite(userId, listingId);
        return ResponseEntity.created(URI.create("/api/v1/rooms/favorites/" + favorite.getId())).body(favorite);
    }

    @DeleteMapping("/listings/{listingId}/favorite")
    ResponseEntity<Void> unfavorite(@PathVariable UUID listingId, Authentication authentication) {
        favoriteService.unfavorite(UUID.fromString(authentication.getName()), listingId);
        return ResponseEntity.noContent().build();
    }
}

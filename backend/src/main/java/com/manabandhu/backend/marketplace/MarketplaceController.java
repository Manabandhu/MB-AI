package com.manabandhu.backend.marketplace;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.manabandhu.backend.foundation.CatalogScreenContent;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {

    private final ListingCategoryService categoryService;
    private final ListingService listingService;
    private final ListingImageService imageService;
    private final ListingFavoriteService favoriteService;
    private final MarketplaceContentService contentService;

    MarketplaceController(ListingCategoryService categoryService, ListingService listingService,
                          ListingImageService imageService, ListingFavoriteService favoriteService,
                          MarketplaceContentService contentService) {
        this.categoryService = categoryService;
        this.listingService = listingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
        this.contentService = contentService;
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(@PathVariable String screenId) {
        return contentService.screen(screenId);
    }

    @GetMapping("/categories")
    List<ListingCategory> categories() {
        return categoryService.findAll();
    }

    private static UUID actorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return UUID.fromString(authentication.getName());
    }

    private static boolean isAdmin(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) return false;
        return authentication.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(a -> a.equals("ROLE_SUPER_ADMIN") || a.equals("ROLE_ADMIN"));
    }

    @PostMapping("/categories")
    ResponseEntity<ListingCategory> createCategory(Authentication authentication, @Valid @RequestBody CreateListingCategoryInput input) {
        if (!isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Admin access required");
        }
        var category = categoryService.create(input.name(), input.slug());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/categories/" + category.getId())).body(category);
    }

    @GetMapping("/categories/{categoryId}")
    ListingCategory category(@PathVariable UUID categoryId) {
        return categoryService.findById(categoryId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Category not found"));
    }

    @GetMapping("/listings")
    Page<Listing> listings(Pageable pageable) {
        return listingService.findAll(pageable);
    }

    @PostMapping("/listings")
    ResponseEntity<Listing> create(Authentication authentication, @Valid @RequestBody CreateListingInput input) {
        var listing = listingService.create(actorId(authentication), input.categoryId(),
                input.title(), input.description(), input.price(), input.currency(), input.condition(),
                input.location(), input.negotiable());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/listings/" + listing.getId())).body(listing);
    }

    @GetMapping("/listings/{listingId}")
    Listing listing(@PathVariable UUID listingId) {
        return listingService.findById(listingId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
    }

    @PatchMapping("/listings/{listingId}")
    Listing update(Authentication authentication, @PathVariable UUID listingId, @Valid @RequestBody UpdateListingInput input) {
        var actorId = actorId(authentication);
        var listing = listingService.findById(listingId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
        if (!listing.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to update this listing");
        }
        return listingService.update(listingId, input.categoryId(), input.title(), input.description(), input.price(),
                input.currency(), input.condition(), input.location(), input.negotiable(), input.status());
    }

    @DeleteMapping("/listings/{listingId}")
    ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID listingId) {
        var actorId = actorId(authentication);
        var listing = listingService.findById(listingId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
        if (!listing.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to delete this listing");
        }
        listingService.delete(listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/images")
    List<ListingImage> images(@PathVariable UUID listingId) {
        return imageService.findByListingId(listingId);
    }

    @PostMapping("/listings/{listingId}/images")
    ResponseEntity<ListingImage> addImage(Authentication authentication, @PathVariable UUID listingId,
                                          @Valid @RequestBody AddListingImageInput input) {
        var actorId = actorId(authentication);
        var listing = listingService.findById(listingId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
        if (!listing.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to add images to this listing");
        }
        var image = imageService.add(listingId, input.url(), input.sortOrder());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/images/" + image.getId())).body(image);
    }

    @DeleteMapping("/images/{imageId}")
    ResponseEntity<Void> deleteImage(Authentication authentication, @PathVariable UUID imageId) {
        var actorId = actorId(authentication);
        var image = imageService.findById(imageId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Image not found"));
        var listing = listingService.findById(image.getListingId())
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
        if (!listing.getOwnerId().equals(actorId) && !isAdmin(authentication)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN, "Not authorized to delete this image");
        }
        imageService.delete(imageId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/{listingId}/favorite")
    ResponseEntity<ListingFavorite> favorite(Authentication authentication, @PathVariable UUID listingId) {
        var userId = UUID.fromString(authentication.getName());
        var favorite = favoriteService.favorite(userId, listingId);
        return ResponseEntity.created(URI.create("/api/v1/marketplace/favorites/" + favorite.getId())).body(favorite);
    }

    @DeleteMapping("/listings/{listingId}/favorite")
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID listingId) {
        favoriteService.unfavorite(UUID.fromString(authentication.getName()), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorites")
    List<ListingFavorite> favorites(Authentication authentication) {
        return favoriteService.findByUserId(UUID.fromString(authentication.getName()));
    }
}

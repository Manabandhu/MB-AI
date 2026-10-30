package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
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
import com.manabandhu.backend.common.catalog.CatalogScreenContent;

import jakarta.validation.Valid;

/** Marketplace REST API; every authorization rule lives in the services, which take an {@link Actor}. */
@RestController
@RequestMapping("/api/v1/marketplace")
public class MarketplaceController {

    private final ListingCategoryService categoryService;
    private final ListingService listingService;
    private final ListingImageService imageService;
    private final ListingFavoriteService favoriteService;
    private final MarketplaceContentService contentService;
    private final ListingViews views;
    private final ListingReportService reportService;
    private final ListingContactService contactService;

    MarketplaceController(ListingCategoryService categoryService, ListingService listingService,
                          ListingImageService imageService, ListingFavoriteService favoriteService,
                          MarketplaceContentService contentService, ListingViews views,
                          ListingReportService reportService, ListingContactService contactService) {
        this.categoryService = categoryService;
        this.listingService = listingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
        this.contentService = contentService;
        this.views = views;
        this.reportService = reportService;
        this.contactService = contactService;
    }

    private static Actor viewer(Authentication authentication) {
        return Actor.from(authentication).orElse(null);
    }

    @GetMapping("/screens/{screenId}")
    CatalogScreenContent screen(Authentication authentication, @PathVariable String screenId) {
        return contentService.screen(screenId, Actor.from(authentication));
    }

    @GetMapping("/categories")
    List<ListingCategory> categories() {
        return categoryService.findAll();
    }

    @PostMapping("/categories")
    ResponseEntity<ListingCategory> createCategory(Authentication authentication,
                                                   @Valid @RequestBody CreateListingCategoryInput input) {
        var category = categoryService.create(Actor.require(authentication), input.name(), input.slug());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/categories/" + category.getId())).body(category);
    }

    @GetMapping("/categories/{categoryId}")
    ListingCategory category(@PathVariable UUID categoryId) {
        return categoryService.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    /** Public search, newest first; `includeClosed` also returns reserved and sold items. */
    @GetMapping("/listings")
    Page<ListingView> listings(Authentication authentication,
                               @RequestParam(required = false) String q,
                               @RequestParam(required = false) UUID categoryId,
                               @RequestParam(required = false) String condition,
                               @RequestParam(required = false) BigDecimal maxPrice,
                               @RequestParam(defaultValue = "false") boolean includeClosed,
                               Pageable pageable) {
        var page = listingService.search(q, categoryId, condition, maxPrice, includeClosed, pageable);
        return new PageImpl<>(views.views(page.getContent(), viewer(authentication)), page.getPageable(),
                page.getTotalElements());
    }

    @PostMapping("/listings")
    ResponseEntity<ListingView> create(Authentication authentication, @Valid @RequestBody CreateListingInput input) {
        var actor = Actor.require(authentication);
        var listing = listingService.create(actor.id(), input.categoryId(), input.title(), input.description(),
                input.price(), input.currency(), input.condition(), input.location(), input.negotiable());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/listings/" + listing.getId()))
                .body(views.view(listing, actor));
    }

    /** The caller's own listings in every status (newest 200). */
    @GetMapping("/listings/mine")
    List<ListingView> mine(Authentication authentication) {
        var actor = Actor.require(authentication);
        return views.views(listingService.findMine(actor), actor);
    }

    @GetMapping("/listings/{listingId}")
    ListingView listing(Authentication authentication, @PathVariable UUID listingId) {
        var viewer = viewer(authentication);
        return views.view(listingService.requireVisible(listingId, viewer), viewer);
    }

    @PatchMapping("/listings/{listingId}")
    ListingView update(Authentication authentication, @PathVariable UUID listingId,
                       @Valid @RequestBody UpdateListingInput input) {
        var actor = Actor.require(authentication);
        return views.view(listingService.update(actor, listingId, input), actor);
    }

    @DeleteMapping("/listings/{listingId}")
    ResponseEntity<Void> delete(Authentication authentication, @PathVariable UUID listingId) {
        listingService.delete(Actor.require(authentication), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/{listingId}/images")
    List<ListingImage> images(Authentication authentication, @PathVariable UUID listingId) {
        return imageService.findVisible(listingId, viewer(authentication));
    }

    @PostMapping("/listings/{listingId}/images")
    ResponseEntity<ListingImage> addImage(Authentication authentication, @PathVariable UUID listingId,
                                          @Valid @RequestBody AddListingImageInput input) {
        var image = imageService.add(Actor.require(authentication), listingId, input.url(), input.sortOrder());
        return ResponseEntity.created(URI.create("/api/v1/marketplace/images/" + image.getId())).body(image);
    }

    @DeleteMapping("/images/{imageId}")
    ResponseEntity<Void> deleteImage(Authentication authentication, @PathVariable UUID imageId) {
        imageService.delete(Actor.require(authentication), imageId);
        return ResponseEntity.noContent().build();
    }

    /** Opens (or reuses) a direct chat with the seller about this listing. */
    @PostMapping("/listings/{listingId}/contact")
    ListingContactService.ListingContactResponse contact(Authentication authentication, @PathVariable UUID listingId) {
        return contactService.contact(Actor.require(authentication), listingId);
    }

    @PostMapping("/listings/{listingId}/report")
    ResponseEntity<ListingReportService.ListingReportResponse> report(Authentication authentication,
                                                                      @PathVariable UUID listingId,
                                                                      @Valid @RequestBody CreateListingReportInput input) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.report(Actor.require(authentication), listingId, input));
    }

    @PostMapping("/listings/{listingId}/favorite")
    ResponseEntity<ListingFavorite> favorite(Authentication authentication, @PathVariable UUID listingId) {
        var favorite = favoriteService.favorite(Actor.require(authentication).id(), listingId);
        return ResponseEntity.created(URI.create("/api/v1/marketplace/favorites/" + favorite.getId())).body(favorite);
    }

    @DeleteMapping("/listings/{listingId}/favorite")
    ResponseEntity<Void> unfavorite(Authentication authentication, @PathVariable UUID listingId) {
        favoriteService.unfavorite(Actor.require(authentication).id(), listingId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/favorites")
    List<ListingFavorite> favorites(Authentication authentication) {
        return favoriteService.findByUserId(Actor.require(authentication).id());
    }

    /** The saved listings themselves (newest 200 that are still public). */
    @GetMapping("/favorites/listings")
    List<ListingView> favoriteListings(Authentication authentication) {
        var actor = Actor.require(authentication);
        return views.views(favoriteService.savedListings(actor.id()), actor);
    }
}

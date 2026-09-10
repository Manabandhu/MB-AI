package com.manabandhu.backend.marketplace;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
public class MarketplaceGraphqlController {

    private final ListingCategoryService categoryService;
    private final ListingService listingService;
    private final ListingImageService imageService;
    private final ListingFavoriteService favoriteService;

    MarketplaceGraphqlController(ListingCategoryService categoryService, ListingService listingService,
                                 ListingImageService imageService, ListingFavoriteService favoriteService) {
        this.categoryService = categoryService;
        this.listingService = listingService;
        this.imageService = imageService;
        this.favoriteService = favoriteService;
    }

    @QueryMapping
    List<ListingCategory> listingCategories() {
        return categoryService.findAll();
    }

    @QueryMapping
    List<Listing> listings() {
        return listingService.findAll(Pageable.unpaged()).getContent();
    }

    @QueryMapping
    Listing listing(@Argument UUID id) {
        return listingService.findById(id)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Listing not found"));
    }

    @QueryMapping
    List<ListingImage> listingImages(@Argument UUID listingId) {
        return imageService.findByListingId(listingId);
    }

    @QueryMapping
    List<ListingFavorite> favorites(Authentication authentication) {
        return favoriteService.findByUserId(UUID.fromString(authentication.getName()));
    }

    @MutationMapping
    ListingCategory createListingCategory(@Argument @Valid CreateListingCategoryInput input) {
        return categoryService.create(input.name(), input.slug());
    }

    @MutationMapping
    Listing createListing(Authentication authentication, @Argument @Valid CreateListingInput input) {
        return listingService.create(UUID.fromString(authentication.getName()), input.categoryId(), input.title(),
                input.description(), input.price(), input.currency(), input.condition(), input.location(),
                input.negotiable());
    }

    @MutationMapping
    Listing updateListing(@Argument UUID id, @Argument @Valid UpdateListingInput input) {
        return listingService.update(id, input.categoryId(), input.title(), input.description(), input.price(),
                input.currency(), input.condition(), input.location(), input.negotiable(), input.status());
    }

    @MutationMapping
    ListingImage addListingImage(@Argument UUID listingId, @Argument @Valid AddListingImageInput input) {
        return imageService.add(listingId, input.url(), input.sortOrder());
    }

    @MutationMapping
    Boolean favoriteListing(Authentication authentication, @Argument UUID listingId) {
        favoriteService.favorite(UUID.fromString(authentication.getName()), listingId);
        return true;
    }

    @MutationMapping
    Boolean unfavoriteListing(Authentication authentication, @Argument UUID listingId) {
        favoriteService.unfavorite(UUID.fromString(authentication.getName()), listingId);
        return true;
    }
}

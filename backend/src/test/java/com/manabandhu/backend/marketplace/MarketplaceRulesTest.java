package com.manabandhu.backend.marketplace;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.media.MediaService;
import com.manabandhu.backend.media.StorageUrls;

/** Authorization, status, visibility and image rules for marketplace listings. */
class MarketplaceRulesTest {

    private final UUID ownerId = UUID.randomUUID();
    private final Actor owner = new Actor(ownerId, false, false);
    private final Actor stranger = new Actor(UUID.randomUUID(), false, false);
    private final Actor admin = new Actor(UUID.randomUUID(), true, false);

    private final ListingRepository listings = mock(ListingRepository.class);
    private final ListingImageRepository images = mock(ListingImageRepository.class);
    private final MediaService media = mock(MediaService.class);
    private final ListingImageService imageService = new ListingImageService(images, listings, mock(StorageUrls.class), media);
    private final ListingService service = new ListingService(listings, mock(ListingCategoryRepository.class), imageService);

    private Listing listing(String status) {
        var listing = new Listing(ownerId, null, "Desk", null, BigDecimal.TEN, "USD", "Like New", "Irving", false, status);
        when(listings.findById(listing.getId())).thenReturn(Optional.of(listing));
        when(listings.save(any())).thenAnswer(inv -> inv.getArgument(0));
        return listing;
    }

    private static UpdateListingInput status(String status) {
        return new UpdateListingInput(null, null, null, null, null, null, null, null, status);
    }

    private static HttpStatus code(Throwable error) {
        return (HttpStatus) ((ResponseStatusException) error).getStatusCode();
    }

    @Test
    void strangersCannotEditOrDelete() {
        var l = listing("active");
        assertThatThrownBy(() -> service.update(stranger, l.getId(), status("sold")))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.delete(stranger, l.getId()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.FORBIDDEN));
        verify(listings, never()).delete(any());
    }

    @Test
    void ownersMoveBetweenActiveReservedAndSold() {
        var l = listing("active");
        assertThat(service.update(owner, l.getId(), status("reserved")).getStatus()).isEqualTo("reserved");
        assertThat(service.update(owner, l.getId(), status("sold")).getStatus()).isEqualTo("sold");
        assertThat(service.update(owner, l.getId(), status("active")).getStatus()).isEqualTo("active");
    }

    @Test
    void onlyModeratorsRemoveOrRestore() {
        var l = listing("active");
        assertThatThrownBy(() -> service.update(owner, l.getId(), status("removed")))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(service.update(admin, l.getId(), status("removed")).getStatus()).isEqualTo("removed");
        assertThatThrownBy(() -> service.update(owner, l.getId(), status("active")))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void removedListingsAreHiddenFromEveryoneButOwnerAndModerators() {
        var l = listing("removed");
        assertThatThrownBy(() -> service.requireVisible(l.getId(), stranger))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.NOT_FOUND));
        assertThat(service.requireVisible(l.getId(), owner)).isSameAs(l);
        assertThat(service.requireVisible(l.getId(), admin)).isSameAs(l);
        assertThat(service.requireVisible(listing("sold").getId(), null).getStatus()).isEqualTo("sold");
    }

    @Test
    void deletingAListingRemovesItsStoredPhotos() {
        var l = listing("active");
        var photo = new ListingImage(l.getId(), "https://x/storage/v1/object/public/marketplace/a/b.jpg", 0);
        when(images.findByListingIdOrderBySortOrderAsc(l.getId())).thenReturn(List.of(photo));
        service.delete(owner, l.getId());
        verify(media).deleteStoredQuietly(photo.getUrl());
        verify(listings).delete(l);
    }

    @Test
    void photosAreCappedAtTen() {
        var l = listing("active");
        when(images.countByListingId(l.getId())).thenReturn((long) MarketplaceRules.MAX_IMAGES);
        assertThatThrownBy(() -> imageService.add(owner, l.getId(), "https://x/a.jpg", 0))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void ownListingsAndClosedListingsCannotBeSaved() {
        var favorites = mock(ListingFavoriteRepository.class);
        var favoriteService = new ListingFavoriteService(favorites, listings);
        var mine = listing("active");
        assertThatThrownBy(() -> favoriteService.favorite(ownerId, mine.getId()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.BAD_REQUEST));
        var sold = listing("sold");
        assertThatThrownBy(() -> favoriteService.favorite(stranger.id(), sold.getId()))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void categoriesAreForModeratorsOnly() {
        var categories = new ListingCategoryService(mock(ListingCategoryRepository.class));
        assertThatThrownBy(() -> categories.create(owner, "Bikes", "bikes"))
                .satisfies(e -> assertThat(code(e)).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void inputRejectsMissingPriceUnknownConditionAndBadCurrency() {
        var validator = jakarta.validation.Validation.buildDefaultValidatorFactory().getValidator();
        var input = new CreateListingInput(UUID.randomUUID(), "Desk", null, null, "usd", "Mint", null, null);
        var fields = validator.validate(input).stream().map(v -> v.getPropertyPath().toString()).toList();
        assertThat(fields).contains("price", "currency", "condition");
        var blank = new UpdateListingInput(null, "   ", null, new BigDecimal("-1"), null, null, null, null, "banana");
        var updateFields = validator.validate(blank).stream().map(v -> v.getPropertyPath().toString()).toList();
        assertThat(updateFields).contains("title", "price", "status");
    }
}

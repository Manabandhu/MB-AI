package com.manabandhu.backend.marketplace;

import java.util.HashMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;

/** Builds {@link ListingView}s in batches: saved flags and cover photos in one query each. */
@Component
public class ListingViews {

    private final ListingImageRepository imageRepository;
    private final ListingFavoriteService favoriteService;

    ListingViews(ListingImageRepository imageRepository, ListingFavoriteService favoriteService) {
        this.imageRepository = imageRepository;
        this.favoriteService = favoriteService;
    }

    @Transactional(readOnly = true)
    public List<ListingView> views(List<Listing> listings, Actor viewer) {
        var ids = listings.stream().map(Listing::getId).toList();
        var covers = new HashMap<UUID, String>();
        if (!ids.isEmpty()) {
            imageRepository.findByListingIdInOrderBySortOrderAscCreatedAtAsc(ids)
                    .forEach(image -> covers.putIfAbsent(image.getListingId(), image.getUrl()));
        }
        Set<UUID> saved = viewer == null ? Set.of() : favoriteService.savedAmong(viewer.id(), ids);
        return listings.stream().map(l -> ListingView.of(l, viewer != null && viewer.is(l.getOwnerId()),
                saved.contains(l.getId()), covers.get(l.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public ListingView view(Listing listing, Actor viewer) {
        return views(List.of(listing), viewer).getFirst();
    }
}

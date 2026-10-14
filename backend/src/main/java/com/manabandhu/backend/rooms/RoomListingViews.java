package com.manabandhu.backend.rooms;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;

/** Builds listing responses in batches: amenities, preferences, saved flags and cover images in one query each. */
@Component
public class RoomListingViews {

    private final RoomListingService listingService;
    private final RoomFavoriteService favoriteService;
    private final RoomImageRepository imageRepository;

    RoomListingViews(RoomListingService listingService, RoomFavoriteService favoriteService,
                     RoomImageRepository imageRepository) {
        this.listingService = listingService;
        this.favoriteService = favoriteService;
        this.imageRepository = imageRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomListingResponse> publicViews(List<RoomListing> listings, Actor viewer) {
        var ids = listings.stream().map(RoomListing::getId).toList();
        var amenities = listingService.amenitiesForListings(ids);
        var preferences = listingService.preferencesForListings(ids);
        var covers = coverImages(ids);
        Set<UUID> saved = viewer == null ? Set.of() : favoriteService.findSavedListingIds(viewer.id(), ids);
        return listings.stream().map(l -> RoomListingResponse.from(l,
                amenities.getOrDefault(l.getId(), List.of()),
                preferences.getOrDefault(l.getId(), List.of()),
                saved.contains(l.getId()),
                viewer != null && viewer.is(l.getOwnerId()),
                covers.get(l.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public RoomListingResponse publicView(RoomListing listing, Actor viewer) {
        return publicViews(List.of(listing), viewer).getFirst();
    }

    @Transactional(readOnly = true)
    public List<OwnerRoomListingResponse> ownerViews(List<RoomListing> listings) {
        var ids = listings.stream().map(RoomListing::getId).toList();
        var amenities = listingService.amenitiesForListings(ids);
        var preferences = listingService.preferencesForListings(ids);
        var covers = coverImages(ids);
        return listings.stream().map(l -> OwnerRoomListingResponse.from(l,
                amenities.getOrDefault(l.getId(), List.of()),
                preferences.getOrDefault(l.getId(), List.of()),
                covers.get(l.getId()))).toList();
    }

    @Transactional(readOnly = true)
    public OwnerRoomListingResponse ownerView(RoomListing listing) {
        return ownerViews(List.of(listing)).getFirst();
    }

    private Map<UUID, String> coverImages(Collection<UUID> listingIds) {
        if (listingIds.isEmpty()) return Map.of();
        var covers = new HashMap<UUID, String>();
        imageRepository.findByListingIdInOrderBySortOrderAscCreatedAtAsc(listingIds)
                .forEach(image -> covers.putIfAbsent(image.getListingId(), image.getUrl()));
        return covers;
    }
}

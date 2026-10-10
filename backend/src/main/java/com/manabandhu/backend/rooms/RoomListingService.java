package com.manabandhu.backend.rooms;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomListingService {

    private static final List<String> STATUSES = List.of("draft", "active", "paused", "archived", "rejected");

    private final RoomListingRepository repository;
    private final RoomAmenityRepository amenityRepository;
    private final RoomPreferenceRepository preferenceRepository;
    private final RoomAmenityCatalogRepository amenityCatalogRepository;

    @org.springframework.beans.factory.annotation.Autowired
    public RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                              RoomPreferenceRepository preferenceRepository,
                              RoomAmenityCatalogRepository amenityCatalogRepository) {
        this.repository = repository;
        this.amenityRepository = amenityRepository;
        this.preferenceRepository = preferenceRepository;
        this.amenityCatalogRepository = amenityCatalogRepository;
    }

    RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                       RoomPreferenceRepository preferenceRepository) {
        this(repository, amenityRepository, preferenceRepository, null);
    }

    @Transactional(readOnly = true)
    public List<RoomAmenityCatalog> getAmenitiesCatalog() {
        if (amenityCatalogRepository == null) return List.of();
        return amenityCatalogRepository.findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findAllPublished() {
        return repository.findByStatusOrderByCreatedAtDesc("active");
    }

    @Transactional(readOnly = true)
    public Optional<RoomListing> findPublishedById(UUID id) {
        return repository.findById(id)
                .filter(l -> "active".equals(l.getStatus()) || "paused".equals(l.getStatus()));
    }

    @Transactional(readOnly = true)
    public Optional<RoomListing> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<RoomListing> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
    }

    /** Active listings matching every provided filter; {@code radiusMiles} applies around {@code lat}/{@code lng}. */
    @Transactional(readOnly = true)
    public Page<RoomListing> search(RoomSearchCriteria criteria, Pageable pageable) {
        BigDecimal minLat = null, maxLat = null, minLng = null, maxLng = null;
        if (criteria.lat() != null && criteria.lng() != null && criteria.radiusMiles() != null && criteria.radiusMiles() > 0) {
            var latDelta = criteria.radiusMiles() / 69.0;
            var lngDelta = criteria.radiusMiles() / (69.0 * Math.max(0.1, Math.cos(Math.toRadians(criteria.lat().doubleValue()))));
            minLat = criteria.lat().subtract(BigDecimal.valueOf(latDelta));
            maxLat = criteria.lat().add(BigDecimal.valueOf(latDelta));
            minLng = criteria.lng().subtract(BigDecimal.valueOf(lngDelta));
            maxLng = criteria.lng().add(BigDecimal.valueOf(lngDelta));
        }
        return repository.searchListings("active", blankToNull(criteria.location()), blankToNull(criteria.roomType()),
                blankToNull(criteria.stateCode()), blankToNull(criteria.dietaryPreference()),
                blankToNull(criteria.genderPreference()), criteria.minRent(), criteria.maxRent(),
                blankToNull(criteria.bathroomType()), minLat, maxLat, minLng, maxLng, pageable);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public RoomListing create(UUID ownerId, CreateRoomListingInput input) {
        var listing = new RoomListing(ownerId, input.title(), input.description(), input.price(),
                input.roomType(), "draft", input.broadLocation(), input.exactAddress(),
                input.latitude(), input.longitude());
        if (input.dietaryPreference() != null) listing.setDietaryPreference(input.dietaryPreference());
        if (input.genderPreference() != null) listing.setGenderPreference(input.genderPreference());
        if (input.bathroomType() != null) listing.setBathroomType(input.bathroomType());
        if (input.utilitiesIncluded() != null) listing.setUtilitiesIncluded(input.utilitiesIncluded());
        if (input.estUtilityMonthly() != null) listing.setEstUtilityMonthly(input.estUtilityMonthly());
        if (input.securityDeposit() != null) listing.setSecurityDeposit(input.securityDeposit());
        if (input.leaseTerm() != null) listing.setLeaseTerm(input.leaseTerm());
        if (input.universityShuttleAccessible() != null) listing.setUniversityShuttleAccessible(input.universityShuttleAccessible());
        if (input.stateCode() != null) listing.setStateCode(input.stateCode());
        if (input.county() != null) listing.setCounty(input.county());
        return repository.save(listing);
    }

    @Transactional
    public RoomListing update(UUID id, UUID actorId, boolean isAdmin, UpdateRoomListingInput input) {
        var listing = requireOwnedListing(id, actorId, isAdmin);
        if (input.title() != null) listing.setTitle(input.title());
        if (input.description() != null) listing.setDescription(input.description());
        if (input.price() != null) listing.setPrice(input.price());
        if (input.roomType() != null) listing.setRoomType(input.roomType());
        if (input.broadLocation() != null) listing.setBroadLocation(input.broadLocation());
        if (input.exactAddress() != null) listing.setExactAddress(input.exactAddress());
        if (input.latitude() != null) listing.latitude = input.latitude();
        if (input.longitude() != null) listing.longitude = input.longitude();
        if (input.dietaryPreference() != null) listing.setDietaryPreference(input.dietaryPreference());
        if (input.genderPreference() != null) listing.setGenderPreference(input.genderPreference());
        if (input.bathroomType() != null) listing.setBathroomType(input.bathroomType());
        if (input.utilitiesIncluded() != null) listing.setUtilitiesIncluded(input.utilitiesIncluded());
        if (input.estUtilityMonthly() != null) listing.setEstUtilityMonthly(input.estUtilityMonthly());
        if (input.securityDeposit() != null) listing.setSecurityDeposit(input.securityDeposit());
        if (input.leaseTerm() != null) listing.setLeaseTerm(input.leaseTerm());
        if (input.universityShuttleAccessible() != null) listing.setUniversityShuttleAccessible(input.universityShuttleAccessible());
        if (input.stateCode() != null) listing.setStateCode(input.stateCode());
        if (input.county() != null) listing.setCounty(input.county());
        if (input.status() != null) {
            validateTransition(listing.getStatus(), input.status(), isAdmin);
            listing.setStatus(input.status());
        }
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    @Transactional
    public RoomListing setOwnerOnlyStatus(UUID id, UUID actorId, String targetStatus, String action) {
        var listing = requireOwnedListing(id, actorId, false);
        validateTransition(listing.getStatus(), targetStatus, false);
        listing.setStatus(targetStatus);
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    @Transactional
    public RoomListing moderate(UUID id, UUID actorId, String targetStatus, boolean isAdmin) {
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Moderator access required");
        }
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        validateTransition(listing.getStatus(), targetStatus, true);
        listing.setStatus(targetStatus);
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    @Transactional
    public void delete(UUID id, UUID actorId, boolean isAdmin) {
        requireOwnedListing(id, actorId, isAdmin);
        preferenceRepository.deleteByListingId(id);
        amenityRepository.deleteByListingId(id);
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public RoomListing requireOwnedListing(UUID id, UUID actorId, boolean isAdmin) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!isAdmin && !listing.getOwnerId().equals(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }
        return listing;
    }

    @Transactional(readOnly = true)
    public RoomListing requireOwnedListingListing(UUID actorId, boolean isAdmin, UUID id) {
        return requireOwnedListing(id, actorId, isAdmin);
    }

    @Transactional(readOnly = true)
    public List<String> amenitiesFor(UUID listingId) {
        return amenityRepository.findByListingIdOrderByCreatedAtAsc(listingId).stream()
                .map(RoomAmenity::getAmenity).toList();
    }

    @Transactional(readOnly = true)
    public java.util.Map<UUID, List<String>> amenitiesForListings(java.util.Collection<UUID> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) return java.util.Map.of();
        return amenityRepository.findByListingIdInOrderByCreatedAtAsc(listingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(RoomAmenity::getListingId,
                        java.util.stream.Collectors.mapping(RoomAmenity::getAmenity, java.util.stream.Collectors.toList())));
    }

    @Transactional(readOnly = true)
    public List<String> preferencesFor(UUID listingId) {
        return preferenceRepository.findByListingIdOrderByCreatedAtAsc(listingId).stream()
                .map(RoomPreference::getPreference).toList();
    }

    @Transactional(readOnly = true)
    public java.util.Map<UUID, List<String>> preferencesForListings(java.util.Collection<UUID> listingIds) {
        if (listingIds == null || listingIds.isEmpty()) return java.util.Map.of();
        return preferenceRepository.findByListingIdInOrderByCreatedAtAsc(listingIds).stream()
                .collect(java.util.stream.Collectors.groupingBy(RoomPreference::getListingId,
                        java.util.stream.Collectors.mapping(RoomPreference::getPreference, java.util.stream.Collectors.toList())));
    }

    public void validateTransition(String from, String to, boolean isAdmin) {
        if (from.equals(to)) {
            return;
        }
        if (!STATUSES.contains(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown target status: " + to);
        }
        var allowed = switch (from) {
            case "draft" -> List.of("active", "archived");
            case "active" -> isAdmin ? List.of("paused", "archived", "rejected") : List.of("paused", "archived");
            case "paused" -> List.of("active", "archived");
            case "rejected" -> isAdmin ? List.of("active", "draft") : List.of();
            default -> List.of();
        };
        if (!allowed.contains(to)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot transition listing from " + from + " to " + to);
        }
    }
}

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

import com.manabandhu.backend.admin.AdminAuditService;
import com.manabandhu.backend.auth.Actor;

@Service
public class RoomListingService {

    private static final List<String> STATUSES = List.of("draft", "active", "paused", "archived", "rejected", "rented");
    static final int MY_LISTINGS_CAP = 200;
    static final int AMENITIES_CAP = 30;

    private final RoomListingRepository repository;
    private final RoomAmenityRepository amenityRepository;
    private final RoomPreferenceRepository preferenceRepository;
    private final RoomAmenityCatalogRepository amenityCatalogRepository;
    private final AdminAuditService audit;

    @org.springframework.beans.factory.annotation.Autowired
    public RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                              RoomPreferenceRepository preferenceRepository,
                              RoomAmenityCatalogRepository amenityCatalogRepository, AdminAuditService audit) {
        this.repository = repository;
        this.amenityRepository = amenityRepository;
        this.preferenceRepository = preferenceRepository;
        this.amenityCatalogRepository = amenityCatalogRepository;
        this.audit = audit;
    }

    RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                       RoomPreferenceRepository preferenceRepository, AdminAuditService audit) {
        this(repository, amenityRepository, preferenceRepository, null, audit);
    }

    RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                       RoomPreferenceRepository preferenceRepository) {
        this(repository, amenityRepository, preferenceRepository, null, null);
    }

    @Transactional(readOnly = true)
    public List<RoomAmenityCatalog> getAmenitiesCatalog() {
        if (amenityCatalogRepository == null) return List.of();
        return amenityCatalogRepository.findByIsActiveTrueOrderBySortOrderAsc();
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

    /** Visible to everyone when active or paused; drafts, rejected and rented listings only to the owner or an admin. */
    @Transactional(readOnly = true)
    public RoomListing requireVisible(UUID id, Actor viewer) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (isPublic(listing) || (viewer != null && (viewer.admin() || viewer.is(listing.getOwnerId())))) {
            return listing;
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found");
    }

    static boolean isPublic(RoomListing listing) {
        return "active".equals(listing.getStatus()) || "paused".equals(listing.getStatus());
    }

    /** The owner's newest listings, capped. */
    @Transactional(readOnly = true)
    public List<RoomListing> findByOwner(UUID ownerId) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(ownerId,
                org.springframework.data.domain.PageRequest.of(0, MY_LISTINGS_CAP));
    }

    /** Active listings matching every provided filter; {@code radiusMiles} applies around {@code lat}/{@code lng}. */
    @Transactional(readOnly = true)
    public Page<RoomListing> search(RoomSearchCriteria criteria, Pageable pageable) {
        BigDecimal minLat = null, maxLat = null, minLng = null, maxLng = null;
        if (criteria.lat() != null && criteria.lng() != null && criteria.radiusMiles() != null && criteria.radiusMiles() > 0) {
            // At least one whole mile: finer boxes would only page through the ~1 km rounding grid.
            var radius = Math.max(1, Math.ceil(criteria.radiusMiles()));
            var latDelta = radius / 69.0;
            var lngDelta = radius / (69.0 * Math.max(0.1, Math.cos(Math.toRadians(criteria.lat().doubleValue()))));
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
    public RoomListing create(Actor actor, CreateRoomListingInput input) {
        var listing = create(actor.id(), input);
        replaceAmenities(listing.getId(), input.amenities());
        return listing;
    }

    @Transactional
    RoomListing create(UUID ownerId, CreateRoomListingInput input) {
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
    public RoomListing update(Actor actor, UUID id, UpdateRoomListingInput input) {
        var listing = requireOwned(actor, id);
        var isAdmin = actor.admin();
        if (input.title() != null) listing.setTitle(input.title());
        // An empty string clears an optional text field; null leaves it unchanged.
        if (input.description() != null) listing.setDescription(blankToNull(input.description()));
        if (input.price() != null) listing.setPrice(input.price());
        if (input.roomType() != null) listing.setRoomType(input.roomType());
        if (input.broadLocation() != null) listing.setBroadLocation(blankToNull(input.broadLocation()));
        if (input.exactAddress() != null) listing.setExactAddress(blankToNull(input.exactAddress()));
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
        if (input.stateCode() != null) listing.setStateCode(blankToNull(input.stateCode()));
        if (input.county() != null) listing.setCounty(blankToNull(input.county()));
        if (input.status() != null) {
            validateTransition(listing.getStatus(), input.status(), isAdmin);
            listing.setStatus(input.status());
        }
        if (input.amenities() != null) replaceAmenities(listing.getId(), input.amenities());
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    /** Publish, pause, archive: the owner's own decision, never an admin acting for them. */
    @Transactional
    public RoomListing setOwnerOnlyStatus(Actor actor, UUID id, String targetStatus) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (!actor.is(listing.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this listing");
        }
        validateTransition(listing.getStatus(), targetStatus, false);
        listing.setStatus(targetStatus);
        listing.setUpdatedAt(java.time.Instant.now());
        return repository.save(listing);
    }

    /** Admin status change; every change is written to {@code admin_audit_log}. */
    @Transactional
    public RoomListing moderate(Actor actor, UUID id, String targetStatus) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Moderator access required");
        }
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        validateTransition(listing.getStatus(), targetStatus, true);
        listing.setStatus(targetStatus);
        listing.setUpdatedAt(java.time.Instant.now());
        var saved = repository.save(listing);
        audit.record(actor.id().toString(), "room.moderate", "ROOM_LISTING", id.toString());
        return saved;
    }

    @Transactional
    public void delete(Actor actor, UUID id) {
        requireOwned(actor, id);
        preferenceRepository.deleteByListingId(id);
        amenityRepository.deleteByListingId(id);
        repository.deleteById(id);
    }

    /** The owner or an admin; anyone else gets 403. */
    @Transactional(readOnly = true)
    public RoomListing requireOwned(Actor actor, UUID id) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        actor.requireOwner(listing.getOwnerId(), "You do not own this listing");
        return listing;
    }

    private void replaceAmenities(UUID listingId, List<String> amenities) {
        if (amenities == null) return;
        var unique = amenities.stream().map(String::trim).filter(a -> !a.isEmpty()).distinct().toList();
        if (unique.size() > AMENITIES_CAP) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At most " + AMENITIES_CAP + " amenities");
        }
        amenityRepository.deleteByListingId(listingId);
        amenityRepository.flush();
        unique.forEach(amenity -> amenityRepository.save(new RoomAmenity(listingId, amenity)));
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
            case "active" -> isAdmin ? List.of("paused", "archived", "rejected", "rented") : List.of("paused", "archived", "rented");
            case "paused" -> List.of("active", "archived", "rented");
            case "rented" -> List.of("active", "archived");
            case "rejected" -> isAdmin ? List.of("active", "draft") : List.of();
            default -> List.of();
        };
        if (!allowed.contains(to)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot transition listing from " + from + " to " + to);
        }
    }
}

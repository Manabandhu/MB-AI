package com.manabandhu.backend.rooms;

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

    RoomListingService(RoomListingRepository repository, RoomAmenityRepository amenityRepository,
                       RoomPreferenceRepository preferenceRepository) {
        this.repository = repository;
        this.amenityRepository = amenityRepository;
        this.preferenceRepository = preferenceRepository;
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

    @Transactional(readOnly = true)
    public Page<RoomListing> search(String location, String roomType, Pageable pageable) {
        if (location != null && roomType != null) {
            return repository.findByStatusAndRoomTypeAndBroadLocationContainingIgnoreCaseOrderByCreatedAtDesc(
                    "active", roomType, location, pageable);
        }
        if (location != null) {
            return repository.findByBroadLocationContainingIgnoreCaseAndStatusOrderByCreatedAtDesc(location, "active", pageable);
        }
        if (roomType != null) {
            return repository.findByRoomTypeAndStatusOrderByCreatedAtDesc(roomType, "active", pageable);
        }
        return repository.findByStatusOrderByCreatedAtDesc("active", pageable);
    }

    @Transactional
    public RoomListing create(UUID ownerId, CreateRoomListingInput input) {
        var listing = new RoomListing(ownerId, input.title(), input.description(), input.price(),
                input.roomType(), "draft", input.broadLocation(), input.exactAddress(),
                input.latitude(), input.longitude());
        return repository.save(listing);
    }

    @Transactional
    public RoomListing update(UUID id, UUID actorId, boolean isAdmin, UpdateRoomListingInput input) {
        var listing = requireOwnedListing(id, actorId, isAdmin);
        if (input.title() != null) listing.setTitle(input.title());
        if (input.description() != null) listing.setDescription(input.description());
        if (input.price() != null) listing.setPrice(input.price());
        if (input.roomType() != null) listing.roomType = input.roomType();
        if (input.broadLocation() != null) listing.broadLocation = input.broadLocation();
        if (input.exactAddress() != null) listing.exactAddress = input.exactAddress();
        if (input.latitude() != null) listing.latitude = input.latitude();
        if (input.longitude() != null) listing.longitude = input.longitude();
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
    public List<String> preferencesFor(UUID listingId) {
        return preferenceRepository.findByListingIdOrderByCreatedAtAsc(listingId).stream()
                .map(RoomPreference::getPreference).toList();
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

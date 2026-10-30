package com.manabandhu.backend.marketplace;

import static com.manabandhu.backend.common.Strings.blankToNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.Paging;

@Service
public class ListingService {

    private final ListingRepository repository;
    private final ListingCategoryRepository categoryRepository;
    private final ListingImageService imageService;

    ListingService(ListingRepository repository, ListingCategoryRepository categoryRepository,
                   ListingImageService imageService) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.imageService = imageService;
    }

    /** Active listings, newest first (the marketplace home). */
    @Transactional(readOnly = true)
    public Page<Listing> findAll(Pageable pageable) {
        return repository.findByStatusOrderByCreatedAtDesc("active", pageable);
    }

    /**
     * Search: text in the title or description, category, condition and a price ceiling. Only active listings
     * unless {@code includeClosed} also asks for reserved and sold ones. Client sort parameters are ignored.
     */
    @Transactional(readOnly = true)
    public Page<Listing> search(String q, UUID categoryId, String condition, BigDecimal maxPrice,
                                boolean includeClosed, Pageable pageable) {
        var statuses = includeClosed ? List.of("active", "reserved", "sold") : List.of("active");
        var page = Paging.bounded(pageable, Paging.SHORT_LIST_CAP);
        return repository.search(statuses, blankToNull(q), categoryId, blankToNull(condition), maxPrice, page);
    }

    @Transactional(readOnly = true)
    public Optional<Listing> findById(UUID id) {
        return repository.findById(id);
    }

    /** Active, reserved and sold listings are public; removed ones only for the owner and moderators. */
    @Transactional(readOnly = true)
    public Listing requireVisible(UUID id, Actor viewer) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        if (MarketplaceRules.PUBLIC_STATUSES.contains(listing.getStatus())
                || (viewer != null && (viewer.admin() || viewer.is(listing.getOwnerId())))) {
            return listing;
        }
        throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found");
    }

    /** The caller's newest listings in every status. */
    @Transactional(readOnly = true)
    public List<Listing> findMine(Actor actor) {
        return repository.findByOwnerIdOrderByCreatedAtDesc(actor.id(), Paging.firstPage());
    }

    @Transactional
    public Listing create(UUID ownerId, UUID categoryId, String title, String description, BigDecimal price,
                          String currency, String condition, String location, Boolean negotiable) {
        var category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));
        var listing = new Listing(ownerId, category, title.trim(), blankToNull(description), price,
                currency.toUpperCase(Locale.ROOT), blankToNull(condition), blankToNull(location), negotiable, "active");
        return repository.save(listing);
    }

    /** The owner (or a moderator) edits; status changes follow {@link MarketplaceRules#OWNER_TRANSITIONS}. */
    @Transactional
    public Listing update(Actor actor, UUID id, UpdateListingInput input) {
        var listing = requireManaged(actor, id);
        if (input.categoryId() != null) {
            listing.category = categoryRepository.findById(input.categoryId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown category"));
        }
        if (input.title() != null) listing.title = input.title().trim();
        if (input.description() != null) listing.description = blankToNull(input.description());
        if (input.price() != null) listing.price = input.price();
        if (input.currency() != null) listing.currency = input.currency();
        if (input.condition() != null) listing.condition = blankToNull(input.condition());
        if (input.location() != null) listing.location = blankToNull(input.location());
        if (input.negotiable() != null) listing.negotiable = input.negotiable();
        if (input.status() != null) changeStatus(actor, listing, input.status());
        listing.updatedAt = Instant.now();
        return repository.save(listing);
    }

    /** Deletes the listing and its photos, including the stored files. */
    @Transactional
    public void delete(Actor actor, UUID id) {
        var listing = requireManaged(actor, id);
        imageService.deleteAllFor(listing);
        repository.delete(listing);
    }

    private Listing requireManaged(Actor actor, UUID id) {
        var listing = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Listing not found"));
        actor.requireOwner(listing.getOwnerId(), "Not authorized to change this listing");
        return listing;
    }

    private static void changeStatus(Actor actor, Listing listing, String target) {
        var current = listing.getStatus();
        if (current.equals(target)) return;
        if ("removed".equals(target) || "removed".equals(current)) {
            // Moderation: only admins remove a listing or bring a removed one back.
            if (!actor.admin()) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only moderators can remove or restore listings");
            }
            listing.status = target;
            return;
        }
        if (!MarketplaceRules.OWNER_TRANSITIONS.getOrDefault(current, List.of()).contains(target)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A " + current + " listing cannot become " + target);
        }
        listing.status = target;
    }
}

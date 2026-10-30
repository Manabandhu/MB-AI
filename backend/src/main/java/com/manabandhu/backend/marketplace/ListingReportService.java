package com.manabandhu.backend.marketplace;

import java.util.UUID;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

/** Members flag a listing for moderators ({@code listing_reports}); one open report per member and listing. */
@Service
public class ListingReportService {

    private final JdbcTemplate jdbc;
    private final ListingService listingService;

    ListingReportService(JdbcTemplate jdbc, ListingService listingService) {
        this.jdbc = jdbc;
        this.listingService = listingService;
    }

    public record ListingReportResponse(UUID id, UUID listingId, String reason, String status) {}

    @Transactional
    public ListingReportResponse report(Actor actor, UUID listingId, CreateListingReportInput input) {
        var listing = listingService.requireVisible(listingId, actor);
        if (actor.is(listing.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot report your own listing");
        }
        var id = UUID.randomUUID();
        try {
            jdbc.update("INSERT INTO public.listing_reports (id, listing_id, reporter_id, reason, description) VALUES (?, ?, ?, ?, ?)",
                    id, listingId, actor.id(), input.reason().trim(), input.description());
        } catch (DuplicateKeyException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reported this listing");
        }
        return new ListingReportResponse(id, listingId, input.reason().trim(), "open");
    }
}

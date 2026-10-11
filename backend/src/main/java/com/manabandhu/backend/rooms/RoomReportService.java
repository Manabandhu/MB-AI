package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.manabandhu.backend.auth.Actor;

@Service
public class RoomReportService {

    static final Set<String> STATUSES = Set.of("open", "in_review", "resolved", "dismissed");
    static final int LIST_CAP = 200;

    private final RoomReportRepository repository;
    private final RoomListingService listingService;

    RoomReportService(RoomReportRepository repository, RoomListingService listingService) {
        this.repository = repository;
        this.listingService = listingService;
    }

    @Transactional(readOnly = true)
    public List<RoomReport> findReviewQueue(Actor actor, String status) {
        requireModerator(actor);
        return repository.findByStatusOrderByCreatedAtDesc(requireStatus(status == null ? "open" : status),
                PageRequest.of(0, LIST_CAP));
    }

    @Transactional(readOnly = true)
    public List<RoomReport> findByReporter(Actor actor) {
        return repository.findByReporterIdOrderByCreatedAtDesc(actor.id(), PageRequest.of(0, LIST_CAP));
    }

    /** Anyone signed in can report a listing they can see, except their own; one open report per listing. */
    @Transactional
    public RoomReport create(Actor actor, UUID listingId, CreateReportInput input) {
        var listing = listingService.requireVisible(listingId, actor);
        if (actor.is(listing.getOwnerId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot report your own listing");
        }
        if (repository.existsByListingIdAndReporterIdAndStatus(listingId, actor.id(), "open")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an open report for this listing");
        }
        return repository.save(new RoomReport(listingId, actor.id(), input.reason().trim(), input.description()));
    }

    @Transactional
    public RoomReport review(Actor actor, UUID id, String status, String resolution) {
        requireModerator(actor);
        var report = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(requireStatus(status));
        report.setReviewerId(actor.id());
        report.setResolution(resolution);
        report.setReviewedAt(Instant.now());
        return repository.save(report);
    }

    private static void requireModerator(Actor actor) {
        if (!actor.admin()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Moderator access required");
        }
    }

    private static String requireStatus(String status) {
        if (!STATUSES.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown report status: " + status);
        }
        return status;
    }
}

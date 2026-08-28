package com.manabandhu.backend.rooms;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RoomReportService {

    private final RoomReportRepository repository;
    private final RoomListingRepository listingRepository;

    RoomReportService(RoomReportRepository repository, RoomListingRepository listingRepository) {
        this.repository = repository;
        this.listingRepository = listingRepository;
    }

    @Transactional(readOnly = true)
    public List<RoomReport> findReviewQueue(String status) {
        if (status == null) {
            return repository.findByStatusOrderByCreatedAtDesc("open");
        }
        return repository.findByStatusOrderByCreatedAtDesc(status);
    }

    @Transactional(readOnly = true)
    public List<RoomReport> findByReporter(UUID reporterId) {
        return repository.findByReporterIdOrderByCreatedAtDesc(reporterId);
    }

    @Transactional
    public RoomReport create(UUID reporterId, CreateReportInput input) {
        var listing = listingRepository.findById(input.listingId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room listing not found"));
        if (listing.getOwnerId().equals(reporterId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot report your own listing");
        }
        if (repository.existsByListingIdAndReporterIdAndStatus(input.listingId(), reporterId, "open")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an open report for this listing");
        }
        var report = new RoomReport(input.listingId(), reporterId, input.reason(), input.description());
        return repository.save(report);
    }

    @Transactional
    public RoomReport review(UUID id, UUID reviewerId, boolean isAdmin, String status, String resolution) {
        if (!isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Moderator access required");
        }
        var report = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Report not found"));
        report.setStatus(status);
        report.setReviewerId(reviewerId);
        report.setResolution(resolution);
        report.setReviewedAt(Instant.now());
        return repository.save(report);
    }
}

package com.manabandhu.backend.safety;

import java.util.List;
import java.util.Optional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.foundation.CatalogItem;
import com.manabandhu.backend.foundation.CatalogMetric;
import com.manabandhu.backend.foundation.CatalogScreenContent;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Safety center screen. Metrics are the caller's own counts; anonymous viewers get none. */
@Service
class SafetyContentService {

    private static final List<SafetyReport.ReportStatus> OPEN_STATUSES =
            List.of(SafetyReport.ReportStatus.OPEN, SafetyReport.ReportStatus.IN_REVIEW);

    private final SafetyReportRepository reportRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final TrustedContactRepository trustedContactRepository;

    SafetyContentService(SafetyReportRepository reportRepository, BlockedUserRepository blockedUserRepository,
                         TrustedContactRepository trustedContactRepository) {
        this.reportRepository = reportRepository;
        this.blockedUserRepository = blockedUserRepository;
        this.trustedContactRepository = trustedContactRepository;
    }

    @Transactional(readOnly = true)
    CatalogScreenContent center(Optional<Actor> viewer) {
        var metrics = viewer.map(actor -> List.of(
                        new CatalogMetric("Open reports",
                                String.valueOf(reportRepository.countByReporterIdAndStatusIn(actor.id(), OPEN_STATUSES))),
                        new CatalogMetric("Blocked users", String.valueOf(blockedUserRepository.countByOwnerId(actor.id()))),
                        new CatalogMetric("Trusted contacts", String.valueOf(trustedContactRepository.countByOwnerId(actor.id())))))
                .orElse(List.of());
        return new CatalogScreenContent(
                "Safety center",
                "Manage reports, blocked users, trusted contacts, and emergency escalation.",
                "Safety",
                metrics,
                List.of(
                        new CatalogItem("reports", "Your reports", "Track reports you have submitted and their status.", "Open reports", "/safety/reports", null),
                        new CatalogItem("blocked", "Blocked users", "Manage users you have blocked and the reasons.", "Blocked", "/safety/blocked-users", null),
                        new CatalogItem("trusted", "Trusted contacts", "Manage people you trust for safety check-ins.", "Trusted", "/safety/trusted-contacts", null)));
    }
}

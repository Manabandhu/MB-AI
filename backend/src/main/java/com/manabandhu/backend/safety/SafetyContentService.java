package com.manabandhu.backend.safety;

import static com.manabandhu.backend.common.catalog.CatalogContent.item;
import static com.manabandhu.backend.common.catalog.CatalogContent.metric;
import static com.manabandhu.backend.common.catalog.CatalogContent.personal;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.manabandhu.backend.auth.Actor;
import com.manabandhu.backend.common.catalog.CatalogScreenContent;

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
        var metrics = personal(viewer, actor -> List.of(
                metric("Open reports", reportRepository.countByReporterIdAndStatusIn(actor.id(), OPEN_STATUSES)),
                metric("Blocked users", blockedUserRepository.countByOwnerId(actor.id())),
                metric("Trusted contacts", trustedContactRepository.countByOwnerId(actor.id()))));
        return new CatalogScreenContent(
                "Safety center",
                "Manage reports, blocked users, trusted contacts, and emergency escalation.",
                "Safety",
                metrics,
                List.of(
                        item("reports", "Your reports", "Track reports you have submitted and their status.", "Open reports", "/safety/reports"),
                        item("blocked", "Blocked users", "Manage users you have blocked and the reasons.", "Blocked", "/safety/blocked-users"),
                        item("trusted", "Trusted contacts", "Manage people you trust for safety check-ins.", "Trusted", "/safety/trusted-contacts")));
    }
}

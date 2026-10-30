package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import com.manabandhu.backend.auth.Actor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SafetyReportService {

    private final SafetyReportRepository repository;

    SafetyReportService(SafetyReportRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SafetyReport> findByReporter(UUID reporterId) {
        return repository.findByReporterIdOrderByCreatedAtDesc(reporterId);
    }

    /** Moderation queue: newest 500 reports, admins only. */
    @Transactional(readOnly = true)
    public List<SafetyReport> findAllForAdmin(Actor actor) {
        actor.requireAdmin();
        return repository.findTop500ByOrderByCreatedAtDesc();
    }

    @Transactional(readOnly = true)
    public java.util.Optional<SafetyReport> findById(UUID id) {
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public List<SafetyReport> findByTarget(UUID targetId) {
        return repository.findByTargetIdOrderByCreatedAtDesc(targetId);
    }

    @Transactional
    public SafetyReport create(UUID reporterId, UUID targetId, String category, String description, SafetyReport.ReportStatus status, SafetyReport.Severity severity, String evidenceUrls) {
        return repository.save(new SafetyReport(reporterId, targetId, category, description, status, severity, evidenceUrls));
    }

    /** Only moderators resolve reports; a reporter cannot close their own report (or anyone else's). */
    @Transactional
    public SafetyReport resolve(Actor actor, UUID id) {
        actor.requireAdmin();
        var report = repository.findById(id).orElseThrow();
        report.resolve();
        return report;
    }
}

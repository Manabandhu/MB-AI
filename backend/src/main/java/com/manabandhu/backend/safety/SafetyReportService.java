package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

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

    @Transactional(readOnly = true)
    public List<SafetyReport> findByTarget(UUID targetId) {
        return repository.findByTargetIdOrderByCreatedAtDesc(targetId);
    }

    @Transactional
    public SafetyReport create(UUID reporterId, UUID targetId, String category, String description, SafetyReport.ReportStatus status, SafetyReport.Severity severity, String evidenceUrls) {
        return repository.save(new SafetyReport(reporterId, targetId, category, description, status, severity, evidenceUrls));
    }

    @Transactional
    public SafetyReport resolve(UUID id) {
        var report = repository.findById(id).orElseThrow();
        report.resolve();
        return report;
    }
}

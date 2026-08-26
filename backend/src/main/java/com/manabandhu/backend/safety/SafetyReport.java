package com.manabandhu.backend.safety;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "safety_reports")
public class SafetyReport {

    @Id
    private UUID id;

    @Column(name = "reporter_id", nullable = false, updatable = false)
    private UUID reporterId;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false, length = 80)
    private String category;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private ReportStatus status;

    @Column(nullable = false, length = 40)
    @Enumerated(EnumType.STRING)
    private Severity severity;

    @Column(name = "evidence_urls", length = 2000)
    private String evidenceUrls;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    protected SafetyReport() {}

    SafetyReport(UUID reporterId, UUID targetId, String category, String description, ReportStatus status, Severity severity, String evidenceUrls) {
        this.id = UUID.randomUUID();
        this.reporterId = reporterId;
        this.targetId = targetId;
        this.category = category;
        this.description = description;
        this.status = status;
        this.severity = severity;
        this.evidenceUrls = evidenceUrls;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getReporterId() { return reporterId; }
    public UUID getTargetId() { return targetId; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public ReportStatus getStatus() { return status; }
    public Severity getSeverity() { return severity; }
    public String getEvidenceUrls() { return evidenceUrls; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getResolvedAt() { return resolvedAt; }

    public void resolve() {
        this.status = ReportStatus.RESOLVED;
        this.resolvedAt = Instant.now();
    }

    public enum ReportStatus {
        OPEN, IN_REVIEW, RESOLVED, DISMISSED
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}

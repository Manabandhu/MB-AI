package com.manabandhu.backend.safety;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

interface SafetyReportRepository extends JpaRepository<SafetyReport, UUID> {
    List<SafetyReport> findTop500ByOrderByCreatedAtDesc();

    List<SafetyReport> findByReporterIdOrderByCreatedAtDesc(UUID reporterId);
    List<SafetyReport> findByTargetIdOrderByCreatedAtDesc(UUID targetId);
    long countByReporterIdAndStatusIn(UUID reporterId, java.util.Collection<SafetyReport.ReportStatus> statuses);
}
